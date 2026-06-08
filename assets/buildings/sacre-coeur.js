import * as THREE from 'three';
import { PARIS_LANDMARK_COLORS as C } from '../../src/constants.js';

export function buildSacreCoeur(add) {
  const cx = -246, cz = -432;
  const PI = Math.PI;
  const bodyMat = new THREE.MeshToonMaterial({ color: C.sacreWhite });
  const shadeMat = new THREE.MeshToonMaterial({ color: C.sacreShade });
  const darkMat = new THREE.MeshToonMaterial({ color: C.limestoneDark });
  const glassMat = new THREE.MeshToonMaterial({ color: C.glassDark });

  function mesh(geometry, material, x, y, z) {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    add(m);
    return m;
  }

  function box(x, y, z, w, h, d, mat = bodyMat) {
    return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
  }

  function dome(x, y, z, r, mat = bodyMat) {
    const m = mesh(new THREE.SphereGeometry(r, 20, 12, 0, PI * 2, 0, PI * 0.58), mat, x, y, z);
    return m;
  }

  function cylinder(x, y, z, rt, rb, h, mat = bodyMat) {
    return mesh(new THREE.CylinderGeometry(rt, rb, h, 16), mat, x, y, z);
  }

  box(cx, 1.5, cz, 46, 3, 56, shadeMat);
  box(cx, 4.5, cz + 4, 38, 3, 46, shadeMat);
  box(cx, 11, cz, 30, 16, 42);
  box(cx, 11, cz, 46, 15, 26);
  box(cx, 15, cz + 17, 22, 22, 14);

  cylinder(cx, 24, cz, 12, 14, 10, bodyMat);
  dome(cx, 34, cz, 13, bodyMat);
  cylinder(cx, 43, cz, 2.5, 3.2, 5, shadeMat);
  mesh(new THREE.ConeGeometry(1.4, 7, 10), shadeMat, cx, 49, cz);

  for (const [x, z] of [[cx - 18, cz - 12], [cx + 18, cz - 12], [cx - 18, cz + 10], [cx + 18, cz + 10]]) {
    cylinder(x, 14, z, 4.8, 5.4, 19, bodyMat);
    dome(x, 25, z, 5.6, bodyMat);
    cylinder(x, 30, z, 1.2, 1.6, 4, shadeMat);
  }

  cylinder(cx + 20, 17, cz + 23, 4.8, 5.2, 28, bodyMat);
  dome(cx + 20, 33, cz + 23, 5, bodyMat);

  for (const x of [cx - 9, cx, cx + 9]) {
    const arch = mesh(new THREE.CylinderGeometry(2.8, 2.8, 0.8, 18), glassMat, x, 13, cz + 28.3);
    arch.rotation.x = PI / 2;
    box(x, 8, cz + 28.4, 5.6, 7, 0.9, darkMat);
  }

  for (const x of [cx - 18, cx - 9, cx, cx + 9, cx + 18]) {
    box(x, 5.2, cz + 33, 5.8, 1.2, 10, shadeMat);
  }
}
