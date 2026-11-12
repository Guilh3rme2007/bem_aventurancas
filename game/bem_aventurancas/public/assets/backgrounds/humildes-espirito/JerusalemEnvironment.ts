import Phaser from 'phaser';
import { PALETTE as P } from './JerusalemBackgroundConfig';
import { Ink, Pt, Rng, createRng, hashSeed, lighten, darken, mix, varyTone } from './HandDrawn';

export type PropKind =
  | 'house' | 'stall' | 'wall' | 'pot' | 'amphora' | 'basket' | 'crate' | 'sack'
  | 'tree' | 'bush' | 'rock' | 'lamp' | 'column' | 'gate' | 'templeWall' | 'cloth'
  | 'bench' | 'templeFar';

export interface PropDef {
  size(rng: Rng): { w: number; h: number };
  draw(ink: Ink, w: number, h: number, rng: Rng): void;
  solid?: { widthFrac: number };
}

export const VARIANTS: Record<PropKind, number> = {
  house: 8, stall: 5, wall: 4, pot: 4, amphora: 3, basket: 4, crate: 3, sack: 3,
  tree: 3, bush: 4, rock: 4, lamp: 2, column: 2, gate: 1, templeWall: 3, cloth: 4,
  bench: 2, templeFar: 1,
};

export const PAD = 8;


const arc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 8): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
  }
  return out;
};

function stoneBlocks(ink: Ink, rng: Rng, x: number, y: number, w: number, h: number, tone: number, course = 22): void {
  ink.rect(x, y, w, h, tone, { width: 2.6 });
  let cy = y;
  while (cy < y + h - 3) {
    const ch = Math.min(course * rng.range(0.85, 1.15), y + h - cy);
    let cx = x - rng.range(0, 24);
    while (cx < x + w) {
      const bw = rng.range(30, 66);
      const x0 = Math.max(cx, x);
      const x1 = Math.min(cx + bw, x + w);
      if (x1 - x0 > 8) {
        const j = () => rng.range(-1.4, 1.4);
        ink.poly(
          [
            { x: x0 + j(), y: cy + j() },
            { x: x1 + j(), y: cy + j() },
            { x: x1 + j(), y: cy + ch + j() },
            { x: x0 + j(), y: cy + ch + j() },
          ],
          varyTone(tone, rng, 0.1),
          { alpha: 0.5, outline: darken(tone, 0.5), width: 1.2, bleed: false },
        );
      }
      cx += bw;
    }
    cy += ch;
  }
  ink.strokes(x, y, w, h, darken(tone, 0.5), Math.floor((w * h) / 1100), 0.12);
  ink.strokes(x, y, w, h, lighten(tone, 0.6), Math.floor((w * h) / 1800), 0.14);
  ink.wash(x + w * 0.8, y, w * 0.2, h, P.shadow, 0.2);
  ink.wash(x, y + h * 0.82, w, h * 0.18, P.shadow, 0.12);
}

function windowAt(ink: Ink, rng: Rng, x: number, y: number, w: number, h: number, tone: number): void {
  ink.rect(x - 3, y - 5, w + 6, 6, darken(tone, 0.22), { width: 1.4 }); 
  ink.rect(x, y, w, h, P.windowDark, { width: 1.6 });
  ink.rect(x - 3, y + h, w + 6, 4, lighten(tone, 0.2), { width: 1.2 }); 
  if (rng.chance(0.4)) ink.rect(x - 1, y, w * 0.45, h, P.doorWood, { width: 1.2, alpha: 0.95 }); 
}

function doorAt(ink: Ink, rng: Rng, x: number, baseY: number, w: number, h: number, tone: number): void {
  ink.rect(x - 5, baseY - h - 6, w + 10, h + 6, darken(tone, 0.2), { width: 1.6 }); 
  const top = baseY - h;
  const body: Pt[] = [
    { x, y: baseY },
    { x, y: top + 10 },
    ...arc(x + w / 2, top + 10, w / 2, 10, Math.PI, Math.PI * 2, 6),
    { x: x + w, y: baseY },
  ];
  ink.poly(body, varyTone(P.doorWood, rng, 0.15), { width: 2 });
  for (let i = 1; i < 4; i++) ink.line(x + (w * i) / 4, top + 8, x + (w * i) / 4, baseY - 1, P.brownDark, 1.2, 0.5);
  ink.ellipse(x + w * 0.78, baseY - h * 0.45, 2.2, 2.2, P.gold, { width: 1 });
  ink.poly(
    [{ x: x - 7, y: baseY + 1 }, { x: x + w + 7, y: baseY + 1 }, { x: x + w + 3, y: baseY - 6 }, { x: x - 3, y: baseY - 6 }],
    lighten(tone, 0.12), { width: 1.4 },
  ); 
}

function parapet(ink: Ink, x: number, y: number, w: number, tone: number): void {
  ink.rect(x - 3, y, w + 6, 10, darken(tone, 0.14), { width: 2 });
  ink.line(x - 3, y + 3, x + w + 3, y + 3, lighten(tone, 0.5), 1.4, 0.5);
}


export const PROPS: Record<PropKind, PropDef> = {
  house: {
    solid: { widthFrac: 0.96 },
    size: (r) => ({ w: r.int(210, 330), h: r.int(190, 300) }),
    draw(ink, w, h, rng) {
      const tone = rng.pick([P.limestone, P.sand, mix(P.limestone, P.beigeLight, 0.4), mix(P.sand, P.terracotta, 0.14)]);
      const lowH = Math.round(h * 0.6);
      ink.contactShadow(w / 2, h - 2, w * 0.52, 8);
      stoneBlocks(ink, rng, 0, h - lowH, w, lowH, tone);
      parapet(ink, 0, h - lowH - 8, w, tone);
      let upX = 0;
      let upW = 0;
      if (h > 200) {
        upW = Math.round(w * rng.range(0.55, 0.8));
        upX = rng.chance(0.5) ? 4 : w - upW - 4;
        stoneBlocks(ink, rng, upX, 12, upW, h - lowH - 18, mix(tone, P.beigeLight, 0.16));
        parapet(ink, upX, 4, upW, tone);
        windowAt(ink, rng, upX + upW * rng.range(0.2, 0.55), 36, 16, 24, tone);
        if (rng.chance(0.5)) windowAt(ink, rng, upX + upW * rng.range(0.6, 0.8), 36, 14, 22, tone);
        for (let i = 0; i < 3; i++) ink.rect(upX + 10 + (i * (upW - 34)) / 2, 14, 11, 6, P.brown, { width: 1.2 }); 
      }
      const dw = rng.int(30, 38);
      const dh = Math.min(lowH - 14, 64);
      const dx = rng.range(16, w - dw - 16);
      doorAt(ink, rng, dx, h - 2, dw, dh, tone);
      const nWin = rng.int(0, 2);
      for (let i = 0; i < nWin; i++) {
        const wx = rng.range(14, w - 30);
        if (Math.abs(wx - dx) > dw + 10) windowAt(ink, rng, wx, h - lowH + 16, 14, 20, tone);
      }
      if (rng.chance(0.55)) {
        const jx = rng.range(6, w - 30);
        const jy = h - lowH - 8;
        ink.ellipse(jx + 10, jy - 12, 10, 13, P.terracotta, { width: 1.6 });
        ink.rect(jx + 5, jy - 28, 10, 6, darken(P.terracotta, 0.2), { width: 1.4 });
      }
      if (rng.chance(0.35) && w - upX - upW > 60) {
        const x0 = upX === 4 ? upX + upW + 8 : 8;
        ink.line(x0, h - lowH - 40, x0 + 46, h - lowH - 38, P.brownDark, 1.6);
        ink.poly(
          [{ x: x0 + 8, y: h - lowH - 39 }, { x: x0 + 36, y: h - lowH - 38 }, { x: x0 + 34, y: h - lowH - 14 }, { x: x0 + 10, y: h - lowH - 15 }],
          rng.pick([P.cloudWhite, P.terracotta, P.olive]), { width: 1.4 },
        );
      }
    },
  },

  wall: {
    solid: { widthFrac: 0.98 },
    size: (r) => ({ w: r.int(200, 340), h: r.int(70, 120) }),
    draw(ink, w, h, rng) {
      const tone = rng.pick([P.limestone, P.sand]);
      ink.contactShadow(w / 2, h - 1, w * 0.5, 6);
      stoneBlocks(ink, rng, 0, 0, w, h, tone, 20);
      parapet(ink, 0, -2, w, tone);
      ink.strokes(0, h * 0.6, w, h * 0.4, P.greenDark, 8, 0.18, 14); 
    },
  },

  stall: {
    solid: { widthFrac: 0.92 },
    size: (r) => ({ w: r.int(150, 215), h: r.int(150, 178) }),
    draw(ink, w, h, rng) {
      const cloth = rng.pick([P.terracotta, P.olive, mix(P.sand, P.terracotta, 0.3), P.beigeLight, mix(P.gold, P.brown, 0.3)]);
      ink.contactShadow(w / 2, h - 2, w * 0.5, 8);
      ink.rect(6, 20, 8, h - 22, P.brown, { width: 1.6 });
      ink.rect(w - 14, 20, 8, h - 22, P.brown, { width: 1.6 });
      const ty = h * 0.62;
      ink.rect(2, ty + 6, w - 4, h * 0.34, darken(P.brown, 0.05), { width: 2 });
      for (let i = 1; i < 4; i++) ink.line(2, ty + 6 + (h * 0.34 * i) / 4, w - 2, ty + 6 + (h * 0.34 * i) / 4, P.brownDark, 1, 0.35);
      ink.rect(-2, ty - 2, w + 4, 9, lighten(P.brown, 0.2), { width: 1.8 });
      const n = Math.floor(w / 36);
      for (let i = 0; i < n; i++) {
        const cx = 22 + (i * (w - 44)) / Math.max(1, n - 1);
        if (rng.chance(0.65)) {
          ink.poly([{ x: cx - 15, y: ty - 3 }, { x: cx + 15, y: ty - 3 }, { x: cx + 11, y: ty - 15 }, { x: cx - 11, y: ty - 15 }], P.sand, { width: 1.4 });
          for (let k = 0; k < 4; k++)
            ink.ellipse(cx - 9 + k * 6, ty - 17 - rng.range(0, 3), 4.4, 4.4, rng.pick([0xa44a3a, 0x6b4e71, P.olive, P.gold, P.terracotta]), { width: 1 });
        } else {
          ink.ellipse(cx, ty - 14, 8, 11, P.terracotta, { width: 1.4 });
        }
      }
      const aw = h * 0.3;
      const awning: Pt[] = [{ x: -8, y: 6 }, { x: w + 8, y: 6 }];
      const sc = Math.max(4, Math.floor(w / 26));
      for (let i = sc; i >= 0; i--) awning.push({ x: -8 + ((w + 16) * i) / sc, y: 6 + aw + (i % 2 ? 9 : 0) });
      ink.poly(awning, cloth, { width: 2.2 });
      for (let i = 0; i < sc; i += 2) ink.wash(-8 + ((w + 16) * i) / sc, 8, (w + 16) / sc, aw, lighten(cloth, 0.5), 0.35);
      ink.wash(0, 6 + aw * 0.7, w, aw * 0.3, P.shadow, 0.22);
      if (rng.chance(0.7)) {
        const sx = rng.chance(0.5) ? 2 : w - 40;
        ink.poly([{ x: sx, y: h - 2 }, { x: sx + 36, y: h - 2 }, { x: sx + 32, y: h - 30 }, { x: sx + 20, y: h - 36 }, { x: sx + 6, y: h - 30 }], P.sand, { width: 1.6 });
        ink.line(sx + 12, h - 34, sx + 28, h - 34, P.brownDark, 1.6);
      }
    },
  },

  pot: {
    solid: { widthFrac: 0.75 },
    size: (r) => ({ w: r.int(26, 36), h: r.int(32, 46) }),
    draw(ink, w, h, rng) {
      const c = varyTone(P.terracotta, rng, 0.15);
      const cx = w / 2;
      const nw = w * 0.28;
      const bw = w / 2;
      ink.contactShadow(cx, h - 1, w * 0.5, 4, 0.3);
      ink.poly(
        [
          { x: cx - nw, y: 2 }, { x: cx + nw, y: 2 }, { x: cx + nw * 0.9, y: 8 }, { x: cx + bw, y: h * 0.45 },
          { x: cx + bw * 0.7, y: h * 0.86 }, { x: cx + bw * 0.4, y: h - 1 }, { x: cx - bw * 0.4, y: h - 1 },
          { x: cx - bw * 0.7, y: h * 0.86 }, { x: cx - bw, y: h * 0.45 }, { x: cx - nw * 0.9, y: 8 },
        ],
        c, { width: 1.8 },
      );
      ink.line(cx - bw * 0.95, h * 0.5, cx + bw * 0.95, h * 0.5, P.brownDark, 1.4, 0.6);
      ink.wash(cx + bw * 0.25, 6, bw * 0.7, h - 8, P.shadow, 0.22);
      ink.ellipse(cx, 2, nw * 1.15, 2.6, darken(c, 0.2), { width: 1.4 });
    },
  },

  amphora: {
    solid: { widthFrac: 0.7 },
    size: (r) => ({ w: r.int(30, 40), h: r.int(62, 84) }),
    draw(ink, w, h, rng) {
      const c = varyTone(mix(P.terracotta, P.sand, 0.25), rng, 0.12);
      const cx = w / 2;
      ink.contactShadow(cx, h - 1, w * 0.4, 4, 0.3);
      ink.curve([{ x: cx - 5, y: 10 }, { x: 2, y: 8 }, { x: 3, y: h * 0.32 }, { x: cx - w * 0.3, y: h * 0.34 }], P.ink, 3);
      ink.curve([{ x: cx + 5, y: 10 }, { x: w - 2, y: 8 }, { x: w - 3, y: h * 0.32 }, { x: cx + w * 0.3, y: h * 0.34 }], P.ink, 3);
      ink.poly(
        [
          { x: cx - 6, y: 0 }, { x: cx + 6, y: 0 }, { x: cx + 5, y: h * 0.18 }, { x: cx + w * 0.42, y: h * 0.4 },
          { x: cx + w * 0.3, y: h * 0.75 }, { x: cx + 3, y: h - 1 }, { x: cx - 3, y: h - 1 },
          { x: cx - w * 0.3, y: h * 0.75 }, { x: cx - w * 0.42, y: h * 0.4 }, { x: cx - 5, y: h * 0.18 },
        ],
        c, { width: 1.8 },
      );
      ink.line(cx - w * 0.4, h * 0.46, cx + w * 0.4, h * 0.46, P.brownDark, 1.3, 0.6);
      ink.wash(cx + 2, 4, w * 0.4, h - 6, P.shadow, 0.22);
    },
  },

  basket: {
    solid: { widthFrac: 0.8 },
    size: (r) => ({ w: r.int(40, 58), h: r.int(34, 48) }),
    draw(ink, w, h, rng) {
      ink.contactShadow(w / 2, h - 1, w * 0.5, 5, 0.3);
      ink.poly([{ x: 2, y: h * 0.38 }, { x: w - 2, y: h * 0.38 }, { x: w - 8, y: h - 2 }, { x: 8, y: h - 2 }], mix(P.sand, P.brown, 0.35), { width: 1.8 });
      for (let i = 1; i < 6; i++) ink.line(4 + (i * (w - 8)) / 6, h * 0.4, 9 + (i * (w - 18)) / 6, h - 3, P.brownDark, 1, 0.4);
      for (let k = 1; k < 4; k++) ink.line(4, h * 0.38 + k * (h * 0.15), w - 4, h * 0.38 + k * (h * 0.15), P.brownDark, 1, 0.35);
      const fruit = rng.pick([0xa44a3a, P.olive, P.gold, 0x6b4e71, P.sand]);
      for (let i = 0; i < 6; i++) ink.ellipse(8 + (i * (w - 16)) / 5, h * 0.3 - (i % 2) * 3, 5.2, 5.2, fruit, { width: 1.1 });
    },
  },

  crate: {
    solid: { widthFrac: 0.95 },
    size: (r) => ({ w: r.int(40, 60), h: r.int(30, 44) }),
    draw(ink, w, h) {
      ink.contactShadow(w / 2, h - 1, w * 0.55, 5, 0.3);
      ink.rect(0, 0, w, h - 2, P.brown, { width: 2 });
      for (let i = 1; i < 3; i++) ink.line(0, (h * i) / 3, w, (h * i) / 3, P.brownDark, 1.2, 0.6);
      ink.line(0, 0, w, h - 2, P.brownDark, 1.2, 0.35);
      ink.strokes(0, 0, w, h, P.brownDark, 6, 0.2, 14);
    },
  },

  sack: {
    solid: { widthFrac: 0.8 },
    size: (r) => ({ w: r.int(28, 40), h: r.int(34, 46) }),
    draw(ink, w, h, rng) {
      ink.contactShadow(w / 2, h - 1, w * 0.5, 4, 0.3);
      ink.poly([{ x: 3, y: h - 2 }, { x: w - 3, y: h - 2 }, { x: w - 1, y: h * 0.45 }, { x: w * 0.66, y: h * 0.16 }, { x: w * 0.34, y: h * 0.16 }, { x: 1, y: h * 0.45 }], varyTone(P.sand, rng, 0.12), { width: 1.8 });
      ink.line(w * 0.32, h * 0.2, w * 0.68, h * 0.2, P.brownDark, 2.2);
      ink.wash(w * 0.55, h * 0.3, w * 0.4, h * 0.65, P.shadow, 0.2);
    },
  },

  tree: {
    solid: { widthFrac: 0.1 },
    size: (r) => ({ w: r.int(110, 160), h: r.int(160, 220) }),
    draw(ink, w, h, rng) {
      const cx = w / 2;
      ink.contactShadow(cx, h - 2, w * 0.3, 7);
      const lean = rng.range(-10, 10);
      ink.poly(
        [{ x: cx - 12, y: h - 2 }, { x: cx - 5 + lean, y: h * 0.55 }, { x: cx - 20 + lean, y: h * 0.4 }, { x: cx - 6 + lean, y: h * 0.45 },
         { x: cx + 14 + lean, y: h * 0.36 }, { x: cx + 6 + lean, y: h * 0.55 }, { x: cx + 13, y: h - 2 }],
        P.brown, { width: 2 },
      );
      ink.strokes(cx - 10, h * 0.5, 22, h * 0.48, P.brownDark, 6, 0.3, 14);
      const blobs = rng.int(6, 9);
      for (let i = 0; i < blobs; i++) {
        const bx = cx + lean + rng.range(-w * 0.34, w * 0.34);
        const by = h * 0.32 + rng.range(-h * 0.18, h * 0.12);
        const tone = rng.pick([P.olive, P.greenDark, mix(P.olive, P.gold, 0.2)]);
        ink.ellipse(bx, by, rng.range(24, 40), rng.range(16, 26), tone, { width: 1.6, alpha: 0.95 });
        ink.strokes(bx - 24, by - 12, 48, 24, lighten(tone, 0.5), 5, 0.22, 14);
      }
    },
  },

  bush: {
    size: (r) => ({ w: r.int(50, 90), h: r.int(36, 62) }),
    draw(ink, w, h, rng) {
      ink.contactShadow(w / 2, h - 2, w * 0.45, 5, 0.25);
      for (let i = 0; i < 5; i++) {
        const tone = rng.pick([P.olive, P.greenDark, mix(P.olive, P.sand, 0.2)]);
        const rx = rng.range(w * 0.16, w * 0.26);
        ink.ellipse(rx + (i * (w - rx * 2)) / 4, h * 0.55 + rng.range(-h * 0.12, h * 0.1), rx, rng.range(h * 0.28, h * 0.4), tone, { width: 1.5 });
      }
      ink.strokes(0, 0, w, h, lighten(P.olive, 0.5), 8, 0.22, 12);
    },
  },

  rock: {
    solid: { widthFrac: 0.8 },
    size: (r) => ({ w: r.int(30, 64), h: r.int(18, 38) }),
    draw(ink, w, h, rng) {
      ink.contactShadow(w / 2, h - 1, w * 0.5, 4, 0.26);
      const pts: Pt[] = [];
      const n = 7;
      for (let i = 0; i < n; i++) {
        const a = Math.PI + (Math.PI * i) / (n - 1);
        pts.push({ x: w / 2 + Math.cos(a) * (w / 2) * rng.range(0.85, 1), y: h - 2 + Math.sin(a) * (h - 4) * rng.range(0.8, 1) });
      }
      ink.poly(pts, varyTone(P.limestone, rng, 0.15), { width: 1.8 });
      ink.wash(w * 0.5, 2, w * 0.45, h - 4, P.shadow, 0.22);
    },
  },

  lamp: {
    solid: { widthFrac: 0.5 },
    size: (r) => ({ w: 28, h: r.int(86, 104) }),
    draw(ink, w, h) {
      const cx = w / 2;
      ink.contactShadow(cx, h - 1, 12, 4, 0.3);
      ink.rect(cx - 9, h - 10, 18, 9, P.limestone, { width: 1.6 });
      ink.rect(cx - 3, 20, 6, h - 30, P.brownDark, { width: 1.4 });
      ink.poly([{ x: cx - 10, y: 14 }, { x: cx + 10, y: 14 }, { x: cx + 7, y: 22 }, { x: cx - 7, y: 22 }], P.terracotta, { width: 1.6 });
      ink.ellipse(cx, 6, 4, 7, P.gold, { width: 1, alpha: 0.95 });
      ink.ellipse(cx, 6, 9, 11, P.gold, { alpha: 0.18, outline: false });
    },
  },

  column: {
    solid: { widthFrac: 0.85 },
    size: (r) => ({ w: r.int(44, 52), h: r.int(190, 230) }),
    draw(ink, w, h, rng) {
      const tone = lighten(P.beigeLight, 0.1);
      const cx = w / 2;
      ink.contactShadow(cx, h - 1, w * 0.6, 6);
      ink.rect(2, h - 16, w - 4, 15, darken(tone, 0.08), { width: 1.8 }); 
      ink.rect(8, 26, w - 16, h - 42, tone, { width: 2 }); 
      for (let i = 1; i < 4; i++) ink.line(8 + ((w - 16) * i) / 4, 28, 8 + ((w - 16) * i) / 4, h - 18, darken(tone, 0.3), 1.2, 0.45);
      ink.wash(w * 0.62, 26, w * 0.3, h - 42, P.shadow, 0.22);
      ink.poly([{ x: 0, y: 2 }, { x: w, y: 2 }, { x: w - 5, y: 14 }, { x: w - 8, y: 28 }, { x: 8, y: 28 }, { x: 5, y: 14 }], lighten(tone, 0.06), { width: 1.8 }); 
      for (let i = 0; i < 3; i++) ink.ellipse(cx + (i - 1) * 9, 16, 4, 7, darken(tone, 0.12), { width: 1, alpha: 0.7 });
      void rng;
    },
  },

  templeWall: {
    solid: { widthFrac: 0.98 },
    size: (r) => ({ w: r.int(400, 520), h: r.int(250, 300) }),
    draw(ink, w, h, rng) {
      const tone = mix(P.limestone, P.beigeLight, 0.35);
      ink.rect(0, 0, w, h, tone, { width: 3 });
      const rows = Math.round(h / 52);
      const rh = h / rows;
      for (let r = 0; r < rows; r++) {
        let x = -rng.range(0, 60);
        while (x < w) {
          const bw = rng.range(95, 150);
          const x0 = Math.max(0, x);
          const x1 = Math.min(w, x + bw);
          const y0 = r * rh;
          if (x1 - x0 > 12) {
            const t = varyTone(tone, rng, 0.08);
            ink.rect(x0, y0, x1 - x0, rh, darken(t, 0.12), { width: 1.4, alpha: 0.9, bleed: false });
            ink.rect(x0 + 6, y0 + 6, x1 - x0 - 12, rh - 12, lighten(t, 0.08), { width: 1.1, alpha: 0.95, bleed: false }); // boss
          }
          x += bw;
        }
      }
      ink.strokes(0, 0, w, h, darken(tone, 0.5), Math.floor((w * h) / 2000), 0.1, 34);
      ink.rect(-4, -4, w + 8, 16, lighten(tone, 0.15), { width: 2.4 }); // cornija
      ink.rect(-4, 12, w + 8, 6, darken(tone, 0.2), { width: 1.6 });
      ink.wash(0, 0, w, h * 0.12, P.cloudWhite, 0.25);
      ink.wash(w * 0.85, 0, w * 0.15, h, P.shadow, 0.2);
    },
  },

  gate: {
    size: () => ({ w: 340, h: 300 }),
    draw(ink, w, h, rng) {
      const tone = mix(P.limestone, P.beigeLight, 0.4);
      ink.contactShadow(w / 2, h - 2, w * 0.5, 8);
      ink.rect(0, 20, w, h - 20, tone, { width: 3 });
      for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) {
        const bx = c * (w / 4) + (r % 2) * 18 - 9;
        ink.rect(Math.max(0, bx), 24 + r * 52, Math.min(w / 4 - 6, w - Math.max(0, bx)), 46, varyTone(tone, rng, 0.08), { width: 1.2, alpha: 0.7, bleed: false });
      }
      const gw = 118;
      const gh = 196;
      const gx = (w - gw) / 2;
      ink.rect(gx - 16, h - gh - 24, gw + 32, gh + 22, darken(tone, 0.22), { width: 2.4 }); 
      ink.rect(gx - 30, h - gh - 46, gw + 60, 24, lighten(tone, 0.12), { width: 2.4 });
      const hole: Pt[] = [{ x: gx, y: h - 2 }, { x: gx, y: h - gh + 20 }, ...arc(w / 2, h - gh + 20, gw / 2, 20, Math.PI, Math.PI * 2, 8), { x: gx + gw, y: h - 2 }];
      ink.poly(hole, 0x3a2c22, { width: 2.4 });
      ink.wash(gx + 10, h - gh + 20, gw - 20, gh - 40, P.gold, 0.12); 
      for (let i = 0; i < 3; i++) ink.rect(gx - 40 - i * 6, h - 12 + i * 4, gw + 80 + i * 12, 10, lighten(tone, 0.1 + i * 0.04), { width: 1.6 }); 
      ink.rect(-4, 8, w + 8, 18, lighten(tone, 0.2), { width: 2.6 }); 
    },
  },

  cloth: {
    size: (r) => ({ w: r.int(40, 70), h: r.int(70, 110) }),
    draw(ink, w, h, rng) {
      const c = rng.pick([P.terracotta, P.olive, P.gold, mix(P.sand, P.terracotta, 0.4), P.cloudWhite]);
      ink.line(0, 3, w, 3, P.brownDark, 3);
      ink.poly([{ x: 3, y: 4 }, { x: w - 3, y: 4 }, { x: w - 1, y: h - 6 }, { x: w * 0.7, y: h }, { x: w * 0.45, y: h - 7 }, { x: w * 0.2, y: h }, { x: 1, y: h - 5 }], c, { width: 1.8 });
      for (let i = 1; i < 4; i++) ink.line((w * i) / 4, 6, (w * i) / 4 + rng.range(-2, 2), h - 8, darken(c, 0.3), 1.2, 0.35);
      if (rng.chance(0.6)) ink.rect(2, h * 0.4, w - 4, 7, lighten(c, 0.5), { width: 1, alpha: 0.7, outline: false });
    },
  },

  bench: {
    solid: { widthFrac: 0.95 },
    size: (r) => ({ w: r.int(70, 100), h: r.int(34, 42) }),
    draw(ink, w, h) {
      ink.contactShadow(w / 2, h - 1, w * 0.5, 5, 0.3);
      ink.rect(2, h * 0.5, 8, h * 0.5 - 1, P.brown, { width: 1.4 });
      ink.rect(w - 10, h * 0.5, 8, h * 0.5 - 1, P.brown, { width: 1.4 });
      ink.rect(0, h * 0.3, w, 9, lighten(P.brown, 0.15), { width: 1.8 });
    },
  },

  templeFar: {
    size: () => ({ w: 760, h: 430 }),
    draw(ink, w, h, rng) {
      const haze = (c: number) => mix(c, P.sky, 0.28);
      const stone = haze(mix(P.limestone, P.beigeLight, 0.5));
      const gold = haze(mix(P.gold, P.beigeLight, 0.25));
      const cx = w / 2;
      ink.rect(0, h - 120, w, 120, stone, { width: 2.6 });
      for (let i = 0; i < 6; i++) ink.line(0, h - 120 + i * 20, w, h - 120 + i * 20, darken(stone, 0.3), 1, 0.3);
      for (let i = 0; i < 14; i++) ink.line(i * (w / 14), h - 120, i * (w / 14), h, darken(stone, 0.3), 1, 0.2);
      ink.rect(cx - 250, h - 250, 130, 130, haze(P.beigeLight), { width: 2.4 });
      ink.rect(cx + 120, h - 250, 130, 130, haze(P.beigeLight), { width: 2.4 });
      ink.rect(cx - 120, h - 400, 240, 280, gold, { width: 2.8 });
      ink.wash(cx - 120, h - 400, 240, 90, P.cloudWhite, 0.28);
      ink.wash(cx + 40, h - 400, 80, 280, P.shadow, 0.16);
      for (let i = 0; i < 6; i++) ink.rect(cx - 96 + i * 36, h - 300, 14, 180, haze(P.beigeLight), { width: 1.6 }); 
      ink.rect(cx - 40, h - 232, 80, 112, 0x3a2c22, { width: 2, alpha: 0.85 }); 
      ink.rect(cx - 130, h - 412, 260, 16, haze(P.gold), { width: 2 });
      for (let i = 0; i < 14; i++) ink.line(cx - 120 + i * 18, h - 412, cx - 120 + i * 18, h - 428, haze(P.gold), 2.2, 0.9);
      ink.strokes(0, 0, w, h, P.cloudWhite, 30, 0.12, 30);
      void rng;
    },
  },
};


export interface BakedProp {
  key: string;
  w: number;
  h: number;
  pad: number;
  originX: number;
  originY: number;
}

const seedOf = (kind: PropKind, variant: number): number => hashSeed(`${kind}:${variant}`);

export function propSize(kind: PropKind, variant: number): { w: number; h: number } {
  return PROPS[kind].size(createRng(seedOf(kind, variant)));
}

export function propKey(kind: PropKind, variant: number): string {
  return `jr-prop-${kind}-${variant}`;
}

export function ensurePropTexture(scene: Phaser.Scene, kind: PropKind, variant: number): BakedProp {
  const key = propKey(kind, variant);
  const rng = createRng(seedOf(kind, variant));
  const { w, h } = PROPS[kind].size(rng);
  if (!scene.textures.exists(key)) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    PROPS[kind].draw(new Ink(g, rng, PAD, PAD), w, h, rng);
    g.generateTexture(key, w + PAD * 2, h + PAD * 2);
    g.destroy();
  }
  return { key, w, h, pad: PAD, originX: (PAD + w / 2) / (w + PAD * 2), originY: (PAD + h) / (h + PAD * 2) };
}
