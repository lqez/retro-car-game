import { timeLeft, startRound } from './state.js';
import { calibrate, reqSensor, initJoystick } from './input.js';
import { CONST_SPEED, MAP_W, MAP_H, HALF_W, HALF_H, TILE, T } from './constants.js';
import { tileMap, mi } from './map.js';

export let gameOn = false;

let overlay, hud, recalBtn, returnBtn;
let mapSelectEl;
let selectedMap = null;
let starting = false;

const MMAP_COLORS = ['#555566','#9ba7ad','#4a7a56','#3399dd','#997755'];
let minimapEl, minimapCtx, minimapBg;

let _ver = 'dev';
try { _ver = __APP_VERSION__; } catch (_) {}

export function initUI(){
  overlay    = document.getElementById('overlay');
  hud        = document.getElementById('hud');
  recalBtn   = document.getElementById('recalBtn');
  mapSelectEl   = document.getElementById('mapSelect');
  const verEl = document.getElementById('version');
  if (verEl) verEl.textContent = _ver;

  document.getElementById('btnParis').addEventListener('click', () => {
    selectedMap = 'paris';
    startGame();
  });
  document.getElementById('btnRandom').addEventListener('click', () => {
    selectedMap = 'random';
    startGame();
  });

  recalBtn.addEventListener('click', calibrate);

  // Init joystick (pass canvas and recalBtn)
  const canvasEl = document.getElementById('c');
  initJoystick(canvasEl, recalBtn, ()=>gameOn);
  returnBtn = document.getElementById('returnBtn');
  returnBtn.addEventListener('click', returnToMenu);
}

export async function startGame(){
  if(gameOn||starting||!selectedMap)return;
  starting=true;
  const ok=await reqSensor();
  if(!ok){starting=false;alert('센서 권한이 필요합니다.');return;}
  startRound(selectedMap);
  calibrate();
  overlay.style.display='none';
  hud.style.display='block';
  recalBtn.style.display='block';
  initMinimap();
  gameOn=true;
  starting=false;
}

function initMinimap(){
  minimapEl = document.getElementById('minimap');
  if(!minimapEl) return;
  minimapEl.width = MAP_W;
  minimapEl.height = MAP_H;
  minimapCtx = minimapEl.getContext('2d');
  minimapBg = document.createElement('canvas');
  minimapBg.width = MAP_W;
  minimapBg.height = MAP_H;
  const bgCtx = minimapBg.getContext('2d');
  for(let ty=0;ty<MAP_H;ty++){
    for(let tx=0;tx<MAP_W;tx++){
      bgCtx.fillStyle = MMAP_COLORS[tileMap[mi(tx,ty)]] ?? '#9ba7ad';
      bgCtx.fillRect(tx,ty,1,1);
    }
  }
  minimapEl.style.display = 'block';
}

export function updateMinimap(carX, carZ){
  if(!minimapCtx||!minimapBg) return;
  minimapCtx.drawImage(minimapBg,0,0);
  const mx = carX/TILE + HALF_W;
  const mz = carZ/TILE + HALF_H;
  minimapCtx.beginPath();
  minimapCtx.arc(mx,mz,2.5,0,Math.PI*2);
  minimapCtx.fillStyle = '#ffd400';
  minimapCtx.fill();
}

export function updateHUD(dirArrow){
  if(!hud) return;
  hud.textContent=`${dirArrow} ${(CONST_SPEED*3.6).toFixed(0)} km/h\n⏱ ${Math.ceil(timeLeft)}s`;
}

export function showGameOver(){
  hud.style.display='none';
  recalBtn.style.display='none';
  if(minimapEl) minimapEl.style.display='none';
  returnBtn.style.display='block';
}

function returnToMenu(){
  returnBtn.style.display='none';
  gameOn=false;
  selectedMap=null;
  minimapBg=null; minimapCtx=null; minimapEl=null;
  mapSelectEl.style.display='flex';
  overlay.style.display='flex';
}
