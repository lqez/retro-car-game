export const PROP_MATERIALS = Object.freeze({
  bark: 0x6b4324,
  barkDark: 0x49311e,
  barkLight: 0x8a6337,
  leafA: 0x3f7d3f,
  leafB: 0x2f6a3c,
  leafC: 0x5b8d3b,
  leafDark: 0x214f35,
  leafBlue: 0x2c5f58,
  leafOlive: 0x6f8a3c,
  leafFresh: 0x4f9a49,
  rockLight: 0x9a9a8e,
  rockMid: 0x727770,
  rockDark: 0x474c53,
  rockBlue: 0x344157,
});

export const TREE_PROPS = Object.freeze([
  {
    name: 'broad-oak',
    parts: [
      { kind: 'cylinder', mat: 'bark',      p: [0, 1.35, 0], s: [0.42, 2.70, 0.42], seg: 8 },
      { kind: 'cylinder', mat: 'bark',      p: [-0.50, 2.35, 0.10], s: [0.18, 1.45, 0.18], r: [0.00, 0.00, 0.72], seg: 6 },
      { kind: 'cylinder', mat: 'barkDark',  p: [0.50, 2.30, -0.15], s: [0.16, 1.28, 0.16], r: [0.00, 0.00, -0.68], seg: 6 },
      { kind: 'cylinder', mat: 'barkLight', p: [0.05, 2.55, 0.55], s: [0.14, 1.15, 0.14], r: [0.62, 0.00, 0.12], seg: 6 },
      { kind: 'sphere',   mat: 'leafA',     p: [-0.85, 3.38, 0.10], s: [1.34, 1.04, 1.18], seg: 10 },
      { kind: 'sphere',   mat: 'leafB',     p: [0.70, 3.28, -0.22], s: [1.25, 1.00, 1.30], seg: 10 },
      { kind: 'sphere',   mat: 'leafC',     p: [0.00, 3.70, 0.40], s: [1.45, 1.04, 1.24], seg: 10 },
      { kind: 'sphere',   mat: 'leafDark',  p: [0.05, 3.12, -0.78], s: [1.18, 0.90, 1.05], seg: 9 },
      { kind: 'sphere',   mat: 'leafFresh', p: [0.02, 4.05, 0.00], s: [0.95, 0.78, 0.92], seg: 9 },
    ],
  },
  {
    name: 'layered-pine',
    parts: [
      { kind: 'cylinder', mat: 'barkDark', p: [0, 1.55, 0], s: [0.30, 3.10, 0.30], seg: 7 },
      { kind: 'cone',     mat: 'leafDark', p: [0, 2.00, 0], s: [1.72, 1.55, 1.72], seg: 9 },
      { kind: 'cone',     mat: 'leafB',    p: [0, 2.78, 0], s: [1.50, 1.48, 1.50], seg: 9 },
      { kind: 'cone',     mat: 'leafDark', p: [0, 3.48, 0], s: [1.24, 1.34, 1.24], seg: 9 },
      { kind: 'cone',     mat: 'leafA',    p: [0, 4.08, 0], s: [0.92, 1.16, 0.92], seg: 8 },
      { kind: 'cone',     mat: 'leafFresh',p: [0, 4.58, 0], s: [0.56, 0.82, 0.56], seg: 8 },
    ],
  },
  {
    name: 'lombardy-poplar',
    parts: [
      { kind: 'cylinder', mat: 'bark',      p: [0, 1.70, 0], s: [0.30, 3.40, 0.30], seg: 7 },
      { kind: 'cylinder', mat: 'barkLight', p: [-0.18, 2.85, 0.05], s: [0.10, 1.55, 0.10], r: [0.00, 0.00, 0.22], seg: 5 },
      { kind: 'cylinder', mat: 'barkLight', p: [0.20, 3.10, -0.04], s: [0.10, 1.45, 0.10], r: [0.00, 0.00, -0.18], seg: 5 },
      { kind: 'sphere',   mat: 'leafDark',  p: [0, 2.70, 0], s: [0.82, 1.35, 0.82], seg: 9 },
      { kind: 'sphere',   mat: 'leafB',     p: [0.08, 3.70, 0.02], s: [0.88, 1.48, 0.88], seg: 9 },
      { kind: 'sphere',   mat: 'leafA',     p: [-0.05, 4.78, 0.00], s: [0.70, 1.22, 0.70], seg: 8 },
      { kind: 'sphere',   mat: 'leafFresh', p: [0.03, 5.58, 0.00], s: [0.46, 0.82, 0.46], seg: 8 },
    ],
  },
  {
    name: 'irregular-maple',
    parts: [
      { kind: 'cylinder', mat: 'bark',      p: [0, 1.22, 0], s: [0.36, 2.44, 0.36], seg: 8 },
      { kind: 'cylinder', mat: 'barkDark',  p: [-0.58, 2.20, -0.18], s: [0.16, 1.25, 0.16], r: [0.00, 0.00, 0.82], seg: 6 },
      { kind: 'cylinder', mat: 'bark',      p: [0.48, 2.14, 0.26], s: [0.14, 1.10, 0.14], r: [-0.42, 0.00, -0.60], seg: 6 },
      { kind: 'sphere',   mat: 'leafOlive', p: [-0.86, 3.05, -0.10], s: [1.08, 0.98, 1.18], seg: 9 },
      { kind: 'sphere',   mat: 'leafC',     p: [0.32, 3.36, 0.20], s: [1.34, 1.12, 1.22], seg: 10 },
      { kind: 'sphere',   mat: 'leafA',     p: [1.02, 2.86, -0.18], s: [0.95, 0.82, 0.92], seg: 9 },
      { kind: 'sphere',   mat: 'leafB',     p: [-0.22, 3.82, 0.60], s: [1.02, 0.78, 0.92], seg: 9 },
    ],
  },
  {
    name: 'park-elm',
    parts: [
      { kind: 'cylinder', mat: 'barkDark', p: [0, 1.15, 0], s: [0.34, 2.30, 0.34], seg: 8 },
      { kind: 'cylinder', mat: 'bark',     p: [-0.72, 2.08, 0.15], s: [0.14, 1.35, 0.14], r: [0.18, 0.00, 0.92], seg: 6 },
      { kind: 'cylinder', mat: 'bark',     p: [0.78, 2.05, -0.05], s: [0.14, 1.32, 0.14], r: [-0.12, 0.00, -0.88], seg: 6 },
      { kind: 'sphere',   mat: 'leafBlue', p: [-1.05, 3.05, 0.08], s: [1.34, 0.84, 1.18], seg: 9 },
      { kind: 'sphere',   mat: 'leafDark', p: [1.05, 3.08, -0.05], s: [1.30, 0.82, 1.12], seg: 9 },
      { kind: 'sphere',   mat: 'leafB',    p: [0.00, 3.34, 0.55], s: [1.55, 0.90, 1.20], seg: 10 },
      { kind: 'sphere',   mat: 'leafA',    p: [0.00, 3.58, -0.45], s: [1.18, 0.72, 1.02], seg: 9 },
    ],
  },
]);

export const ROCK_PROPS = Object.freeze([
  {
    name: 'low-boulder',
    parts: [
      { kind: 'dodeca', mat: 'rockMid',   p: [0, 0.28, 0], s: [0.95, 0.55, 0.75] },
    ],
  },
  {
    name: 'flat-slab',
    parts: [
      { kind: 'box',    mat: 'rockLight', p: [0, 0.18, 0], s: [1.25, 0.36, 0.82] },
    ],
  },
  {
    name: 'three-stone-cluster',
    parts: [
      { kind: 'dodeca', mat: 'rockMid',   p: [-0.35, 0.25, 0.10], s: [0.62, 0.50, 0.58] },
      { kind: 'dodeca', mat: 'rockDark',  p: [0.25, 0.34, -0.05], s: [0.72, 0.68, 0.62] },
      { kind: 'dodeca', mat: 'rockLight', p: [0.55, 0.20, 0.32], s: [0.42, 0.40, 0.45] },
    ],
  },
  {
    name: 'standing-stone',
    parts: [
      { kind: 'dodeca', mat: 'rockDark',  p: [0, 0.62, 0], s: [0.55, 1.25, 0.48] },
    ],
  },
  {
    name: 'blue-gray-pair',
    parts: [
      { kind: 'dodeca', mat: 'rockBlue',  p: [-0.22, 0.30, 0], s: [0.68, 0.60, 0.58] },
      { kind: 'dodeca', mat: 'rockMid',   p: [0.38, 0.22, 0.15], s: [0.50, 0.44, 0.52] },
    ],
  },
]);
