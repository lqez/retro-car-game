import * as THREE from 'three';
import { PARIS_LANDMARK_COLORS as C } from '../../src/constants.js';

export function buildInvalides(add) {
  const cx = -240, cz = 192;
  const PI = Math.PI;
  const stoneMat = new THREE.MeshToonMaterial({ color: C.limestone });
  const shadeMat = new THREE.MeshToonMaterial({ color: C.agedStone });
  const roofMat = new THREE.MeshToonMaterial({ color: C.slate });
  const goldMat = new THREE.MeshToonMaterial({ color: C.gold });
  const shadowMat = new THREE.MeshToonMaterial({ color: C.shadow });

  function mesh(geometry, material, x, y, z) {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    add(m);
    return m;
  }

  function box(x, y, z, w, h, d, mat = stoneMat) {
    return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
  }

  function cyl(x, y, z, rt, rb, h, mat = stoneMat, seg = 18) {
    return mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z);
  }

  box(cx, 6, cz, 50, 12, 34);
  box(cx, 13, cz, 48, 3, 32, roofMat);
  box(cx - 25, 5, cz + 16, 12, 10, 24);
  box(cx + 25, 5, cz + 16, 12, 10, 24);
  box(cx, 6, cz + 25, 58, 12, 9);
  box(cx, 12.5, cz + 25, 56, 2.5, 8, roofMat);

  box(cx, 9, cz - 2, 17, 18, 36, shadeMat);
  box(cx, 20, cz - 2, 18, 4, 34, roofMat);
  cyl(cx, 24, cz - 2, 10, 11, 9, stoneMat, 22);
  for (const a of [0, PI / 2, PI, PI * 1.5]) {
    const x = cx + Math.cos(a) * 11;
    const z = cz - 2 + Math.sin(a) * 11;
    cyl(x, 25, z, 1.1, 1.1, 7, shadeMat, 8);
  }

  const dome = mesh(new THREE.SphereGeometry(10.5, 22, 14, 0, PI * 2, 0, PI * 0.65), goldMat, cx, 33, cz - 2);
  dome.castShadow = true;
  cyl(cx, 43, cz - 2, 2.3, 3, 5, goldMat, 12);
  mesh(new THREE.ConeGeometry(1.4, 9, 8), goldMat, cx, 50, cz - 2);

  const frontZ = cz - 17.5;
  for (const x of [cx - 18, cx - 9, cx, cx + 9, cx + 18]) {
    const arch = mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.8, 14), shadowMat, x, 8, frontZ - 0.45);
    arch.rotation.x = PI / 2;
    box(x, 5, frontZ - 0.5, 4.6, 6, 0.9, shadowMat);
  }
}
