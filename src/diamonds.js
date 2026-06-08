import * as THREE from 'three';
import { scene } from './scene.js';
import { TILE, HALF_W, HALF_H } from './constants.js';
import { roadTiles, tileCenter } from './map.js';

// ─── tunables ───────────────────────────────────────────────────────────────────────────────
const DIAMOND_COUNT = 8;
const COLLECT_DIST  = TILE * 1.15;   // how close the car must get
const FLOAT_Y       = TILE * 0.55;
const SPAWN_CLEAR   = 6;              // min Manhattan tile distance from car spawn

// ─── shared geometry / material ───────────────────────────────────────────────────────────────
const diamondGeo = new THREE.OctahedronGeometry(TILE * 0.30, 0);
const diamondMat = new THREE.MeshToonMaterial({ color: 0x2ad4ff, emissive: 0x0a3a55 });

let diamonds = [];               // {x,z,collected,mesh,phase}
export let collectedCount = 0;
export let totalCount = 0;

export function clearDiamonds(){
  for(const d of diamonds) scene.remove(d.mesh);
  diamonds = [];
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
    diamonds.push({ x, z, collected:false, mesh, phase:Math.random()*Math.PI*2 });
  }
  totalCount = diamonds.length;
  collectedCount = 0;
}

// Spin + bob, and collect any the car reaches. Returns number collected this frame.
export function updateDiamonds(dt, carX, carZ){
  let gained = 0;
  for(const d of diamonds){
    if(d.collected) continue;
    d.phase += dt * 2.2;
    d.mesh.rotation.y += dt * 1.6;
    d.mesh.position.y = FLOAT_Y + Math.sin(d.phase) * TILE * 0.12;
    const dx = d.x - carX, dz = d.z - carZ;
    if(dx*dx + dz*dz < COLLECT_DIST*COLLECT_DIST){
      d.collected = true;
      d.mesh.visible = false;
      collectedCount++;
      gained++;
    }
  }
  return gained;
}

export function getDiamonds(){ return diamonds; }
