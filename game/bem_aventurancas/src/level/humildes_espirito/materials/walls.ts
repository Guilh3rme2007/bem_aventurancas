import { JERUSALEM_VISUAL_THEME as T } from '../style/JerusalemVisualTheme';
import { Ink, Rng, Pt, darken, lighten, mix, varyTone, rgba } from '../HandDrawn';
import { blot, speckle, splitTotal, spans, wrapDraw, hex } from './tileUtils';

const P = T.palette;
const TX = T.texture;

interface BlockStyle {
  mortar: number;
  rows: number;
  minW: number;
  maxW: number;
  tone: () => number;
  outlineWidth: number;
  shade: number;
  inset: number;
}

/** Alvenaria em fiadas (repetível): cada fiada tem blocos de largura variável que somam W. */
function courses(ctx: CanvasRenderingContext2D, ink: Ink, W: number, H: number, rng: Rng, s: BlockStyle, extra?: (x: number, y: number, w: number, h: number, tone: number) => void): void {
  ctx.fillStyle = hex(s.mortar);
  ctx.fillRect(0, 0, W, H);
  const heights = splitTotal(H, s.rows, rng, 0.22);
  let y = 0;
  heights.forEach((rh) => {
    const widths = spans(W, s.minW, s.maxW, rng);
    let x = rng.range(0, W); // fiadas defasadas; os blocos "dão a volta" pela borda
    widths.forEach((bw) => {
      const i = s.inset;
      const j = () => rng.range(-1.6, 1.6);
      const pts: Pt[] = [{ x: x + i + j(), y: y + i + j() }, { x: x + bw - i + j(), y: y + i + j() }, { x: x + bw - i + j(), y: y + rh - i + j() }, { x: x + i + j(), y: y + rh - i + j() }];
      const tone = s.tone();
      const hasChip = rng.chance(0.3 + TX.wear * 0.4);
      const chip: Pt[] = [{ x: x + bw - i - 9, y: y + i }, { x: x + bw - i, y: y + i + 1 }, { x: x + bw - i, y: y + i + 9 }];
      wrapDraw(ink, W, H, x - 4, y - 4, bw + 8, rh + 8, () => {
        ink.poly(pts, tone, { outline: darken(tone, 0.5), width: s.outlineWidth, bleed: false });
        ink.shadeBox(x + i, y + i, bw - 2 * i, rh - 2 * i, s.shade);
        ink.strokes(x + i, y + i, bw - 2 * i, rh - 2 * i, darken(tone, 0.5), Math.round((bw * rh) / 520 * TX.detail), 0.13, 16);
        ink.strokes(x + i, y + i, bw - 2 * i, rh - 2 * i, lighten(tone, 0.6), Math.round((bw * rh) / 900 * TX.detail), 0.16, 14);
        if (hasChip) ink.poly(chip, s.mortar, { alpha: 0.75, outline: false, bleed: false });
        extra?.(x, y, bw, rh, tone);
      });
      x += bw;
    });
    y += rh;
  });
}

/* --------------------------------------------------------------- paredes --- */

export function paintWallLimestone(ctx: CanvasRenderingContext2D, W: number, H: number, rng: Rng): void {
  const ink = new Ink(ctx, rng, 0, 0, 1.1);
  courses(ctx, ink, W, H, rng, {
    mortar: darken(mix(P.sand, P.limestone, 0.5), 0.36),
    rows: 7,
    minW: 30,
    maxW: 66,
    tone: () => {
      let t = mix(P.limestone, P.stoneLight, rng.range(0, 0.5));
      if (rng.chance(0.18)) t = mix(t, P.stoneAged, 0.35);
      return varyTone(t, rng);
    },
    outlineWidth: 1.3,
    shade: 0.8,
    inset: 1.2,
  });
  for (let i = 0; i < 10; i++) blot(ctx, W, H, rng.range(0, W), rng.range(0, H), rng.range(26, 60), rng.chance(0.5) ? P.stoneLight : P.brownDark, 0.06);
  speckle(ctx, W, H, rng, 380, P.brownDark, P.stoneLight, 0.1);
}

export function paintWallRetaining(ctx: CanvasRenderingContext2D, W: number, H: number, rng: Rng): void {
  const ink = new Ink(ctx, rng, 0, 0, 1.6);
  courses(
    ctx, ink, W, H, rng,
    {
      mortar: darken(P.stoneAged, 0.5),
      rows: 4,
      minW: 70,
      maxW: 122,
      tone: () => varyTone(mix(P.limestone, P.stoneAged, rng.range(0.15, 0.65)), rng, 0.1),
      outlineWidth: 2,
      shade: 1.15,
      inset: 2.2,
    },
    (x, y, w, h, tone) => {
      // sombra funda sob cada bloco e musgo seco nas juntas
      ink.soft(x + 2, y + h - 10, w - 4, 10, P.brownDark, 0.4, 'bottom');
      if (rng.chance(0.35)) ink.wash(x + w * 0.1, y + h * 0.65, w * 0.5, h * 0.3, P.olive, 0.2);
      void tone;
    },
  );
  for (let i = 0; i < 8; i++) blot(ctx, W, H, rng.range(0, W), rng.range(0, H), rng.range(30, 70), P.brownDark, 0.07);
}

export function paintWallTemple(ctx: CanvasRenderingContext2D, W: number, H: number, rng: Rng): void {
  // Estilo herodiano: bloco com MARGEM rebaixada (moldura) e face central em relevo.
  const ink = new Ink(ctx, rng, 0, 0, 0.9);
  const base = mix(P.limestone, P.stoneLight, 0.45);
  ctx.fillStyle = hex(darken(base, 0.38));
  ctx.fillRect(0, 0, W, H);
  const rows = 4;
  const rh = H / rows;
  for (let r = 0; r < rows; r++) {
    const widths = spans(W, 96, 142, rng);
    let x = rng.range(0, W);
    widths.forEach((bw) => {
      const y = r * rh;
      const tone = varyTone(base, rng, 0.08);
      const m = 7; // largura da margem
      wrapDraw(ink, W, H, x - 4, y - 4, bw + 8, rh + 8, () => {
        ink.rect(x + 1.2, y + 1.2, bw - 2.4, rh - 2.4, darken(tone, 0.14), { outline: darken(tone, 0.5), width: 1.5, bleed: false });
        ink.rect(x + m, y + m, bw - 2 * m, rh - 2 * m, lighten(tone, 0.06), { outline: darken(tone, 0.42), width: 1.2, bleed: false });
        ink.soft(x + m, y + m, bw - 2 * m, rh - 2 * m, P.shadow, 0.16, 'right');
        ink.soft(x + m, y + m, (bw - 2 * m) * 0.3, rh - 2 * m, P.cloudWhite, 0.22, 'left');
        ink.strokes(x + m, y + m, bw - 2 * m, rh - 2 * m, darken(tone, 0.45), Math.round(5 * TX.detail), 0.1, 26);
      });
      x += bw;
    });
  }
  for (let i = 0; i < 8; i++) blot(ctx, W, H, rng.range(0, W), rng.range(0, H), rng.range(30, 66), rng.chance(0.6) ? P.cloudWhite : P.stoneAged, 0.07);
}

export function paintWallPlaster(ctx: CanvasRenderingContext2D, W: number, H: number, rng: Rng): void {
  const ink = new Ink(ctx, rng, 0, 0, 1.4);
  const base = mix(P.stoneLight, P.sand, 0.25);
  ctx.fillStyle = hex(base);
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 34; i++) blot(ctx, W, H, rng.range(0, W), rng.range(0, H), rng.range(24, 62), rng.pick([P.sand, P.cloudWhite, P.limestone, P.brown]), rng.range(0.07, 0.16));
  // marcas de desempenadeira: arcos curtos
  ctx.lineCap = 'round';
  for (let i = 0; i < 12; i++) {
    const cx = rng.range(0, W);
    const cy = rng.range(10, H - 10);
    ctx.strokeStyle = rgba(rng.chance(0.5) ? P.cloudWhite : P.brown, 0.08);
    ctx.lineWidth = rng.range(2, 5);
    ctx.beginPath();
    ctx.arc(cx, cy, rng.range(18, 40), rng.range(0, 6), rng.range(0, 6) + 1.2);
    ctx.stroke();
  }
  // reboco caído: mostra a pedra por baixo (borda recortada, assimétrica)
  const patches = 2 + Math.round(TX.wear * 3);
  for (let p = 0; p < patches; p++) {
    const cx = rng.range(30, W - 30);
    const cy = rng.range(24, H - 24);
    const rx = rng.range(24, 50);
    const ry = rng.range(16, 32);
    const pts: Pt[] = [];
    const n = 14;
    let r = 1;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      r = Math.max(0.5, Math.min(1.3, r + rng.range(-0.22, 0.22)));
      pts.push({ x: cx + Math.cos(a) * rx * r * (1 + 0.3 * Math.cos(a)), y: cy + Math.sin(a) * ry * r });
    }
    const stone = varyTone(mix(P.limestone, P.stoneAged, 0.3), rng, 0.1);
    wrapDraw(ink, W, H, cx - rx * 1.6, cy - ry * 1.4, rx * 3.2, ry * 2.8, () => {
      ink.poly(pts.map((q) => ({ x: q.x + 2, y: q.y + 3 })), P.shadow, { alpha: 0.24, outline: false, bleed: false }); // sombra da borda do reboco
      ink.poly(pts, stone, { outline: darken(base, 0.45), width: 1.8 });
      // blocos de pedra aparecendo
      ink.line(cx - rx * 0.8, cy - ry * 0.1, cx + rx * 0.8, cy, darken(stone, 0.55), 1.3, 0.55);
      ink.line(cx - rx * 0.15, cy - ry * 0.7, cx - rx * 0.05, cy - ry * 0.1, darken(stone, 0.55), 1.2, 0.5);
      ink.line(cx + rx * 0.3, cy, cx + rx * 0.25, cy + ry * 0.7, darken(stone, 0.55), 1.2, 0.5);
      ink.soft(cx - rx, cy - ry, rx * 2, ry * 2, P.shadow, 0.18, 'top');
    });
  }
  // rachaduras e manchas de umidade escorrendo
  for (let i = 0; i < 3; i++) {
    const x = rng.range(10, W - 10);
    const y = rng.range(10, H - 60);
    const pts: Pt[] = [{ x, y }];
    for (let k = 0; k < 5; k++) pts.push({ x: pts[k].x + rng.range(-7, 7), y: pts[k].y + rng.range(8, 14) });
    ink.curve(pts, darken(base, 0.55), 1.1, 0.45);
  }
  for (let i = 0; i < 4; i++) {
    const x = rng.range(0, W);
    ink.soft(x, 0, rng.range(8, 18), H, P.brownDark, 0.07, 'top');
  }
  speckle(ctx, W, H, rng, 520, P.brownDark, P.cloudWhite, 0.09);
}
