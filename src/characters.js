// Character definitions.
// Multipliers are applied on top of the base constants:
//   speedMul  — driving speed       (× CONST_SPEED)
//   scaleMul  — visual model size    (× auto-fit scale)
//   modelYaw  — visual model yaw fix  (+ radians after base GLB rotation)
//   rotMul    — turn / steer speed   (× ROT_SPEED)
//   colLenMul — collision length 세로 (× CAR_HL)
//   colWidMul — collision width  가로 (× CAR_HW)
//   hp        — hits the car can take
//   gasMax    — gas charges per round
//   gasType   — paralysing-gas variant id (see gas.js GAS_TYPES); 'default' for now
export const CHARACTERS = [
  {
    id: 'han',
    label: '한',
    img: './assets/cars/han.png',
    glb: './assets/cars/han.glb',
    modelYaw:  0,
    speedMul:  1.0,
    scaleMul:  1.0,
    rotMul:    0.8,
    colLenMul: 1.0,
    colWidMul: 1.0,
    hp: 1,
    gasMax: 3,
    gasType: 'default',
  },
  {
    id: 'poong',
    label: '풍장군',
    img: './assets/cars/poong.png',
    glb: './assets/cars/poong.glb',
    modelYaw:  0,
    speedMul:  0.9,
    scaleMul:  1.2,
    rotMul:    1.2,
    colLenMul: 1.0,
    colWidMul: 1.0,
    hp: 1,
    gasMax: 5,
    gasType: 'default',
  },
  {
    id: 'puchi',
    label: '푸치',
    img: './assets/cars/puchi.png',
    glb: './assets/cars/puchi.glb',
    modelYaw:  -Math.PI / 2,
    speedMul:  0.85,
    scaleMul:  1.1,
    rotMul:    0.4,
    colLenMul: 1.0,
    colWidMul: 1.0,
    hp: 1,
    gasMax: 10,
    gasType: 'default',
  },
  {
    id: 'elvers',
    label: '엘버스',
    img: './assets/cars/elvers.png',
    glb: './assets/cars/elvers.glb',
    modelYaw:  -Math.PI / 2,
    speedMul:  1.1,
    scaleMul:  1.0,
    rotMul:    0.5,
    colLenMul: 1.0,
    colWidMul: 0.8,
    hp: 1,
    gasMax: 1,
    gasType: 'default',
  },
];

export let activeCharacter = CHARACTERS[0];
export function setActiveCharacter(c) { activeCharacter = c; }
