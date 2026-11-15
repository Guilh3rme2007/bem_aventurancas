import { JERUSALEM_VISUAL_THEME as T } from '../style/JerusalemVisualTheme';
import { Pt, darken, lighten, mix, varyTone } from '../../../worlds/jerusalem/HandDrawn';
import type { PropDef, PropKind } from './types';
import { jar, leaf } from './components';

const P = T.palette;
const FOLIAGE = [P.olive, P.greenDark, mix(P.olive, P.gold, 0.2), mix(P.olive, P.sand, 0.2)];

/** Vegetação DISCRETA: oliveiras, arbustos e vasos. Nada de jardins ornamentais modernos. */
export const VEGETATION: Partial<Record<PropKind, PropDef>> = {
  /* Oliveira: tronco retorcido e copa de manchas de aquarela. */
  tree: {
    category: 'vegetation', label: 'Oliveira', variants: 3, solid: { widthFrac: 0.1 },
    size: (r) => ({ w: r.int(110, 160), h: r.int(160, 220) }),
    draw(ink, w, h, rng) {
      const cx = w / 2;
      ink.contactShadow(cx, h - 2, w * 0.3, 7);
      const lean = rng.range(-10, 10);
      const trunk: Pt[] = [{ x: cx - 12, y: h - 2 }, { x: cx - 5 + lean, y: h * 0.55 }, { x: cx - 20 + lean, y: h * 0.4 }, { x: cx - 6 + lean, y: h * 0.45 }, { x: cx + 14 + lean, y: h * 0.36 }, { x: cx + 6 + lean, y: h * 0.55 }, { x: cx + 13, y: h - 2 }];
      ink.material(trunk, 'wood_beam', { width: 2, tint: P.brownDark, tintAlpha: 0.2, shift: { x: 0, y: 0 } });
      ink.clipped(trunk, () => ink.soft(cx - 20, h * 0.36, 40, h * 0.64, P.shadow, 0.35, 'right'));
      const blobs = rng.int(6, 9);
      for (let i = 0; i < blobs; i++) {
        const bx = cx + lean + rng.range(-w * 0.34, w * 0.34);
        const by = h * 0.32 + rng.range(-h * 0.18, h * 0.12);
        const tone = rng.pick(FOLIAGE);
        const rx = rng.range(24, 40);
        const ry = rng.range(16, 26);
        ink.ellipse(bx, by, rx, ry, tone, { width: 1.6, alpha: 0.95 });
        ink.clipped(ink.ellipsePts(bx, by, rx, ry), () => {
          ink.soft(bx - rx, by - ry, rx * 2, ry * 2, P.shadow, 0.32, 'bottom');
          ink.soft(bx - rx, by - ry, rx * 0.8, ry * 2, P.cloudWhite, 0.22, 'left');
        });
        for (let k = 0; k < 5; k++) leaf(ink, bx + rng.range(-rx * 0.7, rx * 0.5), by + rng.range(-ry * 0.6, ry * 0.5), rng.range(7, 11), rng.range(-1, 1) - 0.6, lighten(tone, 0.12));
      }
    },
  },

  bush: {
    category: 'vegetation', label: 'Arbusto', variants: 4,
    size: (r) => ({ w: r.int(50, 90), h: r.int(36, 62) }),
    draw(ink, w, h, rng) {
      ink.contactShadow(w / 2, h - 2, w * 0.45, 5, 0.25);
      for (let i = 0; i < 5; i++) {
        const tone = rng.pick(FOLIAGE);
        const rx = rng.range(w * 0.16, w * 0.26);
        const ry = rng.range(h * 0.28, h * 0.4);
        const x = rx + (i * (w - rx * 2)) / 4;
        const y = h * 0.55 + rng.range(-h * 0.12, h * 0.1);
        ink.ellipse(x, y, rx, ry, tone, { width: 1.5 });
        ink.clipped(ink.ellipsePts(x, y, rx, ry), () => ink.soft(x - rx, y - ry, rx * 2, ry * 2, P.shadow, 0.3, 'bottom'));
      }
      for (let k = 0; k < 8; k++) leaf(ink, rng.range(6, w - 12), rng.range(4, h * 0.6), rng.range(7, 11), rng.range(-1.4, 0.2), lighten(P.olive, 0.4));
    },
  },

  /* Planta em vaso de barro (ervas, sempre-viva). */
  plantPot: {
    category: 'vegetation', label: 'Planta em vaso', variants: 4, solid: { widthFrac: 0.7 },
    size: (r) => ({ w: r.int(34, 46), h: r.int(52, 70) }),
    draw(ink, w, h, rng) {
      const potH = h * 0.5;
      const cx = w / 2;
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI / 2 + rng.range(-1.2, 1.2);
        leaf(ink, cx, h - potH + 2, rng.range(14, h * 0.5), a, varyTone(rng.pick(FOLIAGE), rng, 0.1));
      }
      jar(ink, rng, cx, h, w * 0.78, potH, varyTone(P.terracotta, rng, 0.15), 'pot');
    },
  },

  /* Jarro com ramo de oliveira. */
  oliveBranch: {
    category: 'vegetation', label: 'Ramo de oliveira em jarro', variants: 3, solid: { widthFrac: 0.6 },
    size: (r) => ({ w: r.int(44, 60), h: r.int(80, 104) }),
    draw(ink, w, h, rng) {
      const cx = w / 2;
      const jh = h * 0.42;
      for (let b = 0; b < 3; b++) {
        const lean = (b - 1) * rng.range(8, 16);
        const stem: Pt[] = [{ x: cx, y: h - jh }, { x: cx + lean * 0.5, y: h - jh - h * 0.25 }, { x: cx + lean, y: h - jh - h * 0.48 }];
        ink.curve(stem, P.brownDark, 2, 0.9);
        for (let k = 0; k < 7; k++) {
          const t = 0.2 + k * 0.12;
          const sx = cx + lean * t * 1.05;
          const sy = h - jh - h * 0.5 * t;
          leaf(ink, sx, sy, rng.range(9, 14), -Math.PI / 2 + (k % 2 ? 0.9 : -0.9) + rng.range(-0.2, 0.2), rng.chance(0.5) ? P.olive : lighten(P.olive, 0.3));
          if (k % 3 === 1) ink.ellipse(sx + 4, sy + 4, 2.6, 3.2, P.greenDark, { width: 1, bleed: false }); // azeitonas
        }
      }
      jar(ink, rng, cx, h, w * 0.7, jh, varyTone(mix(P.terracotta, P.sand, 0.25), rng, 0.12), 'amphora');
    },
  },

  /* Tufo de capim seco entre as pedras. */
  grassTuft: {
    category: 'vegetation', label: 'Tufo de capim', variants: 4,
    size: (r) => ({ w: r.int(24, 40), h: r.int(14, 26) }),
    draw(ink, w, h, rng) {
      const n = rng.int(7, 12);
      for (let i = 0; i < n; i++) {
        const x = w * 0.5 + rng.range(-w * 0.35, w * 0.35);
        const top = rng.range(0, h * 0.45);
        ink.curve([{ x, y: h - 1 }, { x: x + rng.range(-3, 3), y: h * 0.55 }, { x: x + rng.range(-9, 9), y: top }], rng.pick([P.olive, P.greenDark, mix(P.sand, P.olive, 0.3)]), rng.range(2, 3.2), 0.95);
      }
      ink.contactShadow(w / 2, h - 1, w * 0.35, 2.5, 0.18);
    },
  },

  rock: {
    category: 'vegetation', label: 'Pedra', variants: 4, solid: { widthFrac: 0.8 },
    size: (r) => ({ w: r.int(30, 64), h: r.int(18, 38) }),
    draw(ink, w, h, rng) {
      ink.contactShadow(w / 2, h - 1, w * 0.5, 4, 0.26);
      const pts: Pt[] = [];
      const n = 7;
      for (let i = 0; i < n; i++) {
        const a = Math.PI + (Math.PI * i) / (n - 1);
        pts.push({ x: w / 2 + Math.cos(a) * (w / 2) * rng.range(0.85, 1), y: h - 2 + Math.sin(a) * (h - 4) * rng.range(0.8, 1) });
      }
      const tone = varyTone(mix(P.limestone, P.stoneAged, rng.range(0, 0.4)), rng, 0.15);
      ink.poly(pts, tone, { width: 1.8 });
      ink.clipped(pts, () => {
        ink.soft(0, 0, w, h, P.shadow, 0.34, 'right');
        ink.soft(0, 0, w * 0.4, h, P.cloudWhite, 0.3, 'left');
      });
      ink.strokes(w * 0.2, h * 0.3, w * 0.6, h * 0.5, darken(tone, 0.5), 3, 0.18, 10);
    },
  },
};
