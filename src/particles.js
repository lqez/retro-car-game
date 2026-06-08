import * as THREE from 'three';
import {
  TILE, PEBBLE_COUNT as PCOUNT, SMOKE_COUNT as SCOUNT, PARTICLE_MIN_SPEED,
  CRASH_DUST_COLOR, CRASH_SMOKE_COLOR, CRASH_DUST_BURST,
  EXPLOSION_FIRE_COLORS, EXPLOSION_SMOKE_COLOR, EXPLOSION_BLAST_COLORS, EXPLOSION_BURST,
} from './constants.js';
import { scene } from './scene.js';

const pebbleGeo = new THREE.DodecahedronGeometry(0.24, 0);
const smokeGeo = new THREE.SphereGeometry(0.42, 6, 5);
const blastGeo = new THREE.CircleGeometry(1, 32);
const pebbleMat = new THREE.MeshToonMaterial({ color: CRASH_DUST_COLOR });

const pebbleMeshes = Array.from({ length: PCOUNT }, () => {
  const m = new THREE.Mesh(pebbleGeo, pebbleMat.clone());
  m.visible = false;
  scene.add(m);
  return m;
});

const smokeMeshes = Array.from({ length: SCOUNT }, () => {
  const m = new THREE.Mesh(
    smokeGeo,
    new THREE.MeshBasicMaterial({
      color: CRASH_SMOKE_COLOR,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
  );
  m.visible = false;
  scene.add(m);
  return m;
});

const blastMeshes = Array.from({ length: EXPLOSION_BURST.blastPool }, () => {
  const m = new THREE.Mesh(
    blastGeo,
    new THREE.MeshBasicMaterial({
      color: EXPLOSION_BLAST_COLORS[0],
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  m.rotation.x = -Math.PI / 2;
  m.visible = false;
  scene.add(m);
  return m;
});

const pData = Array.from({ length: PCOUNT }, () => ({
  active: false,
  vx: 0, vy: 0, vz: 0,
  life: 0,
  maxLife: 0.6,
  scale: 1.0,
  shrink: false,
}));

const sData = Array.from({ length: SCOUNT }, () => ({
  active: false,
  vx: 0, vy: 0, vz: 0,
  life: 0,
  maxLife: 1.0,
  startScale: 1.0,
  growScale: 6.0,
  opacity: 0.18,
}));

const bData = Array.from({ length: EXPLOSION_BURST.blastPool }, () => ({
  active: false,
  life: 0,
  maxLife: 1.0,
  majorRadius: 1,
  minorRadius: 1,
  growScale: 1,
  opacity: 0,
}));

let pHead = 0;
let sHead = 0;
let bHead = 0;

export function spawnEffects(x, z, fwX, fwZ, spd) {
  if (spd < PARTICLE_MIN_SPEED) return;
  const px = -fwZ, pz = fwX;
  const rCX = x - fwX * TILE * 0.24 * 1.05;
  const rCZ = z - fwZ * TILE * 0.24 * 1.05;

  const wpos = [
    [rCX + px * TILE * 0.24 * 1.22, rCZ + pz * TILE * 0.24 * 1.22],
    [rCX - px * TILE * 0.24 * 1.22, rCZ - pz * TILE * 0.24 * 1.22],
  ];

  for (const [wx, wz] of wpos) {
    const idx = pHead % PCOUNT; pHead++;
    const p = pData[idx], m = pebbleMeshes[idx];
    const lat = (Math.random() - 0.5) * 2.5;
    const bs = 4 + Math.random() * 10;
    p.active = true;
    p.vx = -fwX * bs + px * lat; p.vy = 4 + Math.random() * 12; p.vz = -fwZ * bs + pz * lat;
    p.life = 1.0; p.maxLife = 0.35 + Math.random() * 0.3;
    p.scale = 1.0; p.shrink = false;
    m.material.color.setHex(CRASH_DUST_COLOR);
    m.scale.setScalar(1.0);
    m.position.set(wx + (Math.random() - 0.5) * 0.5, 0.3, wz + (Math.random() - 0.5) * 0.5);
    m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    m.visible = true;
  }

  for (let si = 0; si < 2; si++) {
    const sidx = sHead % SCOUNT; sHead++;
    const s = sData[sidx], sm = smokeMeshes[sidx];
    s.active = true;
    s.vx = (Math.random() - 0.5) * 4.0; s.vy = 0.2 + Math.random() * 0.5; s.vz = (Math.random() - 0.5) * 4.0;
    s.life = 1.0; s.maxLife = 1.8 + Math.random() * 1.2;
    s.startScale = 0.9; s.growScale = 6.0; s.opacity = 0.18;
    sm.material.color.setHex(CRASH_SMOKE_COLOR);
    sm.position.set(x + (Math.random() - 0.5) * 1.5, 1.2, z + (Math.random() - 0.5) * 1.5);
    sm.scale.setScalar(0.9); sm.material.opacity = 0.18; sm.visible = true;
  }
}

export function updateParticles(dt) {
  for (let i = 0; i < PCOUNT; i++) {
    const p = pData[i]; if (!p.active) continue;
    p.life -= dt / p.maxLife;
    if (p.life <= 0) { p.active = false; pebbleMeshes[i].visible = false; continue; }
    const m = pebbleMeshes[i];
    m.position.x += p.vx * dt; m.position.y += p.vy * dt; m.position.z += p.vz * dt;
    p.vy -= 22 * dt;
    m.rotation.x += p.vx * dt * 3; m.rotation.z += p.vz * dt * 3;
    if (p.shrink) m.scale.setScalar(p.scale * (0.25 + p.life * 0.75));
    if (m.position.y < 0.15) {
      m.position.y = 0.15; p.vy *= -0.25; p.vx *= 0.55; p.vz *= 0.55;
    }
  }

  for (let i = 0; i < SCOUNT; i++) {
    const s = sData[i]; if (!s.active) continue;
    s.life -= dt / s.maxLife;
    if (s.life <= 0) { s.active = false; smokeMeshes[i].visible = false; continue; }
    const m = smokeMeshes[i];
    m.position.x += s.vx * dt; m.position.y += s.vy * dt; m.position.z += s.vz * dt;
    m.scale.setScalar(s.startScale + (1 - s.life) * s.growScale);
    m.material.opacity = s.life * s.opacity;
  }

  for (let i = 0; i < EXPLOSION_BURST.blastPool; i++) {
    const b = bData[i]; if (!b.active) continue;
    b.life -= dt / b.maxLife;
    if (b.life <= 0) { b.active = false; blastMeshes[i].visible = false; continue; }
    const m = blastMeshes[i];
    const t = 1 - b.life;
    const scale = 1 + t * (b.growScale - 1);
    m.scale.set(b.majorRadius * scale, b.minorRadius * scale, 1);
    m.material.opacity = b.life * b.opacity;
  }
}

export function spawnCrashDust(x, z) {
  const burst = CRASH_DUST_BURST;
  for (let i = 0; i < burst.pebbleCount; i++) {
    const idx = pHead % PCOUNT; pHead++;
    const p = pData[idx], m = pebbleMeshes[idx];
    const a = Math.random() * Math.PI * 2, sp = burst.pebbleSpeedBase + Math.random() * burst.pebbleSpeedRandom;
    p.active = true;
    p.vx = Math.cos(a) * sp; p.vy = burst.pebbleUpBase + Math.random() * burst.pebbleUpRandom; p.vz = Math.sin(a) * sp;
    p.life = 1.0; p.maxLife = burst.pebbleLifeBase + Math.random() * burst.pebbleLifeRandom;
    p.scale = 1.0; p.shrink = false;
    m.material.color.setHex(CRASH_DUST_COLOR);
    m.scale.setScalar(1.0);
    m.position.set(x + (Math.random() - 0.5) * 1.5, 0.4, z + (Math.random() - 0.5) * 1.5);
    m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    m.visible = true;
  }

  for (let i = 0; i < burst.smokeCount; i++) {
    const sidx = sHead % SCOUNT; sHead++;
    const s = sData[sidx], sm = smokeMeshes[sidx];
    const a = Math.random() * Math.PI * 2, sp = burst.smokeSpeedBase + Math.random() * burst.smokeSpeedRandom;
    s.active = true;
    s.vx = Math.cos(a) * sp; s.vy = burst.smokeUpBase + Math.random() * burst.smokeUpRandom; s.vz = Math.sin(a) * sp;
    s.life = 1.0; s.maxLife = burst.smokeLifeBase + Math.random() * burst.smokeLifeRandom;
    s.startScale = burst.smokeStartScale; s.growScale = burst.smokeGrowScale; s.opacity = burst.smokeOpacity;
    sm.material.color.setHex(CRASH_SMOKE_COLOR);
    sm.position.set(x + (Math.random() - 0.5) * 2.0, 1.0, z + (Math.random() - 0.5) * 2.0);
    sm.scale.setScalar(burst.smokeStartScale); sm.material.opacity = burst.smokeOpacity; sm.visible = true;
  }
}

export function explode(x, z) {
  const burst = EXPLOSION_BURST;
  for (let i = 0; i < burst.blastCount; i++) {
    const bidx = bHead % burst.blastPool; bHead++;
    const b = bData[bidx], bm = blastMeshes[bidx];
    b.active = true;
    b.life = 1.0; b.maxLife = burst.blastLife * (0.8 + Math.random() * 0.4);
    b.majorRadius = burst.blastMajorRadius * (0.88 + Math.random() * 0.28);
    b.minorRadius = burst.blastMinorRadius * (0.82 + Math.random() * 0.35);
    b.growScale = burst.blastGrowScale * (0.9 + Math.random() * 0.2);
    b.opacity = burst.blastOpacity * (0.75 + Math.random() * 0.25);
    bm.material.color.setHex(EXPLOSION_BLAST_COLORS[Math.floor(Math.random() * EXPLOSION_BLAST_COLORS.length)]);
    bm.position.set(x + (Math.random() - 0.5) * TILE * 0.55, 0.18 + i * 0.01, z + (Math.random() - 0.5) * TILE * 0.55);
    bm.rotation.z = Math.random() * Math.PI;
    bm.scale.set(b.majorRadius, b.minorRadius, 1);
    bm.material.opacity = b.opacity;
    bm.visible = true;
  }

  for (let i = 0; i < burst.sparkCount; i++) {
    const idx = pHead % PCOUNT; pHead++;
    const p = pData[idx], m = pebbleMeshes[idx];
    const a = Math.random() * Math.PI * 2;
    const speedRoll = Math.random();
    const sp = burst.sparkSpeedBase + speedRoll * speedRoll * burst.sparkSpeedRandom;
    const large = Math.random() < burst.sparkScaleLargeChance;
    const scale = large
      ? burst.sparkLargeScaleMin + Math.random() * (burst.sparkLargeScaleMax - burst.sparkLargeScaleMin)
      : burst.sparkScaleMin + Math.random() * (burst.sparkScaleMax - burst.sparkScaleMin);
    p.active = true;
    p.vx = Math.cos(a) * sp; p.vy = burst.sparkUpBase + Math.random() * burst.sparkUpRandom; p.vz = Math.sin(a) * sp;
    p.life = 1.0; p.maxLife = burst.sparkLifeBase + Math.random() * burst.sparkLifeRandom;
    p.scale = scale; p.shrink = true;
    m.material.color.setHex(EXPLOSION_FIRE_COLORS[Math.floor(Math.random() * EXPLOSION_FIRE_COLORS.length)]);
    m.scale.setScalar(scale);
    m.position.set(x + (Math.random() - 0.5) * 1.2, 0.45, z + (Math.random() - 0.5) * 1.2);
    m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    m.visible = true;
  }

  for (let i = 0; i < burst.smokeCount; i++) {
    const sidx = sHead % SCOUNT; sHead++;
    const s = sData[sidx], sm = smokeMeshes[sidx];
    const a = Math.random() * Math.PI * 2, sp = burst.smokeSpeedBase + Math.random() * burst.smokeSpeedRandom;
    s.active = true;
    s.vx = Math.cos(a) * sp; s.vy = burst.smokeUpBase + Math.random() * burst.smokeUpRandom; s.vz = Math.sin(a) * sp;
    s.life = 1.0; s.maxLife = burst.smokeLife;
    s.startScale = burst.smokeStartScale; s.growScale = burst.smokeGrowScale; s.opacity = burst.smokeOpacity;
    sm.material.color.setHex(EXPLOSION_SMOKE_COLOR);
    sm.position.set(x + (Math.random() - 0.5) * 1.4, 0.9, z + (Math.random() - 0.5) * 1.4);
    sm.scale.setScalar(burst.smokeStartScale);
    sm.material.opacity = burst.smokeOpacity;
    sm.visible = true;
  }
}
