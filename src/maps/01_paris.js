import { T } from '../constants.js';
import { MAP_W, MAP_H, HALF_W, HALF_H,
         tileMap, waterMrk, bldgH, bldgStyle, bldgW, bldgD, parkShade,
         initMap, mi, hash2, pruneOrphanRoads } from './common.js';

export const mapW = 80, mapH = 80;
export const hasLandmarks = true;

export function build() {
  initMap(mapW, mapH);

  // Seine river — horizontal band through center
  for(let y=44;y<=46;y++) for(let x=0;x<MAP_W;x++){
    tileMap[mi(x,y)]=T.WATER; waterMrk[mi(x,y)]=1;
  }

  function road(x,y){
    if(x<0||x>=MAP_W||y<0||y>=MAP_H) return;
    tileMap[mi(x,y)]=T.ROAD;
  }

  // Major E-W boulevards (2-wide)
  const ewBoulevards=[[6,7],[14,15],[22,23],[32,33],[40,41],[50,51],[58,59],[66,67],[74,75]];
  for(const [y0,y1] of ewBoulevards)
    for(let y=y0;y<=y1;y++) for(let x=0;x<MAP_W;x++) road(x,y);

  // Major N-S avenues (2-wide)
  const nsAvenues=[[6,7],[14,15],[22,23],[32,33],[40,41],[50,51],[60,61],[70,71]];
  for(const [x0,x1] of nsAvenues)
    for(let x=x0;x<=x1;x++) for(let y=0;y<MAP_H;y++) road(x,y);

  // Small 1-wide cross streets
  const smallY=[10,18,27,36,43,54,62,70];
  const smallX=[10,18,27,36,46,55,65,75];
  for(const y of smallY) for(let x=0;x<MAP_W;x++) road(x,y);
  for(const x of smallX) for(let y=0;y<MAP_H;y++) road(x,y);

  // Arc de Triomphe roundabout plaza (x=33-42, y=27-35)
  for(let y=27;y<=35;y++) for(let x=33;x<=42;x++) road(x,y);
  // Monument center (4×4) — reset to BUILDING before pruneOrphanRoads
  for(let y=29;y<=32;y++) for(let x=37;x<=40;x++) tileMap[mi(x,y)]=T.BUILDING;

  // Eiffel Tower early: non-corner interior tiles → ROAD (before pruneOrphanRoads)
  for(let y=52;y<=59;y++) for(let x=8;x<=15;x++){
    const isCorner=(x<=9||x>=14)&&(y<=53||y>=58);
    if(!isCorner) road(x,y);
  }

  // Convert road-over-water to bridge
  for(let i=0;i<MAP_W*MAP_H;i++)
    if(tileMap[i]===T.ROAD&&waterMrk[i]) tileMap[i]=T.BRIDGE;

  pruneOrphanRoads();

  // Parks — only overwrite BUILDING tiles
  function park(x0,y0,x1,y1){
    const shade=(hash2(x0,y0)*6)|0;
    for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
      if(x<0||x>=MAP_W||y<0||y>=MAP_H) continue;
      const id=mi(x,y);
      if(tileMap[id]===T.BUILDING){ tileMap[id]=T.PARK; parkShade[id]=shade; }
    }
  }

  park(1,6,5,70);       // Bois de Boulogne
  park(40,34,52,42);    // Tuileries Garden
  park(36,56,48,68);    // Luxembourg Gardens
  park(8,52,18,70);     // Champ de Mars
  park(26,6,34,14);     // Parc Monceau
  park(62,4,72,14);     // Parc de la Villette
  park(60,62,72,72);    // Parc de Bercy
  park(56,16,66,28);    // Buttes-Chaumont
  park(48,44,56,54);    // Jardin des Plantes
  park(30,40,33,43);
  park(54,26,57,29);
  park(44,60,47,63);

  for(let ty=0;ty<MAP_H;ty++) for(let tx=0;tx<MAP_W;tx++){
    const id=mi(tx,ty);
    if(tileMap[id]===T.PARK&&parkShade[id]===0)
      parkShade[id]=(hash2(Math.floor(tx/4),Math.floor(ty/4)*17)*6)|0;
  }

  // Landmark tile reservations (post-park; bldgW=255 blocks greedy tiler)
  function lmk(x0,y0,w,h){
    for(let dy=0;dy<h;dy++) for(let dx=0;dx<w;dx++){
      const x=x0+dx, y=y0+dy;
      if(x<0||x>=MAP_W||y<0||y>=MAP_H) continue;
      const id=mi(x,y);
      tileMap[id]=T.BUILDING; bldgW[id]=255;
    }
  }
  lmk(37,29,4,4);                                       // Arc de Triomphe (cx=-12,  cz=-108)
  lmk(8,52,2,2); lmk(14,52,2,2); lmk(8,58,2,2); lmk(14,58,2,2); // Eiffel corners (cx=-336,cz=192)
  lmk(42,43,4,3);                                       // Notre-Dame      (cx=48,   cz=54)
  lmk(22,2,3,4);                                        // Sacré-Cœur      (cx=-198, cz=-432)
  lmk(42,34,4,4);                                       // Louvre          (cx=48,   cz=-48)
  lmk(44,16,4,4);                                       // Opéra Garnier   (cx=72,   cz=-264)
  lmk(18,54,4,4);                                       // Les Invalides   (cx=-240, cz=192)
  lmk(54,34,3,3);                                       // Pompidou        (cx=186,  cz=-54)
  lmk(44,54,3,4);                                       // Panthéon        (cx=66,   cz=192)
  lmk(24,9,3,3);                                        // Moulin Rouge    (cx=-174, cz=-354)

  // Greedy rectangle tiling for buildings
  const free=(x,y)=> x>=0&&y>=0&&x<MAP_W&&y<MAP_H&&
                     tileMap[mi(x,y)]===T.BUILDING&&bldgW[mi(x,y)]===0;
  function claim(bx,by){
    if(!free(bx,by)) return;
    const MAXW=3+Math.floor(hash2(bx*7+1,by*3+2)*5);
    const MAXD=3+Math.floor(hash2(bx*3+5,by*7+9)*4);
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

  // Height + style — Haussmann, mostly low
  for(let ty=0;ty<MAP_H;ty++) for(let tx=0;tx<MAP_W;tx++){
    const id=mi(tx,ty);
    if(tileMap[id]!==T.BUILDING||bldgW[id]===255) continue;
    if(bldgW[id]===0){bldgW[id]=1; bldgD[id]=1;}
    const big=bldgW[id]>1||bldgD[id]>1;
    const hn=hash2(tx,ty), hd=hash2(Math.floor(tx/8)*8, Math.floor(ty/8)*8);
    bldgH[id]=Math.max(2,Math.min(14,Math.round(3+hd*4+hn*2+(big?2:0))));
    bldgStyle[id]=(Math.floor(tx/8)+Math.floor(ty/8)*3)%6;
  }
}
