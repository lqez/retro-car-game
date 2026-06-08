import { T } from '../constants.js';
import { MAP_W, MAP_H, HALF_W, HALF_H,
         tileMap, waterMrk, bldgH, bldgStyle, bldgW, bldgD, parkShade,
         initMap, mi, hash2, pruneOrphanRoads } from '../map.js';

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

  // ── MAJOR E-W BOULEVARDS (2-wide) ─────────────────────────────────────────
  // Haussmann-style long straight boulevards, spacing reflects arrondissement bands
  const ewBoulevards=[[6,7],[14,15],[22,23],[32,33],[40,41],[50,51],[58,59],[66,67],[74,75]];
  for(const [y0,y1] of ewBoulevards)
    for(let y=y0;y<=y1;y++) for(let x=0;x<MAP_W;x++) road(x,y);

  // ── MAJOR N-S AVENUES (2-wide) ────────────────────────────────────────────
  // Shifted so avenues fall between landmark zones rather than through them.
  // x=6-7: western edge (Bois de Boulogne perimeter)
  // x=16-17: between Eiffel zone (x=8-13) and Invalides/Sacré-Cœur zones
  // x=24-25: right of Sacré-Cœur zone (x=17-21)
  // x=32-33, 40-41: central (Arc de Triomphe, Champs-Élysées axis)
  // x=50-51, 60-61, 70-71: right bank grid
  const nsAvenues=[[6,7],[16,17],[24,25],[32,33],[40,41],[50,51],[60,61],[70,71]];
  for(const [x0,x1] of nsAvenues)
    for(let x=x0;x<=x1;x++) for(let y=0;y<MAP_H;y++) road(x,y);

  // ── SMALL 1-WIDE CROSS STREETS ────────────────────────────────────────────
  // Positions chosen to avoid running through landmark tile zones.
  const smallY=[12,20,27,38,42,62,70];
  const smallX=[10,22,29,36,48,57,65,75];
  for(const y of smallY) for(let x=0;x<MAP_W;x++) road(x,y);
  for(const x of smallX) for(let y=0;y<MAP_H;y++) road(x,y);

  // ── ARC DE TRIOMPHE ROUNDABOUT (Place de l'Étoile) ────────────────────────
  // 9×9 plaza; monument center reset to BUILDING later
  for(let y=27;y<=35;y++) for(let x=33;x<=42;x++) road(x,y);
  for(let y=29;y<=32;y++) for(let x=37;x<=40;x++) tileMap[mi(x,y)]=T.BUILDING;

  // ── RADIATING AVENUES FROM PLACE DE L'ÉTOILE ──────────────────────────────
  // Real Étoile has 12 avenues. We add the 4 diagonal spokes that don't conflict
  // with existing landmark zones.

  // Avenue de Wagram — NW diagonal (Arc → top-left toward Parc Monceau)
  for(let i=1;i<=5;i++){ road(32-i, 27-i); road(31-i, 27-i); }
  // Avenue Haussmann / de Friedland — NE diagonal (Arc → Opéra / right bank)
  for(let i=1;i<=4;i++){ road(43+i, 27-i); road(44+i, 27-i); }
  // Avenue Kléber / Iéna — SW diagonal (Arc → Trocadéro / Eiffel Tower quarter)
  for(let i=1;i<=5;i++){ road(32-i, 36+i); road(31-i, 36+i); }

  // ── CHAMPS-ÉLYSÉES WIDE AXIS ──────────────────────────────────────────────
  // Make the E-W boulevard at y=32-33 three tiles wide between Arc (x=42) and
  // Place de la Concorde area (x=50), reflecting the grand 70 m boulevard.
  for(let x=42;x<=52;x++) road(x,31);

  // ── BOULEVARD SAINT-GERMAIN / LEFT BANK RING ─────────────────────────────
  // Curved boulevard on the left bank (south of Seine).
  // Simulated as a diagonal dog-leg from the western left bank to the east.
  for(let i=0;i<=4;i++){ road(28+i, 48+i); road(29+i, 48+i); } // SW segment
  for(let x=33;x<=44;x++){ road(x,53); }                        // E segment

  // ── EIFFEL TOWER — passable footprint (drive under the arches) ─────────────
  // 8×8 zone (x=8-15, y=52-59), centre at the tile vertex (12,56) → world
  // (cx=-336, cz=192). The four corner legs (2×2 blocks) stay impassable; the
  // rest of the zone becomes a wide crossroads so cars pass beneath the tower,
  // just like before. The interior connects to the x=10 cross-street, the
  // y=58-59 boulevard and the x=16-17 avenue, so it survives orphan pruning.
  for(let y=52;y<=59;y++) for(let x=8;x<=15;x++){
    const corner=(x<=9||x>=14)&&(y<=53||y>=58);
    if(!corner) road(x,y);
  }

  // Convert road-over-water to bridge
  for(let i=0;i<MAP_W*MAP_H;i++)
    if(tileMap[i]===T.ROAD&&waterMrk[i]) tileMap[i]=T.BRIDGE;

  pruneOrphanRoads();

  // ── PARKS ─────────────────────────────────────────────────────────────────
  function park(x0,y0,x1,y1){
    const shade=(hash2(x0,y0)*6)|0;
    for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
      if(x<0||x>=MAP_W||y<0||y>=MAP_H) continue;
      const id=mi(x,y);
      if(tileMap[id]===T.BUILDING){ tileMap[id]=T.PARK; parkShade[id]=shade; }
    }
  }

  park(1,6,5,70);        // Bois de Boulogne
  park(40,34,52,42);     // Tuileries Garden
  park(36,56,48,68);     // Luxembourg Gardens
  park(8,52,15,70);      // Champ de Mars (surrounds Eiffel Tower)
  park(26,6,34,14);      // Parc Monceau
  park(62,4,72,14);      // Parc de la Villette
  park(60,62,72,72);     // Parc de Bercy
  park(56,16,66,28);     // Buttes-Chaumont
  park(48,44,56,54);     // Jardin des Plantes
  park(30,40,33,43);
  park(54,26,57,29);
  park(44,60,47,63);

  for(let ty=0;ty<MAP_H;ty++) for(let tx=0;tx<MAP_W;tx++){
    const id=mi(tx,ty);
    if(tileMap[id]===T.PARK&&parkShade[id]===0)
      parkShade[id]=(hash2(Math.floor(tx/4),Math.floor(ty/4)*17)*6)|0;
  }

  // ── LANDMARK TILE RESERVATIONS ─────────────────────────────────────────────
  // bldgW=255 blocks the greedy tiler; tiles become fully impassable BUILDING.
  // ROAD/BRIDGE/WATER tiles inside a zone are skipped (kept as roads).
  function lmk(x0,y0,w,h){
    for(let dy=0;dy<h;dy++) for(let dx=0;dx<w;dx++){
      const x=x0+dx, y=y0+dy;
      if(x<0||x>=MAP_W||y<0||y>=MAP_H) continue;
      const id=mi(x,y);
      if(tileMap[id]===T.ROAD||tileMap[id]===T.BRIDGE||tileMap[id]===T.WATER) continue;
      tileMap[id]=T.BUILDING; bldgW[id]=255;
    }
  }

  // Eiffel Tower — four corner legs (2×2 each); interior is the crossroads.
  // lmk() skips ROAD tiles so the bottom legs (on the y=58-59 boulevard) need
  // an explicit override after lmk() to become truly impassable.  (cx=-336, cz=192)
  lmk(8,52,2,2); lmk(14,52,2,2); lmk(8,58,2,2); lmk(14,58,2,2);
  // Force all four 2×2 leg blocks to BUILDING+255 regardless of road status
  for (const [x0,y0] of [[8,52],[14,52],[8,58],[14,58]])
    for (let dy=0;dy<2;dy++) for (let dx=0;dx<2;dx++) {
      const id=mi(x0+dx,y0+dy); tileMap[id]=T.BUILDING; bldgW[id]=255;
    }

  lmk(37,29,4,4);                                        // Arc de Triomphe  (cx=-12,  cz=-108)
  lmk(42,43,4,3);                                        // Notre-Dame        (cx=48,   cz=54)

  // Sacré-Cœur — moved to x=17-21 to avoid the x=[16,17] avenue cutting through
  // (cx=-246, cz=-432 — slightly west of old position)
  lmk(17,2,5,4);

  lmk(42,34,4,4);                                        // Louvre            (cx=48,   cz=-48)
  lmk(44,16,4,4);                                        // Opéra Garnier     (cx=72,   cz=-264)
  lmk(18,54,4,4);                                        // Les Invalides     (cx=-240, cz=192)
  lmk(54,34,3,3);                                        // Pompidou          (cx=186,  cz=-54)
  lmk(44,54,3,4);                                        // Panthéon          (cx=66,   cz=192)
  lmk(26,9,3,3);                                         // Moulin Rouge      (cx=-162, cz=-354)

  // ── GREEDY RECTANGLE TILING for regular buildings ─────────────────────────
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

  // ── HEIGHT + STYLE — Haussmann-era: mostly low stone-coloured blocks ───────
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
