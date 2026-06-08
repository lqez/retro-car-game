import * as THREE from 'three';
import { PARIS_LANDMARK_COLORS as C } from '../../src/constants.js';

export function buildPantheon(add) {
  const cx = 66, cz = 192;
  const PI = Math.PI;
  const bodyMat = new THREE.MeshToonMaterial({ color: C.limestone });
  const lightMat = new THREE.MeshToonMaterial({ color: C.limestoneLight });
  const shadeMat = new THREE.MeshToonMaterial({ color: C.limestoneDark });
  const domeMat = new THREE.MeshToonMaterial({ color: C.slate });
  const shadowMat = new THREE.MeshToonMaterial({ color: C.shadow });

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

  function cyl(x, y, z, rt, rb, h, mat = bodyMat, seg = 18) {
    return mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z);
  }

  function pediment(width, height, depth) {
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0);
    shape.lineTo(width / 2, 0);
    shape.lineTo(0, height);
    shape.lineTo(-width / 2, 0);
    return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  }

  box(cx, 7, cz, 34, 14, 42);
  box(cx, 14.5, cz, 36, 2, 44, shadeMat);
  box(cx, 9, cz - 25, 32, 12, 7, lightMat);

  const frontZ = cz - 29;
  for (const x of [cx - 13, cx - 8, cx - 3, cx + 3, cx + 8, cx + 13]) {
    cyl(x, 8, frontZ, 1.2, 1.4, 15, lightMat, 12);
  }
  box(cx, 16, frontZ, 31, 2.4, 2.2, lightMat);
  const ped = mesh(pediment(32, 8, 2.2), lightMat, cx, 17, frontZ - 1.1);
  box(cx, 18.8, frontZ - 1.35, 20, 1.2, 0.7, shadeMat);

  for (const x of [cx - 11, cx, cx + 11]) {
    box(x, 7, cz - 21.2, 5.5, 7, 0.8, shadowMat);
  }

  cyl(cx, 19, cz, 9, 10, 7, bodyMat, 22);
  cyl(cx, 23, cz, 11, 11, 3, lightMat, 22);
  const dome = mesh(new THREE.SphereGeometry(9.5, 20, 12, 0, PI * 2, 0, PI * 0.62), domeMat, cx, 31, cz);
  dome.castShadow = true;
  cyl(cx, 40, cz, 2.2, 2.8, 5, domeMat, 12);
  mesh(new THREE.ConeGeometry(1.1, 6, 8), shadeMat, cx, 46, cz);

  for (const [x, z] of [[cx - 18, cz], [cx + 18, cz], [cx, cz - 18], [cx, cz + 18]]) {
    const saucer = mesh(new THREE.SphereGeometry(5.5, 14, 8, 0, PI * 2, 0, PI * 0.45), domeMat, x, 18, z);
    saucer.scale.y = 0.55;
  }
}
