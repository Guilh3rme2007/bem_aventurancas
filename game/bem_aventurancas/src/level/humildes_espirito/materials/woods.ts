import { JERUSALEM_VISUAL_THEME as T } from '../style/JerusalemVisualTheme';
import { Ink, Rng, darken, lighten, mix, varyTone, rgba } from '../HandDrawn';
import { speckle, spans, splitTotal, hex } from './tileUtils';

const P = T.palette;
const TX = T.texture;

/** Veio de madeira ondulado com período inteiro ao longo do eixo longo: repete sem emenda. */
function grain(ctx: CanvasRenderingContext2D, vertical: boolean, along: number, across0: number, amp: number, k: number, phase: number, len: number, color: number, alpha: number, width = 1): void {
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let t = 0; t <= len; t += 6) {
    const off = Math.sin((t / len) * Math.PI * 2 * k + phase) * amp;
    const x = vertical ? across0 + off : t;
    const y = vertical ? t : across0 + off;
    if (t === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  void along;
}

function knot(ink: Ink, x: number, y: number, r: number, tone: number, vertical: boolean): void {
  ink.ellipse(x, y, vertical ? r * 0.7 : r, vertical ? r : r * 0.7, darken(tone, 0.4), { alpha: 0.85, outline: darken(tone, 0.6), width: 1, bleed: false });
  ink.ellipse(x, y, vertical ? r * 1.25 : r * 1.8, vertical ? r * 1.8 : r * 1.25, darken(tone, 0.25), { alpha: 0.18, outline: false, bleed: false });
}

/** Tábuas VERTICAIS (portas, tapumes, caixas). */
export function paintWoodPlanks(ctx: CanvasRenderingContext2D, W: number, H: number, rng: Rng): void {
  const ink = new Ink(ctx, rng, 0, 0, 0.9);
  ctx.fillStyle = hex(darken(P.wood, 0.55));
  ctx.fillRect(0, 0, W, H);
  let x = 0;
  spans(W, 26, 40, rng).forEach((pw) => {
    const tone = varyTone(mix(P.wood, P.brown, rng.range(0, 0.35)), rng, 0.14);
    ink.rect(x + 0.8, 0, pw - 1.6, H, tone, { outline: false, bleed: false });
    const n = Math.round(6 + 6 * TX.detail);
    for (let i = 0; i < n; i++) {
      grain(ctx, true, H, x + rng.range(2, pw - 2), rng.range(0.6, 2.2), rng.pick([1, 2]), rng.range(0, 6.28), H, rng.chance(0.7) ? darken(tone, 0.5) : lighten(tone, 0.35), rng.range(0.14, 0.3), rng.range(0.8, 1.4));
    }
    if (rng.chance(0.5)) knot(ink, x + pw * rng.range(0.3, 0.7), rng.range(20, H - 20), rng.range(3, 6), tone, true);
    ink.soft(x, 0, pw * 0.35, H, P.cloudWhite, 0.12, 'left');
    ink.soft(x + pw * 0.6, 0, pw * 0.4, H, P.brownDark, 0.18, 'right');
    // pregos
    for (const ny of [H * 0.18, H * 0.82]) {
      if (rng.chance(0.7)) ink.ellipse(x + pw / 2, ny, 1.8, 1.8, P.ink, { alpha: 0.8, outline: false, bleed: false });
    }
    ink.line(x + 0.6, 0, x + 0.6, H, P.ink, 1.4, 0.55);
    x += pw;
  });
  speckle(ctx, W, H, rng, 300, P.brownDark, P.stoneLight, 0.1);
}

/** Tábuas HORIZONTAIS (bancadas, tampos, caixas, estrados). */
export function paintWoodBoards(ctx: CanvasRenderingContext2D, W: number, H: number, rng: Rng): void {
  const ink = new Ink(ctx, rng, 0, 0, 0.9);
  ctx.fillStyle = hex(darken(P.wood, 0.55));
  ctx.fillRect(0, 0, W, H);
  let y = 0;
  splitTotal(H, 6, rng, 0.2).forEach((bh) => {
    const tone = varyTone(mix(P.wood, P.brown, rng.range(0, 0.3)), rng, 0.14);
    ink.rect(0, y + 0.8, W, bh - 1.6, tone, { outline: false, bleed: false });
    const n = Math.round(4 + 5 * TX.detail);
    for (let i = 0; i < n; i++) {
      grain(ctx, false, W, y + rng.range(2, bh - 2), rng.range(0.6, 2), rng.pick([1, 2, 3]), rng.range(0, 6.28), W, rng.chance(0.7) ? darken(tone, 0.5) : lighten(tone, 0.35), rng.range(0.14, 0.3), rng.range(0.8, 1.4));
    }
    if (rng.chance(0.55)) knot(ink, rng.range(20, W - 20), y + bh / 2, rng.range(3, 5), tone, false);
    ink.soft(0, y, W, bh * 0.4, P.cloudWhite, 0.12, 'top');
    ink.soft(0, y + bh * 0.6, W, bh * 0.4, P.brownDark, 0.18, 'bottom');
    const jx = rng.range(20, W - 20); // junta de topo entre duas tábuas
    ink.line(jx, y + 1, jx, y + bh - 1, P.ink, 1.3, 0.5);
    ink.ellipse(jx - 5, y + bh / 2, 1.6, 1.6, P.ink, { alpha: 0.75, outline: false, bleed: false });
    ink.ellipse(jx + 5, y + bh / 2, 1.6, 1.6, P.ink, { alpha: 0.75, outline: false, bleed: false });
    ink.line(0, y + 0.6, W, y + 0.6, P.ink, 1.4, 0.55);
    y += bh;
  });
  speckle(ctx, W, H, rng, 300, P.brownDark, P.stoneLight, 0.1);
}

/** Viga/poste VERTICAL grosso (postes de barraca, vigas), com rachaduras de secagem. */
export function paintWoodBeam(ctx: CanvasRenderingContext2D, W: number, H: number, rng: Rng): void {
  const ink = new Ink(ctx, rng, 0, 0, 0.9);
  const tone = mix(P.wood, P.brown, 0.2);
  ctx.fillStyle = hex(tone);
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 22; i++) {
    grain(ctx, true, H, rng.range(2, W - 2), rng.range(1, 4), rng.pick([1, 2]), rng.range(0, 6.28), H, rng.chance(0.65) ? darken(tone, 0.5) : lighten(tone, 0.35), rng.range(0.14, 0.32), rng.range(1, 2));
  }
  for (let i = 0; i < 3; i++) {
    const x = rng.range(10, W - 10);
    const y = rng.range(20, H - 90);
    ink.curve([{ x, y }, { x: x + rng.range(-2, 2), y: y + 24 }, { x: x + rng.range(-3, 3), y: y + 52 }], P.ink, 1.3, 0.55);
  }
  knot(ink, W * rng.range(0.3, 0.7), rng.range(40, H - 40), 6, tone, true);
  ink.soft(0, 0, W * 0.3, H, P.cloudWhite, 0.16, 'left');
  ink.soft(W * 0.55, 0, W * 0.45, H, P.brownDark, 0.28, 'right');
  speckle(ctx, W, H, rng, 260, P.brownDark, P.stoneLight, 0.1);
}
