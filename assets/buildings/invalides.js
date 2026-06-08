import * as THREE from 'three';

export function buildInvalides(add) {
  const cx = -240, cz = 240;
  const PI = Math.PI;
  const stoneMat = new THREE.MeshToonMaterial({ color: 0xbca080 });
  const roofMat  = new THREE.MeshToonMaterial({ color: 0x7a8090 });
  const drumMat  = new THREE.MeshToonMaterial({ color: 0xd8ccb0 });
  const goldMat  = new THREE.MeshToonMaterial({ color: 0xd4a020 });

  const mainBldg = new THREE.Mesh(new THREE.BoxGeometry(44, 12, 34), stoneMat);
  mainBldg.position.set(cx, 6, cz); mainBldg.castShadow = mainBldg.receiveShadow = true; add(mainBldg);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(40, 2, 30), roofMat);
  roof.position.set(cx, 13, cz); add(roof);

  const centre = new THREE.Mesh(new THREE.BoxGeometry(14, 16, 34), stoneMat);
  centre.position.set(cx, 8, cz); centre.castShadow = true; add(centre);

  const domeDrum = new THREE.Mesh(new THREE.CylinderGeometry(9, 10, 10, 16), drumMat);
  domeDrum.position.set(cx, 21, cz); domeDrum.castShadow = true; add(domeDrum);

  const dome = new THREE.Mesh(new THREE.SphereGeometry(9, 16, 12, 0, PI*2, 0, PI*0.65), goldMat);
  dome.position.set(cx, 30, cz); dome.castShadow = true; add(dome);

  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3, 5, 12), goldMat);
  lantern.position.set(cx, 40, cz); add(lantern);

  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0, 2, 8, 8), goldMat);
  spire.position.set(cx, 46, cz); add(spire);

  for (const dx of [-10, 10]) {
    const arch = new THREE.Mesh(new THREE.BoxGeometry(8, 14, 3), stoneMat);
    arch.position.set(cx + dx, 7, cz - 18); add(arch);
  }
}
