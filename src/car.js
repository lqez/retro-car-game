import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TILE } from './constants.js';
import { scene } from './scene.js';

// ─── groups ───────────────────────────────────────────────────────────────────
export const carGroup  = new THREE.Group();
export const carVisual = new THREE.Group();
carGroup.add(carVisual);
scene.add(carGroup);

// Blob shadow
const blobShadow = new THREE.Mesh(
  new THREE.CircleGeometry(TILE * 0.55, 20),
  new THREE.MeshBasicMaterial({color:0x000000, transparent:true, opacity:0.38, depthWrite:false})
);
blobShadow.rotation.x = -Math.PI / 2;
blobShadow.position.y = 0.06;
carGroup.add(blobShadow);

// Wheel meshes disabled (GLB is one solid mesh); keep exports for main.js compat
export const wheelMeshes = [];
export const wR_ = TILE * 0.24 * 0.70;

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

    // Rotate to face local +X (game forward direction).
    model.rotation.y = Math.PI;

    // Centre horizontally and sit on ground
    const box2   = new THREE.Box3().setFromObject(model);
    const centre = box2.getCenter(new THREE.Vector3());
    model.position.set(-centre.x, -box2.min.y, -centre.z);

    carVisual.add(model);
  });
}

// ─── particles ────────────────────────────────────────────────────────────────
const PCOUNT=60, SCOUNT=70;
const pebbleGeo = new THREE.DodecahedronGeometry(0.24,0);
const smokeGeo  = new THREE.SphereGeometry(0.42,6,5);
const pebbleMat = new THREE.MeshToonMaterial({color:0x998866});

const pebbleMeshes = Array.from({length:PCOUNT},()=>{
  const m=new THREE.Mesh(pebbleGeo,pebbleMat); m.visible=false; scene.add(m); return m;
});
const smokeMeshes = Array.from({length:SCOUNT},()=>{
  const m=new THREE.Mesh(smokeGeo,
    new THREE.MeshBasicMaterial({color:0xddddcc,transparent:true,opacity:0}));
  m.visible=false; scene.add(m); return m;
});

const pData = Array.from({length:PCOUNT},()=>({active:false,vx:0,vy:0,vz:0,life:0,maxLife:0.6}));
const sData = Array.from({length:SCOUNT},()=>({active:false,vx:0,vy:0,vz:0,life:0,maxLife:1.0}));
let pHead=0, sHead=0;

export function spawnEffects(x,z,fwX,fwZ,spd){
  if(spd<5)return;
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
    sm.scale.setScalar(0.9); sm.material.opacity=0.35; sm.visible=true;
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
    m.material.opacity=s.life*0.35;
  }
}
