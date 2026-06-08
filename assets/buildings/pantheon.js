import * as THREE from 'three';

export function buildPantheon(add) {
  const cx = 66, cz = 192;
  const PI = Math.PI;
  const bodyMat = new THREE.MeshToonMaterial({ color: 0xe0d8cc });
  const colMat  = new THREE.MeshToonMaterial({ color: 0xf0ece4 });
  const domeMat = new THREE.MeshToonMaterial({ color: 0xc8c0b4 });
  const pedMat  = new THREE.MeshToonMaterial({ color: 0xd4ccc0 });

  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(32, 14, 42), bodyMat);
  mainBody.position.set(cx, 7, cz); mainBody.castShadow = mainBody.receiveShadow = true; add(mainBody);

  const pedLower = new THREE.Mesh(new THREE.BoxGeometry(26, 4, 2), bodyMat);
  pedLower.position.set(cx, 15, cz - 22); pedLower.castShadow = true; add(pedLower);

  const pedGable = new THREE.Mesh(new THREE.BoxGeometry(26, 6, 2), pedMat);
  pedGable.position.set(cx, 18, cz - 22); pedGable.castShadow = true; add(pedGable);

  // Six front columns
  for (const colX of [cx-12, cx-7, cx-2, cx+2, cx+7, cx+12]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 14, 10), colMat);
    col.position.set(colX, 7, cz - 22); col.castShadow = true; add(col);
  }

  const drum = new THREE.Mesh(new THREE.CylinderGeometry(8, 9, 8, 20), bodyMat);
  drum.position.set(cx, 19, cz); drum.castShadow = true; add(drum);

  const colonnade = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 3, 20, 1, true),
    new THREE.MeshToonMaterial({ color: 0xd8d0c4 }));
  colonnade.position.set(cx, 20, cz); add(colonnade);

  const dome = new THREE.Mesh(new THREE.SphereGeometry(8.5, 16, 12, 0, PI*2, 0, PI*0.62), domeMat);
  dome.position.set(cx, 27, cz); dome.castShadow = true; add(dome);

  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.5, 5, 12), domeMat);
  lantern.position.set(cx, 37, cz); add(lantern);

  const finial = new THREE.Mesh(new THREE.CylinderGeometry(0, 1, 6, 6),
    new THREE.MeshToonMaterial({ color: 0xd0c8bc }));
  finial.position.set(cx, 43, cz); add(finial);
}
