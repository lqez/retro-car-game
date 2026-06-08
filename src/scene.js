import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }     from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass }     from 'three/addons/postprocessing/ShaderPass.js';
import { TILE, T, CAM_FOV, CAM_HEIGHT, BARREL_K, FOG_NEAR, FOG_FAR } from './constants.js';
import { MAP_W, MAP_H, HALF_W, HALF_H,
         tileMap, bldgW, bldgD, bldgH, bldgStyle, parkShade,
         mi, hash2, tileCenter, tileCenterX, tileCenterZ } from './map.js';
import { initLandmarks, clearLandmarks, buildLandmarks } from './landmarks.js';

// ─── renderer ────────────────────────────────────────────────────────────────────────────
const canvas   = document.getElementById('c');
export const renderer = new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, FOG_NEAR, FOG_FAR);
initLandmarks(scene);

export const camera = new THREE.PerspectiveCamera(CAM_FOV,1,1,700);
camera.up.set(0,0,-1);

// ─── lighting ─────────────────────────────────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0xffffff, 2.2);
scene.add(ambientLight);
const hemiLight = new THREE.HemisphereLight(0x99ccff, 0x66aa44, 1.2);
scene.add(hemiLight);
const sun = new THREE.DirectionalLight(0xfff0cc, 2.0);
sun.position.set(60,90,50);
sun.castShadow = true;
sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-200,right:200,top:200,bottom:-200,near:1,far:500});
scene.add(sun);

// ─── ground plane — recreated per map in buildScene ──────────────────────────────────────────
let gnd = null;

export const D = new THREE.Object3D();

// ─── module-level mesh refs (set by buildScene) ────────────────────────────────────────────
let mRoad, mBridge, mPark, mWater, mBldgs=[];
let markMeshes=[];
let buildingDetailMeshes=[];
let streetLightMeshes=[];
let streetLightPositions=[];
let streetPointLights=[];
let glowTexture=null;

const STREET_LIGHT_POOL_SIZE = 12;
const STREET_LIGHT_FOCUS_R = TILE*5.2;

const MAP_THEMES = {
  day: {
    sky: 0x87ceeb,
    fog: 0x87ceeb,
    ambient: { color: 0xffffff, intensity: 2.2 },
    hemi: { sky: 0x99ccff, ground: 0x66aa44, intensity: 1.2 },
    sun: { color: 0xfff0cc, intensity: 2.0, position: [60, 90, 50] },
    ground: 0xaa9966,
    road: 0x555566,
    bridge: 0x997755,
    water: 0x3399dd,
    parks: [0x4a7a56,0x3d6b47,0x527a3a,0x466e40,0x3b6650,0x597848],
    buildings: [0xb8afa3,0x9ba7ad,0xa8a18f,0x8fa196,0xb0a4b8,0xaaa48d],
    roof: 0x7f817d,
    roofAlt: 0x626b70,
    windowDark: 0x586f80,
    windowLit: 0xffcf79,
    whiteMark: 0xf7f4e8,
    yellowMark: 0xffd84a,
  },
  night: {
    sky: 0x10183a,
    fog: 0x202641,
    ambient: { color: 0xb4c7ff, intensity: 1.85 },
    hemi: { sky: 0x526bb4, ground: 0x263727, intensity: 1.25 },
    sun: { color: 0xe6eeff, intensity: 1.2, position: [-70, 85, -35] },
    ground: 0x332f42,
    road: 0x42495f,
    bridge: 0x7b6392,
    water: 0x243d7c,
    parks: [0x28623f,0x23553a,0x376232,0x2d5738,0x2a5a4c,0x455f38],
    buildings: [0x626277,0x58667e,0x6b6277,0x5a756f,0x6f5d7e,0x6d6665],
    roof: 0x32384c,
    roofAlt: 0x232838,
    windowDark: 0x16233a,
    windowLit: 0xffd46f,
    whiteMark: 0xecf4ff,
    yellowMark: 0xffcc55,
  },
};

function themeFor(mapModule){
  return MAP_THEMES[mapModule.theme] || MAP_THEMES.day;
}

function applyMapTheme(theme){
  scene.background.setHex(theme.sky);
  scene.fog.color.setHex(theme.fog);
  ambientLight.color.setHex(theme.ambient.color);
  ambientLight.intensity = theme.ambient.intensity;
  hemiLight.color.setHex(theme.hemi.sky);
  hemiLight.groundColor.setHex(theme.hemi.ground);
  hemiLight.intensity = theme.hemi.intensity;
  sun.color.setHex(theme.sun.color);
  sun.intensity = theme.sun.intensity;
  sun.position.set(...theme.sun.position);
}

function streetGlowTexture(){
  if(glowTexture)return glowTexture;
  const c=document.createElement('canvas');
  c.width=c.height=96;
  const ctx=c.getContext('2d');
  const g=ctx.createRadialGradient(48,48,0,48,48,48);
  g.addColorStop(0.00,'rgba(255,232,166,0.92)');
  g.addColorStop(0.28,'rgba(255,190,86,0.34)');
  g.addColorStop(0.68,'rgba(255,154,44,0.10)');
  g.addColorStop(1.00,'rgba(255,154,44,0)');
  ctx.fillStyle=g;
  ctx.fillRect(0,0,96,96);
  glowTexture=new THREE.CanvasTexture(c);
  glowTexture.colorSpace=THREE.SRGBColorSpace;
  return glowTexture;
}

export function updateStreetLightFocus(targets=[]){
  if(streetPointLights.length===0)return;
  if(streetLightPositions.length===0||targets.length===0){
    streetPointLights.forEach(l=>{l.visible=false;});
    return;
  }
  const maxD2=STREET_LIGHT_FOCUS_R*STREET_LIGHT_FOCUS_R;
  const cand=[];
  for(const target of targets){
    if(!target)continue;
    for(let i=0;i<streetLightPositions.length;i++){
      const p=streetLightPositions[i];
      const dx=p.x-target.x, dz=p.z-target.z;
      const d2=dx*dx+dz*dz;
      if(d2<=maxD2)cand.push({i,d2});
    }
  }
  cand.sort((a,b)=>a.d2-b.d2);
  const used=new Set();
  let li=0;
  for(const c of cand){
    if(li>=streetPointLights.length)break;
    if(used.has(c.i))continue;
    used.add(c.i);
    const p=streetLightPositions[c.i], l=streetPointLights[li++];
    l.position.set(p.x,7.2,p.z);
    l.visible=true;
  }
  for(;li<streetPointLights.length;li++)streetPointLights[li].visible=false;
}

// ─── spawn position (exported, mutated by buildScene) ──────────────────────────────────────
export let sx=0, sz=0;

// ─── camera helpers ───────────────────────────────────────────────────────────────────────
const BASE_CAMERA_UP = new THREE.Vector3(0,0,-1);
export const cameraPosLead = new THREE.Vector3();
export const targetCameraPosLead = new THREE.Vector3();
export const cameraLookLead = new THREE.Vector3();
export const targetCameraLookLead = new THREE.Vector3();
export const ZERO_CAMERA_LEAD = new THREE.Vector3();

export function setTopCamera(x, z, upTilt = 0){
  camera.position.set(x+cameraPosLead.x, CAM_HEIGHT, z+cameraPosLead.z);
  // upTilt rotates the camera view around the look axis (subtle turn effect)
  camera.up.set(Math.sin(upTilt), 0, -Math.cos(upTilt));
  camera.lookAt(x+cameraLookLead.x, 0, z+cameraLookLead.z);
}
setTopCamera(sx,sz);

// ─── post-processing: barrel distortion ────────────────────────────────────────────────────
const BarrelShader = {
  uniforms: {
    tDiffuse: { value: null },
    k:        { value: BARREL_K },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float k;
    varying vec2 vUv;
    void main(){
      vec2 uv = vUv - 0.5;
      float r2 = dot(uv, uv);
      vec2 distorted = uv * (1.0 + k * r2);
      distorted /= (1.0 + k * 0.5);
      gl_FragColor = texture2D(tDiffuse, distorted + 0.5);
    }
  `,
};

export const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new ShaderPass(BarrelShader));

function onResize(){
  const w=innerWidth,h=innerHeight;
  renderer.setSize(w,h);
  composer.setSize(w,h);
  camera.aspect=w/h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize',onResize);
onResize();

// ─── buildScene ─────────────────────────────────────────────────────────────────────────────
export function buildScene(mapModule){
  // Remove old meshes before adding new ones
  clearLandmarks();
  if(gnd){ scene.remove(gnd); gnd=null; }
  [mRoad,mBridge,mPark,mWater,...mBldgs].forEach(m=>{ if(m) scene.remove(m); });
  mBldgs=[];
  markMeshes.forEach(m=>scene.remove(m)); markMeshes=[];
  buildingDetailMeshes.forEach(m=>scene.remove(m)); buildingDetailMeshes=[];
  streetLightMeshes.forEach(m=>scene.remove(m)); streetLightMeshes=[];
  streetPointLights.forEach(l=>scene.remove(l)); streetPointLights=[];
  streetLightPositions=[];

  mapModule.build();
  const theme = themeFor(mapModule);
  applyMapTheme(theme);

  gnd = new THREE.Mesh(
    new THREE.PlaneGeometry(MAP_W*TILE, MAP_H*TILE),
    new THREE.MeshToonMaterial({color:theme.ground})
  );
  gnd.rotation.x=-Math.PI/2; gnd.position.y=-0.1; gnd.receiveShadow=true;
  scene.add(gnd);

  // ─── scene geometry ───────────────────────────────────────────────────────────────────────
  const cnt = new Array(5).fill(0);
  for(let i=0;i<MAP_W*MAP_H;i++)cnt[tileMap[i]]++;

  const flatGeo  = new THREE.BoxGeometry(TILE,0.5,TILE);
  const bldgBase = new THREE.BoxGeometry(TILE*0.84,1,TILE*0.84);

  const matRoad   = new THREE.MeshToonMaterial({color:theme.road});
  const matBridge = new THREE.MeshToonMaterial({color:theme.bridge});
  const matWater  = new THREE.MeshToonMaterial({color:theme.water});

  const bldgCnt = new Array(6).fill(0);
  for(let i=0;i<MAP_W*MAP_H;i++)
    if(tileMap[i]===T.BUILDING&&bldgW[i]!==255)bldgCnt[bldgStyle[i]]++;

  function iMesh(geo,mat,n){
    const m=new THREE.InstancedMesh(geo,mat,Math.max(1,n));
    m.castShadow=m.receiveShadow=true;
    scene.add(m);return m;
  }

  mRoad   = iMesh(flatGeo, matRoad,   cnt[T.ROAD]);
  mBridge = iMesh(flatGeo, matBridge, cnt[T.BRIDGE]);
  mPark   = iMesh(flatGeo, new THREE.MeshToonMaterial({color:0xffffff}), Math.max(1,cnt[T.PARK]));
  mWater  = iMesh(flatGeo, matWater,  cnt[T.WATER]);
  mBldgs  = theme.buildings.map((c,i)=>
    iMesh(bldgBase, new THREE.MeshToonMaterial({color:c}), Math.max(1,bldgCnt[i]))
  );

  const bi=[0,0,0,0,0,0];
  let ri=0,bri=0,pi=0,wi=0;
  const buildingRoots=[];

  for(let ty=0;ty<MAP_H;ty++) for(let tx=0;tx<MAP_W;tx++){
    const id=mi(tx,ty), tp=tileMap[id];
    const {x,z}=tileCenter(tx,ty);
    D.rotation.set(0,0,0);
    if(tp===T.ROAD){
      D.position.set(x,0.25,z);D.scale.set(1,1,1);D.updateMatrix();
      mRoad.setMatrixAt(ri++,D.matrix);
    }else if(tp===T.BRIDGE){
      D.position.set(x,0.25,z);D.scale.set(1,1,1);D.updateMatrix();
      mBridge.setMatrixAt(bri++,D.matrix);
    }else if(tp===T.PARK){
      D.position.set(x,0.2,z); D.scale.set(1,1,1); D.updateMatrix();
      mPark.setMatrixAt(pi, D.matrix);
      const shade = parkShade[id] % 6;
      mPark.setColorAt(pi, new THREE.Color(theme.parks[shade]));
      pi++;
    }else if(tp===T.WATER){
      D.position.set(x,-0.15,z);D.scale.set(1,1,1);D.updateMatrix();
      mWater.setMatrixAt(wi++,D.matrix);
    }else if(tp===T.BUILDING){
      if(bldgW[id]===255)continue;
      const ci=bldgStyle[id], h=Math.max(1,bldgH[id]), bh=h*TILE*0.22;
      const fw=Math.max(1,bldgW[id]), fd=Math.max(1,bldgD[id]);
      const bx=x+(fw-1)*TILE*0.5, bz=z+(fd-1)*TILE*0.5;
      D.position.set(bx,bh/2+0.4,bz);D.scale.set(fw,bh,fd);D.updateMatrix();
      mBldgs[ci].setMatrixAt(bi[ci]++,D.matrix);
      buildingRoots.push({tx,ty,bx,bz,fw,fd,bh});
    }
  }
  [mRoad,mBridge,mPark,mWater,...mBldgs].forEach(m=>m.instanceMatrix.needsUpdate=true);
  if(mPark.instanceColor) mPark.instanceColor.needsUpdate=true;

  // ─── building details ───────────────────────────────────────────────────────────────────────
  {
    const isNight = mapModule.theme==='night';
    const darkWindows=[], litWindows=[], roofCaps=[], roofBlocks=[], roofVents=[], roofTanks=[];
    const windowGeo = new THREE.BoxGeometry(1,1,0.08);
    const boxGeo = new THREE.BoxGeometry(1,1,1);
    const tankGeo = new THREE.CylinderGeometry(1,1,1,10);
    const winDarkMat = new THREE.MeshToonMaterial({color:theme.windowDark});
    const winLitMat = new THREE.MeshBasicMaterial({color:theme.windowLit});
    const roofMat = new THREE.MeshToonMaterial({color:theme.roof});
    const roofAltMat = new THREE.MeshToonMaterial({color:theme.roofAlt});
    const wallInset = 0.055;

    function isBuildingTile(tx,ty){
      return tx>=0&&tx<MAP_W&&ty>=0&&ty<MAP_H&&tileMap[mi(tx,ty)]===T.BUILDING;
    }
    function sideVisible(tx,ty,fw,fd,side){
      if(side==='n'||side==='s'){
        const y = side==='n' ? ty-1 : ty+fd;
        for(let x=tx;x<tx+fw;x++) if(!isBuildingTile(x,y)) return true;
      }else{
        const x = side==='w' ? tx-1 : tx+fw;
        for(let y=ty;y<ty+fd;y++) if(!isBuildingTile(x,y)) return true;
      }
      return false;
    }
    function pushWindow(list,x,y,z,w,h,rot=0){
      list.push({x,y,z,w,h,rot});
    }
    function addWindows(root,side){
      const {tx,ty,fw,fd,bx,bz,bh}=root;
      if(!sideVisible(tx,ty,fw,fd,side))return;
      const alongX = side==='n'||side==='s';
      const faceLen = (alongX?fw:fd)*TILE*0.72;
      const cols = Math.max(1,Math.min(6,Math.floor(faceLen/(TILE*0.48))));
      const rows = Math.max(1,Math.min(5,Math.floor((bh+0.8)/3.8)));
      const span = faceLen*0.84;
      const ww = Math.min(TILE*0.23, span/(cols*2.25));
      const wh = Math.min(1.55, Math.max(0.82, bh/(rows*3.5)));
      const y0 = 0.4 + Math.max(0.95, bh*0.13);
      const ySpan = Math.max(0.1, bh - Math.max(1.8, wh*1.6));
      const sideSign = side==='s'||side==='e' ? 1 : -1;
      const faceX = bx + sideSign*fw*TILE*0.42;
      const faceZ = bz + sideSign*fd*TILE*0.42;
      const baseHash = tx*31 + ty*47 + (side.charCodeAt(0)*11);
      for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
        if(hash2(baseHash+c*3,r+ty*5)<0.12)continue;
        const along = cols===1 ? 0 : -span*0.5 + (c+0.5)*span/cols;
        const y = y0 + (rows===1 ? ySpan*0.44 : (r+0.5)*ySpan/rows);
        const lit = isNight && hash2(baseHash+c*13,r*17+9)>0.68;
        if(alongX){
          pushWindow(lit?litWindows:darkWindows,bx+along,y,faceZ+sideSign*wallInset,ww,wh,0);
        }else{
          pushWindow(lit?litWindows:darkWindows,faceX+sideSign*wallInset,y,bz+along,ww,wh,Math.PI/2);
        }
      }
    }
    function addRooftop(root){
      const {tx,ty,fw,fd,bx,bz,bh}=root;
      const top = 0.4 + bh;
      const roofW = Math.max(1,TILE*0.86*fw);
      const roofD = Math.max(1,TILE*0.86*fd);
      roofCaps.push({x:bx,y:top+0.12,z:bz,sx:roofW,sy:0.24,sz:roofD,rot:0});
      if(hash2(tx+19,ty+23)>0.58){
        const sx=Math.min(TILE*0.34,roofW*0.34), sz=Math.min(TILE*0.30,roofD*0.34);
        roofBlocks.push({
          x:bx+roofW*(hash2(tx+4,ty+7)-0.5)*0.42,
          y:top+0.78,
          z:bz+roofD*(hash2(tx+8,ty+5)-0.5)*0.42,
          sx, sy:1.32, sz, rot:0,
        });
      }
      const vents = Math.min(3,Math.max(1,Math.floor((fw*fd+2)/8)));
      for(let i=0;i<vents;i++){
        if(hash2(tx+i*5,ty+i*7)<0.28)continue;
        roofVents.push({
          x:bx+roofW*(hash2(tx+i*11,ty+3)-0.5)*0.58,
          y:top+0.46,
          z:bz+roofD*(hash2(tx+5,ty+i*13)-0.5)*0.58,
          sx:Math.min(1.8,roofW*0.18),
          sy:0.7,
          sz:Math.min(1.4,roofD*0.18),
          rot:(Math.floor(hash2(tx+i,ty+i)*4))*Math.PI/2,
        });
      }
      if(fw*fd>=6&&hash2(tx+71,ty+37)>0.66){
        roofTanks.push({
          x:bx+roofW*(hash2(tx+2,ty+17)-0.5)*0.48,
          y:top+0.8,
          z:bz+roofD*(hash2(tx+29,ty+6)-0.5)*0.48,
          sx:0.78, sy:1.45, sz:0.78, rot:0,
        });
      }
    }
    function makeWindowMesh(list,mat){
      if(!list.length)return null;
      const mesh=new THREE.InstancedMesh(windowGeo,mat,list.length);
      list.forEach(({x,y,z,w,h,rot},i)=>{
        D.rotation.set(0,rot,0);
        D.position.set(x,y,z);
        D.scale.set(w,h,1);
        D.updateMatrix();
        mesh.setMatrixAt(i,D.matrix);
      });
      mesh.instanceMatrix.needsUpdate=true;
      scene.add(mesh);
      return mesh;
    }
    function makeBoxMesh(list,mat,geo=boxGeo){
      if(!list.length)return null;
      const mesh=new THREE.InstancedMesh(geo,mat,list.length);
      mesh.castShadow=mesh.receiveShadow=true;
      list.forEach(({x,y,z,sx,sy,sz,rot=0},i)=>{
        D.rotation.set(0,rot,0);
        D.position.set(x,y,z);
        D.scale.set(sx,sy,sz);
        D.updateMatrix();
        mesh.setMatrixAt(i,D.matrix);
      });
      mesh.instanceMatrix.needsUpdate=true;
      scene.add(mesh);
      return mesh;
    }

    buildingRoots.forEach(root=>{
      addWindows(root,'n'); addWindows(root,'s'); addWindows(root,'w'); addWindows(root,'e');
      addRooftop(root);
    });

    [
      makeWindowMesh(darkWindows,winDarkMat),
      makeWindowMesh(litWindows,winLitMat),
      makeBoxMesh(roofCaps,roofMat),
      makeBoxMesh(roofBlocks,roofAltMat),
      makeBoxMesh(roofVents,roofAltMat),
      makeBoxMesh(roofTanks,roofAltMat,tankGeo),
    ].forEach(m=>{if(m)buildingDetailMeshes.push(m);});
  }

  // ─── road markings ──────────────────────────────────────────────────────────────────────────
  const roadMarkGeo = new THREE.PlaneGeometry(1,1);
  const roadDotGeo = new THREE.CircleGeometry(1,18);
  const MARK_Y = 0.535;
  const MARK_EDGE = TILE*0.08;
  const WHITE_LINE_W = TILE*0.055;
  const WHITE_DOT_R = WHITE_LINE_W*0.62;
  const YELLOW_LINE_W = TILE*0.07;
  const MIN_CENTER_LEN = 7;
  function makeQuarterArcGeometry(inner,outer,segments=14){
    const verts=[];
    for(let i=0;i<segments;i++){
      const a0=(i/segments)*Math.PI/2, a1=((i+1)/segments)*Math.PI/2;
      const i0=[Math.cos(a0)*inner,0,Math.sin(a0)*inner];
      const o0=[Math.cos(a0)*outer,0,Math.sin(a0)*outer];
      const i1=[Math.cos(a1)*inner,0,Math.sin(a1)*inner];
      const o1=[Math.cos(a1)*outer,0,Math.sin(a1)*outer];
      verts.push(...i0,...o0,...i1, ...o0,...o1,...i1);
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
    geo.computeVertexNormals();
    return geo;
  }
  const roadArcGeo = makeQuarterArcGeometry(
    Math.max(0.01,MARK_EDGE-WHITE_LINE_W*0.5),
    MARK_EDGE+WHITE_LINE_W*0.5
  );
  const roadWhiteMat = new THREE.MeshBasicMaterial({color:theme.whiteMark,opacity:0.82,transparent:true,depthWrite:false,side:THREE.DoubleSide});
  const roadYellowMat = new THREE.MeshBasicMaterial({color:theme.yellowMark,opacity:0.48,transparent:true,depthWrite:false,side:THREE.DoubleSide});
  const whiteMarks = [], whiteDots = [], whiteArcs = [], yellowMarks = [];
  const streetLights = [];
  const STREET_LIGHT_STEP = 3;
  const STREET_LIGHT_EDGE = TILE*0.22;
  const STREET_LIGHT_ARM = TILE*0.18;

  function isRoadish(tx,ty){
    if(tx<0||tx>=MAP_W||ty<0||ty>=MAP_H)return false;
    const t=tileMap[mi(tx,ty)];
    return t===T.ROAD||t===T.BRIDGE;
  }
  function isWallTile(tx,ty){
    if(tx<0||tx>=MAP_W||ty<0||ty>=MAP_H)return true;
    const t=tileMap[mi(tx,ty)];
    return t!==T.ROAD&&t!==T.BRIDGE;
  }
  function addMark(list,x,z,w,d,rot=0){
    list.push({x,z,w,d,rot});
  }
  function addDot(list,x,z,r){list.push({x,z,r});}
  function addArc(list,x,z,rot){list.push({x,z,rot});}
  function addStreetLight(axis,edge,start,end,roadSide){
    if(mapModule.theme!=='night')return;
    const len=end-start+1;
    if(len<2)return;
    const first=start+(len>3?1:0);
    const last=end-(len>3?1:0);
    let p=first+((edge+first+(roadSide>0?0:1))%STREET_LIGHT_STEP);
    if(p>last)p=Math.floor((first+last)*0.5);
    for(;p<=last;p+=STREET_LIGHT_STEP){
      if(axis==='v'){
        streetLights.push({
          x:edgeX(edge)+roadSide*STREET_LIGHT_EDGE,
          z:tileCenterZ((p-HALF_H+0.5)*TILE),
          side:roadSide,
          rot:0,
        });
      }else{
        streetLights.push({
          x:tileCenterX((p-HALF_W+0.5)*TILE),
          z:edgeZ(edge)+roadSide*STREET_LIGHT_EDGE,
          side:roadSide,
          rot:Math.PI/2,
        });
      }
    }
  }
  function edgeX(ex){return (ex-HALF_W)*TILE;}
  function edgeZ(ey){return (ey-HALF_H)*TILE;}

  function addWhiteV(ex,start,end,roadSide){
    const x=edgeX(ex)+roadSide*MARK_EDGE;
    const z=(edgeZ(start)+edgeZ(end+1))*0.5;
    addMark(whiteMarks,x,z,WHITE_LINE_W,(end-start+1)*TILE);
    addDot(whiteDots,x,edgeZ(start),WHITE_DOT_R);
    addDot(whiteDots,x,edgeZ(end+1),WHITE_DOT_R);
    addStreetLight('v',ex,start,end,roadSide);
  }
  function addWhiteH(ey,start,end,roadSide){
    const x=(edgeX(start)+edgeX(end+1))*0.5;
    const z=edgeZ(ey)+roadSide*MARK_EDGE;
    addMark(whiteMarks,x,z,(end-start+1)*TILE,WHITE_LINE_W);
    addDot(whiteDots,edgeX(start),z,WHITE_DOT_R);
    addDot(whiteDots,edgeX(end+1),z,WHITE_DOT_R);
    addStreetLight('h',ey,start,end,roadSide);
  }

  for(let ex=0;ex<=MAP_W;ex++){
    for(const roadSide of [-1,1]){
      let start=-1;
      for(let ty=0;ty<MAP_H;ty++){
        const road=roadSide>0?isRoadish(ex,ty):isRoadish(ex-1,ty);
        const wall=roadSide>0?isWallTile(ex-1,ty):isWallTile(ex,ty);
        if(road&&wall){if(start<0)start=ty;}
        else if(start>=0){addWhiteV(ex,start,ty-1,roadSide);start=-1;}
      }
      if(start>=0)addWhiteV(ex,start,MAP_H-1,roadSide);
    }
  }

  for(let ey=0;ey<=MAP_H;ey++){
    for(const roadSide of [-1,1]){
      let start=-1;
      for(let tx=0;tx<MAP_W;tx++){
        const road=roadSide>0?isRoadish(tx,ey):isRoadish(tx,ey-1);
        const wall=roadSide>0?isWallTile(tx,ey-1):isWallTile(tx,ey);
        if(road&&wall){if(start<0)start=tx;}
        else if(start>=0){addWhiteH(ey,start,tx-1,roadSide);start=-1;}
      }
      if(start>=0)addWhiteH(ey,start,MAP_W-1,roadSide);
    }
  }

  for(let ey=1;ey<MAP_H;ey++) for(let ex=1;ex<MAP_W;ex++){
    const x=edgeX(ex), z=edgeZ(ey);
    const nwB=isWallTile(ex-1,ey-1), neB=isWallTile(ex,ey-1);
    const swB=isWallTile(ex-1,ey),   seB=isWallTile(ex,ey);
    const nwR=isRoadish(ex-1,ey-1), neR=isRoadish(ex,ey-1);
    const swR=isRoadish(ex-1,ey),   seR=isRoadish(ex,ey);

    if(nwB&&neR&&swR)addArc(whiteArcs,x,z,0);
    if(neB&&nwR&&seR)addArc(whiteArcs,x,z,-Math.PI/2);
    if(seB&&neR&&swR)addArc(whiteArcs,x,z,Math.PI);
    if(swB&&nwR&&seR)addArc(whiteArcs,x,z,Math.PI/2);
  }

  function addYellowH(ey,start,end){
    const x=(edgeX(start)+edgeX(end+1))*0.5;
    addMark(yellowMarks,x,edgeZ(ey),(end-start+1)*TILE,YELLOW_LINE_W);
  }
  function addYellowV(ex,start,end){
    const z=(edgeZ(start)+edgeZ(end+1))*0.5;
    addMark(yellowMarks,edgeX(ex),z,YELLOW_LINE_W,(end-start+1)*TILE);
  }
  function roadWidthAcrossZ(tx,ey){
    let up=0,down=0;
    for(let y=ey-1;y>=0&&isRoadish(tx,y);y--)up++;
    for(let y=ey;y<MAP_H&&isRoadish(tx,y);y++)down++;
    return {up,down};
  }
  function roadWidthAcrossX(ex,ty){
    let left=0,right=0;
    for(let x=ex-1;x>=0&&isRoadish(x,ty);x--)left++;
    for(let x=ex;x<MAP_W&&isRoadish(x,ty);x++)right++;
    return {left,right};
  }

  for(let ey=1;ey<MAP_H;ey++){
    let start=-1;
    for(let tx=0;tx<MAP_W;tx++){
      const {up,down}=roadWidthAcrossZ(tx,ey);
      const twoLane=isRoadish(tx,ey-1)&&isRoadish(tx,ey)&&
        up===down&&up+down>=2&&
        isRoadish(tx-1,ey-1)&&isRoadish(tx+1,ey-1)&&
        isRoadish(tx-1,ey)&&isRoadish(tx+1,ey);
      if(twoLane){if(start<0)start=tx;}
      else if(start>=0){
        if(tx-start>=MIN_CENTER_LEN)addYellowH(ey,start,tx-1);
        start=-1;
      }
    }
    if(start>=0&&MAP_W-start>=MIN_CENTER_LEN)addYellowH(ey,start,MAP_W-1);
  }

  for(let ex=1;ex<MAP_W;ex++){
    let start=-1;
    for(let ty=0;ty<MAP_H;ty++){
      const {left,right}=roadWidthAcrossX(ex,ty);
      const twoLane=isRoadish(ex-1,ty)&&isRoadish(ex,ty)&&
        left===right&&left+right>=2&&
        isRoadish(ex-1,ty-1)&&isRoadish(ex-1,ty+1)&&
        isRoadish(ex,ty-1)&&isRoadish(ex,ty+1);
      if(twoLane){if(start<0)start=ty;}
      else if(start>=0){
        if(ty-start>=MIN_CENTER_LEN)addYellowV(ex,start,ty-1);
        start=-1;
      }
    }
    if(start>=0&&MAP_H-start>=MIN_CENTER_LEN)addYellowV(ex,start,MAP_H-1);
  }

  // ─── safety zones: road intersections (≥2×2, ratio ≤3:1) or open squares (≥5×5, ratio ≤2:1) ──
  {
    const szH=new Int32Array(MAP_W), szRects=[];
    for(let ty=0;ty<MAP_H;ty++){
      for(let tx=0;tx<MAP_W;tx++) szH[tx]=isRoadish(tx,ty)?szH[tx]+1:0;
      const stk=[];
      for(let tx=0;tx<=MAP_W;tx++){
        const ch=tx<MAP_W?szH[tx]:0; let sx=tx;
        while(stk.length&&stk[stk.length-1].h>ch){
          const {x,h:rh}=stk.pop(); const w=tx-x;
          const mn=Math.min(w,rh), mx=Math.max(w,rh);
          const isIntersection = mn>=2 && mx<=mn*3;
          const isOpenSquare   = mn>=5 && mx<=mn*2;
          if(isIntersection||isOpenSquare) szRects.push({tx1:x,ty1:ty-rh+1,tx2:tx-1,ty2:ty,area:w*rh});
          sx=x;
        }
        stk.push({x:sx,h:ch});
      }
    }
    szRects.sort((a,b)=>b.area-a.area);
    const szCov=new Uint8Array(MAP_W*MAP_H), szSel=[];
    for(const r of szRects){
      let ok=true;
      outer: for(let y=r.ty1;y<=r.ty2;y++)
        for(let x=r.tx1;x<=r.tx2;x++) if(szCov[mi(x,y)]){ok=false;break outer;}
      if(ok){
        szSel.push(r);
        for(let y=r.ty1;y<=r.ty2;y++) for(let x=r.tx1;x<=r.tx2;x++) szCov[mi(x,y)]=1;
      }
    }
    const BT=TILE*0.09, CR=TILE*0.4, HL=TILE*0.5, HW=TILE*0.065, HG=TILE*0.58;
    const szBM=[], szBA=[], szHM=[];
    const szArcGeo=makeQuarterArcGeometry(Math.max(0.01,CR-BT*0.5),CR+BT*0.5);
    const szMat=new THREE.MeshBasicMaterial({color:theme.whiteMark,opacity:0.85,transparent:true,depthWrite:false,side:THREE.DoubleSide});
    for(const {tx1,ty1,tx2,ty2} of szSel){
      const p1=tileCenter(tx1,ty1),p2=tileCenter(tx2,ty2);
      const wL=p1.x+TILE*0.5,wR=p2.x-TILE*0.5,wT=p1.z+TILE*0.5,wB=p2.z-TILE*0.5;
      const wW=wR-wL,wD=wB-wT,cx=(wL+wR)*0.5,cz=(wT+wB)*0.5;
      const iW=wW-CR*2,iD=wD-CR*2;
      if(iW<=0||iD<=0)continue;
      // border sides
      szBM.push({x:cx,z:wT,w:iW,d:BT,rot:0});
      szBM.push({x:cx,z:wB,w:iW,d:BT,rot:0});
      szBM.push({x:wL,z:cz,w:BT,d:iD,rot:0});
      szBM.push({x:wR,z:cz,w:BT,d:iD,rot:0});
      // rounded corners: NW, NE, SE, SW
      szBA.push({x:wL+CR,z:wT+CR,rot:Math.PI});
      szBA.push({x:wR-CR,z:wT+CR,rot:Math.PI/2});
      szBA.push({x:wR-CR,z:wB-CR,rot:0});
      szBA.push({x:wL+CR,z:wB-CR,rot:-Math.PI/2});
      // inward hatching on all 4 sides
      const d45=HL*0.5*Math.SQRT1_2;
      const nX=Math.max(1,Math.round(iW/HG)), nZ=Math.max(1,Math.round(iD/HG));
      for(let i=0;i<nX;i++){
        const hx=wL+CR+(i+0.5)*iW/nX;
        szHM.push({x:hx,z:wT+BT+d45,w:HW,d:HL,rot:Math.PI/4});
        szHM.push({x:hx,z:wB-BT-d45,w:HW,d:HL,rot:Math.PI/4});
      }
      for(let i=0;i<nZ;i++){
        const hz=wT+CR+(i+0.5)*iD/nZ;
        szHM.push({x:wL+BT+d45,z:hz,w:HW,d:HL,rot:Math.PI/4});
        szHM.push({x:wR-BT-d45,z:hz,w:HW,d:HL,rot:Math.PI/4});
      }
    }
    function makeSzMarks(list){
      if(!list.length)return null;
      const mesh=new THREE.InstancedMesh(roadMarkGeo,szMat,list.length);
      list.forEach(({x,z,w,d,rot=0},i)=>{
        D.rotation.set(-Math.PI/2,0,rot);D.position.set(x,MARK_Y+0.006,z);
        D.scale.set(w,d,1);D.updateMatrix();mesh.setMatrixAt(i,D.matrix);
      });
      mesh.instanceMatrix.needsUpdate=true;scene.add(mesh);return mesh;
    }
    function makeSzArcs(list){
      if(!list.length)return null;
      const mesh=new THREE.InstancedMesh(szArcGeo,szMat,list.length);
      list.forEach(({x,z,rot},i)=>{
        D.rotation.set(0,rot,0);D.position.set(x,MARK_Y+0.008,z);
        D.scale.set(1,1,1);D.updateMatrix();mesh.setMatrixAt(i,D.matrix);
      });
      mesh.instanceMatrix.needsUpdate=true;scene.add(mesh);return mesh;
    }
    [makeSzMarks(szBM),makeSzMarks(szHM),makeSzArcs(szBA)].forEach(m=>{if(m)markMeshes.push(m);});
  }

  function makeRoadMarks(list,mat){
    if(list.length===0)return null;
    const mesh=new THREE.InstancedMesh(roadMarkGeo,mat,list.length);
    list.forEach(({x,z,w,d,rot},i)=>{
      D.rotation.set(-Math.PI/2,0,rot);
      D.position.set(x,MARK_Y,z);
      D.scale.set(w,d,1);
      D.updateMatrix();
      mesh.setMatrixAt(i,D.matrix);
    });
    mesh.instanceMatrix.needsUpdate=true;
    scene.add(mesh);
    return mesh;
  }
  function makeRoadDots(list,mat){
    if(list.length===0)return null;
    const mesh=new THREE.InstancedMesh(roadDotGeo,mat,list.length);
    list.forEach(({x,z,r},i)=>{
      D.rotation.set(-Math.PI/2,0,0);
      D.position.set(x,MARK_Y+0.002,z);
      D.scale.set(r,r,1);
      D.updateMatrix();
      mesh.setMatrixAt(i,D.matrix);
    });
    mesh.instanceMatrix.needsUpdate=true;
    scene.add(mesh);
    return mesh;
  }
  function makeRoadArcs(list,mat){
    if(list.length===0)return null;
    const mesh=new THREE.InstancedMesh(roadArcGeo,mat,list.length);
    list.forEach(({x,z,rot},i)=>{
      D.rotation.set(0,rot,0);
      D.position.set(x,MARK_Y+0.004,z);
      D.scale.set(1,1,1);
      D.updateMatrix();
      mesh.setMatrixAt(i,D.matrix);
    });
    mesh.instanceMatrix.needsUpdate=true;
    scene.add(mesh);
    return mesh;
  }

  [
    makeRoadMarks(whiteMarks,roadWhiteMat),
    makeRoadArcs(whiteArcs,roadWhiteMat),
    makeRoadDots(whiteDots,roadWhiteMat),
    makeRoadMarks(yellowMarks,roadYellowMat),
  ].forEach(m=>{ if(m) markMeshes.push(m); });

  if(streetLights.length){
    const poleGeo = new THREE.CylinderGeometry(0.14,0.18,6.3,8);
    const armGeo  = new THREE.BoxGeometry(TILE*0.32,0.16,0.16);
    const bulbGeo = new THREE.SphereGeometry(0.58,10,8);
    const glowGeo = new THREE.PlaneGeometry(1,1);
    const poleMat = new THREE.MeshToonMaterial({color:0x151525});
    const bulbMat = new THREE.MeshBasicMaterial({color:0xffe6a0});
    const glowMat = new THREE.MeshBasicMaterial({
      map:streetGlowTexture(),
      color:0xffc36b,
      opacity:0.64,
      transparent:true,
      depthWrite:false,
      blending:THREE.AdditiveBlending,
      side:THREE.DoubleSide,
    });
    const poles = new THREE.InstancedMesh(poleGeo,poleMat,streetLights.length);
    const arms  = new THREE.InstancedMesh(armGeo,poleMat,streetLights.length);
    const bulbs = new THREE.InstancedMesh(bulbGeo,bulbMat,streetLights.length);
    const glows = new THREE.InstancedMesh(glowGeo,glowMat,streetLights.length);
    poles.castShadow=arms.castShadow=true;
    poles.receiveShadow=arms.receiveShadow=true;
    glows.renderOrder=1;

    streetLights.forEach(({x,z,side,rot},i)=>{
      const alongX = rot===0;
      const lx = x + (alongX?side*STREET_LIGHT_ARM:0);
      const lz = z + (alongX?0:side*STREET_LIGHT_ARM);
      const ax = (x+lx)*0.5;
      const az = (z+lz)*0.5;
      streetLightPositions.push({x:lx,z:lz});

      D.rotation.set(0,0,0);
      D.position.set(x,3.65,z);
      D.scale.set(1,1,1);
      D.updateMatrix();
      poles.setMatrixAt(i,D.matrix);

      D.rotation.set(0,rot,0);
      D.position.set(ax,6.75,az);
      D.scale.set(1,1,1);
      D.updateMatrix();
      arms.setMatrixAt(i,D.matrix);

      D.rotation.set(0,0,0);
      D.position.set(lx,6.75,lz);
      D.scale.set(1,1,1);
      D.updateMatrix();
      bulbs.setMatrixAt(i,D.matrix);

      D.rotation.set(-Math.PI/2,0,0);
      D.position.set(lx,0.518,lz);
      D.scale.set(TILE*1.84,TILE*1.84,1);
      D.updateMatrix();
      glows.setMatrixAt(i,D.matrix);
    });

    [poles,arms,bulbs,glows].forEach(m=>{
      m.instanceMatrix.needsUpdate=true;
      scene.add(m);
      streetLightMeshes.push(m);
    });

    for(let i=0;i<STREET_LIGHT_POOL_SIZE;i++){
      const l=new THREE.PointLight(0xffd18a,3.8,TILE*5.2,1.35);
      l.position.y=7.2;
      l.visible=false;
      scene.add(l);
      streetPointLights.push(l);
    }
  }

  // Car spawn
  const {x:_sx, z:_sz} = tileCenter(HALF_W, HALF_H);
  sx = _sx; sz = _sz;

  // 3-D landmark models (Paris only)
  if(mapModule.hasLandmarks) buildLandmarks();
}
