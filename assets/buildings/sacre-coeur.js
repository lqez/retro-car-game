import * as THREE from 'three';

export function buildSacreCoeur(add) {
  const cx = -90, cz = -528;
  const PI = Math.PI;
  const bodyMat   = new THREE.MeshToonMaterial({ color: 0xf5f0ea });
  const baseMat   = new THREE.MeshToonMaterial({ color: 0xd0c8bc });
  const detailMat = new THREE.MeshToonMaterial({ color: 0xe8e0d4 });

  const terrace = new THREE.Mesh(new THREE.BoxGeometry(32, 5, 44), baseMat);
  terrace.position.set(cx, 2.5, cz); terrace.receiveShadow = true; add(terrace);

  const body = new THREE.Mesh(new THREE.BoxGeometry(26, 14, 36), bodyMat);
  body.position.set(cx, 12, cz); body.castShadow = body.receiveShadow = true; add(body);

  const dome = new THREE.Mesh(new THREE.SphereGeometry(10, 16, 12, 0, PI*2, 0, PI*0.6), bodyMat);
  dome.position.set(cx, 26, cz); dome.castShadow = true; add(dome);

  const towerBody = new THREE.Mesh(new THREE.BoxGeometry(8, 18, 8), bodyMat);
  towerBody.position.set(cx, 9, cz + 18); add(towerBody);

  const towerDome = new THREE.Mesh(new THREE.SphereGeometry(5, 12, 8, 0, PI*2, 0, PI*0.6), bodyMat);
  towerDome.position.set(cx, 27, cz + 18); add(towerDome);

  for (const [tx, tz] of [[cx-14, cz-8],[cx+14, cz-8]]) {
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 16, 10), bodyMat);
    turret.position.set(tx, 8, tz); turret.castShadow = true; add(turret);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(4, 10, 6, 0, PI*2, 0, PI*0.55), bodyMat);
    cap.position.set(tx, 19, tz); add(cap);
  }

  const finial = new THREE.Mesh(new THREE.CylinderGeometry(0, 1.5, 5, 8), detailMat);
  finial.position.set(cx, 37, cz); add(finial);
}
