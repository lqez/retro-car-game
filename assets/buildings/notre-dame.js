import * as THREE from 'three';

export function buildNotreDame(add) {
  const cx = 36, cz = 90;
  const stoneMat = new THREE.MeshToonMaterial({ color: 0xb8a88a });
  const roofMat  = new THREE.MeshToonMaterial({ color: 0x887060 });

  const nave = new THREE.Mesh(new THREE.BoxGeometry(40, 20, 28), stoneMat);
  nave.position.set(cx, 10, cz);
  nave.castShadow = nave.receiveShadow = true;
  add(nave);

  const leftTower = new THREE.Mesh(new THREE.BoxGeometry(9, 34, 9), stoneMat);
  leftTower.position.set(cx - 14, 17, cz + 11);
  leftTower.castShadow = true;
  add(leftTower);

  const rightTower = new THREE.Mesh(new THREE.BoxGeometry(9, 34, 9), stoneMat);
  rightTower.position.set(cx + 14, 17, cz + 11);
  rightTower.castShadow = true;
  add(rightTower);

  const leftCap = new THREE.Mesh(new THREE.ConeGeometry(5.5, 10, 4), roofMat);
  leftCap.rotation.y = Math.PI / 4;
  leftCap.position.set(cx - 14, 39, cz + 11);
  leftCap.castShadow = true;
  add(leftCap);

  const rightCap = new THREE.Mesh(new THREE.ConeGeometry(5.5, 10, 4), roofMat);
  rightCap.rotation.y = Math.PI / 4;
  rightCap.position.set(cx + 14, 39, cz + 11);
  rightCap.castShadow = true;
  add(rightCap);

  const spire = new THREE.Mesh(new THREE.ConeGeometry(3.5, 22, 4), roofMat);
  spire.rotation.y = Math.PI / 4;
  spire.position.set(cx, 31, cz - 4);
  spire.castShadow = true;
  add(spire);

  const buttressMat = new THREE.MeshToonMaterial({ color: 0xb8a88a });
  for (const [bx, bz] of [[cx-21,cz-6],[cx-21,cz+6],[cx+21,cz-6],[cx+21,cz+6]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(3, 8, 6), buttressMat);
    b.position.set(bx, 14, bz);
    b.castShadow = true;
    add(b);
  }
}
