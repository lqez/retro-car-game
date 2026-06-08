// Re-export all map state and utilities from the maps/ modules.
// Consumers (scene, physics, ui, etc.) keep importing from './map.js'.
export { MAP_W, MAP_H, HALF_W, HALF_H,
         tileMap, waterMrk, bldgH, bldgStyle, bldgW, bldgD, parkShade,
         roadTiles, initMap, resetMap,
         mi, hash2, fillRect,
         tileCenter, tileCenterX, tileCenterZ, tileAt, passable,
         pruneOrphanRoads } from './maps/common.js';
