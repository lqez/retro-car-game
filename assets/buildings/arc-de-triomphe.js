import * as THREE from 'three';

export function buildArcDeTriomphe(add) {
  const cx = -12, cz = -108;
  const stoneMat    = new THREE.MeshToonMaterial({ color: 0xd4c090 });
  const reliefMat   = new THREE.MeshToonMaterial({ color: 0xbba870 });
  const archVoidMat = new THREE.MeshToonMaterial({ color: 0x222222 });

  const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(11, 44, 36), stoneMat);
  leftPillar.position.set(cx - 14, 22, cz);
  leftPillar.castShadow = leftPillar.receiveShadow = true;
  add(leftPillar);

  const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(11, 44, 36), stoneMat);
  rightPillar.position.set(cx + 14, 22, cz);
  rightPillar.castShadow = rightPillar.receiveShadow = true;
  add(rightPillar);

  const attic = new THREE.Mesh(new THREE.BoxGeometry(39, 10, 36), stoneMat);
  attic.position.set(cx, 49, cz);
  attic.castShadow = attic.receiveShadow = true;
  add(attic);

  const archVoid = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 36, 16, 1, false), archVoidMat);
  archVoid.rotation.x = Math.PI / 2;
  archVoid.position.set(cx, 20, cz);
  archVoid.castShadow = true;
  add(archVoid);

  const reliefLeft = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 1), reliefMat);
  reliefLeft.position.set(cx - 14, 38, cz - 18);
  reliefLeft.castShadow = true;
  add(reliefLeft);

  const reliefRight = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 1), reliefMat);
  reliefRight.position.set(cx + 14, 38, cz - 18);
  reliefRight.castShadow = true;
  add(reliefRight);
}
