import * as THREE from 'three';

export function buildOperaGarnier(add) {
  const cx = 72, cz = -264;
  const PI = Math.PI;
  const facadeMat = new THREE.MeshToonMaterial({ color: 0xe8d8b0 });
  const colMat    = new THREE.MeshToonMaterial({ color: 0xd8c898 });
  const domeMat   = new THREE.MeshToonMaterial({ color: 0x4a7a5f });
  const goldMat   = new THREE.MeshToonMaterial({ color: 0xd4a820 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(42, 18, 38), facadeMat);
  body.position.set(cx, 9, cz); body.castShadow = body.receiveShadow = true; add(body);

  const attic = new THREE.Mesh(new THREE.BoxGeometry(38, 6, 34), facadeMat);
  attic.position.set(cx, 21, cz); attic.castShadow = true; add(attic);

  for (const px of [cx-12, cx, cx+12]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(3, 16, 2), colMat);
    pillar.position.set(px, 8, cz - 20); pillar.castShadow = true; add(pillar);
  }

  const drum = new THREE.Mesh(new THREE.CylinderGeometry(10, 12, 8, 16), facadeMat);
  drum.position.set(cx, 28, cz); drum.castShadow = true; add(drum);

  const dome = new THREE.Mesh(new THREE.SphereGeometry(10, 16, 10, 0, PI*2, 0, PI*0.55), domeMat);
  dome.position.set(cx, 35, cz); dome.castShadow = true; add(dome);

  const finial = new THREE.Mesh(new THREE.CylinderGeometry(0, 1.5, 6, 8), goldMat);
  finial.position.set(cx, 46, cz); finial.castShadow = true; add(finial);

  for (const dx of [-16, 16]) {
    const flank = new THREE.Mesh(new THREE.SphereGeometry(5, 12, 8, 0, PI*2, 0, PI*0.55), domeMat);
    flank.position.set(cx + dx, 25, cz); flank.castShadow = true; add(flank);
  }

  for (const [dx, dz] of [[-16,-14],[-16,14],[16,-14],[16,14]]) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 4), goldMat);
    s.position.set(cx + dx, 25, cz + dz); s.castShadow = true; add(s);
  }
}
