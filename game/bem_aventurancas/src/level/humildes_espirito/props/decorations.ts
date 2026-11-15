import { JERUSALEM_VISUAL_THEME as T } from '../style/JerusalemVisualTheme';
import { Pt, darken, lighten, mix, varyTone } from '../../../worlds/jerusalem/HandDrawn';
import type { PropDef, PropKind } from './types';
import { arc, jar } from './components';

const P = T.palette;

export const DECORATIONS: Partial<Record<PropKind, PropDef>> = {
  /* Luminária: base de pedra com lamparina de azeite (a chama oscila na cena). */
  lamp: {
    category: 'decoration', label: 'Luminária de azeite', variants: 2, solid: { widthFrac: 0.5 },
    size: (r) => ({ w: 28, h: r.int(86, 104) }),
    draw(ink, w, h) {
      const cx = w / 2;
      ink.contactShadow(cx, h - 1, 12, 4, 0.3);
      ink.rectMaterial(cx - 9, h - 10, 18, 9, 'wall_limestone', { width: 1.6 });
      ink.rectMaterial(cx - 3, 20, 6, h - 30, 'wood_beam', { width: 1.4, shift: { x: 0, y: 0 } });
      const bowl: Pt[] = [{ x: cx - 10, y: 14 }, { x: cx + 10, y: 14 }, { x: cx + 7, y: 22 }, { x: cx - 7, y: 22 }];
      ink.poly(bowl, P.terracotta, { width: 1.6 });
      ink.clipped(bowl, () => ink.soft(cx - 10, 14, 20, 8, P.shadow, 0.3, 'right'));
      ink.ellipse(cx, 6, 4, 7, P.gold, { width: 1, alpha: 0.95 });
      ink.ellipse(cx, 6, 9, 11, P.gold, { alpha: 0.18, outline: false });
    },
  },

  /* Braseiro de bronze sobre tripé (a chama oscila na cena). */
  brazier: {
    category: 'decoration', label: 'Braseiro', variants: 2, solid: { widthFrac: 0.6 },
    size: (r) => ({ w: r.int(40, 50), h: r.int(60, 76) }),
    draw(ink, w, h) {
      const cx = w / 2;
      ink.contactShadow(cx, h - 1, w * 0.4, 4, 0.3);
      for (const dx of [-1, 0, 1]) ink.line(cx + dx * 4, h * 0.5, cx + dx * 14, h - 2, P.ink, 2.4, 0.9); // tripé
      const bowl: Pt[] = [{ x: cx - w * 0.4, y: h * 0.28 }, { x: cx + w * 0.4, y: h * 0.28 }, { x: cx + w * 0.22, y: h * 0.54 }, { x: cx - w * 0.22, y: h * 0.54 }];
      ink.poly(bowl, mix(P.brown, P.gold, 0.3), { width: 1.8 });
      ink.clipped(bowl, () => ink.soft(cx - w * 0.4, h * 0.28, w * 0.8, h * 0.26, P.shadow, 0.35, 'right'));
      ink.ellipse(cx, h * 0.28, w * 0.4, 3, P.terracotta, { width: 1.4 }); // brasas
      ink.poly([{ x: cx - 8, y: h * 0.28 }, { x: cx - 3, y: h * 0.06 }, { x: cx + 2, y: h * 0.18 }, { x: cx + 5, y: h * 0.02 }, { x: cx + 9, y: h * 0.28 }], P.gold, { width: 1, alpha: 0.9 }); // chama
    },
  },

  /* Tecido pendurado (varal/pano): balança suavemente na cena. */
  cloth: {
    category: 'decoration', label: 'Tecido pendurado', variants: 4,
    size: (r) => ({ w: r.int(40, 70), h: r.int(70, 110) }),
    draw(ink, w, h, rng) {
      const c = rng.pick([P.terracotta, P.olive, P.gold, mix(P.sand, P.terracotta, 0.4), P.cloth]);
      ink.line(0, 3, w, 3, P.brownDark, 3);
      const body: Pt[] = [{ x: 3, y: 4 }, { x: w - 3, y: 4 }, { x: w - 1, y: h - 6 }, { x: w * 0.7, y: h }, { x: w * 0.45, y: h - 7 }, { x: w * 0.2, y: h }, { x: 1, y: h - 5 }];
      ink.poly(body, c, { width: 1.8 });
      ink.clipped(body, () => {
        ink.soft(0, 4, w, h, P.shadow, 0.28, 'right');
        for (let i = 1; i < 4; i++) ink.line((w * i) / 4, 6, (w * i) / 4 + rng.range(-2, 2), h - 8, darken(c, 0.3), 1.2, 0.35);
        if (rng.chance(0.6)) ink.rect(2, h * 0.4, w - 4, 7, lighten(c, 0.5), { width: 1, alpha: 0.7, outline: false });
      });
    },
  },

  bench: {
    category: 'decoration', label: 'Banco de madeira', variants: 2, solid: { widthFrac: 0.95 },
    size: (r) => ({ w: r.int(70, 100), h: r.int(34, 42) }),
    draw(ink, w, h) {
      ink.contactShadow(w / 2, h - 1, w * 0.5, 5, 0.3);
      ink.rectMaterial(2, h * 0.5, 8, h * 0.5 - 1, 'wood_beam', { width: 1.4, shift: { x: 0, y: 0 } });
      ink.rectMaterial(w - 10, h * 0.5, 8, h * 0.5 - 1, 'wood_beam', { width: 1.4, shift: { x: 0, y: 0 } });
      ink.rectMaterial(0, h * 0.3, w, 9, 'wood_boards', { width: 1.8, tint: P.stoneLight, tintAlpha: 0.12 });
      ink.soft(0, h * 0.3, w, 9, P.shadow, 0.3, 'bottom');
    },
  },

  /* Poço de pedra com cobertura de madeira e balde. */
  well: {
    category: 'decoration', label: 'Poço de pedra', variants: 2, solid: { widthFrac: 0.9 },
    size: (r) => ({ w: r.int(90, 110), h: r.int(92, 112) }),
    draw(ink, w, h, rng) {
      const cx = w / 2;
      const ringH = h * 0.34;
      const rx = w * 0.4;
      ink.contactShadow(cx, h - 2, rx * 1.15, 8);
      // coluna do poço (cilindro) com alvenaria
      const body: Pt[] = [{ x: cx - rx, y: h - ringH }, { x: cx + rx, y: h - ringH }, ...arc(cx, h - 4, rx, 8, 0, Math.PI, 8)];
      ink.material(body, 'wall_retaining', { width: 2.2 });
      ink.clipped(body, () => {
        ink.soft(cx - rx, h - ringH, rx * 2, ringH, P.shadow, 0.34, 'right');
        ink.soft(cx - rx, h - ringH, rx * 0.8, ringH, P.cloudWhite, 0.22, 'left');
      });
      ink.ellipse(cx, h - ringH, rx, 8, darken(P.limestone, 0.1), { width: 2 }); // boca
      ink.ellipse(cx, h - ringH + 1, rx * 0.8, 5.5, P.windowDark, { width: 1.4 }); // água escura
      // armação de madeira, travessa e balde
      ink.rectMaterial(cx - rx + 2, 14, 6, h - ringH - 6, 'wood_beam', { width: 1.4, shift: { x: 0, y: 0 } });
      ink.rectMaterial(cx + rx - 8, 14, 6, h - ringH - 6, 'wood_beam', { width: 1.4, shift: { x: 0, y: 0 } });
      ink.rectMaterial(cx - rx - 4, 8, rx * 2 + 8, 8, 'wood_boards', { width: 1.6 });
      ink.line(cx, 16, cx, h - ringH - 10, P.brownDark, 1.6, 0.9);
      ink.poly([{ x: cx - 7, y: h - ringH - 22 }, { x: cx + 7, y: h - ringH - 22 }, { x: cx + 5, y: h - ringH - 8 }, { x: cx - 5, y: h - ringH - 8 }], P.wood, { width: 1.4 });
      void rng;
    },
  },

  /* Suporte de madeira com jarros. */
  jarStand: {
    category: 'decoration', label: 'Suporte com jarros', variants: 3, solid: { widthFrac: 0.85 },
    size: (r) => ({ w: r.int(56, 72), h: r.int(60, 76) }),
    draw(ink, w, h, rng) {
      ink.contactShadow(w / 2, h - 1, w * 0.5, 4, 0.3);
      ink.rectMaterial(4, h * 0.5, 6, h * 0.5 - 1, 'wood_beam', { width: 1.4, shift: { x: 0, y: 0 } });
      ink.rectMaterial(w - 10, h * 0.5, 6, h * 0.5 - 1, 'wood_beam', { width: 1.4, shift: { x: 0, y: 0 } });
      ink.rectMaterial(0, h * 0.5 - 2, w, 8, 'wood_boards', { width: 1.6 });
      const tone = () => varyTone(mix(P.terracotta, P.sand, rng.range(0, 0.35)), rng, 0.12);
      jar(ink, rng, w * 0.3, h * 0.5 - 2, w * 0.36, h * 0.46, tone(), 'amphora');
      jar(ink, rng, w * 0.7, h * 0.5 - 2, w * 0.34, h * 0.34, tone(), 'pot');
    },
  },
};
