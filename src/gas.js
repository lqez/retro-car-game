// Rally-X style paralysing gas.
// A charge drops a billowing cloud on the tile behind the car; enemies that
// touch an active cloud are stunned (see enemies.js). Per-character gas is
// prepared via GAS_TYPES but every character uses 'default' for now.
import * as THREE from 'three';
import { scene } from './scene.js';
import { TILE, GAS_MAX, GAS_PUFFS as PUFFS, GAS_RADIUS as R_MAX,
         GAS_GROW_T as GROW_T, GAS_FADE_IN as FADE_IN, GAS_HOLD_T as HOLD_T,
         GAS_FADE_T as FADE_T, GAS_STUN_PAD as STUN_PAD, GAS_Y as Y_BASE } from './constants.js';
import { CHARACTERS, activeCharacter } from './characters.js';

const LIFE_T = HOLD_T + FADE_T;

// Per-character gas definitions. Add entries + set characters[].gasType later;
// for now everything resolves to 'default'.
const GAS_TYPES = {
  default: { color: 0x9bdc5a, opacity: 0.72 },
};
function gasType() {
  return GAS_TYPES[activeCharacter?.gasType] ?? GAS_TYPES.default;
}
export function gasMax() {
  return activeCharacter?.gasMax ?? GAS_MAX;
}

const easeOut = t => 1 - Math.pow(1 - t, 3);

// ─── cloud pool ─────────────────────────────────────────────────────────────
const gasGeo = new THREE.SphereGeometry(0.5, 7, 6);

function makeCloud() {
  const puffs = Array.from({ length: PUFFS }, () => {
    const m = new THREE.Mesh(
      gasGeo,
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })
    );
    m.visible = false;
    scene.add(m);
    return m;
  });
  return { active: false, age: 0, cx: 0, cz: 0, curR: 0, baseOpacity: 0.72, puffs, seeds: [] };
}
const MAX_CLOUDS = Math.max(GAS_MAX, ...CHARACTERS.map(c => c.gasMax ?? 0));
const clouds = Array.from({ length: MAX_CLOUDS }, makeCloud);

function deactivate(c) {
  c.active = false;
  for (const m of c.puffs) m.visible = false;
}

// ─── charges ────────────────────────────────────────────────────────────────
let charges = gasMax();
export function gasCharges() { return charges; }

export function clearGas() { for (const c of clouds) deactivate(c); }
export function resetGas()  { charges = gasMax(); clearGas(); }

// ─── use a charge: drop a cloud at the car's current position ─────────────────
export function useGas(x, z) {
  if (charges <= 0) return false;
  const slot = clouds.find(c => !c.active) ?? clouds[0];

  const type = gasType();
  slot.active = true;
  slot.age = 0;
  slot.cx = x;
  slot.cz = z;
  slot.curR = 0;
  slot.baseOpacity = type.opacity;
  for (let i = 0; i < PUFFS; i++) {
    slot.seeds[i] = {
      ang:    Math.random() * Math.PI * 2,
      rad:    Math.sqrt(Math.random()) * 0.82,   // disc distribution
      size:   TILE * (0.34 + Math.random() * 0.20),
      bphase: Math.random() * Math.PI * 2,
      bspeed: 1.5 + Math.random() * 1.5,
      yoff:   (Math.random() - 0.5) * 0.6,
    };
    const m = slot.puffs[i];
    m.material.color.setHex(type.color);
    m.visible = true;
  }
  charges--;
  return true;
}

// ─── per-frame update ─────────────────────────────────────────────────────────
export function updateGas(dt) {
  for (const c of clouds) {
    if (!c.active) continue;
    c.age += dt;
    if (c.age >= LIFE_T) { deactivate(c); continue; }

    const g = easeOut(Math.min(c.age / GROW_T, 1));
    c.curR = R_MAX * g;

    let alpha;
    if      (c.age < FADE_IN) alpha = c.baseOpacity * (c.age / FADE_IN);
    else if (c.age < HOLD_T)  alpha = c.baseOpacity;
    else                      alpha = c.baseOpacity * (1 - (c.age - HOLD_T) / FADE_T);

    for (let i = 0; i < PUFFS; i++) {
      const s = c.seeds[i], m = c.puffs[i];
      const billow = 1 + 0.12 * Math.sin(c.age * s.bspeed + s.bphase);
      const ox = Math.cos(s.ang) * s.rad * c.curR;
      const oz = Math.sin(s.ang) * s.rad * c.curR;
      m.position.set(
        c.cx + ox,
        Y_BASE + s.yoff * g + Math.sin(c.age * 1.5 + s.bphase) * 0.15,
        c.cz + oz
      );
      m.scale.setScalar(s.size * g * billow);
      m.material.opacity = alpha;
    }
  }
}

// True if (x,z) is inside an active, still-effective cloud (used by enemies).
export function gasStunsAt(x, z) {
  for (const c of clouds) {
    if (!c.active || c.age >= HOLD_T) continue;
    const r = c.curR + STUN_PAD;
    if ((x - c.cx) ** 2 + (z - c.cz) ** 2 < r * r) return true;
  }
  return false;
}
