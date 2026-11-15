import { Ink, createRng, hex, rgba } from '../../../worlds/jerusalem/HandDrawn';

/**
 * Utilidades para texturas REPETÍVEIS (sem emendas).
 * A técnica: toda forma que cruza a borda do tile é desenhada de novo deslocada em ±W/±H,
 * com a MESMA semente de traço, de modo que o contorno e a pintura continuam exatamente do
 * outro lado.
 */

/** Chama `draw` uma vez por cópia necessária. O bbox é o retângulo ocupado pela forma. */
export function wrapDraw(ink: Ink, W: number, H: number, bx: number, by: number, bw: number, bh: number, draw: () => void): void {
  const seed = ink.rng.int(1, 0x3fffffff);
  const xs = [0];
  if (bx < 0) xs.push(W);
  if (bx + bw > W) xs.push(-W);
  const ys = [0];
  if (by < 0) ys.push(H);
  if (by + bh > H) ys.push(-H);
  const original = ink.rng;
  for (const dx of xs) {
    for (const dy of ys) {
      ink.setOffset(dx, dy);
      ink.rng = createRng(seed);
      draw();
    }
  }
  ink.rng = original;
  ink.setOffset(0, 0);
}

/** Mancha suave (aquarela diluída), repetível. */
export function blot(ctx: CanvasRenderingContext2D, W: number, H: number, x: number, y: number, r: number, color: number, alpha: number): void {
  const xs = [0];
  if (x - r < 0) xs.push(W);
  if (x + r > W) xs.push(-W);
  const ys = [0];
  if (y - r < 0) ys.push(H);
  if (y + r > H) ys.push(-H);
  for (const dx of xs) {
    for (const dy of ys) {
      const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
      g.addColorStop(0, rgba(color, alpha));
      g.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x + dx - r, y + dy - r, r * 2, r * 2);
    }
  }
}

/** Grãos finos (poeira de pigmento) espalhados, repetíveis (pontos inteiros dentro do tile). */
export function speckle(ctx: CanvasRenderingContext2D, W: number, H: number, rng: { next(): number }, count: number, dark: number, light: number, alpha = 0.12): void {
  for (let i = 0; i < count; i++) {
    const isDark = rng.next() < 0.6;
    ctx.fillStyle = rgba(isDark ? dark : light, alpha * (0.5 + rng.next()));
    const s = 0.8 + rng.next() * 1.6;
    ctx.fillRect(rng.next() * W, rng.next() * H, s, s);
  }
}

/** Divide `total` em n partes com variação (soma exata). */
export function splitTotal(total: number, n: number, rng: { range(a: number, b: number): number }, jitter = 0.25): number[] {
  const raw = Array.from({ length: n }, () => 1 + rng.range(-jitter, jitter));
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((v) => (v / sum) * total);
}

/** Divide `total` em trechos de largura entre min e max (soma exata, sem trecho minúsculo). */
export function spans(total: number, min: number, max: number, rng: { range(a: number, b: number): number }): number[] {
  const out: number[] = [];
  let s = 0;
  while (s < total - 0.5) {
    let w = rng.range(min, max);
    if (total - s - w < min * 0.7) w = total - s;
    out.push(w);
    s += w;
  }
  return out;
}

export { hex };
