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
  buildInvalides();
  buildPompidou();
  buildPantheon();
  buildMoulinRouge();
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

function buildInvalides() {
  // World center: cx=-240, cz=240 (tiles x=42-45, y=82-85, 4×4 block)
  const cx = -240;
  const cz = 240;
  const PI = Math.PI;

  const stoneMat  = new THREE.MeshToonMaterial({ color: 0xbca080 });
  const roofMat   = new THREE.MeshToonMaterial({ color: 0x7a8090 });
  const drumMat   = new THREE.MeshToonMaterial({ color: 0xd8ccb0 });
  const goldMat   = new THREE.MeshToonMaterial({ color: 0xd4a020 });

  // 1. Main long building (barracks and museum)
  const mainBuilding = new THREE.Mesh(
    new THREE.BoxGeometry(44, 12, 34),
    stoneMat
  );
  mainBuilding.position.set(cx, 6, cz);
  mainBuilding.castShadow = true;
  mainBuilding.receiveShadow = true;
  add(mainBuilding);

  // 2. Roof (flat slab, slightly darker)
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(40, 2, 30),
    roofMat
  );
  roof.position.set(cx, 13, cz);
  add(roof);

  // 3. Central connecting section (taller middle block)
  const centralSection = new THREE.Mesh(
    new THREE.BoxGeometry(14, 16, 34),
    stoneMat
  );
  centralSection.position.set(cx, 8, cz);
  centralSection.castShadow = true;
  add(centralSection);

  // 4. Dome drum (octagonal/circular base of the dome)
  const domeDrum = new THREE.Mesh(
    new THREE.CylinderGeometry(9, 10, 10, 16),
    drumMat
  );
  domeDrum.position.set(cx, 21, cz);
  domeDrum.castShadow = true;
  add(domeDrum);

  // 5. Golden dome (the most iconic feature)
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(9, 16, 12, 0, PI * 2, 0, PI * 0.65),
    goldMat
  );
  dome.position.set(cx, 30, cz);
  dome.castShadow = true;
  add(dome);

  // 6. Lantern (small drum on top of dome)
  const lantern = new THREE.Mesh(
    new THREE.CylinderGeometry(2.5, 3, 5, 12),
    goldMat
  );
  lantern.position.set(cx, 40, cz);
  add(lantern);

  // 7. Golden spire/finial
  const spire = new THREE.Mesh(
    new THREE.CylinderGeometry(0, 2, 8, 8),
    goldMat
  );
  spire.position.set(cx, 46, cz);
  add(spire);

  // 8. Front courtyard entrance arch hints (two simple arch boxes)
  const leftArch = new THREE.Mesh(
    new THREE.BoxGeometry(8, 14, 3),
    stoneMat
  );
  leftArch.position.set(cx - 10, 7, cz - 18);
  add(leftArch);

  const rightArch = new THREE.Mesh(
    new THREE.BoxGeometry(8, 14, 3),
    stoneMat
  );
  rightArch.position.set(cx + 10, 7, cz - 18);
  add(rightArch);
}

function buildPompidou() {
  // World center: cx=162, cz=30 (tiles x=76-78, y=65-67, 3×3 block)
  const cx = 162;
  const cz = 30;
  const PI = Math.PI;

  // 1. Main building body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(30, 20, 30),
    new THREE.MeshToonMaterial({ color: 0x889099 })
  );
  body.position.set(cx, 10, cz);
  body.castShadow = true;
  body.receiveShadow = true;
  add(body);

  // 2. White structural frame (top edge cap)
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(32, 2, 32),
    new THREE.MeshToonMaterial({ color: 0xdddddd })
  );
  frame.position.set(cx, 21, cz);
  frame.castShadow = true;
  add(frame);

  // 3. Blue water pipes — south face y=5
  const bluePipeS5 = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 1.8, 30, 8),
    new THREE.MeshToonMaterial({ color: 0x1155cc })
  );
  bluePipeS5.rotation.z = PI / 2;
  bluePipeS5.position.set(cx, 5, cz - 16);
  add(bluePipeS5);

  // Blue water pipes — south face y=13
  const bluePipeS13 = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 1.8, 30, 8),
    new THREE.MeshToonMaterial({ color: 0x1155cc })
  );
  bluePipeS13.rotation.z = PI / 2;
  bluePipeS13.position.set(cx, 13, cz - 16);
  add(bluePipeS13);

  // Blue water pipes — north face y=5
  const bluePipeN5 = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 1.8, 30, 8),
    new THREE.MeshToonMaterial({ color: 0x1155cc })
  );
  bluePipeN5.rotation.z = PI / 2;
  bluePipeN5.position.set(cx, 5, cz + 16);
  add(bluePipeN5);

  // Blue water pipes — north face y=13
  const bluePipeN13 = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 1.8, 30, 8),
    new THREE.MeshToonMaterial({ color: 0x1155cc })
  );
  bluePipeN13.rotation.z = PI / 2;
  bluePipeN13.position.set(cx, 13, cz + 16);
  add(bluePipeN13);

  // 4. Red air-conditioning pipes — east face (vertical)
  const redPipeL = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 22, 8),
    new THREE.MeshToonMaterial({ color: 0xcc2211 })
  );
  redPipeL.position.set(cx - 16, 11, cz - 8);
  add(redPipeL);

  const redPipeR = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 22, 8),
    new THREE.MeshToonMaterial({ color: 0xcc2211 })
  );
  redPipeR.position.set(cx - 16, 11, cz + 8);
  add(redPipeR);

  // 5. Yellow electrical conduit — west face (vertical)
  const yellowPipeL = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 22, 8),
    new THREE.MeshToonMaterial({ color: 0xddaa11 })
  );
  yellowPipeL.position.set(cx + 16, 11, cz - 6);
  add(yellowPipeL);

  const yellowPipeC = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 22, 8),
    new THREE.MeshToonMaterial({ color: 0xddaa11 })
  );
  yellowPipeC.position.set(cx + 16, 11, cz);
  add(yellowPipeC);

  const yellowPipeR = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 22, 8),
    new THREE.MeshToonMaterial({ color: 0xddaa11 })
  );
  yellowPipeR.position.set(cx + 16, 11, cz + 6);
  add(yellowPipeR);

  // 6. Green pipes — diagonal cross-brace on south face
  const greenPipe = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 22, 6),
    new THREE.MeshToonMaterial({ color: 0x2d7733 })
  );
  greenPipe.rotation.z = PI * 0.25;
  greenPipe.position.set(cx, 10, cz - 16);
  add(greenPipe);

  // 7. External escalator tube — diagonal glass tube on south face
  const escalator = new THREE.Mesh(
    new THREE.CylinderGeometry(2.5, 2.5, 26, 8),
    new THREE.MeshToonMaterial({ color: 0xaaccee, transparent: true, opacity: 0.7 })
  );
  escalator.rotation.z = -PI * 0.35;
  escalator.position.set(cx + 6, 10, cz - 17);
  escalator.castShadow = false;
  add(escalator);
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

function buildPantheon() {
  // World center: cx=30, cz=240 (tiles x=65-67, y=82-85, 3×4 block)
  const cx = 30;
  const cz = 240;
  const PI = Math.PI;

  const bodyMat     = new THREE.MeshToonMaterial({ color: 0xe0d8cc });
  const colMat      = new THREE.MeshToonMaterial({ color: 0xf0ece4 });
  const domeMat     = new THREE.MeshToonMaterial({ color: 0xc8c0b4 });
  const pedMat      = new THREE.MeshToonMaterial({ color: 0xd4ccc0 });

  // 1. Main rectangular body
  const mainBody = new THREE.Mesh(
    new THREE.BoxGeometry(32, 14, 42),
    bodyMat
  );
  mainBody.position.set(cx, 7, cz);
  mainBody.castShadow = true;
  mainBody.receiveShadow = true;
  add(mainBody);

  // 2. Front portico pediment lower box
  const pedimentLower = new THREE.Mesh(
    new THREE.BoxGeometry(26, 4, 2),
    bodyMat
  );
  pedimentLower.position.set(cx, 15, cz - 22);
  pedimentLower.castShadow = true;
  add(pedimentLower);

  // 2b. Front Greek portico pediment (triangular gable)
  const pedimentGable = new THREE.Mesh(
    new THREE.BoxGeometry(26, 6, 2),
    pedMat
  );
  pedimentGable.position.set(cx, 18, cz - 22);
  pedimentGable.castShadow = true;
  add(pedimentGable);

  // 3. Six front columns on south facade
  const colXPositions = [cx - 12, cx - 7, cx - 2, cx + 2, cx + 7, cx + 12];
  for (const colX of colXPositions) {
    const col = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.6, 14, 10),
      colMat
    );
    col.position.set(colX, 7, cz - 22);
    col.castShadow = true;
    add(col);
  }

  // 4. Drum supporting the dome
  const drum = new THREE.Mesh(
    new THREE.CylinderGeometry(8, 9, 8, 20),
    bodyMat
  );
  drum.position.set(cx, 19, cz);
  drum.castShadow = true;
  add(drum);

  // 5. Outer dome colonnade ring (peristyle)
  const colonnade = new THREE.Mesh(
    new THREE.CylinderGeometry(10, 10, 3, 20, 1, true),
    new THREE.MeshToonMaterial({ color: 0xd8d0c4 })
  );
  colonnade.position.set(cx, 20, cz);
  add(colonnade);

  // 6. Main dome
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(8.5, 16, 12, 0, PI * 2, 0, PI * 0.62),
    domeMat
  );
  dome.position.set(cx, 27, cz);
  dome.castShadow = true;
  add(dome);

  // 7. Lantern drum at top
  const lantern = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 2.5, 5, 12),
    domeMat
  );
  lantern.position.set(cx, 37, cz);
  add(lantern);

  // 8. Finial cross/spike
  const finial = new THREE.Mesh(
    new THREE.CylinderGeometry(0, 1, 6, 6),
    new THREE.MeshToonMaterial({ color: 0xd0c8bc })
  );
  finial.position.set(cx, 43, cz);
  add(finial);
}

function buildMoulinRouge() {
  // World center: cx=-186, cz=-534 (tiles x=47-49, y=18-20, 3×3 block)
  const cx = -186;
  const cz = -534;
  const PI = Math.PI;

  const redMat     = new THREE.MeshToonMaterial({ color: 0xcc2233 });
  const darkMat    = new THREE.MeshToonMaterial({ color: 0x441122 });
  const strawMat   = new THREE.MeshToonMaterial({ color: 0xf5e8a0 });
  const blackMat   = new THREE.MeshToonMaterial({ color: 0x221111 });

  // 1. Main cabaret building
  const mainBuilding = new THREE.Mesh(
    new THREE.BoxGeometry(30, 16, 28),
    redMat
  );
  mainBuilding.position.set(cx, 8, cz);
  mainBuilding.castShadow = true;
  mainBuilding.receiveShadow = true;
  add(mainBuilding);

  // 2. Front facade details — two arched window boxes
  const leftWindow = new THREE.Mesh(
    new THREE.BoxGeometry(8, 10, 2),
    darkMat
  );
  leftWindow.position.set(cx - 8, 6, cz - 15);
  leftWindow.castShadow = true;
  add(leftWindow);

  const rightWindow = new THREE.Mesh(
    new THREE.BoxGeometry(8, 10, 2),
    darkMat
  );
  rightWindow.position.set(cx + 8, 6, cz - 15);
  rightWindow.castShadow = true;
  add(rightWindow);

  // 3. Windmill tower (cylindrical base)
  const windmillTower = new THREE.Mesh(
    new THREE.CylinderGeometry(4, 5, 18, 10),
    redMat
  );
  windmillTower.position.set(cx + 10, 17, cz - 8);
  windmillTower.castShadow = true;
  add(windmillTower);

  // 4. Windmill cap (octagonal top)
  const windmillCap = new THREE.Mesh(
    new THREE.CylinderGeometry(3, 4, 5, 8),
    darkMat
  );
  windmillCap.position.set(cx + 10, 27.5, cz - 8);
  windmillCap.castShadow = true;
  add(windmillCap);

  // 5. Windmill blades (4 flat rectangular sails)
  // Blade 1 (vertical up)
  const blade1 = new THREE.Mesh(
    new THREE.BoxGeometry(2, 14, 1.5),
    strawMat
  );
  blade1.position.set(cx + 10, 35, cz - 8);
  blade1.castShadow = true;
  add(blade1);

  // Blade 2 (horizontal right)
  const blade2 = new THREE.Mesh(
    new THREE.BoxGeometry(2, 14, 1.5),
    strawMat
  );
  blade2.rotation.z = PI / 2;
  blade2.position.set(cx + 17, 28, cz - 8);
  blade2.castShadow = true;
  add(blade2);

  // Blade 3 (vertical down)
  const blade3 = new THREE.Mesh(
    new THREE.BoxGeometry(2, 14, 1.5),
    strawMat
  );
  blade3.position.set(cx + 10, 21, cz - 8);
  blade3.castShadow = true;
  add(blade3);

  // Blade 4 (horizontal left)
  const blade4 = new THREE.Mesh(
    new THREE.BoxGeometry(2, 14, 1.5),
    strawMat
  );
  blade4.rotation.z = PI / 2;
  blade4.position.set(cx + 3, 28, cz - 8);
  blade4.castShadow = true;
  add(blade4);

  // 6. Roof parapet/battlement (decorative top edge of front facade)
  const parapet = new THREE.Mesh(
    new THREE.BoxGeometry(32, 3, 4),
    darkMat
  );
  parapet.position.set(cx, 17, cz - 15);
  parapet.castShadow = true;
  add(parapet);

  // 7. Sign board (flat box on the front)
  const signBoard = new THREE.Mesh(
    new THREE.BoxGeometry(20, 4, 1),
    redMat
  );
  signBoard.position.set(cx, 14, cz - 15.5);
  signBoard.castShadow = true;
  add(signBoard);

  // 8. Two decorative round windows embedded in facade
  const leftRoundWindow = new THREE.Mesh(
    new THREE.CylinderGeometry(2.5, 2.5, 1, 16),
    blackMat
  );
  leftRoundWindow.rotation.x = PI / 2;
  leftRoundWindow.position.set(cx - 12, 12, cz - 15);
  leftRoundWindow.castShadow = true;
  add(leftRoundWindow);

  const rightRoundWindow = new THREE.Mesh(
    new THREE.CylinderGeometry(2.5, 2.5, 1, 16),
    blackMat
  );
  rightRoundWindow.rotation.x = PI / 2;
  rightRoundWindow.position.set(cx + 12, 12, cz - 15);
  rightRoundWindow.castShadow = true;
  add(rightRoundWindow);
}
