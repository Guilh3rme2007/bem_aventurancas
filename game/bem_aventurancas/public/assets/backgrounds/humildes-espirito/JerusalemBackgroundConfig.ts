export const PALETTE = {
  sand: 0xd9c39a,
  beigeLight: 0xe8d8b8,
  limestone: 0xc8b18d,
  brown: 0x8b6749,
  brownDark: 0x594330,
  terracotta: 0xb96f4c,
  olive: 0x85865b,
  greenDark: 0x4c5d43,
  sky: 0xa9c5d1,
  gold: 0xd9bd79,
  ink: 0x3b2a1e,
  shadow: 0x5a4636,
  doorWood: 0x6e4d36,
  windowDark: 0x2f2219,
  cloudWhite: 0xf4ecd8,
} as const;

export const DESIGN_HEIGHT = 720;

export const WORLD = {
  designHeight: DESIGN_HEIGHT,
  segmentWidth: 2000,
  groundOverlap: 96,
  preloadDistance: 1400,
  unloadDistance: 1800,
  footprintDepth: 26,
} as const;

export const DEPTH = {
  sky: -3000,
  far: -2900,
  temple: -2500,
  ground: -1000,
  groundDecor: -900,
  midBase: 0,
  foreBase: 5000,
  paper: 9000,
  vignette: 9001,
  ui: 20000,
} as const;

export const PARALLAX = {
  clouds: 0.04,
  mountains: 0.1,
  farCity: 0.28,
} as const;

export const PAPER = {
  alpha: 0.32,
  vignetteAlpha: 0.55,
} as const;

export const QUALITY = {
  stoneTextureVariants: 6,
  maxSwayObjectsPerSegment: 14,
  ambientDust: true,
} as const;
