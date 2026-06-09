import * as THREE from 'three';
import { scene, camera } from './scene.js';
import { TILE, T, CONST_SPEED, ENEMY_SPEED,
         ENEMY_TERRITORY_R as TERRITORY_R, ENEMY_DETECT_DIST as DETECT_DIST,
         ENEMY_THINK_INTERVAL as THINK_INTERVAL, ENEMY_COLLIDE_DIST as COLLIDE_DIST,
         ENEMY_ENEMY_COLLIDE_DIST as ENEMY_CRASH_DIST,
         ENEMY_SPAWN_CLEAR as SPAWN_CLEAR, ENEMY_STUN_TIME as STUN_TIME,
         ENEMY_STUN_FREE_TIME as STUN_FREE_TIME,
         ENEMY_SPIN_SPEED as SPIN_SPEED, ENEMY_ROT_SPEED,
         ENEMY_FLOW_MAX_TILES as FLOW_MAX_TILES,
         ENEMY_CHASE_KEEP_MUL as CHASE_KEEP_MUL,
         ENEMY_TERRITORY_SLACK as TERRITORY_SLACK } from './constants.js';
import { DEFAULT_GAMEPLAY, HALF_W, HALF_H, MAP_W, MAP_H, mi, tileMap, roadTiles, tileCenter } from './map.js';
import { clearForDir, moveWithCollision, leadingClearForDir } from './physics.js';
import { gasStunsAt } from './gas.js';
import { explode } from './particles.js';

// ─── tunables in constants.js (ENEMY_*) ─────────────────────────────────────────

// ─── materials ────────────────────────────────────────────────────────────────
const bodyMat      = new THREE.MeshToonMaterial({ color: 0x1a5fce });
const darkMat      = new THREE.MeshToonMaterial({ color: 0x0d2d6e });
const tireMat      = new THREE.MeshToonMaterial({ color: 0x050505 });
const metalMat     = new THREE.MeshToonMaterial({ color: 0xc0c8d8 });
const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffff99 });
const taillightMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });

const R = TILE * 0.24;

function buildEnemyCar() {
  const g = new THREE.Group();

  // shadow blob
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(TILE * 0.50, 16),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.30, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.06;
  g.add(shadow);

  function box(sx, sy, sz_, px, py, pz, mat) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz_), mat);
    m.position.set(px, py, pz);
    m.castShadow = true;
    g.add(m);
  }

  // body
  box(R*2.9, R*0.52, R*2.15, 0,       R*0.48+0.32, 0, bodyMat);
  // cabin
  box(R*1.12, R*0.60, R*1.50, -R*0.62, R*0.92+0.32, 0, darkMat);
  box(R*0.34, R*1.40, R*1.55, -R*1.14, R*1.55+0.32, 0, bodyMat);

  // front nose cylinder
  const nose = new THREE.Mesh(
    new THREE.CylinderGeometry(R*0.42, R*0.42, R*2.35, 12),
    bodyMat
  );
  nose.position.set(R*1.65, R*0.45+0.28, 0);
  nose.rotation.x = Math.PI / 2;
  nose.castShadow = true;
  g.add(nose);

  // headlights
  box(R*0.14, R*0.22, R*0.22,  R*1.62, R*0.62+0.32,  R*0.72, headlightMat);
  box(R*0.14, R*0.22, R*0.22,  R*1.62, R*0.62+0.32, -R*0.72, headlightMat);
  // taillights
  box(R*0.14, R*0.22, R*0.22, -R*1.28, R*0.62+0.32,  R*0.72, taillightMat);
  box(R*0.14, R*0.22, R*0.22, -R*1.28, R*0.62+0.32, -R*0.72, taillightMat);

  // wheels + hubs
  const wGeo  = new THREE.CylinderGeometry(R*0.70, R*0.70, R*0.52, 14);
  const hubGeo = new THREE.CylinderGeometry(R*0.38, R*0.38, R*0.54, 10);
  [
    [ R*0.85, R*0.70+0.10,  R*1.22],
    [ R*0.85, R*0.70+0.10, -R*1.22],
    [-R*1.05, R*0.70+0.10,  R*1.22],
    [-R*1.05, R*0.70+0.10, -R*1.22],
  ].forEach(([wx, wy, wz]) => {
    const w = new THREE.Mesh(wGeo, tireMat);
    w.rotation.x = Math.PI / 2;
    w.position.set(wx, wy, wz);
    w.castShadow = true;
    g.add(w);
    const h = new THREE.Mesh(hubGeo, metalMat);
    h.rotation.x = Math.PI / 2;
    h.position.set(wx, wy, wz);
    g.add(h);
  });

  return g;
}

let enemies = [];
const DIRS = [[1,0],[-1,0],[0,1],[0,-1]];
const cameraFrustum = new THREE.Frustum();
const cameraProjView = new THREE.Matrix4();
const cameraPoint = new THREE.Vector3();

// ─── chase flow field ───────────────────────────────────────────────────────────
// BFS distance map from the player's tile across the road grid. Chasing enemies
// follow the gradient (step toward the neighbour with the smaller distance), which
// routes around buildings and — because the distance strictly drops along the true
// shortest path — never oscillates the way a greedy straight-line metric does.
let flow = new Int32Array(0);
let flowReady = false;
const flowQueue = [];

function gridTileOf(wx, wz) {
  return { tx: Math.floor(wx / TILE + HALF_W), ty: Math.floor(wz / TILE + HALF_H) };
}

function tileWalkable(tx, ty) {
  if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) return false;
  const t = tileMap[mi(tx, ty)];
  return t === T.ROAD || t === T.BRIDGE;
}

function buildFlowField(carX, carZ) {
  flowReady = false;
  const n = MAP_W * MAP_H;
  if (flow.length !== n) flow = new Int32Array(n);
  flow.fill(-1);

  const { tx: sTx, ty: sTy } = gridTileOf(carX, carZ);
  if (!tileWalkable(sTx, sTy)) return;   // player off-road: leave field empty → fallback

  flow[mi(sTx, sTy)] = 0;
  flowQueue.length = 0;
  flowQueue.push(sTx, sTy);
  let head = 0;
  while (head < flowQueue.length) {
    const x = flowQueue[head++], y = flowQueue[head++];
    const d = flow[mi(x, y)];
    if (d >= FLOW_MAX_TILES) continue;
    for (const [dx, dz] of DIRS) {
      const nx = x + dx, ny = y + dz;
      if (!tileWalkable(nx, ny)) continue;
      const id = mi(nx, ny);
      if (flow[id] !== -1) continue;
      flow[id] = d + 1;
      flowQueue.push(nx, ny);
    }
  }
  flowReady = true;
}

function flowDistAt(tx, ty) {
  if (!flowReady || tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) return -1;
  return flow[mi(tx, ty)];
}

function validDirsAt(x, z) {
  return DIRS.filter(([dx,dz]) => clearForDir(x,z,dx,dz) && leadingClearForDir(x,z,dx,dz));
}

function directionIsOpen(e, dx, dz, dt) {
  const lookAhead = Math.max(CONST_SPEED * ENEMY_SPEED * dt, TILE * 0.5);
  const nx = e.x + dx * lookAhead;
  const nz = e.z + dz * lookAhead;
  return leadingClearForDir(nx, nz, dx, dz);
}

function chooseBestDir(e, dt, scoreDir) {
  let best = null;
  let bestScore = -Infinity;

  for (const [dx, dz] of DIRS) {
    if (!directionIsOpen(e, dx, dz, dt)) continue;

    let score = scoreDir(dx, dz);
    if (dx === e.dx && dz === e.dz) score += 0.25;
    if (dx === -e.dx && dz === -e.dz) score -= 0.35;
    score += Math.random() * 0.01;

    if (score > bestScore) {
      bestScore = score;
      best = [dx, dz];
    }
  }

  return best ?? [e.dx, e.dz];
}

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function tileDist(aTx, aTy, bTx, bTy) {
  return Math.abs(aTx - bTx) + Math.abs(aTy - bTy);
}

function tileKey(tx, ty) {
  return `${tx},${ty}`;
}

function spreadHomes(candidates, count) {
  const remaining = shuffle([...candidates]);
  const picked = [];
  if (count <= 0 || remaining.length === 0) return picked;

  picked.push(remaining.pop());
  while (picked.length < count && remaining.length > 0) {
    let bestIdx = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const h = remaining[i];
      const minDist = picked.reduce(
        (best, p) => Math.min(best, tileDist(h.tx, h.ty, p.tx, p.ty)),
        Infinity
      );
      const score = minDist + Math.random() * 0.01;
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    picked.push(remaining.splice(bestIdx, 1)[0]);
  }
  return picked;
}

export function clearEnemies() {
  for (const e of enemies) scene.remove(e.group);
  enemies = [];
}

export function placeEnemies(count = DEFAULT_GAMEPLAY.enemyCount, spawnTx = HALF_W, spawnTy = HALF_H) {
  clearEnemies();

  const roadWithDirs = roadTiles
    .map(t => {
      const { x, z } = tileCenter(t.tx, t.ty);
      return { ...t, x, z, dirs: validDirsAt(x, z) };
    })
    .filter(t => t.dirs.length > 0);
  const spawnCand = roadWithDirs.filter(t => tileDist(t.tx, t.ty, spawnTx, spawnTy) > SPAWN_CLEAR);
  const viableHomes = roadTiles.filter(home =>
    spawnCand.some(t => tileDist(t.tx, t.ty, home.tx, home.ty) <= TERRITORY_R)
  );
  const homeCand = spreadHomes(
    viableHomes,
    Math.min(viableHomes.length, count * 3)
  );
  const usedSpawnTiles = new Set();

  for (const home of homeCand) {
    if (enemies.length >= count) break;

    const spawnOptions = spawnCand.filter(t =>
      tileDist(t.tx, t.ty, home.tx, home.ty) <= TERRITORY_R &&
      !usedSpawnTiles.has(tileKey(t.tx, t.ty))
    );
    if (spawnOptions.length === 0) continue;

    const spawn = spawnOptions[Math.floor(Math.random() * spawnOptions.length)];
    usedSpawnTiles.add(tileKey(spawn.tx, spawn.ty));
    const group = buildEnemyCar();
    group.position.set(spawn.x, 0, spawn.z);
    scene.add(group);
    const [dx, dz] = spawn.dirs[Math.floor(Math.random() * spawn.dirs.length)];
    enemies.push({
      group, x: spawn.x, z: spawn.z,
      homeTx: home.tx, homeTy: home.ty,
      dx, dz,
      thinkTimer: Math.random() * THINK_INTERVAL,
      stuckTimer: 0,
      turnBias: Math.random() < 0.5 ? 1 : -1,
      stunTimer: 0,
      stunFreeTimer: 0,
      chasing: false,
    });
  }
}

function tileOf(wx, wz) {
  return {
    tx: Math.round(wx / TILE + HALF_W),
    ty: Math.round(wz / TILE + HALF_H),
  };
}

function canStartStun(e) {
  return e.stunTimer <= 0 && e.stunFreeTimer <= 0;
}

function startStun(e, nextDx = e.dx, nextDz = e.dz) {
  e.stunTimer = STUN_TIME;
  e.stunFreeTimer = 0;
  e.dx = nextDx;
  e.dz = nextDz;
  e.thinkTimer = THINK_INTERVAL;
  e.stuckTimer = 0;
}

function updateStunTimers(e, dt) {
  if (e.stunFreeTimer > 0) e.stunFreeTimer = Math.max(0, e.stunFreeTimer - dt);
  if (e.stunTimer <= 0) return false;

  e.stunTimer = Math.max(0, e.stunTimer - dt);
  if (e.stunTimer <= 0) e.stunFreeTimer = Math.max(e.stunFreeTimer, STUN_FREE_TIME);
  return true;
}

function updateCameraFrustum() {
  camera.updateMatrixWorld();
  cameraProjView.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  cameraFrustum.setFromProjectionMatrix(cameraProjView);
}

function enemyCrashInView(a, b) {
  cameraPoint.set((a.x + b.x) * 0.5, TILE * 0.25, (a.z + b.z) * 0.5);
  return cameraFrustum.containsPoint(cameraPoint);
}

function resolveEnemyCrashes() {
  const crashDistSq = ENEMY_CRASH_DIST * ENEMY_CRASH_DIST;
  const stunnedThisFrame = new Set();
  updateCameraFrustum();

  for (let i = 0; i < enemies.length; i++) {
    const a = enemies[i];
    if (stunnedThisFrame.has(a) || !canStartStun(a)) continue;

    for (let j = i + 1; j < enemies.length; j++) {
      const b = enemies[j];
      if (stunnedThisFrame.has(b) || !canStartStun(b)) continue;
      if ((a.x - b.x) ** 2 + (a.z - b.z) ** 2 >= crashDistSq) continue;
      if (!enemyCrashInView(a, b)) continue;

      explode((a.x + b.x) * 0.5, (a.z + b.z) * 0.5);
      startStun(a, -a.dx, -a.dz);
      startStun(b, -b.dx, -b.dz);
      stunnedThisFrame.add(a);
      stunnedThisFrame.add(b);
      break;
    }
  }
}

// Update all enemies; returns true if any enemy collided with the player.
// `chase` is false once the player is gone (crashed) — enemies then just wander.
export function updateEnemies(dt, carX, carZ, chase = true) {
  let hitPlayer = false;

  // Shared path-distance field from the player, used by every chasing enemy.
  if (chase) buildFlowField(carX, carZ);
  else flowReady = false;

  for (const e of enemies) {
    // ── gas stun: freeze in place and spin, ignore AI/movement ────────────────
    if (gasStunsAt(e.x, e.z) && canStartStun(e)) startStun(e);
    if (updateStunTimers(e, dt)) {
      e.group.position.x = e.x;
      e.group.position.z = e.z;
      e.group.rotation.y += SPIN_SPEED * dt;
      continue;
    }

    const { tx: curTx, ty: curTy } = tileOf(e.x, e.z);
    const homeDist     = Math.abs(curTx - e.homeTx) + Math.abs(curTy - e.homeTy);
    const inTerritory  = homeDist <= TERRITORY_R;
    const distToPlayer = Math.hypot(e.x - carX, e.z - carZ);

    // Hysteresis so enemies don't flip-flop on the detection / territory edge:
    // start chasing inside the tight bounds, keep chasing out to looser ones.
    if (!chase) {
      e.chasing = false;
    } else if (e.chasing) {
      e.chasing = distToPlayer < DETECT_DIST * CHASE_KEEP_MUL &&
                  homeDist <= TERRITORY_R + TERRITORY_SLACK;
    } else {
      e.chasing = distToPlayer < DETECT_DIST && inTerritory;
    }
    const canChase = e.chasing;

    // ── AI: choose direction periodically ─────────────────────────────────────
    e.thinkTimer -= dt;
    if (e.thinkTimer <= 0) {
      e.thinkTimer = THINK_INTERVAL * (0.75 + Math.random() * 0.5);

      let wantDx = e.dx, wantDz = e.dz;

      if (canChase) {
        const { tx: eTx, ty: eTy } = gridTileOf(e.x, e.z);
        const ddx = carX - e.x, ddz = carZ - e.z;
        [wantDx, wantDz] = chooseBestDir(e, dt, (dx, dz) => {
          // Primary: follow the BFS gradient (lower distance = closer along a real
          // path). The ×10 weight makes one tile of progress dominate the small
          // momentum/heading tie-breakers, so the gradient always wins.
          const fd = flowDistAt(eTx + dx, eTy + dz);
          if (fd >= 0) {
            return -fd * 10
              + (Math.sign(ddx) === dx ? 0.1 : 0)
              + (Math.sign(ddz) === dz ? 0.1 : 0);
          }
          // Fallback (player unreachable on the grid): greedy straight-line, but
          // always worse than any tile the flood fill actually reached.
          const nextX = e.x + dx * TILE, nextZ = e.z + dz * TILE;
          return -1000 - Math.hypot(carX - nextX, carZ - nextZ);
        });

      } else if (!inTerritory) {
        // return home
        const dhx = e.homeTx - curTx, dhz = e.homeTy - curTy;
        [wantDx, wantDz] = chooseBestDir(e, dt, (dx, dz) =>
          -tileDist(curTx + dx, curTy + dz, e.homeTx, e.homeTy)
          + (Math.sign(dhx) === dx ? 0.15 : 0)
          + (Math.sign(dhz) === dz ? 0.15 : 0)
        );
      }
      // else patrol: keep current direction; wall-avoidance handles turns

      if (wantDx !== e.dx || wantDz !== e.dz) {
        if (directionIsOpen(e, wantDx, wantDz, dt)) {
          e.dx = wantDx; e.dz = wantDz;
        }
      }
    }

    // ── movement (scaled dt for slower speed) ─────────────────────────────────
    const eDt  = dt * ENEMY_SPEED;
    const move = moveWithCollision(e.x, e.z, e.dx, e.dz, eDt);
    if (move.moved) {
      e.x = move.x; e.z = move.z;
      e.stuckTimer = 0;
    } else {
      e.stuckTimer += dt;
      const rX = -e.dz, rZ =  e.dx;
      const lX =  e.dz, lZ = -e.dx;
      const bX = -e.dx, bZ = -e.dz;
      let tries;
      if (e.stuckTimer > 0.45) {
        tries = [[bX, bZ], [rX, rZ], [lX, lZ]];
        e.stuckTimer = 0;
      } else {
        tries = e.turnBias > 0 ? [[rX, rZ], [lX, lZ], [bX, bZ]] : [[lX, lZ], [rX, rZ], [bX, bZ]];
      }
      for (const [tx_, tz_] of tries) {
        const tnx = e.x + tx_ * CONST_SPEED * eDt;
        const tnz = e.z + tz_ * CONST_SPEED * eDt;
        if (leadingClearForDir(tnx, tnz, tx_, tz_)) {
          const tm = moveWithCollision(e.x, e.z, tx_, tz_, eDt);
          if (!tm.moved) continue;
          e.dx = tx_; e.dz = tz_;
          e.x = tm.x; e.z = tm.z;
          e.turnBias = -e.turnBias;
          e.stuckTimer = 0;
          break;
        }
      }
    }

    // ── visual update ─────────────────────────────────────────────────────────
    e.group.position.x = e.x;
    e.group.position.z = e.z;
    const tRotY = Math.atan2(-e.dz, e.dx);
    let diff = tRotY - e.group.rotation.y;
    while (diff >  Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    e.group.rotation.y += Math.sign(diff) * Math.min(Math.abs(diff), ENEMY_ROT_SPEED * dt);

    // ── player collision ──────────────────────────────────────────────────────
    if ((e.x - carX) ** 2 + (e.z - carZ) ** 2 < COLLIDE_DIST * COLLIDE_DIST) {
      hitPlayer = true;
    }
  }

  resolveEnemyCrashes();

  return hitPlayer;
}

export function getEnemies() { return enemies; }
