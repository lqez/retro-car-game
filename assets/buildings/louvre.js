import * as THREE from 'three';

export function buildLouvre(add) {
  const cx = 48, cz = -48;
  const stoneMat = new THREE.MeshToonMaterial({ color: 0xd8cda8 });
  const roofMat  = new THREE.MeshToonMaterial({ color: 0x9a9488 });
  const courtMat = new THREE.MeshToonMaterial({ color: 0xc4b490 });
  const glassMat = new THREE.MeshToonMaterial({ color: 0x99ccee, transparent: true, opacity: 0.75 });
  const wireMat  = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });

  const leftWing = new THREE.Mesh(new THREE.BoxGeometry(10, 14, 40), stoneMat);
  leftWing.position.set(cx - 17, 7, cz); leftWing.castShadow = leftWing.receiveShadow = true; add(leftWing);

  const rightWing = new THREE.Mesh(new THREE.BoxGeometry(10, 14, 40), stoneMat);
  rightWing.position.set(cx + 17, 7, cz); rightWing.castShadow = rightWing.receiveShadow = true; add(rightWing);

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(44, 14, 10), stoneMat);
  backWall.position.set(cx, 7, cz - 17); backWall.castShadow = backWall.receiveShadow = true; add(backWall);

  const leftDormer = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 36), roofMat);
  leftDormer.position.set(cx - 17, 15.5, cz); leftDormer.castShadow = true; add(leftDormer);

  const rightDormer = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 36), roofMat);
  rightDormer.position.set(cx + 17, 15.5, cz); rightDormer.castShadow = true; add(rightDormer);

  const backRoof = new THREE.Mesh(new THREE.BoxGeometry(38, 3, 6), roofMat);
  backRoof.position.set(cx, 15.5, cz - 17); backRoof.castShadow = true; add(backRoof);

  const courtyard = new THREE.Mesh(new THREE.BoxGeometry(22, 0.5, 22), courtMat);
  courtyard.position.set(cx, 0.25, cz + 3); courtyard.receiveShadow = true; add(courtyard);

  const pyrGeo = new THREE.ConeGeometry(9, 16, 4);
  const pyramid = new THREE.Mesh(pyrGeo, glassMat);
  pyramid.rotation.y = Math.PI / 4; pyramid.position.set(cx, 8, cz + 3); pyramid.castShadow = false; add(pyramid);

  const pyramidWire = new THREE.Mesh(pyrGeo, wireMat);
  pyramidWire.rotation.y = Math.PI / 4; pyramidWire.position.set(cx, 8, cz + 3);
  pyramidWire.scale.setScalar(1.01); add(pyramidWire);
}
