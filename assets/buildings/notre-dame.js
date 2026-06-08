import * as THREE from 'three';
import { PARIS_LANDMARK_COLORS as C } from '../../src/constants.js';

export function buildNotreDame(add) {
  const cx = 48, cz = 54;
  const PI = Math.PI;
  const stoneMat = new THREE.MeshToonMaterial({ color: C.limestone });
  const darkStoneMat = new THREE.MeshToonMaterial({ color: C.limestoneDark });
  const roofMat = new THREE.MeshToonMaterial({ color: C.slateDark });
  const glassMat = new THREE.MeshToonMaterial({ color: C.glassDark });
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

  function disc(x, y, z, r, depth, mat = glassMat) {
    const m = mesh(new THREE.CylinderGeometry(r, r, depth, 20), mat, x, y, z);
    m.rotation.x = PI / 2;
    return m;
  }

  function portal(x, z) {
    const shape = new THREE.Shape();
    shape.moveTo(-3.2, 0);
    shape.lineTo(-3.2, 4.4);
    shape.quadraticCurveTo(0, 8, 3.2, 4.4);
    shape.lineTo(3.2, 0);
    shape.lineTo(-3.2, 0);
    const m = mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.8, bevelEnabled: false }), shadowMat, x, 1.4, z);
    return m;
  }

  box(cx, 8, cz - 2, 38, 16, 36);
  box(cx, 17, cz - 2, 34, 2.2, 34, darkStoneMat);
  box(cx, 23.5, cz - 2, 28, 11, 24, stoneMat);

  const roof = mesh(new THREE.ConeGeometry(18, 12, 4), roofMat, cx, 27, cz - 2);
  roof.rotation.y = PI / 4;

  for (const x of [cx - 13.5, cx + 13.5]) {
    box(x, 18, cz + 14, 10, 36, 11);
    box(x, 37, cz + 14, 11, 2.5, 12, darkStoneMat);
    for (const dx of [-3.6, 0, 3.6]) box(x + dx, 40, cz + 14, 2, 4, 11, stoneMat);
    disc(x, 23, cz + 20.15, 2.6, 0.8, glassMat);
    box(x, 10, cz + 20.2, 5, 8, 0.9, shadowMat);
  }

  disc(cx, 19, cz + 20.2, 5.2, 0.9, glassMat);
  disc(cx, 19, cz + 20.7, 2.2, 0.7, shadowMat);
  for (const x of [cx - 9, cx, cx + 9]) portal(x, cz + 20.15);

  for (const x of [cx - 19, cx + 19]) {
    for (const z of [cz - 13, cz - 4, cz + 5]) {
      const b = box(x, 12, z, 3, 13, 6, darkStoneMat);
      b.rotation.z = x < cx ? -0.18 : 0.18;
      const foot = box(x + (x < cx ? -1.4 : 1.4), 3, z, 5, 4, 7, darkStoneMat);
      foot.rotation.z = b.rotation.z;
    }
  }

  const transept = box(cx, 11, cz - 4, 48, 18, 12);
  transept.castShadow = transept.receiveShadow = true;
  for (const x of [cx - 25, cx + 25]) disc(x, 15, cz - 4, 4.2, 0.8, glassMat);

  const spire = mesh(new THREE.ConeGeometry(2.4, 24, 6), roofMat, cx, 42, cz - 5);
  spire.castShadow = true;
}
