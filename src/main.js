import { scene, renderer, camera, composer,
         setTopCamera, cameraLead, targetCameraLead, ZERO_CAMERA_LEAD,
         sx, sz } from './scene.js';
import { carGroup, carVisual, wheelMeshes, wR_, spawnEffects, updateParticles } from './car.js';
import { keys, joyActive, joyDX, joyDY, joyVisible,
         rawBeta, rawGamma, baseBeta, baseGamma,
         calibrate, sensorOk } from './input.js';
import { dirX, dirZ, prevDirX, prevDirZ, turnBias, stuckTimer,
         leadingClearForDir, moveWithCollision, targetRotY, ROT_SPEED,
         setDir, setPrevDir, setTurnBias, setStuckTimer, setTargetRotY } from './physics.js';
import { GameState, gameState, updateState, winRound, loseRound, won, GAME_DURATION, timeLeft } from './state.js';
import { gameOn, updateHUD, updateMinimap, showGameOver, initUI, startGame } from './ui.js';
import { updateDiamonds, collectedCount, totalCount } from './diamonds.js';
import { updateEnemies } from './enemies.js';
import { HALF_W, HALF_H, tileMap, mi } from './map.js';
import { CONST_SPEED, TILE, T } from './constants.js';

// ─── init ─────────────────────────────────────────────────────────────────────────────
initUI();

// ─── game loop state ─────────────────────────────────────────────────────────────────
let particleTimer = 0;
let wheelAngle    = 0;
let last          = performance.now();
let wasGameOver   = false;

// ── driving feel ─────────────────────────────────────────────────────────────────────
const MAX_LEAN     = 0.32;  // radians (~18°), exaggerated so it's visible top-down
const LEAN_HOLD    = 0.45;  // seconds to sustain lean after a turn
const LEAN_LERP    = 7;     // lerp speed (higher = snappier)
const MAX_CAM_TILT = 0.04;  // radians (~2.3°) — very subtle camera rotation on turn
const CAM_TILT_LERP = 3;    // slower than lean for inertial feel

let bumpT      = 0;
let leanAngle  = 0;
let leanTarget = 0;
let leanTimer  = 0;
let camTilt    = 0;
let snapDirX   = 0, snapDirZ = -1;  // last committed direction, for turn detection

// ─── tick ───────────────────────────────────────────────────────────────────────────────
function tick(){
  requestAnimationFrame(tick);
  const now = performance.now();
  const dt  = Math.min((now - last) / 1000, 0.05);
  last = now;

  const _gameOn   = gameOn;
  const _sensorOk = sensorOk;
  const _gState   = gameState;

  if(_gameOn && _sensorOk){

    // ── terrain detection ─────────────────────────────────────────────────────────────
    const ctX      = Math.round(carGroup.position.x / TILE + HALF_W);
    const ctZ      = Math.round(carGroup.position.z / TILE + HALF_H);
    const onBridge = tileMap[mi(ctX, ctZ)] === T.BRIDGE;
    const speedMult = onBridge ? 0.8 : 1.0;
    const eDt       = dt * speedMult;   // terrain-adjusted frame step for movement

    // ── player steers (PLAYING only) ─────────────────────────────────────────────────
    if(_gState===GameState.PLAYING){
      let wantX=0, wantZ=0;
      if     (keys['ArrowUp']   ||keys['KeyW']) { wantX=0;  wantZ=-1; }
      else if(keys['ArrowDown'] ||keys['KeyS']) { wantX=0;  wantZ=1;  }
      else if(keys['ArrowRight']||keys['KeyD']) { wantX=1;  wantZ=0;  }
      else if(keys['ArrowLeft'] ||keys['KeyA']) { wantX=-1; wantZ=0;  }

      if(wantX===0&&wantZ===0 && joyActive){
        const ax=Math.abs(joyDX), ay=Math.abs(joyDY);
        if(Math.max(ax,ay) > 14){
          if(ax>=ay){ wantX = joyDX>0 ? 1 : -1; wantZ=0; }
          else      { wantZ = joyDY>0 ? 1 : -1; wantX=0; }
        }
      }

      if(wantX===0&&wantZ===0 && !joyVisible){
        const tiltFwd  = rawBeta  - baseBeta;
        const tiltSide = rawGamma - baseGamma;
        const FD = 8;
        const afwd = Math.abs(tiltFwd), aside = Math.abs(tiltSide);
        if(Math.max(afwd, aside) > FD){
          if(afwd >= aside){ wantX=0; wantZ = tiltFwd>0 ? 1 : -1; }
          else             { wantX = tiltSide>0 ? 1 : -1; wantZ=0; }
        }
      }

      if((wantX!==0||wantZ!==0)&&(wantX!==dirX||wantZ!==dirZ)){
        const wnx=carGroup.position.x+wantX*CONST_SPEED*dt;
        const wnz=carGroup.position.z+wantZ*CONST_SPEED*dt;
        if(leadingClearForDir(wnx,wnz,wantX,wantZ)){
          setPrevDir(dirX,dirZ);
          setDir(wantX,wantZ);
          setStuckTimer(0);
        }
      }
    }

    // ── move with terrain speed; auto-turn on wall hit ────────────────────────────────
    const move=moveWithCollision(carGroup.position.x,carGroup.position.z,dirX,dirZ,eDt);

    if(move.moved){
      carGroup.position.x=move.x;
      carGroup.position.z=move.z;
      setStuckTimer(0);
    }else{
      setStuckTimer(stuckTimer+dt);

      const rX=-dirZ, rZ=dirX, lX=dirZ, lZ=-dirX, bX=-dirX, bZ=-dirZ;

      const prevIsUseful=(prevDirX!==dirX||prevDirZ!==dirZ)
                        &&(prevDirX!==bX   ||prevDirZ!==bZ);

      let tries;
      if(stuckTimer>0.4){
        tries=[[bX,bZ],[rX,rZ],[lX,lZ]];
        setStuckTimer(0);
      }else if(prevIsUseful){
        const sides=turnBias>0?[[rX,rZ],[lX,lZ]]:[[lX,lZ],[rX,rZ]];
        tries=[[prevDirX,prevDirZ],...sides,[bX,bZ]];
      }else{
        tries=turnBias>0?[[rX,rZ],[lX,lZ],[bX,bZ]]:[[lX,lZ],[rX,rZ],[bX,bZ]];
      }

      for(const [tx,tz] of tries){
        const tnx=carGroup.position.x+tx*CONST_SPEED*dt;
        const tnz=carGroup.position.z+tz*CONST_SPEED*dt;
        if(leadingClearForDir(tnx,tnz,tx,tz)){
          const turnMove=moveWithCollision(carGroup.position.x,carGroup.position.z,tx,tz,eDt);
          if(!turnMove.moved)continue;
          setPrevDir(dirX,dirZ);
          setDir(tx,tz);
          carGroup.position.x=turnMove.x;
          carGroup.position.z=turnMove.z;
          setTurnBias(-turnBias);
          setStuckTimer(0);
          break;
        }
      }
    }

    // ── detect turn for lean (check after any direction change) ─────────────────────
    if(dirX !== snapDirX || dirZ !== snapDirZ){
      const cross = snapDirX * dirZ - snapDirZ * dirX;
      if(cross !== 0){ leanTarget = -cross * MAX_LEAN; leanTimer = LEAN_HOLD; }
      snapDirX = dirX; snapDirZ = dirZ;
    }

    // ── visual rotation toward current direction ───────────────────────────────────────
    setTargetRotY(Math.atan2(-dirZ, dirX));
    let diff=targetRotY-carGroup.rotation.y;
    while(diff>Math.PI)  diff-=Math.PI*2;
    while(diff<-Math.PI) diff+=Math.PI*2;
    carGroup.rotation.y+=Math.sign(diff)*Math.min(Math.abs(diff), ROT_SPEED*dt);

    // ── bump: rough road / stronger on bridge ─────────────────────────────────────────
    bumpT += CONST_SPEED * speedMult * dt;
    const bumpAmp = onBridge ? TILE * 0.055 : TILE * 0.018;
    const bump = Math.sin(bumpT * 0.042) * 0.50
               + Math.sin(bumpT * 0.110) * 0.35
               + Math.sin(bumpT * 0.270) * 0.15;
    carVisual.position.y = bump * bumpAmp;

    // ── lean: bank into turns ─────────────────────────────────────────────────────────
    leanTimer = Math.max(0, leanTimer - dt);
    const targetLean = leanTimer > 0 ? leanTarget : 0;
    leanAngle += (targetLean - leanAngle) * Math.min(1, LEAN_LERP * dt);
    carVisual.rotation.x = leanAngle;

    // ── wheel spin (no-op with GLB, but kept for particle compat) ─────────────────────
    wheelAngle -= CONST_SPEED * speedMult * dt / wR_;
    wheelMeshes.forEach(w => w.rotation.y = wheelAngle);

    // ── particles ────────────────────────────────────────────────────────────────────
    particleTimer += dt;
    if(particleTimer > 0.055){
      particleTimer = 0;
      spawnEffects(carGroup.position.x, carGroup.position.z, dirX, dirZ, CONST_SPEED * speedMult);
    }
    updateParticles(dt);

    // ── camera tilt: follow lean direction, much more subtle ─────────────────────────
    camTilt += (-leanAngle * (MAX_CAM_TILT / MAX_LEAN) - camTilt) * Math.min(1, CAM_TILT_LERP * dt);

    // ── camera lead (original 32-unit offset) ────────────────────────────────────────
    targetCameraLead.set(-dirX*32, 0, -dirZ*32);
    cameraLead.lerp(targetCameraLead, 1-Math.exp(-2.4*dt));
    setTopCamera(carGroup.position.x, carGroup.position.z, camTilt);

    // ── diamonds: always update so pop animation finishes through game-over ──────────
    updateDiamonds(dt, carGroup.position.x, carGroup.position.z);

    // ── enemies: always update so they keep driving after game-over ──────────────────
    const enemyHit = updateEnemies(dt, carGroup.position.x, carGroup.position.z);

    // ── win / lose (PLAYING only) ─────────────────────────────────────────────────────
    if(_gState===GameState.PLAYING){
      if(totalCount>0 && collectedCount>=totalCount) winRound();
      if(enemyHit) loseRound();
    }

    // ── timer + HUD (PLAYING only) ────────────────────────────────────────────────────
    if(_gState===GameState.PLAYING){
      updateState(dt);
      const dirArrow = dirX>0?'→':dirX<0?'←':dirZ<0?'↑':'↓';
      updateHUD(dirArrow);
      updateMinimap(carGroup.position.x, carGroup.position.z);
    }

    // ── game over check ───────────────────────────────────────────────────────────────
    if(gameState===GameState.GAME_OVER && !wasGameOver){
      wasGameOver = true;
      showGameOver(won, collectedCount, totalCount);
    }
    if(gameState!==GameState.GAME_OVER) wasGameOver = false;

  }else if(!_gameOn){
    cameraLead.lerp(ZERO_CAMERA_LEAD, 1-Math.exp(-2.4*dt));
    setTopCamera(sx, sz);
  }

  composer.render();
}

tick();
