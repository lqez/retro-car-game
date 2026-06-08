import * as THREE from 'three';

export function buildEiffelTower(add) {
  // Center of 6×6 tile zone at tiles (8,52): cx=(8-40+3)*12=-348, cz=(52-40+3)*12=180
  const cx = -348, cz = 180;

  // LEGO-inspired warm iron-brown palette (real tower: Eiffel Tower Brown RAL 8002)
  const matDark  = new THREE.MeshToonMaterial({ color: 0x5C3D10 }); // dark base
  const matMid   = new THREE.MeshToonMaterial({ color: 0x7A5420 }); // middle section
  const matLight = new THREE.MeshToonMaterial({ color: 0x9A7030 }); // upper section
  const matPlat  = new THREE.MeshToonMaterial({ color: 0x3C2A0A }); // platform/deck

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
  // Each leg: corner (±30,2,±30) curves inward to (±3,38,±3) at first floor.
  // Four waypoints create the characteristic curved taper.
  const wpts = [
    [30,  2, 30],
    [22, 12, 22],
    [13, 24, 13],
    [ 6, 33,  6],
    [ 3, 38,  3],
  ];
  const legR = [6.0, 4.5, 3.2, 2.0, 1.5];

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
  // Each face has two arch beams rising from leg bases to a crown, plus X-bracing.
  // Z-fixed faces (front z=-30, back z=+30)
  for (const fz of [-30, 30]) {
    beam(-30, 2, fz,    0, 18, fz,  1.8, matDark); // left half arch
    beam(  0, 18, fz,  30,  2, fz,  1.8, matDark); // right half arch
    beam(-22, 12, fz,   0, 26, fz,  1.3, matDark); // upper arch inner-left
    beam(  0, 26, fz,  22, 12, fz,  1.3, matDark); // upper arch inner-right
    beam(-30,  2, fz,  22, 22, fz,  0.8, matDark); // cross brace ↗
    beam( 30,  2, fz, -22, 22, fz,  0.8, matDark); // cross brace ↖
  }
  // X-fixed faces (left x=-30, right x=+30)
  for (const fx of [-30, 30]) {
    beam(fx, 2, -30,  fx, 18,  0,  1.8, matDark);
    beam(fx, 18,  0,  fx,  2, 30,  1.8, matDark);
    beam(fx, 12,-22,  fx, 26,  0,  1.3, matDark);
    beam(fx, 26,  0,  fx, 12, 22,  1.3, matDark);
    beam(fx,  2,-30,  fx, 22, 22,  0.8, matDark);
    beam(fx,  2, 30,  fx, 22,-22,  0.8, matDark);
  }

  // Horizontal tie ring connecting arch crowns (just below first floor)
  beam(-30, 18,  0,   0, 26,  0,  1.0, matDark);
  beam(  0, 26,  0,  30, 18,  0,  1.0, matDark);
  beam(  0, 18,-30,   0, 26,  0,  1.0, matDark);
  beam(  0, 26,  0,   0, 18, 30,  1.0, matDark);

  // ── FIRST FLOOR PLATFORM (y ≈ 38) ─────────────────────────────────────────
  box(0, 37, 0,  18, 2.5, 18, matPlat);   // main deck
  box(0, 39, 0,  20, 1.5, 20, matMid);    // outer rim/railing ledge
  // Corner observation turrets
  for (const [px, pz] of [[-8,-8],[8,-8],[-8,8],[8,8]]) {
    cyl(px, 39, pz, 1.2, 1.2, 4, 8, matMid);
    cyl(px, 42, pz, 1.4, 1.0, 2, 8, matDark);
  }

  // ── UPPER SECTION: first floor → second floor ─────────────────────────────
  // Four angled pylons converge from platform corners to second-floor base.
  for (const [sx, sz] of [[-1,-1],[1,-1],[-1,1],[1,1]]) {
    beam(sx*7, 38, sz*7,  sx*3, 68, sz*3,  2.2, matMid);
  }
  // Horizontal bracing bands at two heights
  for (const by of [50, 60]) {
    const sp = by === 50 ? 5.5 : 4.2;
    beam(-sp, by, 0,  sp, by, 0,  1.1, matMid); // EW tie
    beam(0, by,-sp,   0, by, sp,  1.1, matMid); // NS tie
  }
  // Face X-bracing on the four upper-section faces
  for (const fz of [-6, 6]) {
    beam(-7, 38, fz,  3, 68, fz*0.5,  0.7, matMid);
    beam( 7, 38, fz, -3, 68, fz*0.5,  0.7, matMid);
  }
  for (const fx of [-6, 6]) {
    beam(fx, 38, -7,  fx*0.5, 68, 3,  0.7, matMid);
    beam(fx, 38,  7,  fx*0.5, 68,-3,  0.7, matMid);
  }

  // ── SECOND FLOOR (y ≈ 68) ─────────────────────────────────────────────────
  cyl(0, 68, 0,  7.5, 8.5, 3.5, 12, matPlat);   // platform ring
  box(0, 67, 0,  11, 2, 11, matPlat);            // square deck
  // Railing posts
  for (const [px, pz] of [[-4,-4],[4,-4],[-4,4],[4,4]]) {
    cyl(px, 70, pz, 0.8, 0.8, 3, 6, matMid);
  }

  // ── SPIRE (y 71 → 109) ────────────────────────────────────────────────────
  cyl(0, 74,  0,  3.0, 5.0, 10, 10, matMid);    // spire base
  cyl(0, 84,  0,  1.2, 3.0, 18,  8, matLight);  // lower shaft
  cyl(0, 98,  0,  0.4, 1.3, 14,  8, matLight);  // upper shaft
  cyl(0,107,  0,  0.0, 0.5,  6,  8, matLight);  // tip cone

  // Beacon light at summit
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(1.0, 8, 6),
    new THREE.MeshToonMaterial({ color: 0xFFF8CC, emissive: 0xFFEE44, emissiveIntensity: 0.9 })
  );
  beacon.position.set(cx, 111, cz);
  add(beacon);
}
