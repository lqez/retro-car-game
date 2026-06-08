import { TILE } from './constants.js';
import { HALF_W, HALF_H } from './map.js';
import { buildArcDeTriomphe } from '../assets/buildings/arc-de-triomphe.js';
import { buildEiffelTower }   from '../assets/buildings/eiffel-tower.js';
import { buildNotreDame }     from '../assets/buildings/notre-dame.js';
import { buildSacreCoeur }    from '../assets/buildings/sacre-coeur.js';
import { buildLouvre }        from '../assets/buildings/louvre.js';
import { buildOperaGarnier }  from '../assets/buildings/opera-garnier.js';
import { buildInvalides }     from '../assets/buildings/invalides.js';
import { buildPompidou }      from '../assets/buildings/pompidou.js';
import { buildPantheon }      from '../assets/buildings/pantheon.js';
import { buildMoulinRouge }   from '../assets/buildings/moulin-rouge.js';

// World center of a landmark whose top-left tile is (tx,ty) with size w×h tiles
export function lmkCenter(tx, ty, w, h) {
  return {
    x: (tx - HALF_W + w / 2) * TILE,
    z: (ty - HALF_H + h / 2) * TILE,
  };
}

let _scene = null;
const _meshes = [];

export function initLandmarks(scene) { _scene = scene; }

export function clearLandmarks() {
  _meshes.forEach(m => { if (_scene) _scene.remove(m); });
  _meshes.length = 0;
}

function add(obj) { _meshes.push(obj); _scene.add(obj); return obj; }

export function buildLandmarks() {
  if (!_scene) return;
  clearLandmarks();
  buildArcDeTriomphe(add);
  buildEiffelTower(add);
  buildNotreDame(add);
  buildSacreCoeur(add);
  buildLouvre(add);
  buildOperaGarnier(add);
  buildInvalides(add);
  buildPompidou(add);
  buildPantheon(add);
  buildMoulinRouge(add);
}
