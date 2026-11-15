/**
 * TEMA VISUAL CENTRAL da Jerusalém do século I (Level 01).
 *
 * Todo material, objeto e elemento do cenário lê seus parâmetros daqui: paleta, espessura de
 * contorno, intensidade de sombras, desgaste, nível de detalhe e direção da luz. Para manter a
 * identidade visual (mesmo "artista") em outras fases, copie este arquivo, mude os valores e
 * mantenha as mesmas CHAVES: os geradores continuam funcionando sem alterações.
 *
 * Módulo puro (sem Phaser, sem DOM).
 */

export const JERUSALEM_VISUAL_THEME = {
  style: 'handdrawn-watercolor',

  /** Cores como inteiros 0xRRGGBB (o formato do Phaser). Use `css()` para obter "#rrggbb". */
  palette: {
    sand: 0xd9c39a, //        Areia
    stoneLight: 0xe8d8b8, //  Pedra clara
    limestone: 0xc8b18d, //   Calcário
    stoneAged: 0xa58b68, //   Pedra envelhecida
    brown: 0x8b6749, //       Marrom
    brownDark: 0x594330, //   Marrom escuro (sombras quentes)
    wood: 0x79553b, //        Madeira
    terracotta: 0xb96f4c, //  Terracota
    olive: 0x85865b, //       Verde oliva
    greenDark: 0x4c5d43, //   Verde escuro
    cloth: 0xe8d9bd, //       Tecido claro
    sky: 0xa9c5d1, //        Azul suave
    gold: 0xd9bd79, //       Dourado
    // tintas e sombras (derivadas da paleta, sempre quentes: nunca preto puro)
    ink: 0x3b2a1e,
    shadow: 0x5a4636,
    windowDark: 0x2f2219,
    cloudWhite: 0xf4ecd8,
  },

  /** Traço "à mão". */
  ink: {
    wobble: 1.3, //            irregularidade do contorno (px)
    outlineWidth: 2, //        espessura padrão do contorno
    outlineAlpha: 0.82,
    innerStrokeScale: 0.5, //  segundo traço (mais fino e mais irregular)
    innerStrokeAlpha: 0.35,
    bleedAlpha: 0.32, //       "escorrido" de aquarela no preenchimento
    bleedLighten: 0.14,
    thinWidth: 1.2, //         contorno de detalhes (juntas, tábuas)
  },

  /** Materiais (texturas repetíveis). */
  texture: {
    tileSize: 256,
    irregularity: 0.35, //     0 = regular, 1 = muito irregular
    wear: 0.25, //             quantidade de desgaste/rachaduras
    detail: 0.7, //            densidade de detalhes finos (0.3 = leve, 1 = rico)
    toneVariation: 0.12, //    variação de tom entre pedras/tábuas vizinhas
  },

  shading: {
    softness: 0.8, //          suavidade das sombras pintadas
    contrast: 0.35, //         contraste luz/sombra
    shadowAlpha: 0.22, //      sombra de forma (lado oposto à luz)
    contactShadowAlpha: 0.26, // sombra de contato no chão
  },

  /** A luz vem da ESQUERDA e de cima; sombras caem à direita/baixo. */
  light: {
    from: 'left',
    warmth: 0.12, //           quanto o realce tende ao creme quente
  },

  /** Escalas de referência em px de mundo (jogador ~65 px de altura). */
  scale: {
    playerHeight: 65,
    doorHeight: 64,
    windowHeight: 22,
    stepWidth: 64,
  },
} as const;

export type VisualTheme = typeof JERUSALEM_VISUAL_THEME;
export type PaletteKey = keyof VisualTheme['palette'];

/** Inteiro 0xRRGGBB -> "#rrggbb". */
export const css = (c: number): string => '#' + c.toString(16).padStart(6, '0');
