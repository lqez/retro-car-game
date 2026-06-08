import { scene, renderer, camera, composer,
         setTopCamera, cameraPosLead, targetCameraPosLead,
         cameraLookLead, targetCameraLookLead, ZERO_CAMERA_LEAD,
         sx, sz } from './scene.js';
import { carGroup, carVisual, wheelMeshes, wR_, spawnEffects, updateParticles,
         startCrash, updateCrash, isCrashing } from './car.js';
import { keys, joyActive, joyDX, joyDY, joyVisible,
         rawBeta, rawGamma, baseBeta, baseGamma,
         calibrate, sensorOk, consumeGasRequest } from './input.js';
import { useGas, updateGas } from './gas.js';
import { dirX, dirZ, prevDirX, prevDirZ, turnBias, stuckTimer,
         leadingClearForDir, moveWithCollision, targetRotY,
         setDir, setPrevDir, setTurnBias, setStuckTimer, setTargetRotY } from './physics.js';
import { GameState, gameState, updateState, winRound, loseRound, won, GAME_DURATION, timeLeft } from './state.js';
import { gameOn, updateHUD, updateMinimap, showGameOver, initUI, startGame } from './ui.js';
import { updateDiamonds, collectedCount, totalCount } from './diamonds.js';
import { updateEnemies } from './enemies.js';
import { HALF_W, HALF_H, tileMap, mi } from './map.js';
import { tileProps } from './tiles.js';
import { CONST_SPEED, TILE, ROT_SPEED,
         MAX_LEAN, LEAN_HOLD, LEAN_LERP, MAX_CAM_TILT, CAM_TILT_LERP,
         BUMP_AMP, BUMP_SIDE,
         BUMP_ROLL_CHANCE, BUMP_ROLL_KICK, BUMP_ROLL_DECAY,
         PARTICLE_INTERVAL,
         CAMERA_POS_LEAD_DIST, CAMERA_POS_LEAD_LERP,
         CAMERA_LOOK_LEAD_DIST, CAMERA_LOOK_LEAD_LERP,
         CAMERA_FOLLOW_LERP } from './constants.js';
import { activeCharacter } from './characters.js';

// ─── init ─────────────────────────────────────────────────────────────────────────────
initUI();

// ─── game loop state ─────────────────────────────────────────────────────────────────
let particleTimer = 0;
let wheelAngle    = 0;
let last          = performance.now();
let wasGameOver   = false;

// ── driving feel (tunables in constants.js) ───────────────────────────────────────────
let bumpT      = 0;
let leanAngle  = 0;
let leanTarget = 0;
let leanTimer  = 0;
let roughSide  = 0;
let roughRoll  = 0;
let camTilt    = 0;
let camTiltTarget = 0;
let camTiltTimer  = 0;
let snapDirX   = 0, snapDirZ = -1;  // last committed direction, for turn detection
let camFocusX  = 0, camFocusZ = 0;  // smoothed camera target (lags the car slightly)
let prevGameOn = false;

function angleDiff(target, current){
  let diff = target - current;
  while(diff > Math.PI)  diff -= Math.PI * 2;
  while(diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

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

    // snap the camera onto the car at the start of a round (no initial glide)
    if(!prevGameOn){
      camFocusX = carGroup.position.x; camFocusZ = carGroup.position.z;
      roughSide = 0;
      roughRoll = 0;
    }

    // ── terrain detection ─────────────────────────────────────────────────────────────
    const ctX      = Math.round(carGroup.position.x / TILE + HALF_W);
    const ctZ      = Math.round(carGroup.position.z / TILE + HALF_H);
    const terrain = tileProps(tileMap[mi(ctX, ctZ)]);
    const speedMult = terrain.speedMul * (activeCharacter.speedMul ?? 1.0);
    const turnRotMul = Math.max(0.01, activeCharacter.rotMul ?? 1.0);
    const eDt       = dt * speedMult;   // terrain- and character-adjusted frame step
    const moveStep  = CONST_SPEED * eDt;

    // gas: drain the request every frame (avoids carry-over past game-over),
    // but only drop a cloud while actively playing
    const gasReq = consumeGasRequest();

    // ── player steers (PLAYING only) ─────────────────────────────────────────────────
    if(_gState===GameState.PLAYING){
      if(gasReq) useGas(carGroup.position.x, carGroup.position.z);

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
        const wnx=carGroup.position.x+wantX*moveStep;
        const wnz=carGroup.position.z+wantZ*moveStep;
        if(leadingClearForDir(wnx,wnz,wantX,wantZ)){
          setPrevDir(dirX,dirZ);
          setDir(wantX,wantZ);
          setStuckTimer(0);
        }
      }
    }

    // ── crash death takes over the car after an enemy hit; the wreck then stays put ────
    // After a win the car keeps cruising (auto-drives) instead of freezing.
    if(isCrashing()){
      updateCrash(dt);
    } else if(_gState===GameState.PLAYING || won){

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
        const tnx=carGroup.position.x+tx*moveStep;
        const tnz=carGroup.position.z+tz*moveStep;
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

    const nextTargetRotY = Math.atan2(-dirZ, dirX);

    // ── detect turn for lean (check after any direction change) ─────────────────────
    if(dirX !== snapDirX || dirZ !== snapDirZ){
      const turnDiff = angleDiff(nextTargetRotY, carGroup.rotation.y);
      if(Math.abs(turnDiff) > 0.001){
        const turnSign = Math.sign(turnDiff);
        leanTarget = turnSign * (MAX_LEAN / turnRotMul);
        leanTimer = LEAN_HOLD / turnRotMul;
        camTiltTarget = -turnSign * MAX_CAM_TILT;
        camTiltTimer = LEAN_HOLD;
      }
      snapDirX = dirX; snapDirZ = dirZ;
    }

    // ── visual rotation toward current direction ───────────────────────────────────────
    setTargetRotY(nextTargetRotY);
    const diff = angleDiff(targetRotY, carGroup.rotation.y);
    carGroup.rotation.y+=Math.sign(diff)*Math.min(Math.abs(diff), ROT_SPEED*turnRotMul*dt);

    // ── bump: rough road / stronger on bridge ─────────────────────────────────────────
    bumpT += CONST_SPEED * speedMult * terrain.bumpFreqMul * dt;
    const bumpAmp = BUMP_AMP * terrain.bumpAmpMul;
    const sideAmp = BUMP_SIDE * terrain.bumpSideMul;
    const rollChance = BUMP_ROLL_CHANCE * terrain.bumpRollChanceMul;
    const rollKick = BUMP_ROLL_KICK * terrain.bumpRollKickMul;
    const bump = Math.sin(bumpT * 0.042) * 0.50
               + Math.sin(bumpT * 0.110) * 0.35
               + Math.sin(bumpT * 0.270) * 0.15;
    if(Math.random() < rollChance * dt * speedMult){
      const sign = Math.random() < 0.5 ? -1 : 1;
      roughSide += sign * sideAmp * (0.45 + Math.random() * 0.75);
      roughRoll += sign * rollKick * (0.65 + Math.random() * 0.7);
    }
    roughSide += (0 - roughSide) * Math.min(1, BUMP_ROLL_DECAY * dt);
    roughRoll += (0 - roughRoll) * Math.min(1, BUMP_ROLL_DECAY * dt);
    carVisual.position.y = bump * bumpAmp;
    carVisual.position.z = roughSide;

    // ── lean: bank into turns ─────────────────────────────────────────────────────────
    leanTimer = Math.max(0, leanTimer - dt);
    const targetLean = leanTimer > 0 ? leanTarget : 0;
    leanAngle += (targetLean - leanAngle) * Math.min(1, LEAN_LERP * turnRotMul * dt);
    carVisual.rotation.x = leanAngle + roughRoll;

    // ── wheel spin (no-op with GLB, but kept for particle compat) ─────────────────────
    wheelAngle -= CONST_SPEED * speedMult * dt / wR_;
    wheelMeshes.forEach(w => w.rotation.y = wheelAngle);

    // ── particles ────────────────────────────────────────────────────────────────────
    particleTimer += dt;
    if(particleTimer > PARTICLE_INTERVAL){
      particleTimer = 0;
      spawnEffects(carGroup.position.x, carGroup.position.z, dirX, dirZ, CONST_SPEED * speedMult);
    }

    }  // end PLAYING driving block (skipped while crashing / after game over)

    updateParticles(dt);
    updateGas(dt);

    // ── camera tilt: same turn direction as lean, but independent from rotMul ────────
    camTiltTimer = Math.max(0, camTiltTimer - dt);
    const targetCamTilt = camTiltTimer > 0 ? camTiltTarget : 0;
    camTilt += (targetCamTilt - camTilt) * Math.min(1, CAM_TILT_LERP * dt);

    // ── camera follow: ease toward the car while playing (and on the win cruise);
    //    freeze in place on crash / timeout ─────────────────────────────────────────────
    if(_gState===GameState.PLAYING || won){
      const f = 1 - Math.exp(-CAMERA_FOLLOW_LERP*dt);
      camFocusX += (carGroup.position.x - camFocusX) * f;
      camFocusZ += (carGroup.position.z - camFocusZ) * f;
    }
    targetCameraPosLead.set(dirX*CAMERA_POS_LEAD_DIST, 0, dirZ*CAMERA_POS_LEAD_DIST);
    cameraPosLead.lerp(targetCameraPosLead, 1-Math.exp(-CAMERA_POS_LEAD_LERP*dt));
    targetCameraLookLead.set(dirX*CAMERA_LOOK_LEAD_DIST, 0, dirZ*CAMERA_LOOK_LEAD_DIST);
    cameraLookLead.lerp(targetCameraLookLead, 1-Math.exp(-CAMERA_LOOK_LEAD_LERP*dt));
    setTopCamera(camFocusX, camFocusZ, camTilt);

    // ── diamonds: animate after game-over, but only collect while actively playing ───
    updateDiamonds(dt, carGroup.position.x, carGroup.position.z, _gState===GameState.PLAYING && !isCrashing());

    // ── enemies: always update so they keep driving after game-over ──────────────────
    const enemyHit = updateEnemies(dt, carGroup.position.x, carGroup.position.z, _gState===GameState.PLAYING);

    // ── win / lose (PLAYING only) ─────────────────────────────────────────────────────
    if(_gState===GameState.PLAYING){
      if(totalCount>0 && collectedCount>=totalCount) winRound();
      if(enemyHit){ loseRound(); startCrash(dirX, dirZ); }
    }

    // ── timer + HUD (PLAYING only) ────────────────────────────────────────────────────
    if(_gState===GameState.PLAYING){
      updateState(dt);
      const dirArrow = dirX>0?'→':dirX<0?'←':dirZ<0?'↑':'↓';
      updateHUD(dirArrow, speedMult);
      updateMinimap(carGroup.position.x, carGroup.position.z);
    }

    // ── game over check (wait for the crash to land before showing the screen) ─────────
    if(gameState===GameState.GAME_OVER && !wasGameOver && !isCrashing()){
      wasGameOver = true;
      showGameOver(won, collectedCount, totalCount);
    }
    if(gameState!==GameState.GAME_OVER) wasGameOver = false;

  }else if(!_gameOn){
    cameraPosLead.lerp(ZERO_CAMERA_LEAD, 1-Math.exp(-CAMERA_POS_LEAD_LERP*dt));
    cameraLookLead.lerp(ZERO_CAMERA_LEAD, 1-Math.exp(-CAMERA_LOOK_LEAD_LERP*dt));
    setTopCamera(sx, sz);
  }

  prevGameOn = _gameOn;
  composer.render();
}

tick();
