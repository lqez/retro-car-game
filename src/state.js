import { buildScene, sx, sz } from './scene.js';
import { carGroup, resetCrash } from './car.js';
import { resetPhysics } from './physics.js';
import { placeDiamonds } from './diamonds.js';
import { placeEnemies } from './enemies.js';
import { resetGas } from './gas.js';
import { DEFAULT_GAMEPLAY, gameplayFor } from './map.js';

export const GameState = Object.freeze({
  MENU:'menu', PLAYING:'playing', GAME_OVER:'game_over'
});

export let gameState = GameState.MENU;
export const GAME_DURATION = DEFAULT_GAMEPLAY.timeLimit;
export let roundDuration = GAME_DURATION;
export let timeLeft = GAME_DURATION;
export let won = false;
export let lossReason = 'timeout';  // 'timeout' | 'enemy' | 'win'

export function startRound(mapModule){
  buildScene(mapModule);
  const gameplay = gameplayFor(mapModule);
  resetPhysics();
  resetCrash();
  carGroup.position.set(sx, 0, sz);
  placeDiamonds(gameplay.diamondCount);
  placeEnemies(gameplay.enemyCount);
  resetGas();
  roundDuration = gameplay.timeLimit;
  timeLeft = roundDuration;
  won = false;
  lossReason = 'timeout';
  gameState = GameState.PLAYING;
}

export function updateState(dt){
  if(gameState!==GameState.PLAYING) return;
  timeLeft -= dt;
  if(timeLeft<0.001){ timeLeft=0; gameState=GameState.GAME_OVER; won=false; lossReason='timeout'; }
}

// Called when every diamond has been collected.
export function winRound(){
  if(gameState!==GameState.PLAYING) return;
  gameState = GameState.GAME_OVER;
  won = true;
  lossReason = 'win';
}

// Called when the player is hit by an enemy.
export function loseRound(){
  if(gameState!==GameState.PLAYING) return;
  gameState = GameState.GAME_OVER;
  won = false;
  lossReason = 'enemy';
}
