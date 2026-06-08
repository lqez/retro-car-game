import * as THREE from 'three';

export function buildMoulinRouge(add) {
  const cx = -150, cz = -354;
  const PI = Math.PI;
  const redMat   = new THREE.MeshToonMaterial({ color: 0xcc2233 });
  const darkMat  = new THREE.MeshToonMaterial({ color: 0x441122 });
  const strawMat = new THREE.MeshToonMaterial({ color: 0xf5e8a0 });
  const blackMat = new THREE.MeshToonMaterial({ color: 0x221111 });

  const building = new THREE.Mesh(new THREE.BoxGeometry(30, 16, 28), redMat);
  building.position.set(cx, 8, cz); building.castShadow = building.receiveShadow = true; add(building);

  for (const dx of [-8, 8]) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(8, 10, 2), darkMat);
    win.position.set(cx + dx, 6, cz - 15); win.castShadow = true; add(win);
  }

  const tower = new THREE.Mesh(new THREE.CylinderGeometry(4, 5, 18, 10), redMat);
  tower.position.set(cx + 10, 17, cz - 8); tower.castShadow = true; add(tower);

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(3, 4, 5, 8), darkMat);
  cap.position.set(cx + 10, 27.5, cz - 8); cap.castShadow = true; add(cap);

  // 4 windmill blades
  const hub = { x: cx + 10, z: cz - 8 };
  const blade1 = new THREE.Mesh(new THREE.BoxGeometry(2, 14, 1.5), strawMat);
  blade1.position.set(hub.x, 35, hub.z); blade1.castShadow = true; add(blade1);
  const blade2 = new THREE.Mesh(new THREE.BoxGeometry(2, 14, 1.5), strawMat);
  blade2.rotation.z = PI / 2; blade2.position.set(hub.x + 7, 28, hub.z); blade2.castShadow = true; add(blade2);
  const blade3 = new THREE.Mesh(new THREE.BoxGeometry(2, 14, 1.5), strawMat);
  blade3.position.set(hub.x, 21, hub.z); blade3.castShadow = true; add(blade3);
  const blade4 = new THREE.Mesh(new THREE.BoxGeometry(2, 14, 1.5), strawMat);
  blade4.rotation.z = PI / 2; blade4.position.set(hub.x - 7, 28, hub.z); blade4.castShadow = true; add(blade4);

  const parapet = new THREE.Mesh(new THREE.BoxGeometry(32, 3, 4), darkMat);
  parapet.position.set(cx, 17, cz - 15); parapet.castShadow = true; add(parapet);

  const sign = new THREE.Mesh(new THREE.BoxGeometry(20, 4, 1), redMat);
  sign.position.set(cx, 14, cz - 15.5); sign.castShadow = true; add(sign);

  for (const dx of [-12, 12]) {
    const porthole = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 1, 16), blackMat);
    porthole.rotation.x = PI / 2; porthole.position.set(cx + dx, 12, cz - 15);
    porthole.castShadow = true; add(porthole);
  }
}
