import * as THREE from 'three';
import { TILE, HALF_W, HALF_H } from './constants.js';

// World center of a landmark whose top-left tile is (tx,ty) with size w×h tiles
export function lmkCenter(tx, ty, w, h) {
  return {
    x: (tx - HALF_W + w / 2) * TILE,
    z: (ty - HALF_H + h / 2) * TILE,
  };
}

let _scene = null;
const _meshes = [];

export function initLandmarks(scene) { _scene = scene; }

export function clearLandmarks() {
  _meshes.forEach(m => { if (_scene) _scene.remove(m); });
  _meshes.length = 0;
}

function add(obj) { _meshes.push(obj); _scene.add(obj); return obj; }

export function buildLandmarks() {
  if (!_scene) return;
  clearLandmarks();
  // === LANDMARK BUILDERS (sub-agents append calls here) ===
}
