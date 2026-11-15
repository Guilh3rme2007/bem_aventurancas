import { JERUSALEM_VISUAL_THEME as THEME } from '../../level/humildes_espirito/style/JerusalemVisualTheme';

/**
 * Configuração dimensional do cenário. A aparência (cores, traço, sombras) vem do tema central
 * em `style/JerusalemVisualTheme.ts`; `PALETTE` é apenas um atalho com os nomes históricos.
 */
export const PALETTE = {
  ...THEME.palette,
  beigeLight: THEME.palette.stoneLight,
  doorWood: THEME.palette.wood,
} as const;

export const DESIGN_HEIGHT = 720;

export const WORLD = {
  designHeight: DESIGN_HEIGHT,
  /** Largura típica de um segmento. Mantida <= 2048 para respeitar limites de textura em mobile. */
  segmentWidth: 2000,
  /** Sobreposição (px) da textura de chão de cada segmento com o vizinho. */
  groundOverlap: 96,
  preloadDistance: 1400,
  unloadDistance: 1800,
  /** Profundidade (px) da "pegada" de colisão de objetos sólidos, medida a partir do pé. */
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
  /** Elementos de interface presos à tela (acima de papel/vinheta). */
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
  maxSwayObjectsPerSegment: 14,
  ambientDust: true,
  /** Gera no início todas as texturas de objetos que o mapa usa (evita engasgos ao entrar em segmentos). */
  prebakeProps: true,
} as const;
