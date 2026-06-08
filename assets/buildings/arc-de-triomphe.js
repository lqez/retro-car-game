import * as THREE from 'three';
import { PARIS_LANDMARK_COLORS as C } from '../../src/constants.js';

export function buildArcDeTriomphe(add) {
  const cx = -12, cz = -108;
  const PI = Math.PI;
  const stoneMat = new THREE.MeshToonMaterial({ color: C.limestone });
  const trimMat = new THREE.MeshToonMaterial({ color: C.limestoneLight });
  const reliefMat = new THREE.MeshToonMaterial({ color: C.limestoneDark });
  const voidMat = new THREE.MeshToonMaterial({ color: C.shadow });

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

  function archPanel(width, height, radius, depth) {
    const shape = new THREE.Shape();
    const half = width / 2;
    const springY = height - radius;
    shape.moveTo(-half, 0);
    shape.lineTo(-half, springY);
    shape.quadraticCurveTo(0, height + radius * 0.25, half, springY);
    shape.lineTo(half, 0);
    shape.lineTo(-half, 0);
    return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  }

  box(cx - 15, 22, cz, 11, 44, 34);
  box(cx + 15, 22, cz, 11, 44, 34);
  box(cx, 45, cz, 43, 8, 34);
  box(cx, 52, cz, 39, 8, 32);
  box(cx, 58, cz, 43, 3, 36, trimMat);
  box(cx, 4, cz, 48, 4, 38, reliefMat);

  const frontZ = cz - 17.8;
  const backZ = cz + 17.8;
  for (const z of [frontZ, backZ]) {
    const arch = mesh(archPanel(16, 23, 8, 1.2), voidMat, cx, 8, z);
    arch.rotation.y = z < cz ? 0 : PI;

    for (const sx of [-1, 1]) {
      const sideArch = mesh(archPanel(5.5, 12, 3, 0.9), voidMat, cx + sx * 14.5, 7, z + (z < cz ? -0.1 : 0.1));
      sideArch.rotation.y = z < cz ? 0 : PI;
      box(cx + sx * 14.5, 36, z + (z < cz ? -0.55 : 0.55), 7, 7, 0.8, reliefMat);
      box(cx + sx * 14.5, 49, z + (z < cz ? -0.55 : 0.55), 8, 2, 0.8, trimMat);
    }
    box(cx, 45, z + (z < cz ? -0.6 : 0.6), 31, 2, 0.8, reliefMat);
    box(cx, 55, z + (z < cz ? -0.6 : 0.6), 30, 1.6, 0.8, reliefMat);
  }

  for (const x of [cx - 20, cx - 10, cx, cx + 10, cx + 20]) {
    box(x, 61, cz, 2, 3, 36, trimMat);
  }
}
