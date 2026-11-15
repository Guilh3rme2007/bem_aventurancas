import { JERUSALEM_VISUAL_THEME as T } from '../style/JerusalemVisualTheme';
import { Ink, Pt, Rng, darken, lighten, mix, varyTone } from '../HandDrawn';
import type { PropDef, PropKind } from './types';
import { fruit, jar } from './components';

const P = T.palette;

/** Cores de frutas e grãos: em tom de paleta, sem saturação excessiva. */
const FRUIT = [mix(P.terracotta, 0x7a2f2a, 0.5), 0x6b4e71, P.olive, P.gold, P.terracotta, mix(P.gold, P.terracotta, 0.4)];
const GRAIN = [P.sand, P.stoneLight, mix(P.sand, P.brown, 0.3)];

function sackShape(ink: Ink, rng: Rng, x: number, baseY: number, w: number, h: number, open = false): void {
  const tone = varyTone(mix(P.cloth, P.sand, 0.4), rng, 0.08);
  const pts: Pt[] = [{ x: x + 3, y: baseY - 1 }, { x: x + w - 3, y: baseY - 1 }, { x: x + w - 1, y: baseY - h * 0.55 }, { x: x + w * 0.68, y: baseY - h * 0.84 }, { x: x + w * 0.32, y: baseY - h * 0.84 }, { x: x + 1, y: baseY - h * 0.55 }];
  ink.poly(pts, tone, { width: 1.8 });
  ink.clipped(pts, () => {
    ink.soft(x, baseY - h, w, h, P.shadow, 0.3, 'right');
    ink.soft(x, baseY - h, w * 0.3, h, P.cloudWhite, 0.3, 'left');
  });
  ink.strokes(x + 3, baseY - h * 0.8, w - 6, h * 0.7, darken(tone, 0.4), 6, 0.14, 12);
  if (open) {
    ink.ellipse(x + w / 2, baseY - h * 0.84, w * 0.22, 4, rng.pick(GRAIN), { width: 1.2 }); // grãos à mostra
  } else {
    ink.line(x + w * 0.3, baseY - h * 0.82, x + w * 0.7, baseY - h * 0.82, P.brownDark, 2.2); // amarra
  }
}

function basketBody(ink: Ink, x: number, baseY: number, w: number, h: number): void {
  const top = baseY - h;
  const pts: Pt[] = [{ x: x + 2, y: top }, { x: x + w - 2, y: top }, { x: x + w - 8, y: baseY - 2 }, { x: x + 8, y: baseY - 2 }];
  ink.poly(pts, mix(P.sand, P.brown, 0.35), { width: 1.8 });
  ink.clipped(pts, () => {
    for (let i = 1; i < 6; i++) ink.line(x + 4 + (i * (w - 8)) / 6, top, x + 9 + (i * (w - 18)) / 6, baseY, P.brownDark, 1, 0.4);
    for (let k = 1; k < 4; k++) ink.line(x, top + k * (h / 4), x + w, top + k * (h / 4), P.brownDark, 1, 0.35);
    ink.soft(x, top, w, h, P.shadow, 0.26, 'right');
  });
}

export const MARKET: Partial<Record<PropKind, PropDef>> = {
  /* Barraca de mercado: postes e bancada de madeira, toldo de tecido recortado. */
  stall: {
    category: 'market', label: 'Barraca com toldo', variants: 5, solid: { widthFrac: 0.92 },
    size: (r) => ({ w: r.int(150, 215), h: r.int(150, 178) }),
    draw(ink, w, h, rng) {
      const cloth = rng.pick([P.terracotta, P.olive, mix(P.sand, P.terracotta, 0.35), mix(P.cloth, P.terracotta, 0.3), mix(P.gold, P.brown, 0.3), mix(P.olive, P.greenDark, 0.4)]);
      ink.contactShadow(w / 2, h - 2, w * 0.5, 8);
      ink.rectMaterial(6, 20, 9, h - 22, 'wood_beam', { width: 1.6, shift: { x: 0, y: 0 } });
      ink.rectMaterial(w - 15, 20, 9, h - 22, 'wood_beam', { width: 1.6, shift: { x: 0, y: 0 } });
      const ty = h * 0.62;
      ink.rectMaterial(2, ty + 6, w - 4, h * 0.34, 'wood_boards', { width: 2 });
      ink.soft(2, ty + 6, w - 4, h * 0.34, P.shadow, 0.3, 'bottom');
      ink.rectMaterial(-2, ty - 2, w + 4, 9, 'wood_boards', { width: 1.8, tint: P.stoneLight, tintAlpha: 0.15 });
      const n = Math.floor(w / 36);
      for (let i = 0; i < n; i++) {
        const cx = 22 + (i * (w - 44)) / Math.max(1, n - 1);
        const roll = rng.next();
        if (roll < 0.4) {
          basketBody(ink, cx - 15, ty - 3, 30, 14);
          for (let k = 0; k < 4; k++) fruit(ink, cx - 9 + k * 6, ty - 17 - rng.range(0, 3), 4.6, rng.pick(FRUIT));
        } else if (roll < 0.7) {
          ink.poly(ink.ellipsePts(cx, ty - 8, 12, 5), P.sand, { width: 1.4 }); // pães no pano
          for (let k = 0; k < 3; k++) ink.ellipse(cx - 7 + k * 7, ty - 11, 5, 3.4, mix(P.sand, P.terracotta, 0.35), { width: 1.1 });
        } else {
          jar(ink, rng, cx, ty - 2, 15, 22, varyTone(P.terracotta, rng, 0.15), 'pot');
        }
      }
      // toldo com borda recortada, listras e sombra sobre a bancada
      const aw = h * 0.3;
      const awning: Pt[] = [{ x: -8, y: 6 }, { x: w + 8, y: 6 }];
      const sc = Math.max(4, Math.floor(w / 26));
      for (let i = sc; i >= 0; i--) awning.push({ x: -8 + ((w + 16) * i) / sc, y: 6 + aw + (i % 2 ? 9 : 0) });
      ink.poly(awning, cloth, { width: 2.2 });
      ink.clipped(awning, () => {
        for (let i = 0; i < sc; i += 2) ink.wash(-8 + ((w + 16) * i) / sc, 8, (w + 16) / sc, aw + 12, lighten(cloth, 0.3), 0.22);
        ink.soft(-8, 6, w + 16, aw + 12, P.shadow, 0.3, 'bottom');
        ink.soft(-8, 6, (w + 16) * 0.3, aw + 12, P.cloudWhite, 0.2, 'left');
      });
      if (rng.chance(0.7)) sackShape(ink, rng, rng.chance(0.5) ? 2 : w - 40, h - 2, 36, 36, rng.chance(0.5));
    },
  },

  basket: {
    category: 'market', label: 'Cesto com frutas', variants: 4, solid: { widthFrac: 0.8 },
    size: (r) => ({ w: r.int(40, 58), h: r.int(34, 48) }),
    draw(ink, w, h, rng) {
      ink.contactShadow(w / 2, h - 1, w * 0.5, 5, 0.3);
      basketBody(ink, 0, h, w, h * 0.62);
      const c = rng.pick(FRUIT);
      for (let i = 0; i < 6; i++) fruit(ink, 8 + (i * (w - 16)) / 5, h * 0.36 - (i % 2) * 3, 5.2, rng.chance(0.7) ? c : rng.pick(FRUIT));
    },
  },

  crate: {
    category: 'market', label: 'Caixa de madeira', variants: 3, solid: { widthFrac: 0.95 },
    size: (r) => ({ w: r.int(40, 60), h: r.int(30, 44) }),
    draw(ink, w, h) {
      ink.contactShadow(w / 2, h - 1, w * 0.55, 5, 0.3);
      ink.rectMaterial(0, 0, w, h - 2, 'wood_boards', { width: 2 });
      ink.shadeBox(0, 0, w, h - 2, 0.9);
      ink.line(0, 2, w, h - 4, P.brownDark, 1.6, 0.45); // travessa em diagonal
      ink.outlineRect(0, 0, w, h - 2, P.ink, 2);
    },
  },

  sack: {
    category: 'market', label: 'Saco de grãos', variants: 3, solid: { widthFrac: 0.8 },
    size: (r) => ({ w: r.int(28, 40), h: r.int(34, 46) }),
    draw(ink, w, h, rng) {
      ink.contactShadow(w / 2, h - 1, w * 0.5, 4, 0.3);
      sackShape(ink, rng, 0, h, w, h, rng.chance(0.4));
    },
  },

  sackPile: {
    category: 'market', label: 'Pilha de sacos', variants: 3, solid: { widthFrac: 0.9 },
    size: (r) => ({ w: r.int(70, 92), h: r.int(56, 72) }),
    draw(ink, w, h, rng) {
      ink.contactShadow(w / 2, h - 1, w * 0.55, 5, 0.3);
      const sw = w * 0.46;
      const sh = h * 0.5;
      sackShape(ink, rng, 0, h, sw, sh);
      sackShape(ink, rng, w - sw, h, sw, sh, rng.chance(0.5));
      sackShape(ink, rng, w / 2 - sw / 2, h - sh * 0.72, sw, sh, rng.chance(0.5));
    },
  },

  pot: {
    category: 'market', label: 'Vaso de barro', variants: 4, solid: { widthFrac: 0.75 },
    size: (r) => ({ w: r.int(26, 36), h: r.int(32, 46) }),
    draw(ink, w, h, rng) {
      jar(ink, rng, w / 2, h, w, h, varyTone(P.terracotta, rng, 0.15), 'pot');
    },
  },

  amphora: {
    category: 'market', label: 'Ânfora', variants: 3, solid: { widthFrac: 0.7 },
    size: (r) => ({ w: r.int(30, 40), h: r.int(62, 84) }),
    draw(ink, w, h, rng) {
      jar(ink, rng, w / 2, h, w, h, varyTone(mix(P.terracotta, P.sand, 0.25), rng, 0.12), 'amphora');
    },
  },

  jarCluster: {
    category: 'market', label: 'Grupo de jarros', variants: 4, solid: { widthFrac: 0.85 },
    size: (r) => ({ w: r.int(70, 100), h: r.int(50, 74) }),
    draw(ink, w, h, rng) {
      const tones = () => varyTone(mix(P.terracotta, P.sand, rng.range(0, 0.4)), rng, 0.12);
      jar(ink, rng, w * 0.3, h, w * 0.36, h * 0.8, tones(), 'amphora');
      jar(ink, rng, w * 0.72, h - 2, w * 0.34, h * 0.62, tones(), 'pot');
      jar(ink, rng, w * 0.5, h + 1, w * 0.3, h * 0.42, tones(), 'bowl');
    },
  },

  fruitCrate: {
    category: 'market', label: 'Caixa de frutas', variants: 4, solid: { widthFrac: 0.9 },
    size: (r) => ({ w: r.int(50, 66), h: r.int(40, 54) }),
    draw(ink, w, h, rng) {
      ink.contactShadow(w / 2, h - 1, w * 0.55, 5, 0.3);
      const ch = h * 0.46;
      const c1 = rng.pick(FRUIT);
      for (let row = 0; row < 2; row++)
        for (let i = 0; i < 6 - row; i++) fruit(ink, 7 + row * 4.5 + i * ((w - 14) / 5), h - ch - 4 - row * 7, 5.6, rng.chance(0.75) ? c1 : rng.pick(FRUIT));
      ink.rectMaterial(0, h - ch, w, ch - 1, 'wood_boards', { width: 2 });
      ink.shadeBox(0, h - ch, w, ch - 1, 0.9);
      ink.outlineRect(0, h - ch, w, ch - 1, P.ink, 2);
    },
  },

  breadBasket: {
    category: 'market', label: 'Cesto de pães', variants: 3, solid: { widthFrac: 0.8 },
    size: (r) => ({ w: r.int(44, 60), h: r.int(34, 46) }),
    draw(ink, w, h, rng) {
      ink.contactShadow(w / 2, h - 1, w * 0.5, 5, 0.3);
      basketBody(ink, 0, h, w, h * 0.55);
      const n = 4;
      for (let i = 0; i < n; i++) {
        const cx = 9 + (i * (w - 18)) / (n - 1);
        const cy = h * 0.42 - (i % 2) * 4;
        ink.ellipse(cx, cy, 8.5, 5.6, varyTone(mix(P.sand, P.terracotta, 0.4), rng, 0.1), { width: 1.3 });
        ink.line(cx - 4, cy - 2, cx - 1, cy + 2, P.brownDark, 1, 0.5); // cortes do pão
        ink.line(cx + 1, cy - 2, cx + 4, cy + 2, P.brownDark, 1, 0.5);
      }
    },
  },

  clothRolls: {
    category: 'market', label: 'Rolos de tecido', variants: 4, solid: { widthFrac: 0.9 },
    size: (r) => ({ w: r.int(60, 80), h: r.int(50, 64) }),
    draw(ink, w, h, rng) {
      ink.contactShadow(w / 2, h - 1, w * 0.55, 5, 0.3);
      ink.rectMaterial(0, h * 0.62, w, h * 0.38 - 1, 'wood_boards', { width: 2 });
      ink.rectMaterial(0, h * 0.28, w, 5, 'wood_boards', { width: 1.6 });
      const cols = [P.terracotta, P.olive, P.cloth, P.gold, mix(P.sand, P.terracotta, 0.4), P.greenDark];
      const n = 3;
      for (let row = 0; row < 2; row++) {
        const baseY = row === 0 ? h * 0.62 : h * 0.28;
        for (let i = 0; i < n; i++) {
          const rw = (w - 8) / n;
          const x = 4 + i * rw;
          const c = rng.pick(cols);
          ink.rect(x, baseY - 17, rw - 2, 17, c, { width: 1.4 });
          ink.ellipse(x + rw - 2, baseY - 8.5, 3, 8.5, darken(c, 0.15), { width: 1.2 }); // ponta do rolo
          ink.soft(x, baseY - 17, rw - 2, 17, P.shadow, 0.25, 'bottom');
          if (rng.chance(0.5)) ink.line(x + 2, baseY - 8, x + rw - 4, baseY - 8, lighten(c, 0.5), 1.6, 0.6);
        }
      }
    },
  },
};
