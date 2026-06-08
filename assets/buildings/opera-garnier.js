import * as THREE from 'three';
import { PARIS_LANDMARK_COLORS as C } from '../../src/constants.js';

export function buildOperaGarnier(add) {
  const cx = 72, cz = -264;
  const PI = Math.PI;
  const facadeMat = new THREE.MeshToonMaterial({ color: C.limestone });
  const lightMat = new THREE.MeshToonMaterial({ color: C.limestoneLight });
  const roofMat = new THREE.MeshToonMaterial({ color: C.copperGreen });
  const goldMat = new THREE.MeshToonMaterial({ color: C.gold });
  const shadowMat = new THREE.MeshToonMaterial({ color: C.shadow });

  function mesh(geometry, material, x, y, z) {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    add(m);
    return m;
  }

  function box(x, y, z, w, h, d, mat = facadeMat) {
    return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
  }

  function cyl(x, y, z, rt, rb, h, mat = facadeMat, seg = 14) {
    return mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z);
  }

  box(cx, 8, cz, 46, 16, 38);
  box(cx, 18, cz - 2, 42, 5, 36, lightMat);
  box(cx, 22.5, cz - 8, 36, 4, 24, facadeMat);
  box(cx, 26, cz - 8, 40, 2.5, 26, lightMat);
  box(cx, 31, cz, 34, 4, 32, roofMat);

  const frontZ = cz - 19.4;
  for (const x of [cx - 17, cx - 10, cx - 3, cx + 4, cx + 11, cx + 18]) {
    cyl(x, 8.5, frontZ, 1.1, 1.25, 15, lightMat, 12);
    box(x, 16.8, frontZ - 0.2, 3.6, 2, 0.8, goldMat);
  }

  for (const x of [cx - 13.5, cx, cx + 13.5]) {
    box(x, 8, frontZ - 0.25, 4.8, 7.5, 0.8, shadowMat);
  }

  for (const x of [cx - 22, cx + 22]) {
    box(x, 15, cz - 1, 8, 24, 34, lightMat);
    const flank = mesh(new THREE.SphereGeometry(4.8, 14, 8, 0, PI * 2, 0, PI * 0.55), roofMat, x, 29, cz - 1);
    flank.castShadow = true;
    cyl(x, 35, cz - 1, 1.2, 1.5, 4, goldMat, 10);
  }

  cyl(cx, 31, cz + 2, 9, 10, 8, facadeMat, 20);
  const dome = mesh(new THREE.SphereGeometry(10, 20, 12, 0, PI * 2, 0, PI * 0.55), roofMat, cx, 38, cz + 2);
  dome.castShadow = true;
  cyl(cx, 47, cz + 2, 1.4, 2.2, 5, goldMat, 10);
  mesh(new THREE.ConeGeometry(1.2, 5, 8), goldMat, cx, 52, cz + 2);

  for (const [x, z] of [[cx - 18, cz - 17], [cx + 18, cz - 17], [cx - 18, cz + 14], [cx + 18, cz + 14]]) {
    const statue = mesh(new THREE.ConeGeometry(2.2, 6, 6), goldMat, x, 31, z);
    statue.rotation.y = PI / 6;
  }
}
