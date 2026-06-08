import { build as buildParis } from './01_paris.js';

export const mapW = 80, mapH = 80;
export const hasLandmarks = true;
export const theme = 'night';
export const gameplay = Object.freeze({
  enemyCount: 24,
  diamondCount: 10,
  timeLimit: 100,
});

export function build() {
  buildParis();
}
