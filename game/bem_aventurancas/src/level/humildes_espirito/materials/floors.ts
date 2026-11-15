import { JERUSALEM_VISUAL_THEME as T } from '../style/JerusalemVisualTheme';
import { Ink, Rng, Pt, darken, lighten, mix, varyTone, rgba } from '../../../worlds/jerusalem/HandDrawn';
import { blot, speckle, splitTotal, spans, wrapDraw, hex } from './tileUtils';

const P = T.palette;
const TX = T.texture;
/** Fator de densidade: contagens foram calibradas para um tile 256x256. */
const areaK = (W: number, H: number): number => (W * H) / (256 * 256);

/** Polígono "quase retangular" irregular (pedra lavrada à mão) em torno de (cx, cy). */
function stonePts(cx: number, cy: number, w: number, h: number, rng: Rng, n = 10, round = 0.62): Pt[] {
  const pts: Pt[] = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const e = (v: number) => Math.sign(v) * Math.pow(Math.abs(v), round);
    pts.push({ x: cx + e(c) * (w / 2) * rng.range(0.92, 1.04), y: cy + e(s) * (h / 2) * rng.range(0.9, 1.04) });
  }
  return pts;
}

function bounds(pts: Pt[]): { x: number; y: number; w: number; h: number } {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const x = Math.min(...xs) - 4;
  const y = Math.min(...ys) - 4;
  return { x, y, w: Math.max(...xs) - x + 4, h: Math.max(...ys) - y + 4 };
}

/** Terra batida: manchas de tom, marcas de passagem, seixos e grãos. Base comum a terra e mercado. */
function dirtBase(ctx: CanvasRenderingContext2D, ink: Ink, W: number, H: number, rng: Rng, tone: number): void {
  ctx.fillStyle = hex(tone);
  ctx.fillRect(0, 0, W, H);
  const n = Math.round(46 * areaK(W, H) * (0.6 + TX.detail * 0.6));
  for (let i = 0; i < n; i++) {
    const c = rng.pick([P.terracotta, P.brown, P.sand, P.stoneLight, P.olive]);
    blot(ctx, W, H, rng.range(0, W), rng.range(0, H), rng.range(22, 64), c, rng.range(0.07, 0.2));
  }
  // marcas de passagem: sulcos ondulados com período inteiro (repetem sem emenda)
  for (let i = 0; i < Math.round(5 * areaK(W, H)); i++) {
    const y0 = rng.range(0, H);
    const amp = rng.range(2, 6);
    const k = rng.pick([1, 2, 3]);
    const ph = rng.range(0, Math.PI * 2);
    ctx.strokeStyle = rgba(P.brownDark, rng.range(0.07, 0.14));
    ctx.lineWidth = rng.range(3, 11);
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let x = 0; x <= W; x += 8) {
      const y = y0 + Math.sin((x / W) * Math.PI * 2 * k + ph) * amp;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  speckle(ctx, W, H, rng, Math.round(900 * areaK(W, H) * TX.detail), P.brownDark, P.stoneLight, 0.14);
  // pinceladas secas: dão a textura de guache sobre a terra
  ink.strokes(0, 0, W, H, P.brownDark, Math.round(60 * areaK(W, H)), 0.1, 24);
  ink.strokes(0, 0, W, H, P.stoneLight, Math.round(50 * areaK(W, H)), 0.14, 20);
}

function pebbles(ink: Ink, W: number, H: number, rng: Rng, count: number, size: [number, number]): void {
  for (let i = 0; i < count; i++) {
    const w = rng.range(size[0], size[1]);
    const h = w * rng.range(0.55, 0.85);
    const cx = rng.range(0, W);
    const cy = rng.range(0, H);
    const pts = stonePts(cx, cy, w, h, rng, 8);
    const b = bounds(pts);
    const tone = varyTone(mix(P.limestone, P.stoneAged, rng.range(0, 0.6)), rng, 0.1);
    wrapDraw(ink, W, H, b.x, b.y, b.w, b.h, () => {
      ink.contactShadow(cx + 1, cy + h * 0.35, w * 0.5, h * 0.28, 0.2);
      ink.poly(pts, tone, { outline: darken(tone, 0.5), width: 1.2, bleed: false });
      ink.poly(stonePts(cx - w * 0.12, cy - h * 0.15, w * 0.5, h * 0.4, rng, 7), lighten(tone, 0.4), { alpha: 0.35, outline: false, bleed: false });
    });
  }
}

/* ---------------------------------------------------------------- pisos --- */

export function paintFloorStone(ctx: CanvasRenderingContext2D, W: number, H: number, rng: Rng): void {
  const ink = new Ink(ctx, rng, 0, 0, 1.0);
  ctx.fillStyle = hex(darken(mix(P.sand, P.limestone, 0.5), 0.34)); // junta/terra entre as pedras
  ctx.fillRect(0, 0, W, H);
  const k = areaK(W, H);
  for (let i = 0; i < Math.round(28 * k); i++) blot(ctx, W, H, rng.range(0, W), rng.range(0, H), rng.range(20, 50), P.brownDark, 0.08);

  // fiadas de alturas diferentes; em cada uma, pedras de larguras muito diferentes (nada de grade)
  const rows = Math.round((H / 384) * 10); // ~38 px por fiada: pedras na escala do jogador (65 px)
  const heights = splitTotal(H, rows, rng, 0.38);
  let y = 0;
  heights.forEach((rh, r) => {
    const widths = spans(W, 24, 62, rng);
    let x = rng.range(0, W);
    widths.forEach((rw) => {
      const sw = rw * rng.range(0.82, 0.98);
      const sh = rh * rng.range(0.74, 0.96);
      const cx = x + rw / 2 + rng.range(-3, 3) * (TX.irregularity / 0.35);
      const cy = y + rh / 2 + rng.range(-rh * 0.1, rh * 0.1);
      const pts = stonePts(cx, cy, sw, sh, rng);
      const b = bounds(pts);
      let tone = mix(P.limestone, P.sand, rng.range(0, 0.6));
      if (rng.chance(0.22)) tone = mix(tone, P.stoneAged, rng.range(0.25, 0.5));
      if (rng.chance(0.12)) tone = lighten(tone, 0.18);
      tone = varyTone(tone, rng);
      const hasCrack = rng.chance(0.2 + TX.wear * 0.5);
      const crack: Pt[] = [
        { x: cx - sw * 0.2, y: cy - sh * 0.3 },
        { x: cx + rng.range(-4, 4), y: cy + rng.range(-3, 3) },
        { x: cx + sw * 0.25, y: cy + sh * 0.3 },
      ];
      wrapDraw(ink, W, H, b.x, b.y, b.w, b.h, () => {
        ink.poly(pts, tone, { outline: darken(tone, 0.5), width: 1.5 });
        ink.poly(stonePts(cx - sw * 0.14, cy - sh * 0.16, sw * 0.55, sh * 0.42, rng, 8), lighten(tone, 0.45), { alpha: 0.3, outline: false, bleed: false });
        ink.poly(stonePts(cx + sw * 0.18, cy + sh * 0.2, sw * 0.5, sh * 0.4, rng, 8), P.shadow, { alpha: 0.15, outline: false, bleed: false });
        ink.strokes(cx - sw * 0.4, cy - sh * 0.35, sw * 0.8, sh * 0.7, darken(tone, 0.5), Math.round(3 * TX.detail), 0.14, 14);
        if (hasCrack) ink.curve(crack, darken(tone, 0.6), 1, 0.45);
      });
      x += rw;
    });
    y += rh;
    void r;
  });
  pebbles(ink, W, H, rng, Math.round(16 * k * TX.detail), [5, 12]);
  for (let i = 0; i < Math.round(26 * k); i++) blot(ctx, W, H, rng.range(0, W), rng.range(0, H), rng.range(30, 70), rng.chance(0.5) ? P.stoneLight : P.brownDark, rng.range(0.04, 0.09));
  speckle(ctx, W, H, rng, Math.round(500 * k), P.brownDark, P.stoneLight, 0.1);
}

export function paintFloorDirt(ctx: CanvasRenderingContext2D, W: number, H: number, rng: Rng): void {
  const ink = new Ink(ctx, rng, 0, 0, 1.0);
  dirtBase(ctx, ink, W, H, rng, mix(P.sand, P.terracotta, 0.14));
  pebbles(ink, W, H, rng, Math.round(26 * areaK(W, H) * TX.detail), [5, 16]);
  for (let i = 0; i < Math.round(8 * areaK(W, H)); i++) blot(ctx, W, H, rng.range(0, W), rng.range(0, H), rng.range(40, 80), P.stoneLight, 0.12); // poeira
}

export function paintFloorMarket(ctx: CanvasRenderingContext2D, W: number, H: number, rng: Rng): void {
  const ink = new Ink(ctx, rng, 0, 0, 1.0);
  dirtBase(ctx, ink, W, H, rng, mix(P.sand, P.brown, 0.18));
  // lajes soltas, mais esparsas que na rua de pedra
  for (let i = 0; i < Math.round(9 * areaK(W, H)); i++) {
    const w = rng.range(30, 56);
    const h = w * rng.range(0.55, 0.75);
    const cx = rng.range(0, W);
    const cy = rng.range(0, H);
    const pts = stonePts(cx, cy, w, h, rng, 9);
    const b = bounds(pts);
    const tone = varyTone(mix(P.limestone, P.sand, rng.range(0.1, 0.6)), rng);
    wrapDraw(ink, W, H, b.x, b.y, b.w, b.h, () => {
      ink.contactShadow(cx + 1, cy + h * 0.4, w * 0.52, h * 0.3, 0.22);
      ink.poly(pts, tone, { outline: darken(tone, 0.5), width: 1.4 });
      ink.poly(stonePts(cx - w * 0.12, cy - h * 0.15, w * 0.5, h * 0.4, rng, 7), lighten(tone, 0.45), { alpha: 0.28, outline: false, bleed: false });
    });
  }
  pebbles(ink, W, H, rng, Math.round(20 * areaK(W, H) * TX.detail), [4, 11]);
  // desgaste de circulação: manchas escuras alongadas
  for (let i = 0; i < Math.round(8 * areaK(W, H)); i++) {
    const x = rng.range(0, W);
    const y = rng.range(0, H);
    const w = rng.range(50, 110);
    const h = rng.range(12, 24);
    ctx.save();
    ctx.fillStyle = rgba(P.brownDark, rng.range(0.07, 0.13));
    for (const dx of [0, W, -W]) {
      ctx.beginPath();
      ctx.ellipse(x + dx, y, w, h, rng.range(-0.15, 0.15), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  // palha, folhas e restos do comércio
  for (let i = 0; i < Math.round(34 * areaK(W, H)); i++) {
    const x = rng.range(4, W - 24);
    const y = rng.range(4, H - 8);
    ink.line(x, y, x + rng.range(8, 18), y + rng.range(-3, 3), rng.pick([P.sand, P.olive, P.stoneLight]), 1.2, 0.55);
  }
}

export function paintFloorStairs(ctx: CanvasRenderingContext2D, W: number, H: number, rng: Rng): void {
  const ink = new Ink(ctx, rng, 0, 0, 1.0);
  const step = T.scale.stepWidth; // 64 px; W = 3 degraus
  const riser = 12;
  ctx.fillStyle = hex(darken(P.limestone, 0.4));
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < W / step; i++) {
    const x0 = i * step;
    const treadTone = mix(P.limestone, P.stoneLight, rng.range(0.2, 0.5));
    // piso do degrau
    let y = 0;
    const joints = splitTotal(H, rng.pick([2, 3, 4]), rng, 0.4); // cada degrau tem suas próprias lajes
    joints.forEach((jh) => {
      const tone = varyTone(treadTone, rng, 0.08);
      ink.rect(x0 + riser, y + 1, step - riser - 1, jh - 2, tone, { outline: darken(tone, 0.5), width: 1.2, bleed: false });
      y += jh;
    });
    // desgaste: borda frontal clara, lascas e brilho de uso
    ctx.fillStyle = rgba(P.stoneLight, 0.55);
    ctx.fillRect(x0 + step - 5, 0, 4, H);
    ink.soft(x0 + riser, 0, step - riser, H, P.stoneLight, 0.22, 'right');
    // espelho (face vertical do degrau) em sombra
    ink.soft(x0 - 2, 0, riser + 8, H, P.brownDark, 0.55, 'left');
    ctx.fillStyle = rgba(P.brownDark, 0.35);
    ctx.fillRect(x0, 0, 3, H);
    for (let k = 0; k < 6; k++) {
      const cy = rng.range(10, H - 10);
      ink.poly(
        [{ x: x0 + step - 7, y: cy }, { x: x0 + step - 1, y: cy + rng.range(-3, 3) }, { x: x0 + step - 4, y: cy + rng.range(5, 10) }],
        darken(P.limestone, 0.45),
        { alpha: 0.7, outline: false, bleed: false },
      );
    }
    ink.strokes(x0 + riser, 0, step - riser, H, darken(treadTone, 0.5), Math.round(8 * TX.detail), 0.12, 20);
  }
  for (let i = 0; i < 10; i++) blot(ctx, W, H, rng.range(0, W), rng.range(0, H), rng.range(20, 44), rng.chance(0.5) ? P.stoneLight : P.brownDark, 0.07);
}

export function paintFloorTemple(ctx: CanvasRenderingContext2D, W: number, H: number, rng: Rng): void {
  const ink = new Ink(ctx, rng, 0, 0, 0.8); // acabamento mais refinado: traço menos trêmulo
  ctx.fillStyle = hex(darken(P.stoneLight, 0.24));
  ctx.fillRect(0, 0, W, H);
  const heights = splitTotal(H, 4, rng, 0.18);
  let y = 0;
  heights.forEach((rh) => {
    let x = rng.range(0, W);
    spans(W, 92, 150, rng).forEach((sw) => {
      const w = sw - 2.5;
      const h = rh - 2.5;
      const j = () => rng.range(-0.9, 0.9);
      const pts = [{ x: x + 1.2 + j(), y: y + 1.2 + j() }, { x: x + w + j(), y: y + 1.2 + j() }, { x: x + w + j(), y: y + h + j() }, { x: x + 1.2 + j(), y: y + h + j() }];
      const tone = varyTone(mix(P.stoneLight, P.limestone, rng.range(0, 0.3)), rng, 0.07);
      const cr: Pt[] = [{ x: x + w * rng.range(0.2, 0.5), y: y + 3 }, { x: x + w * rng.range(0.3, 0.6), y: y + h * 0.5 }, { x: x + w * rng.range(0.3, 0.7), y: y + h - 3 }];
      const crack = rng.chance(0.3);
      wrapDraw(ink, W, H, x - 4, y - 4, sw + 8, rh + 8, () => {
        ink.poly(pts, tone, { outline: darken(tone, 0.42), width: 1.3 });
        ink.rect(x + 5, y + 5, w - 8, h - 8, lighten(tone, 0.5), { alpha: 0.2, outline: false, bleed: false }); // bisel
        ink.soft(x + 2, y + 2, w - 2, h - 2, P.shadow, 0.14, 'right');
        ink.soft(x + 2, y + 2, w * 0.3, h - 2, P.cloudWhite, 0.22, 'left');
        ink.strokes(x + 4, y + 4, w - 8, h - 8, darken(tone, 0.4), 3, 0.08, 22);
        if (crack) ink.curve(cr, darken(tone, 0.55), 1, 0.4);
      });
      x += sw;
    });
    y += rh;
  });
  const k = areaK(W, H);
  for (let i = 0; i < Math.round(16 * k); i++) blot(ctx, W, H, rng.range(0, W), rng.range(0, H), rng.range(24, 56), rng.chance(0.55) ? P.cloudWhite : P.stoneAged, rng.range(0.05, 0.1));
  speckle(ctx, W, H, rng, Math.round(360 * k), P.brownDark, P.cloudWhite, 0.08);
}
