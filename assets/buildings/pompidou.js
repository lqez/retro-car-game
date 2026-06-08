import * as THREE from 'three';

export function buildPompidou(add) {
  const cx = 186, cz = -54;
  const PI = Math.PI;

  const body = new THREE.Mesh(new THREE.BoxGeometry(30, 20, 30), new THREE.MeshToonMaterial({ color: 0x889099 }));
  body.position.set(cx, 10, cz); body.castShadow = body.receiveShadow = true; add(body);

  const frame = new THREE.Mesh(new THREE.BoxGeometry(32, 2, 32), new THREE.MeshToonMaterial({ color: 0xdddddd }));
  frame.position.set(cx, 21, cz); frame.castShadow = true; add(frame);

  // Blue water pipes — south and north faces
  const blueMat = new THREE.MeshToonMaterial({ color: 0x1155cc });
  for (const [y, fz] of [[5, cz-16],[13, cz-16],[5, cz+16],[13, cz+16]]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 30, 8), blueMat);
    p.rotation.z = PI / 2; p.position.set(cx, y, fz); add(p);
  }

  // Red AC pipes — east face (vertical)
  const redMat = new THREE.MeshToonMaterial({ color: 0xcc2211 });
  for (const fz of [cz-8, cz+8]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 22, 8), redMat);
    p.position.set(cx - 16, 11, fz); add(p);
  }

  // Yellow electrical — west face (vertical)
  const yelMat = new THREE.MeshToonMaterial({ color: 0xddaa11 });
  for (const fz of [cz-6, cz, cz+6]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 22, 8), yelMat);
    p.position.set(cx + 16, 11, fz); add(p);
  }

  // Green diagonal brace — south face
  const green = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 22, 6), new THREE.MeshToonMaterial({ color: 0x2d7733 }));
  green.rotation.z = PI * 0.25; green.position.set(cx, 10, cz - 16); add(green);

  // Glass escalator tube — south face
  const esc = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 26, 8),
    new THREE.MeshToonMaterial({ color: 0xaaccee, transparent: true, opacity: 0.7 }));
  esc.rotation.z = -PI * 0.35; esc.position.set(cx + 6, 10, cz - 17); esc.castShadow = false; add(esc);
}
