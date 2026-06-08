import * as THREE from 'three';
import { PARIS_LANDMARK_COLORS as C } from '../../src/constants.js';

export function buildPompidou(add) {
  const cx = 186, cz = -54;
  const PI = Math.PI;
  const bodyMat = new THREE.MeshToonMaterial({ color: C.pompidouWhite });
  const steelMat = new THREE.MeshToonMaterial({ color: C.pompidouSteel });
  const glassMat = new THREE.MeshToonMaterial({ color: C.glass, transparent: true, opacity: 0.42 });
  const blueMat = new THREE.MeshToonMaterial({ color: C.pipeBlue });
  const redMat = new THREE.MeshToonMaterial({ color: C.pipeRed });
  const yellowMat = new THREE.MeshToonMaterial({ color: C.pipeYellow });
  const greenMat = new THREE.MeshToonMaterial({ color: C.pipeGreen });

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

  function pipeX(x, y, z, len, r, mat) {
    const p = mesh(new THREE.CylinderGeometry(r, r, len, 8), mat, x, y, z);
    p.rotation.z = PI / 2;
    return p;
  }

  function pipeY(x, y, z, len, r, mat) {
    return mesh(new THREE.CylinderGeometry(r, r, len, 8), mat, x, y, z);
  }

  function pipeZ(x, y, z, len, r, mat) {
    const p = mesh(new THREE.CylinderGeometry(r, r, len, 8), mat, x, y, z);
    p.rotation.x = PI / 2;
    return p;
  }

  box(cx, 11, cz, 34, 22, 30);
  for (const y of [3, 8, 13, 18, 23]) box(cx, y, cz - 16.3, 36, 0.9, 1.1, steelMat);
  for (const x of [cx - 17, cx - 8.5, cx, cx + 8.5, cx + 17]) box(x, 12, cz - 16.4, 0.9, 22, 1.1, steelMat);
  for (const z of [cz - 15, cz, cz + 15]) box(cx, 23, z, 36, 1.5, 1.4, steelMat);

  for (const y of [5, 11, 17]) {
    pipeX(cx, y, cz - 18, 32, 1.1, blueMat);
    pipeX(cx, y + 1.6, cz + 16.8, 30, 0.85, blueMat);
  }

  for (const z of [cz - 10, cz - 3, cz + 4, cz + 11]) pipeY(cx - 18.3, 12, z, 23, 1.0, redMat);
  for (const z of [cz - 8, cz, cz + 8]) pipeY(cx + 18.3, 12, z, 22, 0.7, yellowMat);
  for (const y of [6, 14, 22]) pipeZ(cx + 16.8, y, cz, 28, 0.75, greenMat);

  const brace1 = pipeX(cx, 12, cz - 18.8, 30, 0.75, greenMat);
  brace1.rotation.z = PI * 0.27;
  const brace2 = pipeX(cx, 12, cz - 18.9, 30, 0.75, greenMat);
  brace2.rotation.z = -PI * 0.27;

  const esc = pipeX(cx + 4, 12, cz - 20, 31, 2.0, glassMat);
  esc.rotation.z = -PI * 0.34;
  esc.castShadow = false;
  for (const x of [cx - 8, cx, cx + 8, cx + 16]) {
    const stair = box(x, 8 + (x - cx) * 0.18, cz - 21.9, 5, 0.8, 0.9, steelMat);
    stair.rotation.z = -PI * 0.34;
  }
}
