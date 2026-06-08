import * as THREE from 'three';
import { scene } from './scene.js';
import {
  TILE,
  DIAMOND_COLLECT_DIST,
  DIAMOND_FLOAT_Y,
  DIAMOND_SPAWN_CLEAR,
  DIAMOND_GEM_OPACITY,
  DIAMOND_CORE_OPACITY,
  DIAMOND_GLOW_OPACITY,
  DIAMOND_POP_DURATION,
  DIAMOND_POP_SCALE,
  DIAMOND_BURST_COUNT,
  DIAMOND_BURST_SPEED,
  DIAMOND_BURST_LIFE,
  DIAMOND_BURST_RADIUS,
  DIAMOND_RING_INNER_R,
  DIAMOND_RING_OUTER_R,
  DIAMOND_RING_LIFE,
  DIAMOND_RING_SCALE,
} from './constants.js';
import { DEFAULT_GAMEPLAY, HALF_W, HALF_H, roadTiles, tileCenter } from './map.js';
import { clearForDir, leadingClearForDir } from './physics.js';

const burstGeo = new THREE.SphereGeometry(DIAMOND_BURST_RADIUS, 6, 5);
const burstMat = new THREE.MeshBasicMaterial({ color: 0x7cf7ff, transparent:true, opacity:0.95, depthWrite:false });
const DIRS = [[1,0],[-1,0],[0,1],[0,-1]];

// ─── shared geometry / material ───────────────────────────────────────────────────────────────
function makeDiamondGeometry(){
  const topR = TILE*0.19, girdleR = TILE*0.40, bottomR = TILE*0.18;
  const topY = TILE*0.18, girdleY = 0, bottomY = -TILE*0.30;
  const verts = [];
  for(let i=0;i<8;i++){
    const a = i*Math.PI/4 + Math.PI/8;
    verts.push([Math.cos(a)*topR,topY,Math.sin(a)*topR]);
  }
  for(let i=0;i<8;i++){
    const a = i*Math.PI/4 + Math.PI/8;
    verts.push([Math.cos(a)*girdleR,girdleY,Math.sin(a)*girdleR]);
  }
  for(let i=0;i<8;i++){
    const a = i*Math.PI/4 + Math.PI/8;
    verts.push([Math.cos(a)*bottomR,bottomY,Math.sin(a)*bottomR]);
  }
  const pos = [];
  for(let i=0;i<8;i++){
    const nt = (i+1)%8;
    const topA = i, topB = nt, girdleA = 8+i, girdleB = 8+nt, bottomA = 16+i, bottomB = 16+nt;
    pos.push(...verts[0],...verts[topA],...verts[topB]);
    pos.push(...verts[topA],...verts[girdleA],...verts[girdleB], ...verts[topA],...verts[girdleB],...verts[topB]);
    pos.push(...verts[girdleA],...verts[bottomA],...verts[bottomB], ...verts[girdleA],...verts[bottomB],...verts[girdleB]);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  geo.computeVertexNormals();
  return geo;
}
const diamondGeo = makeDiamondGeometry();
const diamondCoreGeo = new THREE.CylinderGeometry(TILE*0.22,TILE*0.22,TILE*0.035,8);
const glowGeo = new THREE.SphereGeometry(TILE * 0.58, 16, 10);
const collectRingGeo = new THREE.RingGeometry(DIAMOND_RING_INNER_R,DIAMOND_RING_OUTER_R,32);
const diamondMat = new THREE.MeshToonMaterial({
  color: 0x63ecff,
  emissive: 0x27c4ff,
  emissiveIntensity: 0.95,
  transparent: true,
  opacity: DIAMOND_GEM_OPACITY,
  shininess: 90,
  side: THREE.DoubleSide,
});
const diamondCoreMat = new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:DIAMOND_CORE_OPACITY, depthWrite:false });
const glowMat = new THREE.MeshBasicMaterial({
  color:0x39dfff,
  transparent:true,
  opacity:DIAMOND_GLOW_OPACITY,
  depthWrite:false,
  blending:THREE.AdditiveBlending,
});
const collectRingMat = new THREE.MeshBasicMaterial({
  color:0x9fffff,
  transparent:true,
  opacity:0.85,
  depthWrite:false,
  side:THREE.DoubleSide,
  blending:THREE.AdditiveBlending,
});

let diamonds = [];               // {x,z,collected,group,gem,glow,core,phase,popT}
let bursts   = [];               // {mesh,vx,vy,vz,life,maxLife}
let rings    = [];               // {mesh,life,maxLife}
export let collectedCount = 0;
export let totalCount = 0;

export function clearDiamonds(){
  for(const d of diamonds) scene.remove(d.group);
  for(const b of bursts)   scene.remove(b.mesh);
  for(const r of rings)    scene.remove(r.mesh);
  diamonds = [];
  bursts   = [];
  rings    = [];
  collectedCount = 0;
  totalCount = 0;
}

export function placeDiamonds(count = DEFAULT_GAMEPLAY.diamondCount, spawnTx = HALF_W, spawnTy = HALF_H){
  clearDiamonds();

  // candidate road tiles, a comfortable distance from the spawn
  const cand = roadTiles.filter(t => {
    if(Math.abs(t.tx - spawnTx) + Math.abs(t.ty - spawnTy) <= DIAMOND_SPAWN_CLEAR) return false;
    const {x,z} = tileCenter(t.tx,t.ty);
    return DIRS.some(([dx,dz]) => clearForDir(x,z,dx,dz) && leadingClearForDir(x,z,dx,dz));
  });
  // Fisher–Yates shuffle
  for(let i=cand.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [cand[i],cand[j]]=[cand[j],cand[i]];
  }

  const n = Math.min(count, cand.length);
  for(let i=0;i<n;i++){
    const {tx,ty} = cand[i];
    const {x,z}   = tileCenter(tx,ty);
    const group = new THREE.Group();
    const gem = new THREE.Mesh(diamondGeo, diamondMat.clone());
    const core = new THREE.Mesh(diamondCoreGeo, diamondCoreMat.clone());
    const glow = new THREE.Mesh(glowGeo, glowMat.clone());
    core.position.y = TILE*0.20;
    glow.scale.set(1.0,0.72,1.0);
    gem.castShadow = true;
    glow.renderOrder = 1;
    gem.renderOrder = 2;
    core.renderOrder = 3;
    group.add(glow, gem, core);
    group.position.set(x, DIAMOND_FLOAT_Y, z);
    scene.add(group);
    diamonds.push({ x, z, collected:false, group, gem, glow, core, phase:Math.random()*Math.PI*2, popT:-1 });
  }
  totalCount = diamonds.length;
  collectedCount = 0;
}

function spawnBurst(x, y, z){
  const ring = new THREE.Mesh(collectRingGeo, collectRingMat.clone());
  ring.rotation.x = -Math.PI/2;
  ring.position.set(x,y,z);
  scene.add(ring);
  rings.push({mesh:ring,life:DIAMOND_RING_LIFE,maxLife:DIAMOND_RING_LIFE});

  for(let i=0;i<DIAMOND_BURST_COUNT;i++){
    const mesh = new THREE.Mesh(burstGeo, burstMat.clone());
    mesh.position.set(x, y, z);
    scene.add(mesh);
    // random direction in upper hemisphere
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.random() * Math.PI * 0.7;
    const spd   = DIAMOND_BURST_SPEED * (0.5 + Math.random() * 0.5);
    bursts.push({
      mesh,
      vx: Math.sin(phi) * Math.cos(theta) * spd,
      vy: Math.cos(phi) * spd,
      vz: Math.sin(phi) * Math.sin(theta) * spd,
      life: DIAMOND_BURST_LIFE * (0.75 + Math.random()*0.5),
      maxLife: DIAMOND_BURST_LIFE,
    });
  }
}

// Spin + bob, pop animation, burst particles, and optionally collect diamonds.
// Returns count collected this frame.
export function updateDiamonds(dt, carX, carZ, canCollect = true){
  let gained = 0;

  for(const d of diamonds){
    if(d.collected){
      // drive pop animation
      if(d.popT >= 0){
        d.popT += dt;
        const t = d.popT / DIAMOND_POP_DURATION;
        if(t >= 1){
          d.group.visible = false;
          d.popT = -1;
        } else {
          const s = 1 + (DIAMOND_POP_SCALE - 1) * Math.sin(Math.min(1,t) * Math.PI);
          const fade = 1-t;
          d.group.scale.setScalar(s);
          d.group.rotation.y += dt * 12;
          d.group.position.y += dt*TILE*1.1;
          d.gem.material.opacity = DIAMOND_GEM_OPACITY*fade;
          d.core.material.opacity = DIAMOND_CORE_OPACITY*fade;
          d.glow.material.opacity = DIAMOND_GLOW_OPACITY*fade;
        }
      }
      continue;
    }

    d.phase += dt * 2.2;
    d.group.rotation.y += dt * 1.7;
    d.group.rotation.z = Math.sin(d.phase*0.8) * 0.08;
    d.group.position.y = DIAMOND_FLOAT_Y + Math.sin(d.phase) * TILE * 0.14;
    d.glow.material.opacity = DIAMOND_GLOW_OPACITY + (Math.sin(d.phase*2.4)+1)*0.045;
    const pulse = 1 + Math.sin(d.phase*2.4)*0.08;
    d.glow.scale.set(1.0*pulse,0.72*pulse,1.0*pulse);

    if(canCollect){
      const dx = d.x - carX, dz = d.z - carZ;
      if(dx*dx + dz*dz < DIAMOND_COLLECT_DIST*DIAMOND_COLLECT_DIST){
        d.collected = true;
        d.popT = 0;               // start pop animation
        d.group.scale.setScalar(1);
        spawnBurst(d.x, d.group.position.y, d.z);
        collectedCount++;
        gained++;
      }
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
    b.vy -= TILE * 5.4 * dt;  // gravity
    const alpha = b.life / b.maxLife;
    b.mesh.scale.setScalar(alpha);
    b.mesh.material.opacity = Math.max(0,alpha*0.95);
  }

  for(let i = rings.length - 1; i >= 0; i--){
    const r = rings[i];
    r.life -= dt;
    if(r.life <= 0){
      scene.remove(r.mesh);
      rings.splice(i, 1);
      continue;
    }
    const t = 1 - r.life / r.maxLife;
    r.mesh.scale.setScalar(1 + t*DIAMOND_RING_SCALE);
    r.mesh.position.y += dt*TILE*0.10;
    r.mesh.material.opacity = (1-t)*0.85;
  }

  return gained;
}

export function getDiamonds(){ return diamonds; }
