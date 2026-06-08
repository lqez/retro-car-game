import { T } from './constants.js';

const DEFAULT_TILE_PROPS = Object.freeze({
  passable: false,
  speedMul: 1.0,
  bumpFreqMul: 0,
  bumpAmpMul: 0,
  bumpSideMul: 0,
  bumpRollChanceMul: 0,
  bumpRollKickMul: 0,
});

export const TILE_PROPS = Object.freeze({
  [T.ROAD]: Object.freeze({
    ...DEFAULT_TILE_PROPS,
    passable: true,
    bumpFreqMul: 1.35,
    bumpAmpMul: 1.0,
    bumpSideMul: 1.0,
    bumpRollChanceMul: 1.0,
    bumpRollKickMul: 1.0,
  }),
  [T.BUILDING]: DEFAULT_TILE_PROPS,
  [T.PARK]: DEFAULT_TILE_PROPS,
  [T.WATER]: DEFAULT_TILE_PROPS,
  [T.BRIDGE]: Object.freeze({
    ...DEFAULT_TILE_PROPS,
    passable: true,
    speedMul: 0.8,
    bumpFreqMul: 1.55,
    bumpAmpMul: 1.6,
    bumpSideMul: 1.45,
    bumpRollChanceMul: 1.6,
    bumpRollKickMul: 1.5,
  }),
});

export function tileProps(tileType) {
  return TILE_PROPS[tileType] ?? DEFAULT_TILE_PROPS;
}
