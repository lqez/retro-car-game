// ════════════════════════════════════════════════════════════════════════════
// Central tuning knobs — adjust game feel / presentation (연출) from here.
// Per-character overrides live in characters.js; pure layout/geometry detail
// (road markings, building generation, particle velocity math) stays local to
// scene.js / car.js.
// ════════════════════════════════════════════════════════════════════════════

// ─── core grid ────────────────────────────────────────────────────────────────
export const TILE = 12;
export const T = Object.freeze({ ROAD: 0, BUILDING: 1, PARK: 2, WATER: 3, BRIDGE: 4 });

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

// ─── enemies ────────────────────────────────────────────────────────────────────
export const ENEMY_COUNT          = 8;
export const ENEMY_SPEED          = 0.92;        // fraction of player speed
export const ENEMY_TERRITORY_R    = 18;          // max Manhattan tiles from home while chasing
export const ENEMY_DETECT_DIST    = TILE * 14;   // world-unit radius to start chasing
export const ENEMY_THINK_INTERVAL = 0.5;         // seconds between direction decisions
export const ENEMY_COLLIDE_DIST   = TILE * 0.82; // center-to-center game-over trigger
export const ENEMY_SPAWN_CLEAR    = 10;          // min Manhattan tiles from player spawn
export const ENEMY_STUN_TIME      = 3.0;         // seconds frozen after touching gas
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

// ─── input feel ────────────────────────────────────────────────────────────────
export const JOY_RADIUS    = 48;   // joystick max stick travel (px)
export const JOY_HOLD_MS   = 500;  // touch-hold before the joystick appears
export const DOUBLE_TAP_MS = 300;  // max gap between taps to count as a double-tap (gas)
