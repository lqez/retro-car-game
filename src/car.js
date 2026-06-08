import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TILE, CRASH_UP_SPEED, CRASH_FWD_SPEED, CRASH_AIRTIME, CRASH_SPIN,
         CRASH_SPIN_NOISE, CRASH_BOUNCE, CRASH_EMBED } from './constants.js';
import { scene } from './scene.js';
import { passable } from './map.js';
import { spawnCrashDust, explode } from './particles.js';

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
    spawnCrashDust(carGroup.position.x, carGroup.position.z);
    explode(carGroup.position.x, carGroup.position.z);
  }
}
