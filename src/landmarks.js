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
  buildNotreDame();
  buildSacreCœur();
  buildLouvre();
  buildOperaGarnier();
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

function buildNotreDame() {
  // World center: cx=36, cz=90 (tiles x=65-68, y=70-72, 4×3 block)
  // Facade faces south (toward Seine, toward higher z)
  const cx = 36;
  const cz = 90;

  const stoneMat = new THREE.MeshToonMaterial({ color: 0xb8a88a });
  const roofMat  = new THREE.MeshToonMaterial({ color: 0x887060 });

  // 1. Main nave (long body)
  const nave = new THREE.Mesh(
    new THREE.BoxGeometry(40, 20, 28),
    stoneMat
  );
  nave.position.set(cx, 10, cz);
  nave.castShadow = true;
  nave.receiveShadow = true;
  add(nave);

  // 2. Two front towers (south facade, toward higher z)
  const leftTower = new THREE.Mesh(
    new THREE.BoxGeometry(9, 34, 9),
    stoneMat
  );
  leftTower.position.set(cx - 14, 17, cz + 11);
  leftTower.castShadow = true;
  add(leftTower);

  const rightTower = new THREE.Mesh(
    new THREE.BoxGeometry(9, 34, 9),
    stoneMat
  );
  rightTower.position.set(cx + 14, 17, cz + 11);
  rightTower.castShadow = true;
  add(rightTower);

  // 3. Tower caps (square pyramid tops)
  const leftCap = new THREE.Mesh(
    new THREE.ConeGeometry(5.5, 10, 4),
    roofMat
  );
  leftCap.rotation.y = Math.PI / 4;
  leftCap.position.set(cx - 14, 39, cz + 11);
  leftCap.castShadow = true;
  add(leftCap);

  const rightCap = new THREE.Mesh(
    new THREE.ConeGeometry(5.5, 10, 4),
    roofMat
  );
  rightCap.rotation.y = Math.PI / 4;
  rightCap.position.set(cx + 14, 39, cz + 11);
  rightCap.castShadow = true;
  add(rightCap);

  // 4. Central spire (behind towers)
  const spire = new THREE.Mesh(
    new THREE.ConeGeometry(3.5, 22, 4),
    roofMat
  );
  spire.rotation.y = Math.PI / 4;
  spire.position.set(cx, 31, cz - 4);
  spire.castShadow = true;
  add(spire);

  // 5. Flying buttress hints (2 pairs of simple thin boxes on sides)
  const buttressMat = new THREE.MeshToonMaterial({ color: 0xb8a88a });
  const buttressPositions = [
    { x: cx - 21, z: cz - 6 },
    { x: cx - 21, z: cz + 6 },
    { x: cx + 21, z: cz - 6 },
    { x: cx + 21, z: cz + 6 },
  ];
  for (const { x, z } of buttressPositions) {
    const buttress = new THREE.Mesh(
      new THREE.BoxGeometry(3, 8, 6),
      buttressMat
    );
    buttress.position.set(x, 14, z);
    buttress.castShadow = true;
    add(buttress);
  }
}

function buildSacreCœur() {
  // World center: cx=-90, cz=-528 (tiles x=55-57, y=18-21, 3×4 block)
  const cx = -90;
  const cz = -528;
  const PI = Math.PI;

  const bodyMat   = new THREE.MeshToonMaterial({ color: 0xf5f0ea });
  const baseMat   = new THREE.MeshToonMaterial({ color: 0xd0c8bc });
  const detailMat = new THREE.MeshToonMaterial({ color: 0xe8e0d4 });

  // 1. Elevated stone terrace/base
  const terrace = new THREE.Mesh(
    new THREE.BoxGeometry(32, 5, 44),
    baseMat
  );
  terrace.position.set(cx, 2.5, cz);
  terrace.receiveShadow = true;
  add(terrace);

  // 2. Main body
  const mainBody = new THREE.Mesh(
    new THREE.BoxGeometry(26, 14, 36),
    bodyMat
  );
  mainBody.position.set(cx, 12, cz);
  mainBody.castShadow = true;
  mainBody.receiveShadow = true;
  add(mainBody);

  // 3. Central large dome (upper hemisphere)
  const centralDome = new THREE.Mesh(
    new THREE.SphereGeometry(10, 16, 12, 0, PI * 2, 0, PI * 0.6),
    bodyMat
  );
  centralDome.position.set(cx, 26, cz);
  centralDome.castShadow = true;
  add(centralDome);

  // 4. Front entrance bell tower body
  const towerBody = new THREE.Mesh(
    new THREE.BoxGeometry(8, 18, 8),
    bodyMat
  );
  towerBody.position.set(cx, 9, cz + 18);
  add(towerBody);

  // Front entrance bell tower dome
  const towerDome = new THREE.Mesh(
    new THREE.SphereGeometry(5, 12, 8, 0, PI * 2, 0, PI * 0.6),
    bodyMat
  );
  towerDome.position.set(cx, 27, cz + 18);
  add(towerDome);

  // 5. Two side turrets — left
  const leftTurret = new THREE.Mesh(
    new THREE.CylinderGeometry(3.5, 3.5, 16, 10),
    bodyMat
  );
  leftTurret.position.set(cx - 14, 8, cz - 8);
  leftTurret.castShadow = true;
  add(leftTurret);

  // Left turret cap
  const leftCap = new THREE.Mesh(
    new THREE.SphereGeometry(4, 10, 6, 0, PI * 2, 0, PI * 0.55),
    bodyMat
  );
  leftCap.position.set(cx - 14, 19, cz - 8);
  add(leftCap);

  // Right turret
  const rightTurret = new THREE.Mesh(
    new THREE.CylinderGeometry(3.5, 3.5, 16, 10),
    bodyMat
  );
  rightTurret.position.set(cx + 14, 8, cz - 8);
  rightTurret.castShadow = true;
  add(rightTurret);

  // Right turret cap
  const rightCap = new THREE.Mesh(
    new THREE.SphereGeometry(4, 10, 6, 0, PI * 2, 0, PI * 0.55),
    bodyMat
  );
  rightCap.position.set(cx + 14, 19, cz - 8);
  add(rightCap);

  // 6. Central dome tip (finial)
  const finial = new THREE.Mesh(
    new THREE.CylinderGeometry(0, 1.5, 5, 8),
    detailMat
  );
  finial.position.set(cx, 37, cz);
  add(finial);
}

function buildLouvre() {
  // World center: cx=36, cz=-48 (tiles x=65-68, y=58-61, 4×4 block)
  const cx = 36;
  const cz = -48;

  const stoneMat   = new THREE.MeshToonMaterial({ color: 0xd8cda8 });
  const roofMat    = new THREE.MeshToonMaterial({ color: 0x9a9488 });
  const courtMat   = new THREE.MeshToonMaterial({ color: 0xc4b490 });
  const glassMat   = new THREE.MeshToonMaterial({ color: 0x99ccee, transparent: true, opacity: 0.75 });
  const wireMat    = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });

  // 1. Left wing (west arm of the U)
  const leftWing = new THREE.Mesh(
    new THREE.BoxGeometry(10, 14, 40),
    stoneMat
  );
  leftWing.position.set(cx - 17, 7, cz);
  leftWing.castShadow = true;
  leftWing.receiveShadow = true;
  add(leftWing);

  // 2. Right wing (east arm of the U)
  const rightWing = new THREE.Mesh(
    new THREE.BoxGeometry(10, 14, 40),
    stoneMat
  );
  rightWing.position.set(cx + 17, 7, cz);
  rightWing.castShadow = true;
  rightWing.receiveShadow = true;
  add(rightWing);

  // 3. Back wall (closing the U at the north)
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(44, 14, 10),
    stoneMat
  );
  backWall.position.set(cx, 7, cz - 17);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  add(backWall);

  // 4a. Left dormer row (roof detail on left wing)
  const leftDormer = new THREE.Mesh(
    new THREE.BoxGeometry(6, 3, 36),
    roofMat
  );
  leftDormer.position.set(cx - 17, 15.5, cz);
  leftDormer.castShadow = true;
  add(leftDormer);

  // 4b. Right dormer row (roof detail on right wing)
  const rightDormer = new THREE.Mesh(
    new THREE.BoxGeometry(6, 3, 36),
    roofMat
  );
  rightDormer.position.set(cx + 17, 15.5, cz);
  rightDormer.castShadow = true;
  add(rightDormer);

  // 4c. Back wall roof
  const backRoof = new THREE.Mesh(
    new THREE.BoxGeometry(38, 3, 6),
    roofMat
  );
  backRoof.position.set(cx, 15.5, cz - 17);
  backRoof.castShadow = true;
  add(backRoof);

  // 5. Courtyard paving (fills the open U area)
  const courtyard = new THREE.Mesh(
    new THREE.BoxGeometry(22, 0.5, 22),
    courtMat
  );
  courtyard.position.set(cx, 0.25, cz + 3);
  courtyard.receiveShadow = true;
  add(courtyard);

  // 6. Glass Pyramid (iconic modern addition)
  const pyramidGeo = new THREE.ConeGeometry(9, 16, 4);
  const pyramid = new THREE.Mesh(pyramidGeo, glassMat);
  pyramid.rotation.y = Math.PI / 4;
  pyramid.position.set(cx, 8, cz + 3);
  pyramid.castShadow = false;
  add(pyramid);

  // 7. Wireframe overlay on pyramid (decorative glass edges)
  const pyramidWire = new THREE.Mesh(pyramidGeo, wireMat);
  pyramidWire.rotation.y = Math.PI / 4;
  pyramidWire.position.set(cx, 8, cz + 3);
  pyramidWire.scale.setScalar(1.01);
  add(pyramidWire);
}

function buildOperaGarnier() {
  // World center: cx=96, cz=-468 (tiles x=70-73, y=23-26, 4×4 block)
  const cx = 96;
  const cz = -468;
  const PI = Math.PI;

  const facadeMat  = new THREE.MeshToonMaterial({ color: 0xe8d8b0 });
  const colMat     = new THREE.MeshToonMaterial({ color: 0xd8c898 });
  const domeMat    = new THREE.MeshToonMaterial({ color: 0x4a7a5f });
  const goldMat    = new THREE.MeshToonMaterial({ color: 0xd4a820 });

  // 1. Main body
  const mainBody = new THREE.Mesh(
    new THREE.BoxGeometry(42, 18, 38),
    facadeMat
  );
  mainBody.position.set(cx, 9, cz);
  mainBody.castShadow = true;
  mainBody.receiveShadow = true;
  add(mainBody);

  // 2. Upper attic story
  const attic = new THREE.Mesh(
    new THREE.BoxGeometry(38, 6, 34),
    facadeMat
  );
  attic.position.set(cx, 21, cz);
  attic.castShadow = true;
  add(attic);

  // 3. Front colonnade hint (south-facing facade — lower z)
  const pillarPositions = [cx - 12, cx, cx + 12];
  for (const px of pillarPositions) {
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(3, 16, 2),
      colMat
    );
    pillar.position.set(px, 8, cz - 20);
    pillar.castShadow = true;
    add(pillar);
  }

  // 4. Grand central dome
  // Drum base
  const drumBase = new THREE.Mesh(
    new THREE.CylinderGeometry(10, 12, 8, 16),
    facadeMat
  );
  drumBase.position.set(cx, 28, cz);
  drumBase.castShadow = true;
  add(drumBase);

  // Dome
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(10, 16, 10, 0, PI * 2, 0, PI * 0.55),
    domeMat
  );
  dome.position.set(cx, 35, cz);
  dome.castShadow = true;
  add(dome);

  // Dome finial
  const finial = new THREE.Mesh(
    new THREE.CylinderGeometry(0, 1.5, 6, 8),
    goldMat
  );
  finial.position.set(cx, 46, cz);
  finial.castShadow = true;
  add(finial);

  // 5. Two smaller flanking domes
  const flankOffsets = [-16, 16];
  for (const dx of flankOffsets) {
    const flankDome = new THREE.Mesh(
      new THREE.SphereGeometry(5, 12, 8, 0, PI * 2, 0, PI * 0.55),
      domeMat
    );
    flankDome.position.set(cx + dx, 25, cz);
    flankDome.castShadow = true;
    add(flankDome);
  }

  // 6. Roof sculptures hint (small box clusters at roof corners)
  const cornerOffsets = [
    { dx: -16, dz: -14 }, { dx: -16, dz: 14 },
    { dx:  16, dz: -14 }, { dx:  16, dz: 14 },
  ];
  for (const { dx, dz } of cornerOffsets) {
    const sculpture = new THREE.Mesh(
      new THREE.BoxGeometry(4, 5, 4),
      goldMat
    );
    sculpture.position.set(cx + dx, 25, cz + dz);
    sculpture.castShadow = true;
    add(sculpture);
  }
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
