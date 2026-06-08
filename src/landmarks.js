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
  buildArcDeTriomphe();
}

function buildArcDeTriomphe() {
  // World center: x=0, z=-132 (tiles 62-65, y=51-54, 4×4 block)
  const cx = 0;
  const cz = -132;

  const stoneMat = new THREE.MeshToonMaterial({ color: 0xd4c090 });
  const reliefMat = new THREE.MeshToonMaterial({ color: 0xbba870 });
  const archVoidMat = new THREE.MeshToonMaterial({ color: 0x222222 });

  // Left pillar
  const leftPillar = new THREE.Mesh(
    new THREE.BoxGeometry(11, 44, 36),
    stoneMat
  );
  leftPillar.position.set(cx - 14, 22, cz);
  leftPillar.castShadow = true;
  leftPillar.receiveShadow = true;
  add(leftPillar);

  // Right pillar
  const rightPillar = new THREE.Mesh(
    new THREE.BoxGeometry(11, 44, 36),
    stoneMat
  );
  rightPillar.position.set(cx + 14, 22, cz);
  rightPillar.castShadow = true;
  rightPillar.receiveShadow = true;
  add(rightPillar);

  // Top attic block
  const attic = new THREE.Mesh(
    new THREE.BoxGeometry(39, 10, 36),
    stoneMat
  );
  attic.position.set(cx, 49, cz);
  attic.castShadow = true;
  attic.receiveShadow = true;
  add(attic);

  // Arch opening (dark cylinder suggesting the vaulted tunnel)
  const archVoid = new THREE.Mesh(
    new THREE.CylinderGeometry(9, 9, 36, 16, 1, false),
    archVoidMat
  );
  archVoid.rotation.x = Math.PI / 2;
  archVoid.position.set(cx, 20, cz);
  archVoid.castShadow = true;
  add(archVoid);

  // Decorative relief panels above each side of the arch opening
  const reliefLeft = new THREE.Mesh(
    new THREE.BoxGeometry(8, 8, 1),
    reliefMat
  );
  reliefLeft.position.set(cx - 14, 38, cz - 18);
  reliefLeft.castShadow = true;
  add(reliefLeft);

  const reliefRight = new THREE.Mesh(
    new THREE.BoxGeometry(8, 8, 1),
    reliefMat
  );
  reliefRight.position.set(cx + 14, 38, cz - 18);
  reliefRight.castShadow = true;
  add(reliefRight);
}
