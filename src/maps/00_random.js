import { T } from '../constants.js';
import { MAP_W, MAP_H, HALF_W, HALF_H,
         tileMap, waterMrk, bldgH, bldgStyle, bldgW, bldgD, parkShade,
         initMap, rngSeed, rng, mi, hash2, fillRect, pruneOrphanRoads } from '../map.js';

const MIN_MAP_SIZE = 48;
const MAX_MAP_SIZE = 72;
const MAP_SIZE_STEP = 4;
const THEMES = ['day', 'night'];

export let mapW = 64, mapH = 64;
export const hasLandmarks = false;
export let theme = 'day';
export let gameplay = Object.freeze({
  enemyCount: 10,
  diamondCount: 10,
  timeLimit: 75,
});

function randomMapSize() {
  const steps = ((MAX_MAP_SIZE - MIN_MAP_SIZE) / MAP_SIZE_STEP) + 1;
  return MIN_MAP_SIZE + Math.floor(Math.random() * steps) * MAP_SIZE_STEP;
}

function gameplayForSize(size) {
  const t = (size - MIN_MAP_SIZE) / (MAX_MAP_SIZE - MIN_MAP_SIZE);
  return Object.freeze({
    enemyCount: Math.round(6 + t * 8),
    diamondCount: Math.round(6 + t * 9),
    timeLimit: Math.round(40 + t * 70),
  });
}

export function build() {
  mapW = randomMapSize();
  mapH = mapW;
  theme = THEMES[Math.floor(Math.random() * THEMES.length)];
  gameplay = gameplayForSize(mapW);

  initMap(mapW, mapH);
  rngSeed((Date.now() ^ (Math.random() * 0xffffffff)) >>> 0);

  const RW = MAP_W - 4, RH = MAP_H - 4;
  const OX = (MAP_W-RW) >> 1, OY = (MAP_H-RH) >> 1;

  // Water channels
  for(let i=0;i<5;i++){
    if(rng()<0.5){
      const wy=OY+2+Math.floor(rng()*(RH-4)), ww=2+Math.floor(rng()*3);
      fillRect(OX,wy,RW,ww,T.WATER); fillRect(OX,wy,RW,ww,1,waterMrk);
    }else{
      const wx=OX+2+Math.floor(rng()*(RW-4)), ww=2+Math.floor(rng()*3);
      fillRect(wx,OY,ww,RH,T.WATER); fillRect(wx,OY,ww,RH,1,waterMrk);
    }
  }

  // Horizontal roads
  for(let y=OY+4;y<OY+RH-4;){
    const w=[1,1,2,2,3,4][Math.floor(rng()*6)];
    fillRect(OX,y,RW,w,T.ROAD);
    y+=w+7+Math.floor(rng()*11);
  }
  // Vertical roads
  for(let x=OX+4;x<OX+RW-4;){
    const w=[1,1,2,2,3,4][Math.floor(rng()*6)];
    fillRect(x,OY,w,RH,T.ROAD);
    x+=w+7+Math.floor(rng()*11);
  }
  // Forced central cross (ensures spawn is always on a road)
  fillRect(HALF_W-1,OY,3,RH,T.ROAD);
  fillRect(OX,HALF_H-1,RW,3,T.ROAD);

  // Fill-in strokes
  for(let i=0;i<45;i++){
    const horizontal=rng()<0.5, len=4+Math.floor(rng()*8), w=1+Math.floor(rng()*2);
    const x=OX+3+Math.floor(rng()*(RW-6)), y=OY+3+Math.floor(rng()*(RH-6));
    if(Math.abs(x-HALF_W)<4&&Math.abs(y-HALF_H)<4) continue;
    if(horizontal) fillRect(x,y,Math.min(len,OX+RW-x-2),w,T.BUILDING);
    else fillRect(x,y,w,Math.min(len,OY+RH-y-2),T.BUILDING);
  }
  for(let i=0;i<55;i++){
    const horizontal=rng()<0.5, len=8+Math.floor(rng()*16), w=1+Math.floor(rng()*2);
    const x=OX+2+Math.floor(rng()*(RW-4)), y=OY+2+Math.floor(rng()*(RH-4));
    if(horizontal) fillRect(x,y,Math.min(len,OX+RW-x-1),w,T.ROAD);
    else fillRect(x,y,w,Math.min(len,OY+RH-y-1),T.ROAD);
  }

  // Re-assert central cross
  fillRect(HALF_W-1,OY,3,RH,T.ROAD);
  fillRect(OX,HALF_H-1,RW,3,T.ROAD);

  // Road-over-water → bridge
  for(let i=0;i<MAP_W*MAP_H;i++)
    if(tileMap[i]===T.ROAD&&waterMrk[i]) tileMap[i]=T.BRIDGE;

  pruneOrphanRoads();

  // Large solid parks
  for(let i=0;i<14;i++){
    const px=OX+4+Math.floor(rng()*(RW-16)), py=OY+4+Math.floor(rng()*(RH-16));
    const pw=4+Math.floor(rng()*9), ph=4+Math.floor(rng()*9);
    let ok=true;
    const shade=Math.floor(rng()*6);
    loop:for(let dy=0;dy<ph;dy++) for(let dx=0;dx<pw;dx++)
      if(tileMap[mi(px+dx,py+dy)]!==T.BUILDING){ok=false;break loop;}
    if(ok){
      for(let dy=0;dy<ph;dy++) for(let dx=0;dx<pw;dx++){
        const id=mi(px+dx,py+dy);
        tileMap[id]=T.PARK; parkShade[id]=shade;
      }
    }
  }

  // Scattered greenery
  for(let ty=OY;ty<OY+RH;ty++) for(let tx=OX;tx<OX+RW;tx++){
    const id=mi(tx,ty);
    if(tileMap[id]!==T.BUILDING) continue;
    const dX=Math.floor(tx/16), dY=Math.floor(ty/16);
    if(hash2(dX+50,dY+90)<0.6) continue;
    const patch=hash2((tx>>1)+7,(ty>>1)+3)*0.55 + hash2(tx,ty)*0.45;
    if(patch>0.58){ tileMap[id]=T.PARK; parkShade[id]=Math.floor(hash2(tx>>2,ty>>2)*6); }
  }

  // Larger guaranteed parks
  for(let i=0;i<8;i++){
    const px=OX+4+Math.floor(rng()*(RW-22)), py=OY+4+Math.floor(rng()*(RH-22));
    const pw=8+Math.floor(rng()*10), ph=8+Math.floor(rng()*10);
    const shade=Math.floor(rng()*6);
    let ok=true;
    loop:for(let dy=0;dy<ph;dy++) for(let dx=0;dx<pw;dx++)
      if(tileMap[mi(px+dx,py+dy)]!==T.BUILDING){ok=false;break loop;}
    if(ok){
      for(let dy=0;dy<ph;dy++) for(let dx=0;dx<pw;dx++){
        const id=mi(px+dx,py+dy);
        tileMap[id]=T.PARK; parkShade[id]=shade;
      }
    }
  }

  // Greedy rectangle tiling
  const free = (x,y) => x>=0&&y>=0&&x<MAP_W&&y<MAP_H&&
                        tileMap[mi(x,y)]===T.BUILDING&&bldgW[mi(x,y)]===0;
  function claim(bx,by){
    if(!free(bx,by)) return;
    const MAXW=3+Math.floor(rng()*5), MAXD=3+Math.floor(rng()*4);
    let w=0; while(w<MAXW&&free(bx+w,by)) w++;
    let d=1;
    grow:while(d<MAXD){
      for(let dx=0;dx<w;dx++) if(!free(bx+dx,by+d)) break grow;
      d++;
    }
    bldgW[mi(bx,by)]=w; bldgD[mi(bx,by)]=d;
    for(let dy=0;dy<d;dy++) for(let dx=0;dx<w;dx++)
      if(dx!==0||dy!==0) bldgW[mi(bx+dx,by+dy)]=255;
  }
  for(let ty=0;ty<MAP_H;ty++) for(let tx=0;tx<MAP_W;tx++) claim(tx,ty);

  // Height + style
  for(let ty=0;ty<MAP_H;ty++) for(let tx=0;tx<MAP_W;tx++){
    const id=mi(tx,ty);
    if(tileMap[id]!==T.BUILDING||bldgW[id]===255) continue;
    if(bldgW[id]===0){bldgW[id]=1; bldgD[id]=1;}
    const fx=(tx-HALF_W)/HALF_W, fy=(ty-HALF_H)/HALF_H;
    const center=Math.max(0,1-Math.hypot(fx,fy));
    const dn4=hash2(Math.floor(tx/8),Math.floor(ty/8));
    const dn=dn4*dn4*dn4*dn4;
    const big=bldgW[id]>1||bldgD[id]>1;
    const area=bldgW[id]*bldgD[id];
    bldgH[id]=Math.max(1,Math.min(18,Math.round(1+center*3+dn*14+hash2(tx,ty)*hash2(tx,ty)*5+(big?Math.min(area,16)*0.4:0))));
    bldgStyle[id]=(Math.floor(tx/8)*2+Math.floor(ty/8)*3+Math.floor(hash2(Math.floor(tx/8),Math.floor(ty/8))*3))%6;
  }
}
