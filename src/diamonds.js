import * as THREE from 'three';
import { scene } from './scene.js';
import { TILE, HALF_W, HALF_H } from './constants.js';
import { roadTiles, tileCenter } from './map.js';

// ─── tunables ───────────────────────────────────────────────────────────────────────────────
const DIAMOND_COUNT = 8;
const COLLECT_DIST  = TILE * 0.58;   // diamond radius TILE*0.30 + car half ~TILE*0.28
const FLOAT_Y       = TILE * 0.55;
const SPAWN_CLEAR   = 6;              // min Manhattan tile distance from car spawn

// pop animation
const POP_DURATION  = 0.18;          // seconds for scale-up burst
const POP_SCALE     = 2.4;           // peak scale during pop

// burst particles
const BURST_COUNT   = 10;
const BURST_SPEED   = TILE * 3.2;
const BURST_LIFE    = 0.45;
const burstGeo = new THREE.SphereGeometry(TILE * 0.055, 4, 4);
const burstMat = new THREE.MeshBasicMaterial({ color: 0x2ad4ff });

// ─── shared geometry / material ───────────────────────────────────────────────────────────────
const diamondGeo = new THREE.OctahedronGeometry(TILE * 0.30, 0);
const diamondMat = new THREE.MeshToonMaterial({ color: 0x2ad4ff, emissive: 0x0a3a55 });

let diamonds = [];               // {x,z,collected,mesh,phase,popT}
let bursts   = [];               // {mesh,vx,vy,vz,life,maxLife}
export let collectedCount = 0;
export let totalCount = 0;

export function clearDiamonds(){
  for(const d of diamonds) scene.remove(d.mesh);
  for(const b of bursts)   scene.remove(b.mesh);
  diamonds = [];
  bursts   = [];
  collectedCount = 0;
  totalCount = 0;
}

export function placeDiamonds(spawnTx = HALF_W, spawnTy = HALF_H){
  clearDiamonds();

  // candidate road tiles, a comfortable distance from the spawn
  const cand = roadTiles.filter(t =>
    Math.abs(t.tx - spawnTx) + Math.abs(t.ty - spawnTy) > SPAWN_CLEAR
  );
  // Fisher–Yates shuffle
  for(let i=cand.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [cand[i],cand[j]]=[cand[j],cand[i]];
  }

  const n = Math.min(DIAMOND_COUNT, cand.length);
  for(let i=0;i<n;i++){
    const {tx,ty} = cand[i];
    const {x,z}   = tileCenter(tx,ty);
    const mesh = new THREE.Mesh(diamondGeo, diamondMat);
    mesh.position.set(x, FLOAT_Y, z);
    mesh.castShadow = true;
    scene.add(mesh);
    diamonds.push({ x, z, collected:false, mesh, phase:Math.random()*Math.PI*2, popT:-1 });
  }
  totalCount = diamonds.length;
  collectedCount = 0;
}

function spawnBurst(x, y, z){
  for(let i=0;i<BURST_COUNT;i++){
    const mesh = new THREE.Mesh(burstGeo, burstMat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    // random direction in upper hemisphere
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.random() * Math.PI * 0.7;
    const spd   = BURST_SPEED * (0.5 + Math.random() * 0.5);
    bursts.push({
      mesh,
      vx: Math.sin(phi) * Math.cos(theta) * spd,
      vy: Math.cos(phi) * spd,
      vz: Math.sin(phi) * Math.sin(theta) * spd,
      life: BURST_LIFE,
      maxLife: BURST_LIFE,
    });
  }
}

// Spin + bob, pop animation, burst particles, and collect diamonds. Returns count collected this frame.
export function updateDiamonds(dt, carX, carZ){
  let gained = 0;

  for(const d of diamonds){
    if(d.collected){
      // drive pop animation
      if(d.popT >= 0){
        d.popT += dt;
        const t = d.popT / POP_DURATION;
        if(t >= 1){
          d.mesh.visible = false;
          d.popT = -1;
        } else {
          // scale up then back down in a smooth arc, then fade out
          const s = 1 + (POP_SCALE - 1) * Math.sin(t * Math.PI);
          d.mesh.scale.setScalar(s);
          d.mesh.rotation.y += dt * 6;
        }
      }
      continue;
    }

    d.phase += dt * 2.2;
    d.mesh.rotation.y += dt * 1.6;
    d.mesh.position.y = FLOAT_Y + Math.sin(d.phase) * TILE * 0.12;

    const dx = d.x - carX, dz = d.z - carZ;
    if(dx*dx + dz*dz < COLLECT_DIST*COLLECT_DIST){
      d.collected = true;
      d.popT = 0;               // start pop animation
      d.mesh.scale.setScalar(1);
      spawnBurst(d.x, d.mesh.position.y, d.z);
      collectedCount++;
      gained++;
    }
  }

  // update burst particles
  for(let i = bursts.length - 1; i >= 0; i--){
    const b = bursts[i];
    b.life -= dt;
    if(b.life <= 0){
      scene.remove(b.mesh);
      bursts.splice(i, 1);
      continue;
    }
    b.mesh.position.x += b.vx * dt;
    b.mesh.position.y += b.vy * dt;
    b.mesh.position.z += b.vz * dt;
    b.vy -= TILE * 8 * dt;  // gravity
    const alpha = b.life / b.maxLife;
    b.mesh.scale.setScalar(alpha);
  }

  return gained;
}

export function getDiamonds(){ return diamonds; }
