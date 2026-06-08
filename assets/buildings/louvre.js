import * as THREE from 'three';
import { PARIS_LANDMARK_COLORS as C } from '../../src/constants.js';

export function buildLouvre(add) {
  const cx = 48, cz = -48;
  const PI = Math.PI;
  const stoneMat = new THREE.MeshToonMaterial({ color: C.limestone });
  const trimMat = new THREE.MeshToonMaterial({ color: C.limestoneLight });
  const roofMat = new THREE.MeshToonMaterial({ color: C.slate });
  const courtMat = new THREE.MeshToonMaterial({ color: C.agedStone });
  const glassMat = new THREE.MeshToonMaterial({ color: C.glass, transparent: true, opacity: 0.48 });
  const ribMat = new THREE.MeshToonMaterial({ color: C.glassDark });

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

  function beam(ax, ay, az, bx, by, bz, r, mat) {
    const a = new THREE.Vector3(ax, ay, az);
    const b = new THREE.Vector3(bx, by, bz);
    const len = a.distanceTo(b);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), mat);
    m.position.copy(a.clone().add(b).multiplyScalar(0.5));
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    m.castShadow = true;
    add(m);
  }

  box(cx - 22, 7, cz, 9, 14, 46);
  box(cx + 22, 7, cz, 9, 14, 46);
  box(cx, 7, cz - 22, 52, 14, 9);
  box(cx - 22, 16, cz, 7, 4, 44, roofMat);
  box(cx + 22, 16, cz, 7, 4, 44, roofMat);
  box(cx, 16, cz - 22, 50, 4, 7, roofMat);

  for (const z of [cz - 15, cz - 7, cz + 1, cz + 9, cz + 17]) {
    box(cx - 27.1, 9, z, 0.9, 7, 3.2, trimMat);
    box(cx + 27.1, 9, z, 0.9, 7, 3.2, trimMat);
  }
  for (const x of [cx - 18, cx - 9, cx, cx + 9, cx + 18]) {
    box(x, 9, cz - 27.1, 4, 7, 0.9, trimMat);
  }

  box(cx, 0.25, cz + 4, 30, 0.5, 30, courtMat);
  for (const [x, z] of [[cx - 13, cz + 15], [cx + 13, cz + 15], [cx, cz - 7]]) {
    const pool = box(x, 0.55, z, 8, 0.35, 8, new THREE.MeshToonMaterial({ color: C.glassDark }));
    pool.castShadow = false;
  }

  const pyramid = mesh(new THREE.ConeGeometry(9.5, 15, 4), glassMat, cx, 7.5, cz + 4);
  pyramid.rotation.y = PI / 4;
  pyramid.castShadow = false;

  const baseY = 0.6;
  const apex = [cx, 15.2, cz + 4];
  const corners = [
    [cx - 9.7, baseY, cz - 5.7],
    [cx + 9.7, baseY, cz - 5.7],
    [cx + 9.7, baseY, cz + 13.7],
    [cx - 9.7, baseY, cz + 13.7],
  ];
  for (let i = 0; i < corners.length; i++) {
    const a = corners[i];
    const b = corners[(i + 1) % corners.length];
    beam(a[0], a[1], a[2], b[0], b[1], b[2], 0.28, ribMat);
    beam(a[0], a[1], a[2], apex[0], apex[1], apex[2], 0.28, ribMat);
  }

  for (const [x, z] of [[cx - 17, cz + 4], [cx + 17, cz + 4], [cx, cz + 20]]) {
    const small = mesh(new THREE.ConeGeometry(3.2, 5.2, 4), glassMat, x, 2.6, z);
    small.rotation.y = PI / 4;
    small.castShadow = false;
  }
}
