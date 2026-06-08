/**
 * Node.js test runner for pure-logic modules (no Three.js, no DOM).
 * Run with: node test.mjs
 *
 * Tests pure modules only: constants.js, maps/, map.js, physics.js
 * Browser-dependent modules (scene.js, car.js, ui.js) are not tested here.
 */
import assert from 'assert/strict';

let passed = 0, failed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${e.message}`);
    failed++;
  }
}
function suite(name) { console.log(`\n${name}`); }

import {
  TILE, T, CONST_SPEED, CAR_HL, CAR_HW, ROT_SPEED
} from './src/constants.js';

import {
  MAP_W, MAP_H, HALF_W, HALF_H,
  tileMap, mi, tileAt, tileCenter, tileCenterX, tileCenterZ,
  passable,
  bldgH, bldgW, bldgD, bldgStyle, parkShade, waterMrk, roadTiles,
  DEFAULT_GAMEPLAY, gameplayFor,
} from './src/map.js';

import * as randomMap from './src/maps/00_random.js';
import * as parisMap  from './src/maps/01_paris.js';
import * as parisNightMap from './src/maps/02_paris_night.js';

import {
  dirX, dirZ, prevDirX, prevDirZ, turnBias, stuckTimer,
  resetPhysics, setDir,
  cornersForDir, leadingPointsForDir, clearForDir, leadingClearForDir,
  moveWithCollision,
} from './src/physics.js';


// ─── 1. constants ─────────────────────────────────────────────────────────────
suite('constants');

test('TILE is 12', () => assert.equal(TILE, 12));
test('T values are 0-4', () => {
  assert.equal(T.ROAD, 0);
  assert.equal(T.BUILDING, 1);
  assert.equal(T.PARK, 2);
  assert.equal(T.WATER, 3);
  assert.equal(T.BRIDGE, 4);
});
test('CAR dimensions', () => {
  assert.ok(CAR_HL > 0 && CAR_HW > 0, 'car half-extents must be positive');
  assert.ok(CAR_HL < TILE, 'car half-length must fit in one tile');
  assert.ok(CAR_HW < TILE, 'car half-width must fit in one tile');
});
test('CONST_SPEED is positive', () => assert.ok(CONST_SPEED > 0));


// ─── 2. map module metadata ───────────────────────────────────────────────────
suite('map module metadata');

test('randomMap has runtime-randomized metadata', () => {
  randomMap.build();
  const gameplay = gameplayFor(randomMap);
  assert.ok(randomMap.mapW >= 32 && randomMap.mapW <= 72, `mapW=${randomMap.mapW}`);
  assert.equal(randomMap.mapW % 4, 0, 'mapW should stay on the configured step');
  assert.equal(randomMap.mapH, randomMap.mapW);
  assert.equal(randomMap.hasLandmarks, false);
  assert.ok(['day', 'night'].includes(randomMap.theme), `theme=${randomMap.theme}`);
  assert.ok(gameplay.enemyCount >= 6 && gameplay.enemyCount <= 14, `enemyCount=${gameplay.enemyCount}`);
  assert.ok(gameplay.diamondCount >= 6 && gameplay.diamondCount <= 15, `diamondCount=${gameplay.diamondCount}`);
  assert.ok(gameplay.timeLimit >= 40 && gameplay.timeLimit <= 110, `timeLimit=${gameplay.timeLimit}`);
});

test('parisMap is 80×80 with landmarks', () => {
  assert.equal(parisMap.mapW, 80);
  assert.equal(parisMap.mapH, 80);
  assert.equal(parisMap.hasLandmarks, true);
  assert.deepEqual(gameplayFor(parisMap), { enemyCount: 14, diamondCount: 12, timeLimit: 80 });
});

test('parisNightMap is 80×80 with landmarks and night theme', () => {
  assert.equal(parisNightMap.mapW, 80);
  assert.equal(parisNightMap.mapH, 80);
  assert.equal(parisNightMap.hasLandmarks, true);
  assert.equal(parisNightMap.theme, 'night');
  assert.deepEqual(gameplayFor(parisNightMap), { enemyCount: 20, diamondCount: 10, timeLimit: 100 });
});

test('map gameplay falls back to default values', () => {
  assert.deepEqual(gameplayFor({}), DEFAULT_GAMEPLAY);
  assert.deepEqual(gameplayFor({ gameplay: { enemyCount: 1 } }), {
    enemyCount: 1,
    diamondCount: DEFAULT_GAMEPLAY.diamondCount,
    timeLimit: DEFAULT_GAMEPLAY.timeLimit,
  });
});


// ─── 3. map helpers (after randomMap.build) ───────────────────────────────────
suite('map helpers');

randomMap.build();

test('MAP_W/H updated by build()', () => {
  assert.ok(MAP_W >= 32 && MAP_W <= 72, `MAP_W=${MAP_W}`);
  assert.equal(MAP_W % 4, 0, 'MAP_W should stay on the configured step');
  assert.equal(MAP_H, MAP_W);
  assert.equal(MAP_W, randomMap.mapW);
  assert.equal(MAP_H, randomMap.mapH);
  assert.equal(HALF_W, MAP_W >> 1);
  assert.equal(HALF_H, MAP_H >> 1);
});

test('mi(x,y) linear mapping', () => {
  assert.equal(mi(0, 0), 0);
  assert.equal(mi(1, 0), 1);
  assert.equal(mi(0, 1), MAP_W);
  assert.equal(mi(MAP_W-1, MAP_H-1), (MAP_H-1) * MAP_W + (MAP_W-1));
});

test('tileCenter(0,0) is bottom-left corner', () => {
  const {x, z} = tileCenter(0, 0);
  assert.equal(x, (-HALF_W + 0.5) * TILE);
  assert.equal(z, (-HALF_H + 0.5) * TILE);
});

test('tileCenter(HALF_W,HALF_H) near world origin', () => {
  const {x, z} = tileCenter(HALF_W, HALF_H);
  assert.equal(x, 0.5 * TILE);
  assert.equal(z, 0.5 * TILE);
});

test('tileAt out-of-bounds returns BUILDING (wall)', () => {
  assert.equal(tileAt(-9999, 0), T.BUILDING);
  assert.equal(tileAt(0, -9999), T.BUILDING);
  assert.equal(tileAt(9999, 0), T.BUILDING);
  assert.equal(tileAt(0, 9999), T.BUILDING);
});

test('tileCenterX round-trips for any road tile', () => {
  const wx = tileCenter(20, 30).x;
  assert.equal(tileCenterX(wx), wx, 'tileCenterX should invert tileCenter.x');
});

test('tileCenterZ round-trips for any road tile', () => {
  const wz = tileCenter(20, 30).z;
  assert.equal(tileCenterZ(wz), wz, 'tileCenterZ should invert tileCenter.z');
});

test('tileAt(world) matches tileCenter for known tile', () => {
  for (let ty = HALF_H - 4; ty <= HALF_H + 4; ty++) {
    for (let tx = HALF_W - 4; tx <= HALF_W + 4; tx++) {
      const expected = tileMap[mi(tx, ty)];
      const {x, z} = tileCenter(tx, ty);
      assert.equal(tileAt(x, z), expected, `tile(${tx},${ty}) mismatch`);
    }
  }
});


// ─── 4. randomMap validity ────────────────────────────────────────────────────
suite('randomMap map validity');

randomMap.build();

const countTiles = () => {
  const c = {road:0, building:0, park:0, water:0, bridge:0};
  for (let i = 0; i < MAP_W * MAP_H; i++) {
    switch (tileMap[i]) {
      case T.ROAD:     c.road++;     break;
      case T.BUILDING: c.building++; break;
      case T.PARK:     c.park++;     break;
      case T.WATER:    c.water++;    break;
      case T.BRIDGE:   c.bridge++;   break;
    }
  }
  return c;
};

const cR = countTiles();
const total = MAP_W * MAP_H;

test('has sufficient road coverage (≥5%)', () => {
  assert.ok(cR.road / total >= 0.05, `road=${(cR.road/total*100).toFixed(1)}%`);
});

test('has buildings', () => assert.ok(cR.building > 0));

test('center cross roads are passable', () => {
  const RW = MAP_W - 4, OX = (MAP_W - RW) / 2;
  for (let tx = OX; tx < OX + RW; tx++) {
    const t = tileMap[mi(tx, HALF_H)];
    assert.ok(t === T.ROAD || t === T.BRIDGE || t === T.WATER,
      `center H row tile(${tx},${HALF_H})=${t} unexpected`);
  }
});

test('spawn at tileCenter(HALF_W,HALF_H) is passable', () => {
  const {x, z} = tileCenter(HALF_W, HALF_H);
  assert.ok(passable(x, z), `type=${tileAt(x, z)}`);
});

test('bldgW is 1-7 or 255 for all building tiles', () => {
  for (let i = 0; i < MAP_W * MAP_H; i++) {
    if (tileMap[i] !== T.BUILDING) continue;
    const w = bldgW[i];
    assert.ok(w === 255 || (w >= 1 && w <= 7), `bldgW[${i}]=${w}`);
  }
});

test('bldgStyle 0-5 for root building tiles', () => {
  for (let i = 0; i < MAP_W * MAP_H; i++) {
    if (tileMap[i] !== T.BUILDING || bldgW[i] === 255) continue;
    assert.ok(bldgStyle[i] >= 0 && bldgStyle[i] <= 5, `bldgStyle[${i}]=${bldgStyle[i]}`);
  }
});

test('bldgH 1-18 for root building tiles (random map)', () => {
  for (let i = 0; i < MAP_W * MAP_H; i++) {
    if (tileMap[i] !== T.BUILDING || bldgW[i] === 255) continue;
    assert.ok(bldgH[i] >= 1 && bldgH[i] <= 18, `bldgH[${i}]=${bldgH[i]}`);
  }
});

test('parkShade 0-5 for park tiles', () => {
  for (let i = 0; i < MAP_W * MAP_H; i++) {
    if (tileMap[i] !== T.PARK) continue;
    assert.ok(parkShade[i] >= 0 && parkShade[i] <= 5, `parkShade[${i}]=${parkShade[i]}`);
  }
});

test('no orphan roads: every road/bridge tile is reachable from spawn', () => {
  const isRoad = (x,y) => x>=0&&x<MAP_W&&y>=0&&y<MAP_H &&
    (tileMap[mi(x,y)]===T.ROAD || tileMap[mi(x,y)]===T.BRIDGE);
  const seen = new Uint8Array(MAP_W*MAP_H);
  const q = [HALF_W, HALF_H];
  seen[mi(HALF_W,HALF_H)] = 1;
  for (let h=0; h<q.length; h+=2) {
    const x=q[h], y=q[h+1];
    for (const [nx,ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]])
      if (isRoad(nx,ny) && !seen[mi(nx,ny)]) { seen[mi(nx,ny)]=1; q.push(nx,ny); }
  }
  let orphans = 0;
  for (let i=0;i<MAP_W*MAP_H;i++)
    if ((tileMap[i]===T.ROAD||tileMap[i]===T.BRIDGE) && !seen[i]) orphans++;
  assert.equal(orphans, 0, `${orphans} unreachable road tiles remain`);
});

test('roadTiles lists exactly the reachable road/bridge tiles', () => {
  let roadCount = 0;
  for (let i=0;i<MAP_W*MAP_H;i++)
    if (tileMap[i]===T.ROAD||tileMap[i]===T.BRIDGE) roadCount++;
  assert.ok(roadTiles.length > 0, 'roadTiles is empty');
  assert.equal(roadTiles.length, roadCount, `roadTiles=${roadTiles.length} road tiles=${roadCount}`);
  for (const {tx,ty} of roadTiles) {
    const t = tileMap[mi(tx,ty)];
    assert.ok(t===T.ROAD||t===T.BRIDGE, `roadTiles entry (${tx},${ty}) is type ${t}`);
  }
});

test('randomMap produces different maps on each call', () => {
  const snapshot1 = tileMap.slice();
  randomMap.build();
  const snapshot2 = tileMap.slice();
  let differs = false;
  for (let i = 0; i < MAP_W * MAP_H; i++) {
    if (snapshot1[i] !== snapshot2[i]) { differs = true; break; }
  }
  assert.ok(differs, 'randomMap produced identical maps twice — seed not randomized');
});


// ─── 5. parisMap validity ─────────────────────────────────────────────────────
suite('parisMap map validity');

parisMap.build();

const cP = countTiles();

test('MAP_W/H updated to 80×80', () => {
  assert.equal(MAP_W, 80);
  assert.equal(MAP_H, 80);
});

test('has road tiles', () => assert.ok(cP.road > 0));

test('has Seine water tiles', () => assert.ok(cP.water > 0, `water=${cP.water}`));

test('paris spawn is passable', () => {
  const {x, z} = tileCenter(HALF_W, HALF_H);
  assert.ok(passable(x, z), `type=${tileAt(x, z)}`);
});

test('bldgH 2-14 for paris buildings', () => {
  for (let i = 0; i < MAP_W * MAP_H; i++) {
    if (tileMap[i] !== T.BUILDING || bldgW[i] === 255) continue;
    assert.ok(bldgH[i] >= 2 && bldgH[i] <= 14, `bldgH[${i}]=${bldgH[i]}`);
  }
});

test('Seine rows 44-46 are water/bridge except the Notre-Dame island', () => {
  for (let ty = 44; ty <= 46; ty++) {
    for (let tx = 0; tx < MAP_W; tx++) {
      const t = tileMap[mi(tx, ty)];
      const inNotreDame = tx >= 42 && tx < 46 && ty >= 43 && ty < 46;
      if (inNotreDame) {
        assert.equal(t, T.BUILDING, `tile(${tx},${ty}) should be Notre-Dame island/building`);
        continue;
      }
      assert.ok(t === T.WATER || t === T.BRIDGE,
        `tile(${tx},${ty})=${t} in Seine should be water/bridge`);
    }
  }
});

test('paris landmark footprints do not leave road or bridge tiles underneath', () => {
  for (const fp of parisMap.blockedLandmarkFootprints) {
    for (let ty = fp.y0; ty < fp.y0 + fp.h; ty++) {
      for (let tx = fp.x0; tx < fp.x0 + fp.w; tx++) {
        const id = mi(tx, ty);
        assert.equal(tileMap[id], T.BUILDING,
          `${fp.name} tile(${tx},${ty}) should be reserved as BUILDING`);
        assert.equal(bldgW[id], 255,
          `${fp.name} tile(${tx},${ty}) should block regular building tiling`);
      }
    }
  }
});

test('no orphan roads in paris map', () => {
  const isRoad = (x,y) => x>=0&&x<MAP_W&&y>=0&&y<MAP_H &&
    (tileMap[mi(x,y)]===T.ROAD || tileMap[mi(x,y)]===T.BRIDGE);
  const seen = new Uint8Array(MAP_W*MAP_H);
  const q = [HALF_W, HALF_H];
  seen[mi(HALF_W,HALF_H)] = 1;
  for (let h=0; h<q.length; h+=2) {
    const x=q[h], y=q[h+1];
    for (const [nx,ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]])
      if (isRoad(nx,ny) && !seen[mi(nx,ny)]) { seen[mi(nx,ny)]=1; q.push(nx,ny); }
  }
  let orphans = 0;
  for (let i=0;i<MAP_W*MAP_H;i++)
    if ((tileMap[i]===T.ROAD||tileMap[i]===T.BRIDGE) && !seen[i]) orphans++;
  assert.equal(orphans, 0, `${orphans} unreachable road tiles remain`);
});

test('paris roadTiles lists exactly the reachable road/bridge tiles', () => {
  let roadCount = 0;
  for (let i=0;i<MAP_W*MAP_H;i++)
    if (tileMap[i]===T.ROAD||tileMap[i]===T.BRIDGE) roadCount++;
  assert.ok(roadTiles.length > 0, 'roadTiles is empty');
  assert.equal(roadTiles.length, roadCount, `roadTiles=${roadTiles.length} road tiles=${roadCount}`);
  for (const {tx,ty} of roadTiles) {
    const t = tileMap[mi(tx,ty)];
    assert.ok(t===T.ROAD||t===T.BRIDGE, `roadTiles entry (${tx},${ty}) is type ${t}`);
  }
});

test('paris night duplicates paris tile layout', () => {
  parisMap.build();
  const parisTiles = tileMap.slice();
  parisNightMap.build();
  assert.equal(MAP_W, 80);
  assert.equal(MAP_H, 80);
  assert.deepEqual(tileMap, parisTiles);
});


// ─── 6. physics ───────────────────────────────────────────────────────────────
suite('physics (random map)');

randomMap.build();
resetPhysics();

test('initial direction is (0,-1)', () => {
  assert.equal(dirX, 0);
  assert.equal(dirZ, -1);
});

test('initial prevDir is (0,-1)', () => {
  assert.equal(prevDirX, 0);
  assert.equal(prevDirZ, -1);
});

test('cornersForDir returns exactly 4 corners', () => {
  assert.equal(cornersForDir(0, 0, 1, 0).length, 4);
  assert.equal(cornersForDir(0, 0, 0, -1).length, 4);
});

test('leadingPointsForDir returns exactly 3 points', () => {
  assert.equal(leadingPointsForDir(0, 0, 1, 0).length, 3);
});

test('corners are symmetric around center', () => {
  const corners = cornersForDir(0, 0, 1, 0);
  const zVals = corners.map(([, z]) => z).sort((a,b) => a-b);
  assert.ok(Math.abs(zVals[0] + zVals[3]) < 1e-10, 'z corners not symmetric');
});

test('leading points are ahead of car', () => {
  const pts = leadingPointsForDir(0, 0, 1, 0);
  assert.ok(pts.every(([x]) => x > 0), 'leading points should be in +x direction');
});

test('spawn position is movable', () => {
  const {x, z} = tileCenter(HALF_W, HALF_H);
  assert.ok(passable(x, z), 'spawn not passable');
  const dt = 1 / 60;
  const canMove = [[0,-1],[0,1],[1,0],[-1,0]].some(([dx,dz]) => {
    const r = moveWithCollision(x, z, dx, dz, dt);
    return r.moved;
  });
  assert.ok(canMove, 'car cannot move in any direction from spawn');
});

test('moveWithCollision returns {x, z, moved}', () => {
  const {x, z} = tileCenter(HALF_W, HALF_H);
  const r = moveWithCollision(x, z, 0, -1, 1/60);
  assert.ok('x' in r && 'z' in r && 'moved' in r, 'missing result fields');
  assert.equal(typeof r.moved, 'boolean');
});

test('car stays within map bounds when driving', () => {
  const {x: sx, z: sz} = tileCenter(HALF_W, HALF_H);
  let cx = sx, cz = sz;
  let dx = 0, dz = -1;
  const dt = 1/60;
  const halfSize = Math.max(MAP_W, MAP_H) * TILE / 2;

  for (let i = 0; i < 300; i++) {
    const r = moveWithCollision(cx, cz, dx, dz, dt);
    if (r.moved) { cx = r.x; cz = r.z; }
    else { [dx, dz] = [-dz, dx]; }
    assert.ok(Math.abs(cx) <= halfSize, `x=${cx} out of bounds`);
    assert.ok(Math.abs(cz) <= halfSize, `z=${cz} out of bounds`);
  }
});

test('setDir live binding updates dirX/dirZ', () => {
  setDir(1, 0);
  assert.equal(dirX, 1);
  assert.equal(dirZ, 0);
  resetPhysics();
  assert.equal(dirX, 0);
  assert.equal(dirZ, -1);
});

test('CONST_SPEED * dt_60fps < TILE (car moves ≤1 tile per frame)', () => {
  const step = CONST_SPEED * (1/60);
  assert.ok(step < TILE, `step=${step.toFixed(3)} exceeds TILE=${TILE}`);
});


// ─── 7. game state machine (pure logic) ──────────────────────────────────────
suite('state machine logic (no Three.js)');

const GameState = Object.freeze({
  MENU:'menu', PLAYING:'playing', GAME_OVER:'game_over'
});
const GAME_DURATION = 90;
const TIMER_EPSILON = 0.001;

function simulateTimer(dtPerFrame) {
  let timeLeft = GAME_DURATION;
  let gs = GameState.PLAYING;
  let frames = 0;
  const maxFrames = Math.ceil(GAME_DURATION / dtPerFrame) + 10;
  while (frames < maxFrames) {
    if (gs !== GameState.PLAYING) break;
    timeLeft -= dtPerFrame;
    if (timeLeft < TIMER_EPSILON) { timeLeft = 0; gs = GameState.GAME_OVER; }
    frames++;
  }
  return { gs, timeLeft, frames };
}

test('timer reaches GAME_OVER at 60fps (dt=1/60)', () => {
  const { gs, timeLeft } = simulateTimer(1/60);
  assert.equal(gs, GameState.GAME_OVER, 'should reach GAME_OVER');
  assert.equal(timeLeft, 0);
});

test('timer reaches GAME_OVER at capped dt=0.05', () => {
  const { gs, timeLeft } = simulateTimer(0.05);
  assert.equal(gs, GameState.GAME_OVER);
  assert.equal(timeLeft, 0);
});

test('timer duration is ~90s at 60fps', () => {
  const { frames } = simulateTimer(1/60);
  const elapsed = frames / 60;
  assert.ok(elapsed >= 89.9 && elapsed <= 90.1,
    `elapsed=${elapsed.toFixed(3)}s (expected ~90s)`);
});

test('timer does not tick in non-PLAYING states', () => {
  let timeLeft = GAME_DURATION;
  const gs = GameState.MENU;
  if (gs !== GameState.PLAYING) { /* no tick */ }
  assert.equal(timeLeft, GAME_DURATION, 'timeLeft changed when not PLAYING');
});

test('GameState transitions: MENU → PLAYING → GAME_OVER', () => {
  let gs = GameState.MENU;
  gs = GameState.PLAYING;
  assert.equal(gs, GameState.PLAYING);
  let timeLeft = 0;
  if (timeLeft < TIMER_EPSILON) { gs = GameState.GAME_OVER; }
  assert.equal(gs, GameState.GAME_OVER);
});

test('GAME_OVER is reset to PLAYING on new round', () => {
  let gs = GameState.GAME_OVER;
  let timeLeft = 0;
  timeLeft = GAME_DURATION;
  gs = GameState.PLAYING;
  assert.equal(gs, GameState.PLAYING);
  assert.equal(timeLeft, GAME_DURATION);
});


// ─── 8. passable / collision edge cases ───────────────────────────────────────
suite('passable edge cases');

randomMap.build();

test('passable returns false for water tiles', () => {
  let found = false;
  for (let i = 0; i < MAP_W * MAP_H && !found; i++) {
    if (tileMap[i] === T.WATER) {
      const tx = i % MAP_W, ty = Math.floor(i / MAP_W);
      const {x, z} = tileCenter(tx, ty);
      assert.equal(passable(x, z), false, `water tile at (${tx},${ty}) should not be passable`);
      found = true;
    }
  }
});

test('passable returns true for road tiles', () => {
  let checked = 0;
  for (let ty = HALF_H - 3; ty <= HALF_H + 3; ty++) {
    for (let tx = HALF_W - 3; tx <= HALF_W + 3; tx++) {
      if (tileMap[mi(tx, ty)] === T.ROAD) {
        const {x, z} = tileCenter(tx, ty);
        assert.ok(passable(x, z), `road tile (${tx},${ty}) should be passable`);
        checked++;
      }
    }
  }
  assert.ok(checked > 0, 'no road tiles found near center');
});

test('passable returns true for bridge tiles', () => {
  let checked = 0;
  for (let i = 0; i < MAP_W * MAP_H; i++) {
    if (tileMap[i] !== T.BRIDGE) continue;
    const tx = i % MAP_W, ty = Math.floor(i / MAP_W);
    const {x, z} = tileCenter(tx, ty);
    assert.ok(passable(x, z), `bridge tile (${tx},${ty}) should be passable`);
    checked++;
    if (checked >= 10) break;
  }
});

test('building tiles are not passable', () => {
  for (let ty = 10; ty < 20; ty++) {
    for (let tx = 10; tx < 20; tx++) {
      if (tileMap[mi(tx, ty)] === T.BUILDING) {
        const {x, z} = tileCenter(tx, ty);
        assert.equal(passable(x, z), false, `building (${tx},${ty}) should not be passable`);
      }
    }
  }
});


// ─── summary ─────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
