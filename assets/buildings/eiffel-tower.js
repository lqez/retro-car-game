import * as THREE from 'three';

export function buildEiffelTower(add) {
  const cx = -336, cz = 192;
  const PI = Math.PI;
  const ironMat     = new THREE.MeshToonMaterial({ color: 0xc47020 });
  const platformMat = new THREE.MeshToonMaterial({ color: 0x8b5810 });

  // Four base legs (tapered) at corner offsets ±36
  for (const [dx, dz] of [[-36,-36],[36,-36],[-36,36],[36,36]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 7, 26, 8), ironMat);
    leg.position.set(cx + dx, 13, cz + dz);
    leg.castShadow = true;
    add(leg);
  }

  // Lower cross-arches at y=10 (radius 2, length 72)
  const ewA1 = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 72, 8), ironMat);
  ewA1.rotation.z = PI / 2; ewA1.position.set(cx, 10, cz - 36); ewA1.castShadow = true; add(ewA1);
  const ewA2 = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 72, 8), ironMat);
  ewA2.rotation.z = PI / 2; ewA2.position.set(cx, 10, cz + 36); ewA2.castShadow = true; add(ewA2);
  const nsA1 = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 72, 8), ironMat);
  nsA1.rotation.x = PI / 2; nsA1.position.set(cx - 36, 10, cz); nsA1.castShadow = true; add(nsA1);
  const nsA2 = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 72, 8), ironMat);
  nsA2.rotation.x = PI / 2; nsA2.position.set(cx + 36, 10, cz); nsA2.castShadow = true; add(nsA2);

  // Upper cross-arches at y=22 (radius 1.5, length 56)
  const ewA3 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 56, 8), ironMat);
  ewA3.rotation.z = PI / 2; ewA3.position.set(cx, 22, cz - 36); ewA3.castShadow = true; add(ewA3);
  const ewA4 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 56, 8), ironMat);
  ewA4.rotation.z = PI / 2; ewA4.position.set(cx, 22, cz + 36); ewA4.castShadow = true; add(ewA4);
  const nsA3 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 56, 8), ironMat);
  nsA3.rotation.x = PI / 2; nsA3.position.set(cx - 36, 22, cz); nsA3.castShadow = true; add(nsA3);
  const nsA4 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 56, 8), ironMat);
  nsA4.rotation.x = PI / 2; nsA4.position.set(cx + 36, 22, cz); nsA4.castShadow = true; add(nsA4);

  // First floor platform at y=28
  const p1 = new THREE.Mesh(new THREE.CylinderGeometry(16, 18, 4, 16), platformMat);
  p1.position.set(cx, 28, cz); p1.castShadow = true; add(p1);

  // Upper shaft y=30-64
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(4, 13, 34, 12), ironMat);
  shaft.position.set(cx, 47, cz); shaft.castShadow = true; add(shaft);

  // Second floor ring at y=64
  const p2 = new THREE.Mesh(new THREE.CylinderGeometry(8, 9, 3, 12), platformMat);
  p2.position.set(cx, 65.5, cz); p2.castShadow = true; add(p2);

  // Antenna y=67-95
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 3, 28, 8), ironMat);
  ant.position.set(cx, 81, cz); ant.castShadow = true; add(ant);

  // Tip spike
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0, 0.8, 8, 8), ironMat);
  tip.position.set(cx, 99, cz); tip.castShadow = true; add(tip);
}
