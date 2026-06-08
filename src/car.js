import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TILE, PEBBLE_COUNT as PCOUNT, SMOKE_COUNT as SCOUNT, PARTICLE_MIN_SPEED,
         CRASH_UP_SPEED, CRASH_FWD_SPEED, CRASH_AIRTIME, CRASH_SPIN,
         CRASH_SPIN_NOISE, CRASH_BOUNCE, CRASH_EMBED } from './constants.js';
import { scene } from './scene.js';
import { passable } from './map.js';

// Gravity that brings the launch back to ground in ~CRASH_AIRTIME seconds.
const CRASH_GRAVITY = (2 * CRASH_UP_SPEED) / CRASH_AIRTIME;

// ─── groups ───────────────────────────────────────────────────────────────────
export const carGroup  = new THREE.Group();
export const carVisual = new THREE.Group();
carGroup.add(carVisual);
scene.add(carGroup);

// Wheel meshes disabled (GLB is one solid mesh); keep exports for main.js compat
export const wheelMeshes = [];
export const wR_ = TILE * 0.24 * 0.70;

export function setCarVisible(visible) {
  carGroup.visible = visible;
}

// ─── character model loader ──────────────────────────────────────────────────
const _loader = new GLTFLoader();
let _loadId = 0; // incremented each load; stale callbacks are ignored

export function loadCharacterModel(char) {
  // Remove any currently loaded model meshes from carVisual
  while (carVisual.children.length > 0) carVisual.remove(carVisual.children[0]);

  const thisId = ++_loadId;
  _loader.load(char.glb, (gltf) => {
    if (thisId !== _loadId) return; // superseded by a newer load
    const model = gltf.scene;

    model.traverse(child => {
      if (child.isMesh) {
        child.castShadow    = true;
        child.receiveShadow = true;
      }
    });

    // Scale so the longest horizontal extent ≈ car length (2 × CAR_HL = TILE * 0.96)
    // then apply character's scale multiplier.
    const box1 = new THREE.Box3().setFromObject(model);
    const size  = box1.getSize(new THREE.Vector3());
    const base  = (TILE * 0.96) / Math.max(size.x, size.z);
    model.scale.setScalar(base * (char.scaleMul ?? 1.0));

    // Rotate to face local +X, then apply per-character GLB orientation fixes.
    model.rotation.y = Math.PI + (char.modelYaw ?? 0);

    // Centre horizontally and sit on ground
    const box2   = new THREE.Box3().setFromObject(model);
    const centre = box2.getCenter(new THREE.Vector3());
    model.position.set(-centre.x, -box2.min.y, -centre.z);

    carVisual.add(model);
  });
}

// ─── particles (pool sizes / cadence in constants.js) ──────────────────────────
const pebbleGeo = new THREE.DodecahedronGeometry(0.24,0);
const smokeGeo  = new THREE.SphereGeometry(0.42,6,5);
const pebbleMat = new THREE.MeshToonMaterial({color:0x998866});

const pebbleMeshes = Array.from({length:PCOUNT},()=>{
  const m=new THREE.Mesh(pebbleGeo,pebbleMat); m.visible=false; scene.add(m); return m;
});
const smokeMeshes = Array.from({length:SCOUNT},()=>{
  const m=new THREE.Mesh(smokeGeo,
    new THREE.MeshBasicMaterial({color:0xddddcc,transparent:true,opacity:0,depthWrite:false}));
  m.visible=false; scene.add(m); return m;
});

const pData = Array.from({length:PCOUNT},()=>({active:false,vx:0,vy:0,vz:0,life:0,maxLife:0.6}));
const sData = Array.from({length:SCOUNT},()=>({active:false,vx:0,vy:0,vz:0,life:0,maxLife:1.0}));
let pHead=0, sHead=0;

export function spawnEffects(x,z,fwX,fwZ,spd){
  if(spd<PARTICLE_MIN_SPEED)return;
  const px=-fwZ, pz=fwX;
  const rCX=x-fwX*TILE*0.24*1.05, rCZ=z-fwZ*TILE*0.24*1.05;

  const wpos=[
    [rCX+px*TILE*0.24*1.22, rCZ+pz*TILE*0.24*1.22],
    [rCX-px*TILE*0.24*1.22, rCZ-pz*TILE*0.24*1.22],
  ];

  for(const [wx,wz] of wpos){
    const idx=pHead%PCOUNT; pHead++;
    const p=pData[idx], m=pebbleMeshes[idx];
    const lat=(Math.random()-0.5)*2.5;
    const bs=4+Math.random()*10;
    p.active=true;
    p.vx=-fwX*bs+px*lat; p.vy=4+Math.random()*12; p.vz=-fwZ*bs+pz*lat;
    p.life=1.0; p.maxLife=0.35+Math.random()*0.3;
    m.position.set(wx+(Math.random()-0.5)*0.5, 0.3, wz+(Math.random()-0.5)*0.5);
    m.rotation.set(Math.random()*6,Math.random()*6,Math.random()*6);
    m.visible=true;
  }

  for(let si=0;si<2;si++){
    const sidx=sHead%SCOUNT; sHead++;
    const s=sData[sidx], sm=smokeMeshes[sidx];
    s.active=true;
    s.vx=(Math.random()-0.5)*4.0; s.vy=0.2+Math.random()*0.5; s.vz=(Math.random()-0.5)*4.0;
    s.life=1.0; s.maxLife=1.8+Math.random()*1.2;
    sm.position.set(x+(Math.random()-0.5)*1.5,1.2,z+(Math.random()-0.5)*1.5);
    sm.scale.setScalar(0.9); sm.material.opacity=0.18; sm.visible=true;
  }
}

export function updateParticles(dt){
  for(let i=0;i<PCOUNT;i++){
    const p=pData[i]; if(!p.active)continue;
    p.life-=dt/p.maxLife;
    if(p.life<=0){p.active=false;pebbleMeshes[i].visible=false;continue;}
    const m=pebbleMeshes[i];
    m.position.x+=p.vx*dt; m.position.y+=p.vy*dt; m.position.z+=p.vz*dt;
    p.vy-=22*dt;
    m.rotation.x+=p.vx*dt*3; m.rotation.z+=p.vz*dt*3;
    if(m.position.y<0.15){
      m.position.y=0.15; p.vy*=-0.25; p.vx*=0.55; p.vz*=0.55;
    }
  }
  for(let i=0;i<SCOUNT;i++){
    const s=sData[i]; if(!s.active)continue;
    s.life-=dt/s.maxLife;
    if(s.life<=0){s.active=false;smokeMeshes[i].visible=false;continue;}
    const m=smokeMeshes[i];
    m.position.x+=s.vx*dt; m.position.y+=s.vy*dt; m.position.z+=s.vz*dt;
    m.scale.setScalar(1+(1-s.life)*6);
    m.material.opacity=s.life*0.18;
  }
}

// ─── crash death: launch into the air tumbling, then slam into the ground ───────
// carGroup carries world position (incl. height); carVisual carries the tumble.
let _crashing = false;   // animation currently playing
let _crashed  = false;   // wreck has crashed this round (stays embedded)
const _cv = new THREE.Vector3();  // linear velocity
const _cw = new THREE.Vector3();  // angular velocity (pitch, yaw, roll)

export function isCrashing(){ return _crashing; }

export function resetCrash(){
  _crashing = false; _crashed = false;
  _cv.set(0,0,0); _cw.set(0,0,0);
  carGroup.position.y = 0;
  carVisual.position.set(0,0,0);
  carVisual.rotation.set(0,0,0);
}

export function startCrash(dirX, dirZ){
  if(_crashed) return;
  _crashing = true; _crashed = true;
  const len = Math.hypot(dirX, dirZ) || 1;
  const fx = dirX/len, fz = dirZ/len;
  const rnd = () => Math.random()*2 - 1;
  // fling straight along the travel direction (no lateral drift)
  _cv.set(fx*CRASH_FWD_SPEED, CRASH_UP_SPEED, fz*CRASH_FWD_SPEED);
  // tumble end-over-end about the lateral axis (local Z = pitch), light noise on the rest.
  // carGroup already faces the travel dir, so local Z is the world axis ⟂ to travel.
  _cw.set(
    rnd()*CRASH_SPIN*CRASH_SPIN_NOISE,   // x roll — noise
    rnd()*CRASH_SPIN*CRASH_SPIN_NOISE,   // y yaw  — noise
    -CRASH_SPIN                           // z pitch — main end-over-end flip
  );
  carVisual.position.set(0,0,0);  // hand height control to carGroup
}

export function updateCrash(dt){
  if(!_crashing) return;
  _cv.y -= CRASH_GRAVITY * dt;

  // horizontal travel; bounce back off buildings/walls
  const nx = carGroup.position.x + _cv.x * dt;
  const nz = carGroup.position.z + _cv.z * dt;
  if(passable(nx, nz)){
    carGroup.position.x = nx;
    carGroup.position.z = nz;
  }else{
    _cv.x *= -CRASH_BOUNCE;   // reverse (with energy loss)
    _cv.z *= -CRASH_BOUNCE;
  }
  carGroup.position.y += _cv.y * dt;

  carVisual.rotation.x += _cw.x * dt;
  carVisual.rotation.y += _cw.y * dt;
  carVisual.rotation.z += _cw.z * dt;

  // hit the ground while descending → bury ~half and stop
  if(_cv.y < 0 && carGroup.position.y <= -CRASH_EMBED){
    carGroup.position.y = -CRASH_EMBED;
    _crashing = false;        // animation done; wreck stays embedded at this pose
    crashDust(carGroup.position.x, carGroup.position.z);
  }
}

// Radial dust + debris burst at the impact point.
function crashDust(x, z){
  for(let i=0;i<10;i++){
    const idx=pHead%PCOUNT; pHead++;
    const p=pData[idx], m=pebbleMeshes[idx];
    const a=Math.random()*Math.PI*2, sp=8+Math.random()*16;
    p.active=true;
    p.vx=Math.cos(a)*sp; p.vy=6+Math.random()*14; p.vz=Math.sin(a)*sp;
    p.life=1.0; p.maxLife=0.4+Math.random()*0.35;
    m.position.set(x+(Math.random()-0.5)*1.5, 0.4, z+(Math.random()-0.5)*1.5);
    m.rotation.set(Math.random()*6,Math.random()*6,Math.random()*6);
    m.visible=true;
  }
  for(let i=0;i<8;i++){
    const sidx=sHead%SCOUNT; sHead++;
    const s=sData[sidx], sm=smokeMeshes[sidx];
    const a=Math.random()*Math.PI*2, sp=1+Math.random()*4;
    s.active=true;
    s.vx=Math.cos(a)*sp; s.vy=0.6+Math.random()*1.2; s.vz=Math.sin(a)*sp;
    s.life=1.0; s.maxLife=1.6+Math.random()*1.0;
    sm.position.set(x+(Math.random()-0.5)*2.0, 1.0, z+(Math.random()-0.5)*2.0);
    sm.scale.setScalar(1.0); sm.material.opacity=0.22; sm.visible=true;
  }
}
