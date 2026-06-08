import * as THREE from 'three';

export function buildEiffelTower(add) {
  // Centre on the crossroads vertex of the 8×8 zone (tiles 8-15, 52-59).
  // World centre = (12-40)*12, (56-40)*12 = (-336, 192). The four legs land on
  // the impassable 2×2 corner blocks at ±36; cars drive through the centre.
  const cx = -336, cz = 192;

  // LEGO-inspired warm iron-brown palette (real tower: RAL 8002 brown gradient)
  const matDark  = new THREE.MeshToonMaterial({ color: 0x5C3D10 }); // base / arches
  const matMid   = new THREE.MeshToonMaterial({ color: 0x7A5420 }); // middle section
  const matLight = new THREE.MeshToonMaterial({ color: 0x9A7030 }); // upper / spire
  const matPlat  = new THREE.MeshToonMaterial({ color: 0x3C2A0A }); // platforms / decks

  // Angled beam between two 3-D points (cylinder aligned to direction vector)
  function beam(ax, ay, az, bx, by, bz, r, mat) {
    const A = new THREE.Vector3(cx + ax, ay, cz + az);
    const B = new THREE.Vector3(cx + bx, by, cz + bz);
    const len = A.distanceTo(B);
    if (len < 0.1) return;
    const mid = A.clone().add(B).multiplyScalar(0.5);
    const dir = B.clone().sub(A).normalize();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), mat);
    m.position.copy(mid);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    m.castShadow = true;
    add(m);
  }

  function cyl(x, y, z, rT, rB, h, seg, mat) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, h, seg), mat);
    m.position.set(cx + x, y, cz + z);
    m.castShadow = true;
    add(m);
  }

  function box(x, y, z, w, h, d, mat) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(cx + x, y, cz + z);
    m.castShadow = true;
    add(m);
  }

  // ── FOUR CURVED LEGS ───────────────────────────────────────────────────────
  // Each leg curves inward from its ground corner (±36, well outside the road)
  // up to the first-floor platform. Generous arch clearance so cars pass under.
  const wpts = [
    [36,  3, 36],
    [27, 18, 27],
    [16, 36, 16],
    [ 8, 50,  8],
    [ 5, 56,  5],
  ];
  const legR = [7.0, 5.2, 3.6, 2.4, 2.0];

  for (const [sx, sz] of [[-1,-1],[1,-1],[-1,1],[1,1]]) {
    const pts = wpts.map(([x,y,z]) => [x*sx, y, z*sz]);
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1,y1,z1] = pts[i];
      const [x2,y2,z2] = pts[i+1];
      const r = (legR[i] + legR[i+1]) / 2;
      beam(x1,y1,z1, x2,y2,z2, r, i <= 1 ? matDark : matMid);
    }
  }

  // ── BASE ARCH SPANS (one per face, 4 total) ───────────────────────────────
  // Two-part arch rising from each pair of leg bases to a crown (~y=36), with
  // X-bracing — the tower's signature open lattice. Crown sits well above a car.
  for (const fz of [-36, 36]) {
    beam(-36,  3, fz,   0, 26, fz, 2.4, matDark); // left half arch
    beam(  0, 26, fz,  36,  3, fz, 2.4, matDark); // right half arch
    beam(-27, 18, fz,   0, 36, fz, 1.6, matDark); // inner arch
    beam(  0, 36, fz,  27, 18, fz, 1.6, matDark);
    beam(-36,  3, fz,  24, 33, fz, 1.0, matDark); // cross brace ↗
    beam( 36,  3, fz, -24, 33, fz, 1.0, matDark); // cross brace ↖
  }
  for (const fx of [-36, 36]) {
    beam(fx,  3, -36,  fx, 26,  0, 2.4, matDark);
    beam(fx, 26,  0,  fx,  3, 36, 2.4, matDark);
    beam(fx, 18, -27,  fx, 36,  0, 1.6, matDark);
    beam(fx, 36,  0,  fx, 18, 27, 1.6, matDark);
    beam(fx,  3, -36,  fx, 33, 24, 1.0, matDark);
    beam(fx,  3, 36,  fx, 33,-24, 1.0, matDark);
  }

  // Square frame tying the four arch crowns just under the first floor (y=40)
  for (const fz of [-30, 30]) beam(-30, 40, fz,  30, 40, fz, 1.2, matDark);
  for (const fx of [-30, 30]) beam(fx, 40, -30,  fx, 40, 30, 1.2, matDark);

  // ── FIRST FLOOR PLATFORM (y ≈ 56) ─────────────────────────────────────────
  box(0, 56, 0,  34, 3, 34, matPlat);   // main deck
  box(0, 58.5, 0, 37, 1.6, 37, matMid); // outer railing ledge
  for (const [px, pz] of [[-13,-13],[13,-13],[-13,13],[13,13]]) {
    cyl(px, 59, pz, 1.4, 1.4, 5, 8, matMid);  // corner observation turrets
    cyl(px, 63, pz, 1.7, 1.2, 2.5, 8, matDark);
  }

  // ── UPPER SECTION: first floor → second floor ─────────────────────────────
  // Four pylons converge from the platform corners up to the second-floor base.
  for (const [sx, sz] of [[-1,-1],[1,-1],[-1,1],[1,1]]) {
    beam(sx*11, 57, sz*11,  sx*4, 98, sz*4,  2.6, matMid);
  }
  // Horizontal bracing rings at two heights
  for (const [by, sp] of [[74, 8], [88, 5.5]]) {
    beam(-sp, by, 0,  sp, by, 0,  1.2, matMid); // EW tie
    beam(0, by,-sp,   0, by, sp,  1.2, matMid); // NS tie
  }
  // Face X-bracing on the four upper-section faces
  for (const fz of [-9, 9]) {
    beam(-11, 57, fz,  4, 98, fz*0.45,  0.8, matMid);
    beam( 11, 57, fz, -4, 98, fz*0.45,  0.8, matMid);
  }
  for (const fx of [-9, 9]) {
    beam(fx, 57, -11,  fx*0.45, 98, 4,  0.8, matMid);
    beam(fx, 57,  11,  fx*0.45, 98,-4,  0.8, matMid);
  }

  // ── SECOND FLOOR (y ≈ 99) ─────────────────────────────────────────────────
  cyl(0, 99, 0,  9, 10.5, 4, 12, matPlat);   // platform ring
  box(0, 98, 0,  14, 2.5, 14, matPlat);       // square deck
  for (const [px, pz] of [[-5,-5],[5,-5],[-5,5],[5,5]]) {
    cyl(px, 102, pz, 1.0, 1.0, 4, 6, matMid); // railing posts
  }

  // ── SPIRE (y 102 → 152) ───────────────────────────────────────────────────
  cyl(0, 106, 0,  3.6, 6.0, 13, 10, matMid);   // spire base
  cyl(0, 120, 0,  1.6, 3.6, 24,  8, matLight); // lower shaft
  cyl(0, 138, 0,  0.5, 1.6, 18,  8, matLight); // upper shaft
  cyl(0, 149, 0,  0.0, 0.6,  8,  8, matLight); // tip cone

  // Beacon light at the summit
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(1.3, 8, 6),
    new THREE.MeshToonMaterial({ color: 0xFFF8CC, emissive: 0xFFEE44, emissiveIntensity: 0.9 })
  );
  beacon.position.set(cx, 154, cz);
  add(beacon);
}
