// Character definitions.
// speedMul / scaleMul / rotMul are multipliers on top of the base constants.
// All values are 1.0 for now; tweak per-character when ready.
export const CHARACTERS = [
  { id: 'han',    label: '한',     glb: './assets/car/han.glb',    speedMul: 1.0, scaleMul: 1.0, rotMul: 1.0, hp: 1 },
  { id: 'poong',  label: '풍장군', glb: './assets/car/poong.glb',  speedMul: 1.0, scaleMul: 1.0, rotMul: 1.0, hp: 1 },
  { id: 'elvers', label: '엘버스', glb: './assets/car/elvers.glb', speedMul: 1.0, scaleMul: 1.0, rotMul: 1.0, hp: 1 },
];

export let activeCharacter = CHARACTERS[0];
export function setActiveCharacter(c) { activeCharacter = c; }
