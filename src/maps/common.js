import { TILE, T } from '../constants.js';

// ── live map dimensions — updated by initMap() ───────────────────────────────
export let MAP_W = 80, MAP_H = 80;
export let HALF_W = 40, HALF_H = 40;

// ── map arrays — reallocated by initMap() ────────────────────────────────────
export let tileMap   = new Uint8Array(MAP_W*MAP_H).fill(T.BUILDING);
export let waterMrk  = new Uint8Array(MAP_W*MAP_H);
export let bldgH     = new Uint8Array(MAP_W*MAP_H);
export let bldgStyle = new Uint8Array(MAP_W*MAP_H);
export let bldgW     = new Uint8Array(MAP_W*MAP_H);
export let bldgD     = new Uint8Array(MAP_W*MAP_H);
export let parkShade = new Uint8Array(MAP_W*MAP_H);
export const roadTiles = [];

export function initMap(w, h) {
  MAP_W = w; MAP_H = h; HALF_W = w >> 1; HALF_H = h >> 1;
  tileMap   = new Uint8Array(w*h).fill(T.BUILDING);
  waterMrk  = new Uint8Array(w*h);
  bldgH     = new Uint8Array(w*h);
  bldgStyle = new Uint8Array(w*h);
  bldgW     = new Uint8Array(w*h);
  bldgD     = new Uint8Array(w*h);
  parkShade = new Uint8Array(w*h);
  roadTiles.length = 0;
}

export function resetMap() {
  tileMap.fill(T.BUILDING); waterMrk.fill(0);
  bldgH.fill(0); bldgStyle.fill(0);
  bldgW.fill(0); bldgD.fill(0); parkShade.fill(0);
  roadTiles.length = 0;
}

// ── rng ──────────────────────────────────────────────────────────────────────
let _s = 0xdeadbeef;
export function rngSeed(s) { _s = s >>> 0; }
export function rng() {
  _s = Math.imul(_s^(_s>>>16), 0x45d9f3b);
  _s = Math.imul(_s^(_s>>>16), 0x45d9f3b);
  _s ^= _s>>>16;
  return (_s>>>0)/0xffffffff;
}

// ── helpers ──────────────────────────────────────────────────────────────────
export function mi(x,y) { return y*MAP_W+x; }
export function hash2(x,y) {
  let n = Math.imul(x+101,374761393)^Math.imul(y+211,668265263);
  n = Math.imul(n^(n>>>13),1274126177);
  return ((n^(n>>>16))>>>0)/0xffffffff;
}
export function fillRect(x0,y0,w,h,val,buf=tileMap) {
  for(let dy=0;dy<h;dy++) for(let dx=0;dx<w;dx++){
    const x=x0+dx, y=y0+dy;
    if(x>=0&&x<MAP_W&&y>=0&&y<MAP_H) buf[mi(x,y)]=val;
  }
}

// ── coordinate helpers ───────────────────────────────────────────────────────
export function tileCenter(tx,ty) { return {x:(tx-HALF_W+0.5)*TILE, z:(ty-HALF_H+0.5)*TILE}; }
export function tileCenterX(wx) { return (Math.floor(wx/TILE+HALF_W)-HALF_W+0.5)*TILE; }
export function tileCenterZ(wz) { return (Math.floor(wz/TILE+HALF_H)-HALF_H+0.5)*TILE; }
export function tileAt(wx,wz) {
  const tx=Math.floor(wx/TILE+HALF_W), ty=Math.floor(wz/TILE+HALF_H);
  if(tx<0||tx>=MAP_W||ty<0||ty>=MAP_H) return T.BUILDING;
  return tileMap[mi(tx,ty)];
}
export function passable(wx,wz) { const t=tileAt(wx,wz); return t===T.ROAD||t===T.BRIDGE; }

// ── connectivity ─────────────────────────────────────────────────────────────
export function pruneOrphanRoads(startTx=HALF_W, startTy=HALF_H) {
  const isRoad = (x,y) => x>=0&&x<MAP_W&&y>=0&&y<MAP_H &&
                          (tileMap[mi(x,y)]===T.ROAD||tileMap[mi(x,y)]===T.BRIDGE);
  const seen = new Uint8Array(MAP_W*MAP_H);
  const q = [];
  if(isRoad(startTx,startTy)) { seen[mi(startTx,startTy)]=1; q.push(startTx,startTy); }
  let h = 0;
  while(h<q.length) {
    const x=q[h++], y=q[h++];
    for(const [nx,ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]])
      if(isRoad(nx,ny)&&!seen[mi(nx,ny)]) { seen[mi(nx,ny)]=1; q.push(nx,ny); }
  }
  roadTiles.length = 0;
  for(let ty=0;ty<MAP_H;ty++) for(let tx=0;tx<MAP_W;tx++) {
    const id = mi(tx,ty);
    if(tileMap[id]!==T.ROAD&&tileMap[id]!==T.BRIDGE) continue;
    if(seen[id]) roadTiles.push({tx,ty});
    else { tileMap[id]=T.BUILDING; waterMrk[id]=0; }
  }
}
