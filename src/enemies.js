import * as THREE from 'three';
import { scene } from './scene.js';
import { TILE, CONST_SPEED, ENEMY_COUNT, ENEMY_SPEED,
         ENEMY_TERRITORY_R as TERRITORY_R, ENEMY_DETECT_DIST as DETECT_DIST,
         ENEMY_THINK_INTERVAL as THINK_INTERVAL, ENEMY_COLLIDE_DIST as COLLIDE_DIST,
         ENEMY_SPAWN_CLEAR as SPAWN_CLEAR, ENEMY_STUN_TIME as STUN_TIME,
         ENEMY_SPIN_SPEED as SPIN_SPEED, ENEMY_ROT_SPEED } from './constants.js';
import { HALF_W, HALF_H, roadTiles, tileCenter } from './map.js';
import { clearForDir, moveWithCollision, leadingClearForDir } from './physics.js';
import { gasStunsAt } from './gas.js';

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

function validDirsAt(x, z) {
  return DIRS.filter(([dx,dz]) => clearForDir(x,z,dx,dz) && leadingClearForDir(x,z,dx,dz));
}

export function clearEnemies() {
  for (const e of enemies) scene.remove(e.group);
  enemies = [];
}

export function placeEnemies(spawnTx = HALF_W, spawnTy = HALF_H) {
  clearEnemies();

  const cand = roadTiles
    .map(t => {
      const { x, z } = tileCenter(t.tx, t.ty);
      return { ...t, x, z, dirs: validDirsAt(x, z) };
    })
    .filter(t =>
      Math.abs(t.tx - spawnTx) + Math.abs(t.ty - spawnTy) > SPAWN_CLEAR &&
      t.dirs.length > 0
    );
  for (let i = cand.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cand[i], cand[j]] = [cand[j], cand[i]];
  }

  const n = Math.min(ENEMY_COUNT, cand.length);
  for (let i = 0; i < n; i++) {
    const { tx, ty, x, z, dirs } = cand[i];
    const group = buildEnemyCar();
    group.position.set(x, 0, z);
    scene.add(group);
    const [dx, dz] = dirs[Math.floor(Math.random() * dirs.length)];
    enemies.push({
      group, x, z,
      homeTx: tx, homeTy: ty,
      dx, dz,
      thinkTimer: Math.random() * THINK_INTERVAL,
      stuckTimer: 0,
      turnBias: Math.random() < 0.5 ? 1 : -1,
      stunTimer: 0,
    });
  }
}

function tileOf(wx, wz) {
  return {
    tx: Math.round(wx / TILE + HALF_W),
    ty: Math.round(wz / TILE + HALF_H),
  };
}

// Update all enemies; returns true if any enemy collided with the player.
// `chase` is false once the player is gone (crashed) — enemies then just wander.
export function updateEnemies(dt, carX, carZ, chase = true) {
  let hitPlayer = false;

  for (const e of enemies) {
    // ── gas stun: freeze in place and spin, ignore AI/movement ────────────────
    if (gasStunsAt(e.x, e.z)) e.stunTimer = STUN_TIME;   // (re)trigger on contact
    if (e.stunTimer > 0) {
      e.stunTimer -= dt;
      e.group.position.x = e.x;
      e.group.position.z = e.z;
      e.group.rotation.y += SPIN_SPEED * dt;
      if ((e.x - carX) ** 2 + (e.z - carZ) ** 2 < COLLIDE_DIST * COLLIDE_DIST) hitPlayer = true;
      continue;
    }

    const { tx: curTx, ty: curTy } = tileOf(e.x, e.z);
    const inTerritory  = Math.abs(curTx - e.homeTx) + Math.abs(curTy - e.homeTy) <= TERRITORY_R;
    const distToPlayer = Math.hypot(e.x - carX, e.z - carZ);
    const canChase     = chase && distToPlayer < DETECT_DIST && inTerritory;

    // ── AI: choose direction periodically ─────────────────────────────────────
    e.thinkTimer -= dt;
    if (e.thinkTimer <= 0) {
      e.thinkTimer = THINK_INTERVAL * (0.75 + Math.random() * 0.5);

      let wantDx = e.dx, wantDz = e.dz;

      if (canChase) {
        const ddx = carX - e.x, ddz = carZ - e.z;
        // 25% chance of picking the wrong axis (dumb mistake)
        const pickMinor = Math.random() < 0.25;
        if (pickMinor
          ? Math.abs(ddx) < Math.abs(ddz)
          : Math.abs(ddx) >= Math.abs(ddz)
        ) { wantDx = ddx > 0 ? 1 : -1; wantDz = 0; }
        else { wantDx = 0; wantDz = ddz > 0 ? 1 : -1; }

      } else if (!inTerritory) {
        // return home
        const dhx = e.homeTx - curTx, dhz = e.homeTy - curTy;
        if (Math.abs(dhx) >= Math.abs(dhz)) { wantDx = dhx > 0 ? 1 : -1; wantDz = 0; }
        else                                 { wantDx = 0; wantDz = dhz > 0 ? 1 : -1; }
      }
      // else patrol: keep current direction; wall-avoidance handles turns

      if (wantDx !== e.dx || wantDz !== e.dz) {
        const nx = e.x + wantDx * CONST_SPEED * ENEMY_SPEED * dt;
        const nz = e.z + wantDz * CONST_SPEED * ENEMY_SPEED * dt;
        if (leadingClearForDir(nx, nz, wantDx, wantDz)) {
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

  return hitPlayer;
}

export function getEnemies() { return enemies; }
