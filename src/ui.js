import { timeLeft, startRound, lossReason } from './state.js';
import { calibrate, reqSensor, initJoystick } from './input.js';
import { CONST_SPEED, TILE, T } from './constants.js';
import { MAP_W, MAP_H, HALF_W, HALF_H, tileMap, mi } from './map.js';
import * as randomMap from './maps/00_random.js';
import * as parisMap  from './maps/01_paris.js';
import { getDiamonds, collectedCount, totalCount, clearDiamonds } from './diamonds.js';
import { getEnemies, clearEnemies } from './enemies.js';

const DIAMOND_BLUE = '#2ad4ff';
const ENEMY_RED    = '#ff4444';

export let gameOn = false;

let overlay, hud, recalBtn, returnBtn, gameOverMsg;
let mapSelectEl;
let selectedMap = null;
let starting = false;

const MMAP_VIEW = 32; // tiles visible in the viewport
const MMAP_PX   = 80;  // canvas pixel size
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
    selectedMap = parisMap;
    startGame();
  });
  document.getElementById('btnRandom').addEventListener('click', () => {
    selectedMap = randomMap;
    startGame();
  });

  recalBtn.addEventListener('click', calibrate);

  // Init joystick (pass canvas and recalBtn)
  const canvasEl = document.getElementById('c');
  initJoystick(canvasEl, recalBtn, ()=>gameOn);
  returnBtn = document.getElementById('returnBtn');
  returnBtn.addEventListener('click', returnToMenu);
  gameOverMsg = document.getElementById('gameOverMsg');
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

  // Precompute road-only map: transparent bg, solid gray for road/bridge
  minimapBg = document.createElement('canvas');
  minimapBg.width = MAP_W;
  minimapBg.height = MAP_H;
  const bgCtx = minimapBg.getContext('2d');
  bgCtx.fillStyle = 'rgba(155,160,168,1)';
  for(let ty=0;ty<MAP_H;ty++) for(let tx=0;tx<MAP_W;tx++){
    const t = tileMap[mi(tx,ty)];
    if(t===T.ROAD||t===T.BRIDGE) bgCtx.fillRect(tx,ty,1,1);
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

  // Clear to transparent — CSS backdrop-filter+background handles the dark blur
  minimapCtx.clearRect(0, 0, MMAP_PX, MMAP_PX);

  // 32×32 tile window centred on car; draw roads crisply (no interpolation)
  const cx = carX/TILE + HALF_W;
  const cz = carZ/TILE + HALF_H;
  const sx = cx - MMAP_VIEW/2, sy = cz - MMAP_VIEW/2;
  minimapCtx.imageSmoothingEnabled = false;
  minimapCtx.drawImage(minimapBg, sx, sy, MMAP_VIEW, MMAP_VIEW, 0, 0, MMAP_PX, MMAP_PX);
  minimapCtx.imageSmoothingEnabled = true;

  // Convex glass: edge vignette
  const vig = minimapCtx.createRadialGradient(R,R,R*0.35, R,R,R);
  vig.addColorStop(0,   'rgba(0,0,0,0)');
  vig.addColorStop(0.65,'rgba(0,5,20,0.06)');
  vig.addColorStop(1,   'rgba(0,5,30,0.52)');
  minimapCtx.fillStyle = vig;
  minimapCtx.fillRect(0, 0, MMAP_PX, MMAP_PX);

  // Convex glass: specular highlight (top-left)
  const spec = minimapCtx.createRadialGradient(R*0.52, R*0.38, 0, R*0.52, R*0.38, R*0.5);
  spec.addColorStop(0,   'rgba(255,255,255,0.2)');
  spec.addColorStop(0.4, 'rgba(255,255,255,0.05)');
  spec.addColorStop(1,   'rgba(255,255,255,0)');
  minimapCtx.fillStyle = spec;
  minimapCtx.fillRect(0, 0, MMAP_PX, MMAP_PX);

  const tilesToPx = MMAP_PX / MMAP_VIEW;
  const edgeR = R - 4;

  // ── diamond markers ──────────────────────────────────────────────────────────
  minimapCtx.fillStyle = DIAMOND_BLUE;
  for(const d of getDiamonds()){
    if(d.collected) continue;
    const dxp = (d.x - carX)/TILE * tilesToPx;
    const dzp = (d.z - carZ)/TILE * tilesToPx;
    if(Math.hypot(dxp,dzp) <= edgeR){
      const bx = R + dxp, by = R + dzp;
      minimapCtx.fillRect(bx-2.5, by-2.5, 5, 5);
    }else{
      const ang = Math.atan2(dzp, dxp);
      minimapCtx.save();
      minimapCtx.translate(R + Math.cos(ang)*edgeR, R + Math.sin(ang)*edgeR);
      minimapCtx.rotate(ang);
      minimapCtx.beginPath();
      minimapCtx.moveTo(5,0); minimapCtx.lineTo(-3,-3.5); minimapCtx.lineTo(-3,3.5);
      minimapCtx.closePath();
      minimapCtx.fill();
      minimapCtx.restore();
    }
  }

  // ── enemy markers (red dots, in-view only) ──────────────────────────────────
  minimapCtx.fillStyle = ENEMY_RED;
  for(const e of getEnemies()){
    const dxp = (e.x - carX)/TILE * tilesToPx;
    const dzp = (e.z - carZ)/TILE * tilesToPx;
    if(Math.hypot(dxp,dzp) <= edgeR){
      const bx = R + dxp, by = R + dzp;
      minimapCtx.beginPath();
      minimapCtx.arc(bx, by, 3, 0, Math.PI*2);
      minimapCtx.fill();
    }
  }

  // Car dot (yellow) — always on top, dead centre
  minimapCtx.shadowColor = '#ffaa00';
  minimapCtx.shadowBlur  = 5;
  minimapCtx.beginPath();
  minimapCtx.arc(R, R, 2.5, 0, Math.PI*2);
  minimapCtx.fillStyle = '#ffd400';
  minimapCtx.fill();
  minimapCtx.shadowBlur = 0;

  minimapCtx.restore();
}

export function updateHUD(dirArrow){
  if(!hud) return;
  hud.textContent=`${dirArrow} ${(CONST_SPEED*3.6).toFixed(0)} km/h\n💎 ${collectedCount}/${totalCount}\n⏱ ${Math.ceil(timeLeft)}s`;
}

export function showGameOver(won, collected, total){
  hud.style.display='none';
  recalBtn.style.display='none';
  if(minimapEl) minimapEl.style.display='none';
  if(gameOverMsg){
    let msg;
    if(won)                     msg = `🎉 모든 다이아몬드 수집! ${collected}/${total}`;
    else if(lossReason==='enemy') msg = `🚨 적 차량에 충돌! 💎 ${collected}/${total}`;
    else                          msg = `⏰ 시간 종료  💎 ${collected}/${total}`;
    gameOverMsg.textContent = msg;
    gameOverMsg.style.display='block';
  }
  returnBtn.style.display='block';
}

function returnToMenu(){
  returnBtn.style.display='none';
  if(gameOverMsg) gameOverMsg.style.display='none';
  gameOn=false;
  selectedMap=null;
  clearDiamonds();
  clearEnemies();
  minimapBg=null; minimapCtx=null; minimapEl=null;
  mapSelectEl.style.display='flex';
  overlay.style.display='flex';
}
