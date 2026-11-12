import Phaser from 'phaser';
import { PALETTE } from './JerusalemBackgroundConfig';


export interface Rng {
  next(): number;
  range(min: number, max: number): number;
  int(min: number, maxInclusive: number): number;
  pick<T>(arr: readonly T[]): T;
  chance(p: number): boolean;
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (min, max) => min + next() * (max - min),
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
  };
}

export function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}


export function mix(c1: number, c2: number, t: number): number {
  const r = ((c1 >> 16) & 255) * (1 - t) + ((c2 >> 16) & 255) * t;
  const g = ((c1 >> 8) & 255) * (1 - t) + ((c2 >> 8) & 255) * t;
  const b = (c1 & 255) * (1 - t) + (c2 & 255) * t;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}
export const lighten = (c: number, t: number): number => mix(c, 0xfff6e0, t);
export const darken = (c: number, t: number): number => mix(c, PALETTE.brownDark, t);
export function varyTone(c: number, rng: Rng, amount = 0.12): number {
  return rng.chance(0.5) ? lighten(c, rng.next() * amount) : darken(c, rng.next() * amount);
}
export const hex = (c: number): string => '#' + c.toString(16).padStart(6, '0');


/**
 * Converte pontos simples {x, y} em instâncias de Phaser.Math.Vector2.
 * As tipagens do Phaser (Graphics.fillPoints/strokePoints) exigem Vector2[],
 * então toda chamada ao Graphics deve passar por aqui.
 */
export function toVec(pts: ReadonlyArray<{ x: number; y: number }>): Phaser.Math.Vector2[] {
  return pts.map((p) => new Phaser.Math.Vector2(p.x, p.y));
}

export interface Pt {
  x: number;
  y: number;
}

export interface InkOpts {
  alpha?: number;
  outline?: boolean | number;
  width?: number;
  bleed?: boolean;
}

export class Ink {
  constructor(
    public readonly g: Phaser.GameObjects.Graphics,
    public readonly rng: Rng,
    private readonly ox = 0,
    private readonly oy = 0,
    public wobble = 1.3,
    public inkColor: number = PALETTE.ink,
  ) {}

  private j(amp: number): number {
    return (this.rng.next() - 0.5) * 2 * amp;
  }

  private wobblePoly(pts: Pt[], amp: number, closed = true): Pt[] {
    const out: Pt[] = [];
    const n = pts.length;
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % n];
      const steps = Math.max(1, Math.floor(Math.hypot(b.x - a.x, b.y - a.y) / 16));
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        out.push({
          x: a.x + (b.x - a.x) * t + this.j(amp),
          y: a.y + (b.y - a.y) * t + this.j(amp),
        });
      }
    }
    if (!closed) out.push({ x: pts[n - 1].x + this.j(amp), y: pts[n - 1].y + this.j(amp) });
    return out;
  }

  private shift(pts: Pt[]): Pt[] {
    return pts.map((p) => ({ x: p.x + this.ox, y: p.y + this.oy }));
  }

  poly(pts: Pt[], fill: number, o: InkOpts = {}): void {
    const g = this.g;
    const a = o.alpha ?? 1;
    const base = this.shift(pts);
    g.fillStyle(fill, a);
    g.fillPoints(toVec(this.wobblePoly(base, this.wobble * 0.7)), true);
    if (o.bleed !== false) {
      const off = this.wobblePoly(base, this.wobble * 1.5).map((p) => ({
        x: p.x + this.j(1.6),
        y: p.y + this.j(1.6),
      }));
      g.fillStyle(lighten(fill, 0.14), 0.32 * a);
      g.fillPoints(toVec(off), true);
    }
    if (o.outline !== false) {
      const col = typeof o.outline === 'number' ? o.outline : this.inkColor;
      const w = o.width ?? 2;
      g.lineStyle(w, col, 0.82 * a);
      g.strokePoints(toVec(this.wobblePoly(base, this.wobble)), true);
      g.lineStyle(Math.max(1, w * 0.5), col, 0.35 * a);
      g.strokePoints(toVec(this.wobblePoly(base, this.wobble * 1.4)), true);
    }
  }

  rect(x: number, y: number, w: number, h: number, fill: number, o: InkOpts = {}): void {
    this.poly(
      [
        { x, y },
        { x: x + w, y },
        { x: x + w, y: y + h },
        { x, y: y + h },
      ],
      fill,
      o,
    );
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, fill: number, o: InkOpts = {}): void {
    const pts: Pt[] = [];
    const n = Math.max(10, Math.round((rx + ry) / 3));
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      pts.push({ x: cx + Math.cos(t) * rx, y: cy + Math.sin(t) * ry });
    }
    this.poly(pts, fill, o);
  }

  line(x1: number, y1: number, x2: number, y2: number, color: number, width = 2, alpha = 0.8): void {
    const pts = this.wobblePoly(this.shift([{ x: x1, y: y1 }, { x: x2, y: y2 }]), this.wobble * 0.8, false);
    this.g.lineStyle(width, color, alpha);
    this.g.strokePoints(toVec(pts), false);
  }

  curve(pts: Pt[], color: number, width = 2, alpha = 0.8): void {
    this.g.lineStyle(width, color, alpha);
    this.g.strokePoints(toVec(this.wobblePoly(this.shift(pts), this.wobble * 0.6, false)), false);
  }

  outline(pts: Pt[], color: number = this.inkColor, width = 2.4, alpha = 0.85): void {
    const p = this.wobblePoly(this.shift(pts), this.wobble);
    this.g.lineStyle(width, color, alpha);
    this.g.strokePoints(toVec(p), true);
    this.g.lineStyle(Math.max(1, width * 0.45), color, alpha * 0.4);
    this.g.strokePoints(toVec(this.wobblePoly(this.shift(pts), this.wobble * 1.5)), true);
  }

  strokes(x: number, y: number, w: number, h: number, color: number, count: number, alpha = 0.14, len = 26): void {
    const r = this.rng;
    this.g.lineStyle(1.6, color, alpha);
    for (let i = 0; i < count; i++) {
      const sx = x + r.next() * w;
      const sy = y + r.next() * h;
      const l = len * (0.4 + r.next());
      this.g.strokePoints(
        toVec([
          { x: sx + this.ox, y: sy + this.oy },
          { x: sx + l * 0.5 + this.ox, y: sy + this.j(1.2) + this.oy },
          { x: sx + l + this.ox, y: sy + this.j(1.6) + this.oy },
        ]),
        false,
      );
    }
  }

  contactShadow(cx: number, cy: number, rx: number, ry: number, alpha = 0.26): void {
    this.g.fillStyle(PALETTE.shadow, alpha);
    this.g.fillEllipse(cx + this.ox, cy + this.oy, rx * 2, ry * 2);
    this.g.fillStyle(PALETTE.shadow, alpha * 0.6);
    this.g.fillEllipse(cx + this.ox + 3, cy + this.oy + 1, rx * 1.6, ry * 1.5);
  }

  wash(x: number, y: number, w: number, h: number, color: number, alpha = 0.18): void {
    this.poly(
      [
        { x, y },
        { x: x + w, y: y + this.j(2) },
        { x: x + w + this.j(2), y: y + h },
        { x: x + this.j(2), y: y + h },
      ],
      color,
      { alpha, outline: false, bleed: true },
    );
  }
}
