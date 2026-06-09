import { timeLeft, startRound, lossReason } from './state.js';
import { calibrate, reqSensor, initJoystick, requestGas, tiltAvailable } from './input.js';
import { gasCharges, gasMax, clearGas } from './gas.js';
import { CONST_SPEED, TILE, T } from './constants.js';
import { MAP_W, MAP_H, HALF_W, HALF_H, tileMap, mi } from './map.js';
import * as randomMap from './maps/00_random.js';
import * as parisMap  from './maps/01_paris.js';
import * as parisNightMap from './maps/02_paris_night.js';
import { getDiamonds, collectedCount, totalCount, clearDiamonds } from './diamonds.js';
import { getEnemies, clearEnemies } from './enemies.js';
import { CHARACTERS, setActiveCharacter } from './characters.js';
import { loadCharacterModel, resetCrash, setCarVisible } from './car.js';

const DIAMOND_BLUE = '#2ad4ff';
const ENEMY_RED    = '#ff4444';

export let gameOn = false;

let overlay, hud, recalBtn, returnBtn, gameOverMsg, btnStart, gasBtn;
let mapSelectEl, charSelectEl, mapLabelEl, mapCardSelectEl;
let selectedMap = null;
let starting = false;
let menuStep = 'character';
let charBtns = [];
let mapCards = [];

const START_BACKDROP_MS = 720;
const MMAP_VIEW = 32; // tiles visible in the viewport
// minimap marker sizes (px)
const MMAP_DIAMOND_SIZE = 8;   // in-view diamond square side
const MMAP_DIAMOND_ARROW = 1.6; // off-view diamond arrow scale (base shape ~5px long)
const MMAP_ENEMY_R = 4.5;      // enemy dot radius
let minimapPx = 80; // synced to CSS size
let minimapEl, minimapCtx, minimapBg;

let _ver = 'dev';
try { _ver = __APP_VERSION__; } catch (_) {}

function focusSoon(el){
  requestAnimationFrame(() => el?.focus?.());
}

function activeButtonIndex(buttons){
  return Math.max(0, buttons.findIndex(b => b.classList.contains('active')));
}

function selectCharacter(index){
  if(!charBtns.length) return;
  const nextIndex = Math.max(0, Math.min(index, charBtns.length - 1));
  charBtns.forEach(b => b.classList.remove('active'));
  charBtns[nextIndex].classList.add('active');
  setActiveCharacter(CHARACTERS[nextIndex]);
  loadCharacterModel(CHARACTERS[nextIndex]);
}

function showMapSelection(){
  menuStep = 'map';
  mapLabelEl.hidden = false;
  mapCardSelectEl.hidden = false;
  focusSoon(mapCards[activeButtonIndex(mapCards)]);
}

function resetMenuFlow(){
  menuStep = 'character';
  selectedMap = null;
  if(mapLabelEl) mapLabelEl.hidden = true;
  if(mapCardSelectEl) mapCardSelectEl.hidden = true;
  if(btnStart){
    btnStart.disabled = true;
    btnStart.hidden = true;
  }
  mapCards.forEach(b => b.classList.remove('active'));
  focusSoon(charBtns[activeButtonIndex(charBtns)]);
}

function moveMenuFocus(buttons, delta){
  if(!buttons.length) return;
  const current = buttons.indexOf(document.activeElement);
  const fallback = activeButtonIndex(buttons);
  const from = current >= 0 ? current : fallback;
  const next = (from + delta + buttons.length) % buttons.length;
  buttons[next].focus();
  if(buttons === charBtns) selectCharacter(next);
}

function handleMenuKeydown(e){
  if(overlay?.style.display === 'none' || starting) return;
  const isArrow = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code);
  if(!isArrow) return;

  if(menuStep === 'character'){
    e.preventDefault();
    moveMenuFocus(charBtns, e.code === 'ArrowLeft' || e.code === 'ArrowUp' ? -1 : 1);
    return;
  }

  if(menuStep === 'map'){
    e.preventDefault();
    moveMenuFocus(mapCards, e.code === 'ArrowLeft' || e.code === 'ArrowUp' ? -1 : 1);
  }
}

export function initUI(){
  overlay    = document.getElementById('overlay');
  hud        = document.getElementById('hud');
  recalBtn   = document.getElementById('recalBtn');
  mapSelectEl   = document.getElementById('mapSelect');
  charSelectEl  = document.getElementById('charSelect');
  mapLabelEl = document.getElementById('mapLabel');
  mapCardSelectEl = document.getElementById('mapCardSelect');
  const verEl = document.getElementById('version');
  if (verEl) verEl.textContent = _ver;

  // ── character selection ───────────────────────────────────────────────────
  charBtns = charSelectEl ? [...charSelectEl.querySelectorAll('.charBtn')] : [];
  setCarVisible(false);
  // Load the default character model immediately
  selectCharacter(0);

  charBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      selectCharacter(i);
      showMapSelection();
    });
  });

  // ── map selection ─────────────────────────────────────────────────────────
  btnStart = document.getElementById('btnStart');
  btnStart.addEventListener('click', startGame);

  mapCards = [...document.querySelectorAll('.mapCard')];
  function selectMap(id, map) {
    mapCards.forEach(b => b.classList.remove('active'));
    const selectedCard = document.getElementById(id);
    selectedCard.classList.add('active');
    selectedMap = map;
    const img = selectedCard.querySelector('img');
    if(overlay && img){
      overlay.style.setProperty('--city-bg', `url("${img.currentSrc || img.src}")`);
      overlay.classList.add('hasCityBackdrop');
      overlay.classList.remove('launching');
    }
    btnStart.disabled = false;
    btnStart.hidden = false;
    focusSoon(btnStart);
  }
  document.getElementById('btnParis').addEventListener('click',      () => selectMap('btnParis',      parisMap));
  document.getElementById('btnParisNight').addEventListener('click', () => selectMap('btnParisNight', parisNightMap));
  document.getElementById('btnRandom').addEventListener('click',     () => selectMap('btnRandom',     randomMap));
  document.addEventListener('keydown', handleMenuKeydown);
  resetMenuFlow();

  recalBtn.addEventListener('click', calibrate);

  gasBtn = document.getElementById('gasBtn');
  if (gasBtn) gasBtn.addEventListener('click', requestGas);

  // Init joystick (pass canvas and recalBtn)
  const canvasEl = document.getElementById('c');
  initJoystick(canvasEl, recalBtn, ()=>gameOn);
  returnBtn = document.getElementById('returnBtn');
  returnBtn.addEventListener('click', returnToMenu);
  gameOverMsg = document.getElementById('gameOverMsg');
}

export async function startGame(){
  if(gameOn||starting||!selectedMap||btnStart?.disabled)return;
  starting=true;
  const ok=await reqSensor();
  if(!ok){starting=false;alert('센서 권한이 필요합니다.');return;}
  startRound(selectedMap);
  hud.style.display='block';
  if(tiltAvailable){
    calibrate();
    recalBtn.style.display='block';
  }else{
    recalBtn.style.display='none';
  }
  if(gasBtn){ gasBtn.style.display='block'; gasBtn.disabled=false; gasBtn.textContent='GAS ×'+gasMax(); }
  initMinimap();
  gameOn=true;
  overlay.classList.add('launching');
  await new Promise(resolve => setTimeout(resolve, START_BACKDROP_MS));
  overlay.style.display='none';
  overlay.classList.remove('launching');
  document.activeElement?.blur?.();
  starting=false;
}

function initMinimap(){
  minimapEl = document.getElementById('minimap');
  if(!minimapEl) return;
  minimapEl.style.display = 'block';
  syncMinimapSize();

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
}

function syncMinimapSize(){
  if(!minimapEl) return;
  const cssPx = Math.max(1, Math.round(minimapEl.getBoundingClientRect().width));
  if(minimapEl.width !== cssPx || minimapEl.height !== cssPx){
    minimapEl.width = cssPx;
    minimapEl.height = cssPx;
    minimapPx = cssPx;
  }
  if(!minimapCtx){
    minimapCtx = minimapEl.getContext('2d');
  }
}

export function updateMinimap(carX, carZ){
  if(!minimapCtx||!minimapBg) return;
  syncMinimapSize();

  const P = minimapPx;
  const R = P / 2;
  minimapCtx.save();

  // Clip to circle
  minimapCtx.beginPath();
  minimapCtx.arc(R, R, R, 0, Math.PI*2);
  minimapCtx.clip();

  // Clear to transparent — CSS backdrop-filter+background handles the dark blur
  minimapCtx.clearRect(0, 0, P, P);

  // 32×32 tile window centred on car; draw roads crisply (no interpolation)
  const cx = carX/TILE + HALF_W;
  const cz = carZ/TILE + HALF_H;
  const sx = cx - MMAP_VIEW/2, sy = cz - MMAP_VIEW/2;
  minimapCtx.imageSmoothingEnabled = false;
  minimapCtx.drawImage(minimapBg, sx, sy, MMAP_VIEW, MMAP_VIEW, 0, 0, P, P);
  minimapCtx.imageSmoothingEnabled = true;

  // Convex glass: edge vignette
  const vig = minimapCtx.createRadialGradient(R,R,R*0.35, R,R,R);
  vig.addColorStop(0,   'rgba(0,0,0,0)');
  vig.addColorStop(0.65,'rgba(0,5,20,0.06)');
  vig.addColorStop(1,   'rgba(0,5,30,0.52)');
  minimapCtx.fillStyle = vig;
  minimapCtx.fillRect(0, 0, P, P);

  // Convex glass: specular highlight (top-left)
  const spec = minimapCtx.createRadialGradient(R*0.52, R*0.38, 0, R*0.52, R*0.38, R*0.5);
  spec.addColorStop(0,   'rgba(255,255,255,0.2)');
  spec.addColorStop(0.4, 'rgba(255,255,255,0.05)');
  spec.addColorStop(1,   'rgba(255,255,255,0)');
  minimapCtx.fillStyle = spec;
  minimapCtx.fillRect(0, 0, P, P);

  const tilesToPx = P / MMAP_VIEW;
  const edgeR = R - 4;

  // ── diamond markers ──────────────────────────────────────────────────────────
  minimapCtx.fillStyle = DIAMOND_BLUE;
  for(const d of getDiamonds()){
    if(d.collected) continue;
    const dxp = (d.x - carX)/TILE * tilesToPx;
    const dzp = (d.z - carZ)/TILE * tilesToPx;
    if(Math.hypot(dxp,dzp) <= edgeR){
      const bx = R + dxp, by = R + dzp;
      const h = MMAP_DIAMOND_SIZE/2;
      minimapCtx.fillRect(bx-h, by-h, MMAP_DIAMOND_SIZE, MMAP_DIAMOND_SIZE);
    }else{
      const ang = Math.atan2(dzp, dxp);
      const a = MMAP_DIAMOND_ARROW;
      minimapCtx.save();
      minimapCtx.translate(R + Math.cos(ang)*edgeR, R + Math.sin(ang)*edgeR);
      minimapCtx.rotate(ang);
      minimapCtx.beginPath();
      minimapCtx.moveTo(5*a,0); minimapCtx.lineTo(-3*a,-3.5*a); minimapCtx.lineTo(-3*a,3.5*a);
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
      minimapCtx.arc(bx, by, MMAP_ENEMY_R, 0, Math.PI*2);
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

export function updateHUD(dirArrow, speedMult = 1){
  if(!hud) return;
  hud.textContent=`${dirArrow} ${(CONST_SPEED*speedMult*3.6).toFixed(0)} km/h\n💎 ${collectedCount}/${totalCount}\n⏱ ${Math.ceil(timeLeft)}s\n💨 ${gasCharges()}/${gasMax()}`;
  if(gasBtn){ const n=gasCharges(); gasBtn.disabled=n<=0; gasBtn.textContent='GAS ×'+n; }
}

export function showGameOver(won, collected, total){
  hud.style.display='none';
  recalBtn.style.display='none';
  if(gasBtn) gasBtn.style.display='none';
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
  focusSoon(returnBtn);
}

function returnToMenu(){
  returnBtn.style.display='none';
  if(gameOverMsg) gameOverMsg.style.display='none';
  gameOn=false;
  selectedMap=null;
  if(gasBtn) gasBtn.style.display='none';
  clearDiamonds();
  clearEnemies();
  clearGas();
  resetCrash();
  setCarVisible(false);
  minimapBg=null; minimapCtx=null; minimapEl=null;
  mapSelectEl.style.display='flex';
  overlay.classList.remove('launching', 'hasCityBackdrop');
  overlay.style.removeProperty('--city-bg');
  overlay.style.display='flex';
  resetMenuFlow();
}
