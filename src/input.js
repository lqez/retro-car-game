import { JOY_RADIUS as JOY_R, JOY_HOLD_MS, DOUBLE_TAP_MS } from './constants.js';

// ─── keyboard ──────────────────────────────────────────────────────────────
export const keys={};
window.addEventListener('keydown',e=>{
  const buttonLike = e.target?.closest?.('button,a,input,select,textarea,[role="button"]');
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  if(e.code==='Space' && getGameOn() && !buttonLike){
    e.preventDefault();
    if(!e.repeat) requestGas();
  }
  keys[e.code]=true;
});
window.addEventListener('keyup',e=>{keys[e.code]=false;});

// ─── gas trigger (space / double-tap / GAS button) ──────────────────────────
let gasReq=false;
export function requestGas(){ if(getGameOn()) gasReq=true; }
export function consumeGasRequest(){ const v=gasReq; gasReq=false; return v; }

// ─── sensor ──────────────────────────────────────────────────────────────────
export let rawBeta=0, rawGamma=0, baseBeta=0, baseGamma=0;
export let sensorOk=false;
export let tiltAvailable=false;
window.addEventListener('deviceorientation',e=>{
  if(e.beta!=null || e.gamma!=null) tiltAvailable=true;
  rawBeta=e.beta??0;rawGamma=e.gamma??0;
});

export async function reqSensor(){
  const OrientationEvent = globalThis.DeviceOrientationEvent;
  if(typeof OrientationEvent === 'undefined'){
    tiltAvailable=false;
    sensorOk=true;
    return true;
  }
  tiltAvailable=true;
  if(typeof OrientationEvent.requestPermission==='function'){
    const r=await OrientationEvent.requestPermission();
    tiltAvailable = r==='granted';
    return r==='granted';
  }
  return true;
}
export function calibrate(){baseBeta=rawBeta;baseGamma=rawGamma;sensorOk=true;}

// ─── virtual joystick (touch hold 0.5s) ──────────────────────────────────────────────
let joyEl, stickEl;
export let joyVisible = false;
export let joyActive  = false;
export let joyDX = 0, joyDY = 0;
let joyOX = 0, joyOY = 0;
let touchId = null;
let holdTimer = null, hideTimer = null;

function showJoystick(x,y){
  clearTimeout(hideTimer);          // cancel any pending fade-out cleanup
  joyOX=x; joyOY=y; joyDX=0; joyDY=0;
  joyEl.style.left=x+'px'; joyEl.style.top=y+'px';
  stickEl.style.transform='translate(-50%,-50%)';
  joyEl.classList.add('on');        // instant activation (transition:0s)
  if(recalBtnRef) recalBtnRef.classList.add('faded');
  joyVisible=true; joyActive=true;
}
function moveStick(x,y){
  let dx=x-joyOX, dy=y-joyOY;
  const d=Math.hypot(dx,dy);
  if(d>JOY_R){ dx=dx/d*JOY_R; dy=dy/d*JOY_R; }
  joyDX=dx; joyDY=dy;
  stickEl.style.transform=`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}
function fadeOutJoystick(){
  // Stay fully visible for 1s, then begin a 1s CSS fade-out, then remove.
  clearTimeout(hideTimer);
  hideTimer=setTimeout(()=>{
    joyEl.classList.remove('on');                       // start 1s CSS fade-out
    if(recalBtnRef) recalBtnRef.classList.remove('faded');
    hideTimer=setTimeout(()=>{ joyVisible=false; }, 1000);
  }, 1000);
}

let recalBtnRef = null;
let getGameOn = ()=>false;

export function initJoystick(canvasEl, recalBtn, gameOnGetter){
  joyEl   = document.getElementById('joystick');
  stickEl = document.getElementById('stick');
  recalBtnRef = recalBtn;
  if(gameOnGetter) getGameOn = gameOnGetter;

  canvasEl.addEventListener('touchstart',e=>{
    if(getGameOn()) e.preventDefault();
    if(!getGameOn()||touchId!==null) return;
    const t=e.changedTouches[0];
    touchId=t.identifier;
    const x=t.clientX, y=t.clientY;
    clearTimeout(holdTimer);
    holdTimer=setTimeout(()=>showJoystick(x,y),JOY_HOLD_MS);
  },{passive:false});

  canvasEl.addEventListener('touchmove',e=>{
    if(touchId===null) return;
    const t=[...e.changedTouches].find(c=>c.identifier===touchId);
    if(!t) return;
    if(joyActive){ e.preventDefault(); moveStick(t.clientX,t.clientY); }
  },{passive:false});

  let lastTap=0;
  function endTouch(e){
    if(touchId===null) return;
    if(![...e.changedTouches].some(c=>c.identifier===touchId)) return;
    const wasJoy=joyActive;
    touchId=null;
    clearTimeout(holdTimer);
    if(joyActive){
      joyActive=false; joyDX=0; joyDY=0;
      stickEl.style.transform='translate(-50%,-50%)';
      fadeOutJoystick();
    }
    // A quick tap (joystick never engaged) → detect double-tap for gas.
    if(!wasJoy){
      const now=performance.now();
      if(now-lastTap < DOUBLE_TAP_MS){ requestGas(); lastTap=0; }
      else lastTap=now;
    }
  }
  canvasEl.addEventListener('touchend',endTouch);
  canvasEl.addEventListener('touchcancel',endTouch);
}
