// ════════════════════════════════════════════════════════════════════════════
// Central tuning knobs — adjust game feel / presentation (연출) from here.
// Per-character overrides live in characters.js; pure layout/geometry detail
// (road markings, building generation, particle velocity math) stays local to
// scene.js / particles.js.
// ════════════════════════════════════════════════════════════════════════════

// ─── core grid ────────────────────────────────────────────────────────────────
export const TILE = 12;
export const T = Object.freeze({ ROAD: 0, BUILDING: 1, PARK: 2, WATER: 3, BRIDGE: 4 });

// ─── Paris landmark palette ─────────────────────────────────────────────────
export const PARIS_LANDMARK_COLORS = Object.freeze({
  limestone: 0xb8ad98,
  limestoneLight: 0xd0c7b4,
  limestoneDark: 0x918572,
  agedStone: 0xa99176,
  slate: 0x5e6870,
  slateDark: 0x3f484f,
  shadow: 0x242321,
  glass: 0x7390a0,
  glassDark: 0x3f5964,
  copperGreen: 0x51725d,
  gold: 0xb8902f,
  sacreWhite: 0xded9cc,
  sacreShade: 0xbdb5a4,
  pompidouWhite: 0xd7d9d3,
  pompidouSteel: 0x8d9698,
  pipeBlue: 0x315d8f,
  pipeRed: 0x963027,
  pipeYellow: 0xa07828,
  pipeGreen: 0x3f7054,
  rougeRed: 0x8c2027,
  rougeTrim: 0x302127,
  rougeCream: 0xb7a365,
});

// ─── player car ─────────────────────────────────────────────────────────────
export const CONST_SPEED       = 55;           // base driving speed (world units/s)
export const CAR_HL            = TILE * 0.5;   // collision half-length
export const CAR_HW            = TILE * 0.4;   // collision half-width 
export const ROT_SPEED         = 18;           // visual yaw turn rate (rad/s)

// ─── driving feel: lean / roll into turns ─────────────────────────────────────
export const MAX_LEAN  = 0.20;   // radians bank into a turn
export const LEAN_HOLD = 0.20;   // seconds to sustain lean after a turn
export const LEAN_LERP = 7;      // lean lerp speed (higher = snappier)

// ─── camera ────────────────────────────────────────────────────────────────────
export const CAM_FOV          = 42;        // perspective field of view (deg)
export const CAM_HEIGHT        = 190;      // camera height above ground
export const CAMERA_FOLLOW_LERP = 5;       // how quickly the camera eases toward the car (higher = tighter)
export const CAMERA_POS_LEAD_DIST  = 24;   // camera position shift ahead of travel
export const CAMERA_POS_LEAD_LERP  = 1.6;  // camera position-lead follow speed
export const CAMERA_LOOK_LEAD_DIST = 10;   // lookAt shift ahead of travel
export const CAMERA_LOOK_LEAD_LERP = 4.6;  // lookAt lead follow speed
export const MAX_CAM_TILT     = 0.05;      // radians view roll on turn
export const CAM_TILT_LERP    = 3;         // camera-roll follow speed
export const BARREL_K         = 0.28;      // barrel (fisheye) distortion strength
export const FOG_NEAR = 200, FOG_FAR = 440;

// ─── building windows ───────────────────────────────────────────────────────
export const BUILDING_WINDOW_LIT_CHANCE = 0.28;
export const BUILDING_WINDOW_LIT_TEMPERATURES = Object.freeze([3000, 4000, 5000, 6000]);
export const BUILDING_DAY_WINDOW_COLORS = Object.freeze([0x526975, 0x607986, 0x6d838c, 0x596d73]);
export const BUILDING_WINDOW_WIDTH_MIN = TILE * 0.12;
export const BUILDING_WINDOW_WIDTH_BIG_BONUS = TILE * 0.15;
export const BUILDING_WINDOW_WIDTH_RANDOM = TILE * 0.43;
export const BUILDING_WINDOW_HEIGHT_MIN = 0.72;
export const BUILDING_WINDOW_HEIGHT_TALL_BONUS = 1.35;
export const BUILDING_WINDOW_HEIGHT_RANDOM = 3.72;
export const BUILDING_WINDOW_CELL_FILL = 0.84;
export const BUILDING_WINDOW_SPAN_MIN = 0.92;
export const BUILDING_WINDOW_SPAN_RANDOM = 0.17;
export const BUILDING_WINDOW_SPAN_BIG_BONUS = 0.07;

// ─── road markings ─────────────────────────────────────────────────────────
export const SAFE_ZONE_OPACITY = 0.3;

// ─── street lights ──────────────────────────────────────────────────────────
export const STREET_LIGHT_GLOW_SCALE = TILE * 1.84;
export const STREET_LIGHT_GLOW_SCALE_RANDOM = 0.34;

// ─── road bump (occasional visual-only jolts while driving) ───────────────────
export const BUMP_AMP         = TILE * 0.007;
export const BUMP_SIDE        = TILE * 0.052;
export const BUMP_ROLL_CHANCE = 1.1;      // random jolt events per second
export const BUMP_ROLL_KICK   = 0.045;    // radians
export const BUMP_ROLL_DECAY  = 24;

// ─── tyre dust / smoke particles ──────────────────────────────────────────────
export const PARTICLE_INTERVAL  = 0.055;   // seconds between dust bursts
export const PARTICLE_MIN_SPEED = 5;       // min speed to emit dust
export const PEBBLE_COUNT = 60;            // dust-pebble pool size
export const SMOKE_COUNT  = 70;            // smoke-puff pool size

// ─── paralysing gas ────────────────────────────────────────────────────────────
export const GAS_MAX     = 3;              // charges per round
export const GAS_PUFFS   = 14;             // particles per cloud
export const GAS_RADIUS  = TILE * 0.625;   // full cloud radius (diameter 1.25 × tile)
export const GAS_GROW_T  = 0.40;           // seconds to grow to full size
export const GAS_FADE_IN = 0.15;           // opacity ramp-in
export const GAS_HOLD_T  = 3.0;            // fully-effective duration (stuns enemies)
export const GAS_FADE_T  = 0.6;            // quick fade-out after hold
export const GAS_STUN_PAD = TILE * 0.25;   // extra contact radius for enemy bodies
export const GAS_Y       = 1.1;            // cloud height off the ground

// ─── diamonds / collection effects ───────────────────────────────────────────
export const DIAMOND_COLLECT_DIST = TILE * 0.58;
export const DIAMOND_FLOAT_Y      = TILE * 0.55;
export const DIAMOND_SPAWN_CLEAR  = 6;              // min Manhattan tile distance from car spawn
export const DIAMOND_GEM_OPACITY  = 0.92;
export const DIAMOND_CORE_OPACITY = 0.42;
export const DIAMOND_GLOW_OPACITY = 0.18;
export const DIAMOND_POP_DURATION = 0.26;           // seconds for scale-up burst
export const DIAMOND_POP_SCALE    = 2.05;           // peak scale during pop
export const DIAMOND_BURST_COUNT  = 14;
export const DIAMOND_BURST_SPEED  = TILE * 3.1;
export const DIAMOND_BURST_LIFE   = 0.48;
export const DIAMOND_BURST_RADIUS = TILE * 0.05;
export const DIAMOND_RING_INNER_R = TILE * 0.20;
export const DIAMOND_RING_OUTER_R = TILE * 0.32;
export const DIAMOND_RING_LIFE    = 0.34;
export const DIAMOND_RING_SCALE   = 1.9;

// ─── enemies ────────────────────────────────────────────────────────────────────
export const ENEMY_COUNT          = 8;
export const ENEMY_SPEED          = 0.90;        // fraction of player speed
export const ENEMY_TERRITORY_R    = 18;          // max Manhattan tiles from home while chasing
export const ENEMY_DETECT_DIST    = TILE * 12;   // world-unit radius to start chasing
export const ENEMY_THINK_INTERVAL = 0.5;         // seconds between direction decisions
export const ENEMY_COLLIDE_DIST   = TILE * 0.82; // center-to-center game-over trigger
export const ENEMY_ENEMY_COLLIDE_DIST = TILE * 0.82; // center-to-center enemy crash trigger
export const ENEMY_SPAWN_CLEAR    = 14;          // min Manhattan tiles from player spawn
export const ENEMY_STUN_TIME      = 2.4;         // seconds frozen after touching gas
export const ENEMY_STUN_FREE_TIME = 0.5;         // seconds immune to fresh stuns after recovery
export const ENEMY_SPIN_SPEED     = 8.0;         // rad/s spin-in-place while stunned
export const ENEMY_ROT_SPEED      = 18;          // visual yaw turn rate (rad/s)

// ─── crash (player death on enemy hit): launch, tumble, embed ───────────────────
export const CRASH_UP_SPEED   = TILE * 7.5;   // initial upward launch velocity (apex height)
export const CRASH_FWD_SPEED  = TILE * 2.4;   // forward fling along travel dir
export const CRASH_AIRTIME    = 1.4;          // ~seconds the wreck stays aloft (gravity derived from this)
export const CRASH_SPIN       = 20;           // end-over-end tumble rate (rad/s)
export const CRASH_SPIN_NOISE = 0.18;         // fraction of CRASH_SPIN wobble on other axes
export const CRASH_BOUNCE     = 0.6;          // velocity kept when bouncing off a building
export const CRASH_EMBED      = TILE * 0.14;  // depth the wreck buries below ground
export const CRASH_DUST_COLOR = 0x998866;
export const CRASH_SMOKE_COLOR = 0xddddcc;
export const CRASH_DUST_BURST = Object.freeze({
  pebbleCount: 10,
  smokeCount: 8,
  pebbleSpeedBase: 8,
  pebbleSpeedRandom: 16,
  pebbleUpBase: 6,
  pebbleUpRandom: 14,
  pebbleLifeBase: 0.4,
  pebbleLifeRandom: 0.35,
  smokeSpeedBase: 1,
  smokeSpeedRandom: 4,
  smokeUpBase: 0.6,
  smokeUpRandom: 1.2,
  smokeLifeBase: 1.6,
  smokeLifeRandom: 1.0,
  smokeStartScale: 1.0,
  smokeGrowScale: 6.0,
  smokeOpacity: 0.22,
});
export const EXPLOSION_FIRE_COLORS = Object.freeze([0xffd94a, 0xffaa22, 0xff6a1f, 0xff2f18]);
export const EXPLOSION_SMOKE_COLOR = 0x15110f;
export const EXPLOSION_BURST = Object.freeze({
  sparkCount: 36,
  sparkScale: 0.45,
  sparkSpeedBase: 10,
  sparkSpeedRandom: 24,
  sparkUpBase: 10,
  sparkUpRandom: 26,
  sparkLifeBase: 0.28,
  sparkLifeRandom: 0.38,
  smokeCount: 10,
  smokeLife: 2.0,
  smokeSpeedBase: 0.4,
  smokeSpeedRandom: 2.2,
  smokeUpBase: 8,
  smokeUpRandom: 5,
  smokeStartScale: 0.55,
  smokeGrowScale: 8.0,
  smokeOpacity: 0.36,
});

// ─── input feel ────────────────────────────────────────────────────────────────
export const JOY_RADIUS    = 48;   // joystick max stick travel (px)
export const JOY_HOLD_MS   = 500;  // touch-hold before the joystick appears
export const DOUBLE_TAP_MS = 300;  // max gap between taps to count as a double-tap (gas)
