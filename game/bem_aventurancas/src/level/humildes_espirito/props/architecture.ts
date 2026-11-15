import { JERUSALEM_VISUAL_THEME as T } from '../style/JerusalemVisualTheme';
import { Ink, Pt, Rng, darken, lighten, mix, varyTone } from '../../../worlds/jerusalem/HandDrawn';
import type { MaterialId } from '../materials/MaterialLibrary';
import type { PropDef, PropContext, PropKind } from './types';
import { arc, doorAt, parapet, stepsRight, toneOfMaterial, wallBody, windowAt } from './components';

const P = T.palette;
const matOf = (ctx: PropContext, fallback: MaterialId): MaterialId => ctx.mat ?? fallback;

/** Sobe o canal de vigas de madeira (cabeças de viga) sob o parapeito. */
function beams(ink: Ink, x: number, y: number, w: number, n: number): void {
  for (let i = 0; i < n; i++) ink.rectMaterial(x + 8 + (i * (w - 30)) / Math.max(1, n - 1), y, 11, 7, 'wood_beam', { width: 1.2 });
}

/** Moringa, lenha ou varal sobre o terraço (detalhes de vida cotidiana). */
function roofLife(ink: Ink, rng: Rng, x0: number, x1: number, roofY: number): void {
  if (x1 - x0 < 40) return;
  const kind = rng.int(0, 2);
  const x = rng.range(x0 + 6, x1 - 34);
  if (kind === 0) {
    ink.ellipse(x + 10, roofY - 12, 10, 13, P.terracotta, { width: 1.6 });
    ink.rect(x + 5, roofY - 28, 10, 6, darken(P.terracotta, 0.2), { width: 1.4 });
  } else if (kind === 1) {
    ink.line(x, roofY - 40, x + 46, roofY - 38, P.brownDark, 1.6);
    ink.poly([{ x: x + 8, y: roofY - 39 }, { x: x + 36, y: roofY - 38 }, { x: x + 34, y: roofY - 14 }, { x: x + 10, y: roofY - 15 }], rng.pick([P.cloth, P.terracotta, P.olive]), { width: 1.4 });
  } else {
    for (let i = 0; i < 3; i++) ink.rectMaterial(x + i * 4, roofY - 14 - i * 8, 26, 8, 'wood_boards', { width: 1.2 });
  }
}

export const ARCHITECTURE: Partial<Record<PropKind, PropDef>> = {
  /* Casa de dois pavimentos, terraço plano e parapeito. */
  house: {
    category: 'architecture', label: 'Casa de dois pavimentos', variants: 8, materialRole: 'house', defaultMaterial: 'wall_limestone',
    solid: { widthFrac: 0.96 },
    size: (r) => ({ w: r.int(210, 330), h: r.int(190, 300) }),
    draw(ink, w, h, rng, ctx) {
      const mat = matOf(ctx, 'wall_limestone');
      const tone = toneOfMaterial(mat);
      const lowH = Math.round(h * 0.6);
      ink.contactShadow(w / 2, h - 2, w * 0.52, 8);
      wallBody(ink, 0, h - lowH, w, lowH, mat);
      parapet(ink, 0, h - lowH - 8, w, tone);
      let upX = 0;
      let upW = 0;
      if (h > 200) {
        upW = Math.round(w * rng.range(0.55, 0.8));
        upX = rng.chance(0.5) ? 4 : w - upW - 4;
        wallBody(ink, upX, 12, upW, h - lowH - 18, rng.chance(0.4) ? 'wall_plaster' : mat, undefined, 0.9);
        parapet(ink, upX, 4, upW, tone);
        windowAt(ink, rng, upX + upW * rng.range(0.2, 0.5), 36, 16, 24, tone, rng.chance(0.4));
        if (rng.chance(0.5)) windowAt(ink, rng, upX + upW * rng.range(0.6, 0.8), 36, 14, 22, tone);
        beams(ink, upX, 14, upW, 3);
      }
      const dw = rng.int(30, 38);
      const dh = Math.min(lowH - 14, 64);
      const dx = rng.range(20, w - dw - 20);
      doorAt(ink, rng, dx, h - 2, dw, dh, tone, rng.chance(0.35) ? 'arch' : 'plank');
      for (let i = 0; i < rng.int(0, 2); i++) {
        const wx = rng.range(14, w - 30);
        if (Math.abs(wx - dx) > dw + 14) windowAt(ink, rng, wx, h - lowH + 16, 14, 20, tone);
      }
      if (rng.chance(0.6)) roofLife(ink, rng, upX === 4 ? upW + 8 : 4, upX === 4 ? w : upX - 6, h - lowH - 8);
    },
  },

  /* Casa pequena de um pavimento. */
  houseSmall: {
    category: 'architecture', label: 'Casa pequena de pedra', variants: 6, materialRole: 'house', defaultMaterial: 'wall_limestone',
    solid: { widthFrac: 0.96 },
    size: (r) => ({ w: r.int(140, 210), h: r.int(112, 160) }),
    draw(ink, w, h, rng, ctx) {
      const mat = matOf(ctx, 'wall_limestone');
      const tone = toneOfMaterial(mat);
      ink.contactShadow(w / 2, h - 2, w * 0.52, 7);
      wallBody(ink, 0, 12, w, h - 12, mat);
      parapet(ink, 0, 4, w, tone);
      const dw = rng.int(28, 34);
      const dx = rng.range(16, w - dw - 16);
      doorAt(ink, rng, dx, h - 2, dw, Math.min(h - 28, 58), tone, rng.chance(0.3) ? 'arch' : 'plank');
      const wx = dx > w / 2 ? rng.range(12, dx - 30) : rng.range(dx + dw + 16, w - 28);
      if (wx > 8 && wx < w - 24) windowAt(ink, rng, wx, 30, 14, 20, tone);
      beams(ink, 0, 14, w, 3);
      if (rng.chance(0.5)) roofLife(ink, rng, 4, w - 4, 4);
    },
  },

  /* Casa com escada externa de pedra e terraço com pérgola de madeira e toldo. */
  houseTerrace: {
    category: 'architecture', label: 'Casa com escada externa e terraço', variants: 5, materialRole: 'house', defaultMaterial: 'wall_limestone',
    solid: { widthFrac: 0.96 },
    size: (r) => ({ w: r.int(270, 350), h: r.int(220, 280) }),
    draw(ink, w, h, rng, ctx) {
      const mat = matOf(ctx, 'wall_limestone');
      const tone = toneOfMaterial(mat);
      const left = rng.chance(0.5);
      const stairW = 112;
      const bx = left ? stairW : 0; // bloco principal
      const bw = w - stairW;
      const lowH = Math.round(h * 0.55);
            ink.contactShadow(w / 2, h - 2, w * 0.52, 8);
      // casa
      wallBody(ink, bx, h - lowH, bw, lowH, mat);
      parapet(ink, bx, h - lowH - 8, bw, tone);
      const upW = bw * 0.72;
      const upX = bx + (left ? bw - upW - 6 : 6);
      wallBody(ink, upX, 18, upW, h - lowH - 24, rng.chance(0.5) ? 'wall_plaster' : mat, undefined, 0.9);
      parapet(ink, upX, 10, upW, tone);
      windowAt(ink, rng, upX + upW * 0.3, 44, 16, 26, tone, true);
      windowAt(ink, rng, upX + upW * 0.65, 44, 16, 26, tone);
      // escada externa com muro lateral, levando ao terraço do pavimento térreo
      const sx = left ? 0 : bw;
      stepsRight(ink, rng, sx, h - 2, stairW, 5, lowH / 5, 'wall_retaining', tone);
      // pérgola de madeira com toldo sobre o terraço
      const px = left ? bx + 8 : bx + bw - 80;
      ink.rectMaterial(px, h - lowH - 62, 5, 54, 'wood_beam', { width: 1.2 });
      ink.rectMaterial(px + 72, h - lowH - 62, 5, 54, 'wood_beam', { width: 1.2 });
      ink.rectMaterial(px - 4, h - lowH - 66, 86, 7, 'wood_boards', { width: 1.5 });
      const cloth = rng.pick([P.cloth, P.terracotta, mix(P.sand, P.terracotta, 0.3)]);
      ink.poly([{ x: px - 2, y: h - lowH - 60 }, { x: px + 80, y: h - lowH - 60 }, { x: px + 76, y: h - lowH - 44 }, { x: px + 4, y: h - lowH - 42 }], cloth, { alpha: 0.95, width: 1.4 });
      doorAt(ink, rng, bx + bw * (left ? 0.62 : 0.2), h - 2, 32, 60, tone, 'plank');
    },
  },

  /* Escada externa de pedra com muro lateral (para becos e desníveis). */
  stairsExt: {
    category: 'architecture', label: 'Escada externa de pedra', variants: 3, materialRole: 'retaining', defaultMaterial: 'wall_retaining',
    solid: { widthFrac: 0.9 },
    size: (r) => ({ w: r.int(130, 180), h: r.int(70, 100) }),
    draw(ink, w, h, rng, ctx) {
      const mat = matOf(ctx, 'wall_retaining');
      const tone = toneOfMaterial(mat);
      ink.contactShadow(w / 2, h - 2, w * 0.5, 6);
      const n = rng.int(4, 5);
      const sh = (h - 10) / n;
      stepsRight(ink, rng, 0, h - 2, w - 14, n, sh, mat, tone);
      ink.rectMaterial(w - 16, 10, 16, h - 12, mat, { width: 1.8 }); // muro lateral (altura do último degrau)
      ink.rect(w - 19, 4, 22, 9, darken(tone, 0.14), { width: 1.6 });
    },
  },

  /* Rampa de pedra com muro lateral. */
  rampStone: {
    category: 'architecture', label: 'Rampa de pedra', variants: 2, materialRole: 'retaining', defaultMaterial: 'wall_retaining',
    solid: { widthFrac: 0.9 },
    size: (r) => ({ w: r.int(120, 180), h: r.int(44, 64) }),
    draw(ink, w, h, rng, ctx) {
      const mat = matOf(ctx, 'wall_retaining');
      ink.contactShadow(w / 2, h - 1, w * 0.5, 5);
      ink.material([{ x: 0, y: h - 2 }, { x: w, y: h - 2 }, { x: w, y: 4 }], mat, { width: 2.2 });
      ink.clipped([{ x: 0, y: h - 2 }, { x: w, y: h - 2 }, { x: w, y: 4 }], () => {
        ink.soft(0, 0, w, h, P.shadow, 0.3, 'bottom');
        ink.soft(0, 0, w * 0.4, h, P.cloudWhite, 0.2, 'left');
      });
      for (let i = 1; i < 5; i++) ink.line((w * i) / 5, h - 3, (w * i) / 5 + 4, h - 3 - (h - 8) * (i / 5), P.ink, 1.2, 0.35); // sulcos de tração
      void rng;
    },
  },

  /* Muro de contenção. */
  wall: {
    category: 'architecture', label: 'Muro de contenção', variants: 4, materialRole: 'retaining', defaultMaterial: 'wall_retaining',
    solid: { widthFrac: 0.98 },
    size: (r) => ({ w: r.int(200, 340), h: r.int(70, 120) }),
    draw(ink, w, h, rng, ctx) {
      const mat = matOf(ctx, 'wall_retaining');
      ink.contactShadow(w / 2, h - 1, w * 0.5, 6);
      wallBody(ink, 0, 0, w, h, mat, undefined, 1.1);
      parapet(ink, 0, -2, w, toneOfMaterial(mat));
      ink.strokes(0, h * 0.6, w, h * 0.4, P.greenDark, 8, 0.18, 14);
      void rng;
    },
  },

  /* Muro baixo (divisas, bordas de terraço). */
  wallLow: {
    category: 'architecture', label: 'Muro baixo', variants: 3, materialRole: 'retaining', defaultMaterial: 'wall_retaining',
    solid: { widthFrac: 0.98 },
    size: (r) => ({ w: r.int(120, 200), h: r.int(34, 50) }),
    draw(ink, w, h, rng, ctx) {
      const mat = matOf(ctx, 'wall_retaining');
      ink.contactShadow(w / 2, h - 1, w * 0.5, 4);
      wallBody(ink, 0, 8, w, h - 8, mat, undefined, 1);
      ink.rect(-2, 0, w + 4, 10, darken(toneOfMaterial(mat), 0.1), { width: 1.8 });
      void rng;
    },
  },

  /* Passagem em arco de pedra entre duas construções. */
  archway: {
    category: 'architecture', label: 'Passagem em arco', variants: 2, materialRole: 'retaining', defaultMaterial: 'wall_retaining',
    solid: { widthFrac: 0.98 },
    size: (r) => ({ w: r.int(170, 220), h: r.int(190, 240) }),
    draw(ink, w, h, rng, ctx) {
      const mat = matOf(ctx, 'wall_retaining');
      const tone = toneOfMaterial(mat);
      ink.contactShadow(w / 2, h - 2, w * 0.5, 8);
      wallBody(ink, 0, 0, w, h, mat);
      parapet(ink, 0, -4, w, tone);
      const aw = w * 0.42;
      const ah = h * 0.7;
      const ax = (w - aw) / 2;
      const r = aw / 2;
      const hole: Pt[] = [{ x: ax, y: h - 2 }, { x: ax, y: h - ah + r }, ...arc(w / 2, h - ah + r, r, r, Math.PI, Math.PI * 2, 10), { x: ax + aw, y: h - 2 }];
      for (let i = 0; i < 11; i++) {
        const a0 = Math.PI + (Math.PI * i) / 11;
        const a1 = Math.PI + (Math.PI * (i + 1)) / 11;
        const cx = w / 2;
        const cy = h - ah + r;
        const rr = r + 14;
        ink.poly([{ x: cx + Math.cos(a0) * r, y: cy + Math.sin(a0) * r }, { x: cx + Math.cos(a0) * rr, y: cy + Math.sin(a0) * rr }, { x: cx + Math.cos(a1) * rr, y: cy + Math.sin(a1) * rr }, { x: cx + Math.cos(a1) * r, y: cy + Math.sin(a1) * r }], varyTone(lighten(tone, 0.2), rng, 0.08), { width: 1.4, bleed: false });
      }
      ink.poly(hole, P.windowDark, { width: 2.4 });
      ink.clipped(hole, () => {
        ink.soft(ax, h - ah, aw, ah, P.gold, 0.18, 'bottom'); // luz da rua ao fundo
        ink.soft(ax, h - ah, aw, 30, P.ink, 0.5, 'top');
      });
    },
  },

  /* Coluna (ordem coríntia simplificada, pedra clara). */
  column: {
    category: 'architecture', label: 'Coluna', variants: 2, materialRole: 'monumental', defaultMaterial: 'wall_temple',
    solid: { widthFrac: 0.85 },
    size: (r) => ({ w: r.int(44, 52), h: r.int(190, 230) }),
    draw(ink, w, h, rng) {
      const tone = lighten(P.stoneLight, 0.1);
      const cx = w / 2;
      ink.contactShadow(cx, h - 1, w * 0.6, 6);
      ink.rect(2, h - 16, w - 4, 15, darken(tone, 0.08), { width: 1.8 }); // base
      ink.rect(8, 26, w - 16, h - 42, tone, { width: 2 }); // fuste
      for (let i = 1; i < 4; i++) ink.line(8 + ((w - 16) * i) / 4, 28, 8 + ((w - 16) * i) / 4, h - 18, darken(tone, 0.3), 1.2, 0.45); // caneluras
      ink.soft(8, 26, w - 16, h - 42, P.shadow, 0.3, 'right');
      ink.soft(8, 26, (w - 16) * 0.35, h - 42, P.cloudWhite, 0.3, 'left');
      ink.poly([{ x: 0, y: 2 }, { x: w, y: 2 }, { x: w - 5, y: 14 }, { x: w - 8, y: 28 }, { x: 8, y: 28 }, { x: 5, y: 14 }], lighten(tone, 0.06), { width: 1.8 }); // capitel
      for (let i = 0; i < 3; i++) ink.ellipse(cx + (i - 1) * 9, 16, 4, 7, darken(tone, 0.12), { width: 1, alpha: 0.7 }); // folhas de acanto
      void rng;
    },
  },

  /* Base de coluna isolada (plinto + toro). */
  columnBase: {
    category: 'architecture', label: 'Base de coluna', variants: 2, materialRole: 'monumental', defaultMaterial: 'wall_temple',
    solid: { widthFrac: 0.9 },
    size: (r) => ({ w: r.int(54, 66), h: r.int(30, 38) }),
    draw(ink, w, h, rng, ctx) {
      const mat = matOf(ctx, 'wall_temple');
      const tone = toneOfMaterial(mat);
      ink.contactShadow(w / 2, h - 1, w * 0.55, 4);
      wallBody(ink, 0, h * 0.5, w, h * 0.5 - 1, mat, undefined, 0.9); // plinto
      ink.ellipse(w / 2, h * 0.42, w * 0.4, h * 0.2, lighten(tone, 0.1), { width: 1.6 }); // toro
      ink.ellipse(w / 2, h * 0.2, w * 0.3, h * 0.14, lighten(tone, 0.16), { width: 1.6 });
      void rng;
    },
  },

  /* Muro monumental estilo herodiano (blocos com margem rebaixada). */
  templeWall: {
    category: 'architecture', label: 'Muro monumental (herodiano)', variants: 3, materialRole: 'monumental', defaultMaterial: 'wall_temple',
    solid: { widthFrac: 0.98 },
    size: (r) => ({ w: r.int(400, 520), h: r.int(250, 300) }),
    draw(ink, w, h, rng, ctx) {
      const mat = matOf(ctx, 'wall_temple');
      const tone = toneOfMaterial(mat);
      wallBody(ink, 0, 0, w, h, mat, undefined, 1);
      ink.rect(-4, -4, w + 8, 16, lighten(tone, 0.15), { width: 2.4 }); // cornija
      ink.rect(-4, 12, w + 8, 6, darken(tone, 0.2), { width: 1.6 });
      ink.soft(0, 18, w, h * 0.2, P.cloudWhite, 0.18, 'top');
      void rng;
    },
  },

  /* Escadaria ampla do Templo. */
  templeStairs: {
    category: 'architecture', label: 'Escadaria ampla do Templo', variants: 2, materialRole: 'monumental', defaultMaterial: 'wall_temple',
    solid: { widthFrac: 0.96 },
    size: (r) => ({ w: r.int(300, 380), h: r.int(64, 84) }),
    draw(ink, w, h, rng, ctx) {
      const mat = matOf(ctx, 'wall_temple');
      const tone = toneOfMaterial(mat);
      ink.contactShadow(w / 2, h - 1, w * 0.52, 6);
      const n = 5;
      const sh = (h - 4) / n;
      for (let i = 0; i < n; i++) {
        const inset = i * 10; // degraus recuados: forma de pirâmide truncada
        const y = h - 2 - sh * (i + 1);
        ink.rectMaterial(inset, y, w - inset * 2, sh + 0.5, mat, { width: 1.8, tint: varyTone(tone, rng, 0.08), tintAlpha: 0.12 });
        ink.soft(inset, y, w - inset * 2, sh * 0.5, P.cloudWhite, 0.3, 'top');
        ink.soft(inset, y + sh * 0.5, w - inset * 2, sh * 0.5, P.shadow, 0.22, 'bottom');
      }
    },
  },

  /* Blocos de pedra monumentais empilhados (obras do Templo de Herodes). */
  templeBlocks: {
    category: 'architecture', label: 'Blocos monumentais empilhados', variants: 3, materialRole: 'monumental', defaultMaterial: 'wall_temple',
    solid: { widthFrac: 0.95 },
    size: (r) => ({ w: r.int(120, 180), h: r.int(52, 84) }),
    draw(ink, w, h, rng, ctx) {
      const mat = matOf(ctx, 'wall_temple');
      ink.contactShadow(w / 2, h - 1, w * 0.55, 5);
      const rows = h > 66 ? 2 : 1;
      const rh = (h - 2) / rows;
      for (let r = 0; r < rows; r++) {
        const n = rows === 2 ? (r === 0 ? 2 : 1) : 2;
        const bw = (w - 6) / n;
        for (let i = 0; i < n; i++) {
          const x = 3 + i * bw + (r ? w * 0.12 : 0);
          const bww = bw - 3 - (r ? w * 0.1 : 0);
          wallBody(ink, x, h - 2 - rh * (r + 1), bww, rh - 1.5, mat, varyTone(P.limestone, rng, 0.1), 1);
        }
      }
    },
  },

  /* Portão monumental (fim do percurso): só a fachada externa. */
  gate: {
    category: 'architecture', label: 'Portão monumental', variants: 1, materialRole: 'monumental', defaultMaterial: 'wall_temple',
    size: () => ({ w: 340, h: 300 }),
    draw(ink, w, h, rng, ctx) {
      const mat = matOf(ctx, 'wall_temple');
      const tone = toneOfMaterial(mat);
      ink.contactShadow(w / 2, h - 2, w * 0.5, 8);
      wallBody(ink, 0, 20, w, h - 20, mat);
      const gw = 118;
      const gh = 196;
      const gx = (w - gw) / 2;
      ink.rect(gx - 16, h - gh - 24, gw + 32, gh + 22, darken(tone, 0.22), { width: 2.4 }); // moldura
      ink.rect(gx - 30, h - gh - 46, gw + 60, 24, lighten(tone, 0.12), { width: 2.4 }); // arquitrave
      const hole: Pt[] = [{ x: gx, y: h - 2 }, { x: gx, y: h - gh + 20 }, ...arc(w / 2, h - gh + 20, gw / 2, 20, Math.PI, Math.PI * 2, 8), { x: gx + gw, y: h - 2 }];
      ink.poly(hole, 0x3a2c22, { width: 2.4 });
      ink.clipped(hole, () => {
        ink.soft(gx, h - gh, gw, gh, P.gold, 0.2, 'bottom'); // luz ao fundo
        ink.soft(gx, h - gh, gw, 50, P.ink, 0.45, 'top');
      });
      for (let i = 0; i < 3; i++) ink.rect(gx - 40 - i * 6, h - 12 + i * 4, gw + 80 + i * 12, 10, lighten(tone, 0.1 + i * 0.04), { width: 1.6 }); // degraus
      ink.rect(-4, 8, w + 8, 18, lighten(tone, 0.2), { width: 2.6 }); // cornija
      void rng;
    },
  },

  /* Santuário do Templo visto ao longe (perspectiva atmosférica: tons suavizados). */
  templeFar: {
    category: 'architecture', label: 'Templo ao horizonte', variants: 1,
    size: () => ({ w: 760, h: 430 }),
    draw(ink, w, h, rng) {
      const haze = (c: number) => mix(c, P.sky, 0.28);
      const stone = haze(mix(P.limestone, P.stoneLight, 0.5));
      const gold = haze(mix(P.gold, P.stoneLight, 0.25));
      const cx = w / 2;
      ink.rectMaterial(0, h - 120, w, 120, 'wall_temple', { width: 2.6, tint: P.sky, tintAlpha: 0.28 }); // terraço monumental
      ink.rect(cx - 250, h - 250, 130, 130, haze(P.stoneLight), { width: 2.4 });
      ink.rect(cx + 120, h - 250, 130, 130, haze(P.stoneLight), { width: 2.4 });
      ink.rect(cx - 120, h - 400, 240, 280, gold, { width: 2.8 });
      ink.soft(cx - 120, h - 400, 240, 90, P.cloudWhite, 0.32, 'top');
      ink.soft(cx - 120, h - 400, 240, 280, P.shadow, 0.2, 'right');
      for (let i = 0; i < 6; i++) ink.rect(cx - 96 + i * 36, h - 300, 14, 180, haze(P.stoneLight), { width: 1.6 }); // colunata
      ink.rect(cx - 40, h - 232, 80, 112, 0x3a2c22, { width: 2, alpha: 0.85 }); // pórtico
      ink.rect(cx - 130, h - 412, 260, 16, haze(P.gold), { width: 2 });
      for (let i = 0; i < 14; i++) ink.line(cx - 120 + i * 18, h - 412, cx - 120 + i * 18, h - 428, haze(P.gold), 2.2, 0.9);
      ink.strokes(0, 0, w, h, P.cloudWhite, 30, 0.12, 30);
      void stone;
      void rng;
    },
  },
};
