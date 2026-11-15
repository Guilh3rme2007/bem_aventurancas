import { JERUSALEM_VISUAL_THEME as T, css } from '../../level/humildes_espirito/style/JerusalemVisualTheme';
import { getPattern } from '../../level/humildes_espirito/style/CanvasStore';

/* ---------------------------------------------------------------- RNG --- */

export interface Rng {
  next(): number;
  range(min: number, max: number): number;
  int(min: number, maxInclusive: number): number;
  pick<T>(arr: readonly T[]): T;
  chance(p: number): boolean;
}

/** mulberry32: pequeno, rápido e determinístico (mesma seed => mesmo cenário). */
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

/** Hash de string -> seed numérica. */
export function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* -------------------------------------------------------------- cores --- */

export function mix(c1: number, c2: number, t: number): number {
  const r = ((c1 >> 16) & 255) * (1 - t) + ((c2 >> 16) & 255) * t;
  const g = ((c1 >> 8) & 255) * (1 - t) + ((c2 >> 8) & 255) * t;
  const b = (c1 & 255) * (1 - t) + (c2 & 255) * t;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}
/** Clareia em direção ao creme quente (a luz do tema é quente). */
export const lighten = (c: number, t: number): number => mix(c, 0xfff6e0, t);
/** Escurece em direção ao marrom escuro (nunca preto). */
export const darken = (c: number, t: number): number => mix(c, T.palette.brownDark, t);
/** Pequena variação de tom (evita que pedras/tábuas/casas vizinhas tenham a mesma cor). */
export function varyTone(c: number, rng: Rng, amount: number = T.texture.toneVariation): number {
  return rng.chance(0.5) ? lighten(c, rng.next() * amount) : darken(c, rng.next() * amount);
}
export const hex = css;

/* ---------------------------------------------------------------- Ink --- */

export interface Pt {
  x: number;
  y: number;
}

export interface InkOpts {
  alpha?: number;
  /** false = sem contorno. Número = cor do contorno. */
  outline?: boolean | number;
  width?: number;
  /** Camada extra deslocada e translúcida que imita aquarela escorrendo. */
  bleed?: boolean;
}

export interface MaterialOpts extends InkOpts {
  /** Cor translúcida por cima do material (variação de tom entre objetos). */
  tint?: number;
  tintAlpha?: number;
  /** Desloca o padrão (evita que dois objetos mostrem exatamente o mesmo trecho da textura). */
  shift?: Pt;
}

/**
 * Pincel "à mão" sobre um Canvas 2D. É o ÚNICO jeito de desenhar no cenário: materiais,
 * objetos e elementos usam esta classe, e por isso compartilham o mesmo traço: contorno
 * irregular de dois passes, preenchimento levemente desalinhado como aquarela, pinceladas secas
 * e sombras pintadas, tudo parametrizado pelo tema central.
 *
 * Coordenadas são locais; (ox, oy) é o deslocamento de desenho (margem do baking, ou cópia
 * deslocada ao fazer texturas repetíveis). `rng` pode ser trocado (ver `wrapDraw`).
 */
export class Ink {
  constructor(
    public readonly ctx: CanvasRenderingContext2D,
    public rng: Rng,
    private ox = 0,
    private oy = 0,
    public wobble: number = T.ink.wobble,
    public inkColor: number = T.palette.ink,
  ) {}

  setOffset(ox: number, oy: number): void {
    this.ox = ox;
    this.oy = oy;
  }

  private j(amp: number): number {
    return (this.rng.next() - 0.5) * 2 * amp;
  }

  /** Subdivide as arestas e desloca levemente cada ponto. */
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
        out.push({ x: a.x + (b.x - a.x) * t + this.j(amp), y: a.y + (b.y - a.y) * t + this.j(amp) });
      }
    }
    if (!closed) out.push({ x: pts[n - 1].x + this.j(amp), y: pts[n - 1].y + this.j(amp) });
    return out;
  }

  private shift(pts: Pt[]): Pt[] {
    return pts.map((p) => ({ x: p.x + this.ox, y: p.y + this.oy }));
  }

  private trace(pts: Pt[], closed: boolean): void {
    const c = this.ctx;
    c.beginPath();
    pts.forEach((p, i) => (i === 0 ? c.moveTo(p.x, p.y) : c.lineTo(p.x, p.y)));
    if (closed) c.closePath();
  }

  private strokeOutline(base: Pt[], o: InkOpts, a: number): void {
    if (o.outline === false) return;
    const c = this.ctx;
    const col = typeof o.outline === 'number' ? o.outline : this.inkColor;
    const w = o.width ?? T.ink.outlineWidth;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.strokeStyle = hex(col);
    c.globalAlpha = T.ink.outlineAlpha * a;
    c.lineWidth = w;
    this.trace(this.wobblePoly(base, this.wobble), true);
    c.stroke();
    c.globalAlpha = T.ink.innerStrokeAlpha * a;
    c.lineWidth = Math.max(1, w * T.ink.innerStrokeScale);
    this.trace(this.wobblePoly(base, this.wobble * 1.4), true);
    c.stroke();
    c.globalAlpha = 1;
  }

  /** Polígono pintado à mão (preenchimento + contorno). */
  poly(pts: Pt[], fill: number, o: InkOpts = {}): void {
    const c = this.ctx;
    const a = o.alpha ?? 1;
    const base = this.shift(pts);
    c.globalAlpha = a;
    c.fillStyle = hex(fill);
    this.trace(this.wobblePoly(base, this.wobble * 0.7), true);
    c.fill();
    if (o.bleed !== false) {
      const off = this.wobblePoly(base, this.wobble * 1.5).map((p) => ({ x: p.x + this.j(1.6), y: p.y + this.j(1.6) }));
      c.globalAlpha = T.ink.bleedAlpha * a;
      c.fillStyle = hex(lighten(fill, T.ink.bleedLighten));
      this.trace(off, true);
      c.fill();
    }
    c.globalAlpha = 1;
    this.strokeOutline(base, o, a);
  }

  /** Polígono preenchido com um MATERIAL (textura repetível) e contorno à mão. */
  material(pts: Pt[], id: string, o: MaterialOpts = {}): void {
    const c = this.ctx;
    const a = o.alpha ?? 1;
    const base = this.shift(pts);
    const body = this.wobblePoly(base, this.wobble * 0.7);
    const pat = getPattern(c, id.startsWith('jr-') ? id : 'jr-mat-' + id);
    if (pat) {
      const s = o.shift ?? { x: this.rng.range(0, 256), y: this.rng.range(0, 256) };
      if (typeof DOMMatrix !== 'undefined') pat.setTransform(new DOMMatrix([1, 0, 0, 1, s.x, s.y]));
      c.fillStyle = pat;
    } else {
      c.fillStyle = hex(T.palette.limestone); // material ainda não gerado: cor neutra
    }
    c.globalAlpha = a;
    this.trace(body, true);
    c.fill();
    if (o.tint !== undefined) {
      c.globalAlpha = (o.tintAlpha ?? 0.22) * a;
      c.fillStyle = hex(o.tint);
      this.trace(body, true);
      c.fill();
    }
    c.globalAlpha = 1;
    this.strokeOutline(base, o, a);
  }

  rect(x: number, y: number, w: number, h: number, fill: number, o: InkOpts = {}): void {
    this.poly(this.rectPts(x, y, w, h), fill, o);
  }

  rectMaterial(x: number, y: number, w: number, h: number, id: string, o: MaterialOpts = {}): void {
    this.material(this.rectPts(x, y, w, h), id, o);
  }

  private rectPts(x: number, y: number, w: number, h: number): Pt[] {
    return [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }];
  }

  ellipsePts(cx: number, cy: number, rx: number, ry: number): Pt[] {
    const pts: Pt[] = [];
    const n = Math.max(10, Math.round((rx + ry) / 3));
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      pts.push({ x: cx + Math.cos(t) * rx, y: cy + Math.sin(t) * ry });
    }
    return pts;
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, fill: number, o: InkOpts = {}): void {
    this.poly(this.ellipsePts(cx, cy, rx, ry), fill, o);
  }

  line(x1: number, y1: number, x2: number, y2: number, color: number, width: number = T.ink.outlineWidth, alpha = 0.8): void {
    const c = this.ctx;
    const pts = this.wobblePoly(this.shift([{ x: x1, y: y1 }, { x: x2, y: y2 }]), this.wobble * 0.8, false);
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.strokeStyle = hex(color);
    c.globalAlpha = alpha;
    c.lineWidth = width;
    this.trace(pts, false);
    c.stroke();
    c.globalAlpha = 1;
  }

  /** Curva aberta por pontos (cabos, bordas de tecido, rachaduras). */
  curve(pts: Pt[], color: number, width: number = T.ink.outlineWidth, alpha = 0.8): void {
    const c = this.ctx;
    const p = this.wobblePoly(this.shift(pts), this.wobble * 0.6, false);
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.strokeStyle = hex(color);
    c.globalAlpha = alpha;
    c.lineWidth = width;
    this.trace(p, false);
    c.stroke();
    c.globalAlpha = 1;
  }

  /** Apenas o contorno (traço duplo irregular), sem preenchimento. */
  outline(pts: Pt[], color: number = this.inkColor, width: number = T.ink.outlineWidth + 0.4, alpha = 1): void {
    this.strokeOutline(this.shift(pts), { outline: color, width }, alpha);
  }

  outlineRect(x: number, y: number, w: number, h: number, color: number = this.inkColor, width?: number): void {
    this.outline(this.rectPts(x, y, w, h), color, width);
  }

  /** Executa `fn` com o desenho recortado pela silhueta `pts` (sombras/luzes não vazam da forma). */
  clipped(pts: Pt[], fn: () => void): void {
    const c = this.ctx;
    c.save();
    this.trace(this.shift(pts), true);
    c.clip();
    fn();
    c.restore();
  }

  /** Pinceladas secas (dry-brush): a textura de guache dentro de uma região. */
  strokes(x: number, y: number, w: number, h: number, color: number, count: number, alpha = 0.14, len = 26): void {
    const c = this.ctx;
    const r = this.rng;
    c.lineWidth = 1.6;
    c.lineCap = 'round';
    c.strokeStyle = hex(color);
    c.globalAlpha = alpha;
    for (let i = 0; i < count; i++) {
      const sx = x + r.next() * w + this.ox;
      const sy = y + r.next() * h + this.oy;
      const l = len * (0.4 + r.next());
      c.beginPath();
      c.moveTo(sx, sy);
      c.quadraticCurveTo(sx + l * 0.5, sy + this.j(1.2), sx + l, sy + this.j(1.6));
      c.stroke();
    }
    c.globalAlpha = 1;
  }

  /** Sombra de contato pintada no chão. */
  contactShadow(cx: number, cy: number, rx: number, ry: number, alpha: number = T.shading.contactShadowAlpha): void {
    const c = this.ctx;
    c.fillStyle = hex(T.palette.shadow);
    c.globalAlpha = alpha;
    c.beginPath();
    c.ellipse(cx + this.ox, cy + this.oy, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = alpha * 0.6;
    c.beginPath();
    c.ellipse(cx + this.ox + 3, cy + this.oy + 1, rx * 0.8, ry * 0.75, 0, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;
  }

  /** Mancha de aquarela translúcida de borda irregular (luz/sombra/desgaste). */
  wash(x: number, y: number, w: number, h: number, color: number, alpha = 0.18): void {
    this.poly(
      [{ x, y }, { x: x + w, y: y + this.j(2) }, { x: x + w + this.j(2), y: y + h }, { x: x + this.j(2), y: y + h }],
      color,
      { alpha, outline: false, bleed: true },
    );
  }

  /**
   * Sombra/luz SUAVE em degradê dentro de um retângulo. `edge` = lado onde o efeito é mais forte.
   * É o que dá o volume "pintado" (em vez de um bloco chapado).
   */
  soft(x: number, y: number, w: number, h: number, color: number, alpha: number, edge: 'left' | 'right' | 'top' | 'bottom'): void {
    const c = this.ctx;
    const X = x + this.ox;
    const Y = y + this.oy;
    const g =
      edge === 'right' ? c.createLinearGradient(X + w, 0, X, 0)
      : edge === 'left' ? c.createLinearGradient(X, 0, X + w, 0)
      : edge === 'bottom' ? c.createLinearGradient(0, Y + h, 0, Y)
      : c.createLinearGradient(0, Y, 0, Y + h);
    g.addColorStop(0, rgba(color, alpha));
    g.addColorStop(1, rgba(color, 0));
    c.fillStyle = g;
    c.fillRect(X, Y, w, h);
  }

  /**
   * Volume padrão de uma caixa: realce à esquerda (luz), sombra à direita e ambiente embaixo.
   * `strength` 1 = padrão do tema.
   */
  shadeBox(x: number, y: number, w: number, h: number, strength = 1): void {
    const sh = T.shading;
    const k = (sh.contrast / 0.35) * strength;
    this.soft(x + w * 0.5, y, w * 0.5, h, T.palette.shadow, sh.shadowAlpha * k * sh.softness, 'right');
    this.soft(x, y + h * 0.68, w, h * 0.32, T.palette.shadow, 0.14 * k, 'bottom');
    this.soft(x, y, w * 0.28, h, mix(T.palette.cloudWhite, T.palette.gold, T.light.warmth), 0.2 * k, 'left');
  }
}

export function rgba(color: number, alpha: number): string {
  return `rgba(${(color >> 16) & 255},${(color >> 8) & 255},${color & 255},${alpha})`;
}
