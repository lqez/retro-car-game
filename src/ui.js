import { timeLeft, startRound } from './state.js';
import { calibrate, reqSensor, initJoystick } from './input.js';
import { CONST_SPEED, MAP_W, MAP_H, HALF_W, HALF_H, TILE, T } from './constants.js';
import { tileMap, mi } from './map.js';

export let gameOn = false;

let overlay, hud, recalBtn, returnBtn;
let mapSelectEl;
let selectedMap = null;
let starting = false;

const MMAP_VIEW = 32; // tiles visible in the viewport
const MMAP_PX   = 120; // canvas pixel size
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
  minimapEl.width = MMAP_PX;
  minimapEl.height = MMAP_PX;
  minimapCtx = minimapEl.getContext('2d');

  // Precompute road-only map: transparent bg, bright pixels for road/bridge
  minimapBg = document.createElement('canvas');
  minimapBg.width = MAP_W;
  minimapBg.height = MAP_H;
  const bgCtx = minimapBg.getContext('2d');
  for(let ty=0;ty<MAP_H;ty++) for(let tx=0;tx<MAP_W;tx++){
    const t = tileMap[mi(tx,ty)];
    if(t===T.ROAD)   { bgCtx.fillStyle='rgba(180,205,255,1)'; bgCtx.fillRect(tx,ty,1,1); }
    else if(t===T.BRIDGE){ bgCtx.fillStyle='rgba(210,185,150,1)'; bgCtx.fillRect(tx,ty,1,1); }
  }
  minimapEl.style.display = 'block';
}

export function updateMinimap(carX, carZ){
  if(!minimapCtx||!minimapBg) return;

  const R = MMAP_PX / 2;
  minimapCtx.save();

  // Clip to circle
  minimapCtx.beginPath();
  minimapCtx.arc(R, R, R, 0, Math.PI*2);
  minimapCtx.clip();

  // Dark background
  minimapCtx.fillStyle = 'rgb(7,9,16)';
  minimapCtx.fillRect(0, 0, MMAP_PX, MMAP_PX);

  // 32×32 tile window centred on car
  const cx = carX/TILE + HALF_W;
  const cz = carZ/TILE + HALF_H;
  const sx = cx - MMAP_VIEW/2, sy = cz - MMAP_VIEW/2;

  // Road glow: wide + soft
  minimapCtx.globalAlpha = 0.38;
  minimapCtx.filter = 'blur(3px)';
  minimapCtx.drawImage(minimapBg, sx, sy, MMAP_VIEW, MMAP_VIEW, 0, 0, MMAP_PX, MMAP_PX);

  // Road core: crisp centre
  minimapCtx.globalAlpha = 1.0;
  minimapCtx.filter = 'blur(0.6px)';
  minimapCtx.drawImage(minimapBg, sx, sy, MMAP_VIEW, MMAP_VIEW, 0, 0, MMAP_PX, MMAP_PX);
  minimapCtx.filter = 'none';

  // Car dot (yellow, glowing)
  minimapCtx.shadowColor = '#ffaa00';
  minimapCtx.shadowBlur  = 8;
  minimapCtx.beginPath();
  minimapCtx.arc(R, R, 3.5, 0, Math.PI*2);
  minimapCtx.fillStyle = '#ffd400';
  minimapCtx.fill();
  minimapCtx.shadowBlur = 0;

  // ── Convex glass overlay ──────────────────────────────────────────────────
  // vignette: darken edges like a lens rim
  const vig = minimapCtx.createRadialGradient(R,R,R*0.35, R,R,R);
  vig.addColorStop(0,   'rgba(0,0,0,0)');
  vig.addColorStop(0.65,'rgba(0,5,20,0.08)');
  vig.addColorStop(1,   'rgba(0,5,30,0.62)');
  minimapCtx.fillStyle = vig;
  minimapCtx.fillRect(0, 0, MMAP_PX, MMAP_PX);

  // specular: bright top-left highlight simulating convex bulge
  const spec = minimapCtx.createRadialGradient(R*0.52, R*0.38, 0, R*0.52, R*0.38, R*0.52);
  spec.addColorStop(0,   'rgba(255,255,255,0.22)');
  spec.addColorStop(0.4, 'rgba(255,255,255,0.06)');
  spec.addColorStop(1,   'rgba(255,255,255,0)');
  minimapCtx.fillStyle = spec;
  minimapCtx.fillRect(0, 0, MMAP_PX, MMAP_PX);

  minimapCtx.restore();
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
