import * as THREE from 'three';
import { PARIS_LANDMARK_COLORS as C } from '../../src/constants.js';

export function buildMoulinRouge(add) {
  const cx = -150, cz = -354;
  const PI = Math.PI;
  const redMat = new THREE.MeshToonMaterial({ color: C.rougeRed });
  const trimMat = new THREE.MeshToonMaterial({ color: C.rougeTrim });
  const bladeMat = new THREE.MeshToonMaterial({ color: C.rougeCream });
  const glassMat = new THREE.MeshToonMaterial({ color: C.shadow });
  const signMat = new THREE.MeshToonMaterial({ color: C.gold });

  function mesh(geometry, material, x, y, z) {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    add(m);
    return m;
  }

  function box(x, y, z, w, h, d, mat = redMat) {
    return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
  }

  function cyl(x, y, z, rt, rb, h, mat = redMat, seg = 12) {
    return mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z);
  }

  box(cx, 8, cz, 34, 16, 28);
  box(cx, 17.5, cz - 4, 36, 3, 23, trimMat);
  box(cx, 20, cz - 3, 30, 3, 20, redMat);
  box(cx, 23, cz - 3, 32, 3, 22, trimMat);

  const frontZ = cz - 14.8;
  for (const x of [cx - 11, cx, cx + 11]) {
    box(x, 8.5, frontZ - 0.45, 6.8, 7.2, 0.8, glassMat);
  }
  box(cx, 14.2, frontZ - 0.6, 24, 3.5, 0.8, signMat);
  box(cx, 14.2, frontZ - 0.95, 20, 2.1, 0.5, redMat);

  cyl(cx + 10, 19, cz - 7, 4.5, 5.5, 23, redMat, 12);
  cyl(cx + 10, 31.5, cz - 7, 3.3, 4.4, 5, trimMat, 10);
  mesh(new THREE.ConeGeometry(3.6, 5, 10), trimMat, cx + 10, 36.5, cz - 7);

  const hubX = cx + 10;
  const hubY = 29;
  const hubZ = cz - 12.4;
  for (const rot of [0, PI / 2, PI / 4, -PI / 4]) {
    const blade = box(hubX, hubY, hubZ - 0.5, 2.1, 22, 1, bladeMat);
    blade.rotation.z = rot;
  }
  const hub = cyl(hubX, hubY, hubZ - 1.1, 2.2, 2.2, 1.1, trimMat, 16);
  hub.rotation.x = PI / 2;

  for (const x of [cx - 15, cx + 15]) {
    const porthole = cyl(x, 12, frontZ - 0.8, 2.4, 2.4, 0.8, glassMat, 16);
    porthole.rotation.x = PI / 2;
  }
}
