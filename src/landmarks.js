import * as THREE from 'three';
import { TILE, HALF_W, HALF_H } from './constants.js';

// World center of a landmark whose top-left tile is (tx,ty) with size w×h tiles
export function lmkCenter(tx, ty, w, h) {
  return {
    x: (tx - HALF_W + w / 2) * TILE,
    z: (ty - HALF_H + h / 2) * TILE,
  };
}

let _scene = null;
const _meshes = [];

export function initLandmarks(scene) { _scene = scene; }

export function clearLandmarks() {
  _meshes.forEach(m => { if (_scene) _scene.remove(m); });
  _meshes.length = 0;
}

function add(obj) { _meshes.push(obj); _scene.add(obj); return obj; }

export function buildLandmarks() {
  if (!_scene) return;
  clearLandmarks();
  // === LANDMARK BUILDERS (sub-agents append calls here) ===
  buildArcDeTriomphe();
  buildEiffelTower();
}

function buildArcDeTriomphe() {
  // World center: x=0, z=-132 (tiles 62-65, y=51-54, 4×4 block)
  const cx = 0;
  const cz = -132;

  const stoneMat = new THREE.MeshToonMaterial({ color: 0xd4c090 });
  const reliefMat = new THREE.MeshToonMaterial({ color: 0xbba870 });
  const archVoidMat = new THREE.MeshToonMaterial({ color: 0x222222 });

  // Left pillar
  const leftPillar = new THREE.Mesh(
    new THREE.BoxGeometry(11, 44, 36),
    stoneMat
  );
  leftPillar.position.set(cx - 14, 22, cz);
  leftPillar.castShadow = true;
  leftPillar.receiveShadow = true;
  add(leftPillar);

  // Right pillar
  const rightPillar = new THREE.Mesh(
    new THREE.BoxGeometry(11, 44, 36),
    stoneMat
  );
  rightPillar.position.set(cx + 14, 22, cz);
  rightPillar.castShadow = true;
  rightPillar.receiveShadow = true;
  add(rightPillar);

  // Top attic block
  const attic = new THREE.Mesh(
    new THREE.BoxGeometry(39, 10, 36),
    stoneMat
  );
  attic.position.set(cx, 49, cz);
  attic.castShadow = true;
  attic.receiveShadow = true;
  add(attic);

  // Arch opening (dark cylinder suggesting the vaulted tunnel)
  const archVoid = new THREE.Mesh(
    new THREE.CylinderGeometry(9, 9, 36, 16, 1, false),
    archVoidMat
  );
  archVoid.rotation.x = Math.PI / 2;
  archVoid.position.set(cx, 20, cz);
  archVoid.castShadow = true;
  add(archVoid);

  // Decorative relief panels above each side of the arch opening
  const reliefLeft = new THREE.Mesh(
    new THREE.BoxGeometry(8, 8, 1),
    reliefMat
  );
  reliefLeft.position.set(cx - 14, 38, cz - 18);
  reliefLeft.castShadow = true;
  add(reliefLeft);

  const reliefRight = new THREE.Mesh(
    new THREE.BoxGeometry(8, 8, 1),
    reliefMat
  );
  reliefRight.position.set(cx + 14, 38, cz - 18);
  reliefRight.castShadow = true;
  add(reliefRight);
}

function buildEiffelTower() {
  // World center of full 8×8 footprint: tiles x=20-27, y=82-89
  const cx = -480;
  const cz = 264;

  const ironMat = new THREE.MeshToonMaterial({ color: 0xc47020 });
  const platformMat = new THREE.MeshToonMaterial({ color: 0x8b5810 });

  // 1. Four base legs (tapered cylinders) at corners (±36, y=13, ±36)
  const legOffsets = [
    { dx: -36, dz: -36 }, // TL
    { dx:  36, dz: -36 }, // TR
    { dx: -36, dz:  36 }, // BL
    { dx:  36, dz:  36 }, // BR
  ];
  for (const { dx, dz } of legOffsets) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 7, 26, 8),
      ironMat
    );
    leg.position.set(cx + dx, 13, cz + dz);
    leg.castShadow = true;
    add(leg);
  }

  // 2. Lower cross-arches at y=10 (radius=2, connecting pairs of legs)
  // E-W arch at z=-36
  const ewArch1 = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 2, 72, 8),
    ironMat
  );
  ewArch1.rotation.z = Math.PI / 2;
  ewArch1.position.set(cx, 10, cz - 36);
  ewArch1.castShadow = true;
  add(ewArch1);

  // E-W arch at z=+36
  const ewArch2 = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 2, 72, 8),
    ironMat
  );
  ewArch2.rotation.z = Math.PI / 2;
  ewArch2.position.set(cx, 10, cz + 36);
  ewArch2.castShadow = true;
  add(ewArch2);

  // N-S arch at x=-36
  const nsArch1 = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 2, 72, 8),
    ironMat
  );
  nsArch1.rotation.x = Math.PI / 2;
  nsArch1.position.set(cx - 36, 10, cz);
  nsArch1.castShadow = true;
  add(nsArch1);

  // N-S arch at x=+36
  const nsArch2 = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 2, 72, 8),
    ironMat
  );
  nsArch2.rotation.x = Math.PI / 2;
  nsArch2.position.set(cx + 36, 10, cz);
  nsArch2.castShadow = true;
  add(nsArch2);

  // 3. Upper cross-arches at y=22 (thinner, radius=1.5, height=56)
  // E-W arch at z=-36
  const ewArch3 = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 56, 8),
    ironMat
  );
  ewArch3.rotation.z = Math.PI / 2;
  ewArch3.position.set(cx, 22, cz - 36);
  ewArch3.castShadow = true;
  add(ewArch3);

  // E-W arch at z=+36
  const ewArch4 = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 56, 8),
    ironMat
  );
  ewArch4.rotation.z = Math.PI / 2;
  ewArch4.position.set(cx, 22, cz + 36);
  ewArch4.castShadow = true;
  add(ewArch4);

  // N-S arch at x=-36
  const nsArch3 = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 56, 8),
    ironMat
  );
  nsArch3.rotation.x = Math.PI / 2;
  nsArch3.position.set(cx - 36, 22, cz);
  nsArch3.castShadow = true;
  add(nsArch3);

  // N-S arch at x=+36
  const nsArch4 = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 56, 8),
    ironMat
  );
  nsArch4.rotation.x = Math.PI / 2;
  nsArch4.position.set(cx + 36, 22, cz);
  nsArch4.castShadow = true;
  add(nsArch4);

  // 4. First floor platform at y=28
  const platform1 = new THREE.Mesh(
    new THREE.CylinderGeometry(16, 18, 4, 16),
    platformMat
  );
  platform1.position.set(cx, 28, cz);
  platform1.castShadow = true;
  add(platform1);

  // 5. Upper shaft (truncated cone) from y=30 to y=64
  const upperShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(4, 13, 34, 12),
    ironMat
  );
  upperShaft.position.set(cx, 47, cz);
  upperShaft.castShadow = true;
  add(upperShaft);

  // 6. Second floor ring at y=64
  const platform2 = new THREE.Mesh(
    new THREE.CylinderGeometry(8, 9, 3, 12),
    platformMat
  );
  platform2.position.set(cx, 65.5, cz);
  platform2.castShadow = true;
  add(platform2);

  // 7. Antenna section from y=67 to y=95
  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 3, 28, 8),
    ironMat
  );
  antenna.position.set(cx, 81, cz);
  antenna.castShadow = true;
  add(antenna);

  // 8. Tip spike
  const tip = new THREE.Mesh(
    new THREE.CylinderGeometry(0, 0.8, 8, 8),
    ironMat
  );
  tip.position.set(cx, 99, cz);
  tip.castShadow = true;
  add(tip);
}
