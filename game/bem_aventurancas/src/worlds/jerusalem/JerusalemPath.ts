/**
 * Percurso principal do jogador (rua -> mercado -> acesso ao Templo -> pátio externo).
 * Módulo PURO (sem Phaser): pode ser testado e ampliado só editando dados.
 *
 * Convenção 2.5D: o mundo rola em X; Y é profundidade no "chão". O jogador anda
 * livremente em uma faixa (banda) ao redor da linha central do caminho:
 *      topo    = y(x) - halfWidth(x)   (linha de fundo, onde ficam as fachadas)
 *      base    = y(x) + halfWidth(x)   (limite do primeiro plano)
 */

export type AreaId = 'street' | 'market' | 'temple-approach' | 'temple-court';

export interface PathPoint {
  x: number;
  /** Y do centro do caminho neste ponto. */
  y: number;
  area: AreaId;
  /** Meia-largura da faixa caminhável. Valores maiores = becos, praças, pátios. */
  halfWidth: number;
  /** Se true, o trecho até o PRÓXIMO ponto é uma escadaria (rampa visual no chão). */
  stairs?: boolean;
}

export type GroundStyle = 'cobble' | 'ashlar';

export interface LevelSegment {
  id: string;
  area: AreaId;
  startX: number;
  endX: number;
  /** Primeiro ponto deve estar em startX e o último em endX. */
  path: PathPoint[];
  groundStyle: GroundStyle;
}

/* ------------------------------------------------------------------ DADOS --- */
/**
 * COMO AMPLIAR: acrescente um novo LevelSegment ao final (startX = endX do anterior,
 * primeiro ponto = último ponto do anterior). O planejador e o streaming cuidam do resto.
 */
export const LEVEL_01_SEGMENTS: LevelSegment[] = [
  {
    id: 'seg-01-street',
    area: 'street',
    startX: 0,
    endX: 2000,
    groundStyle: 'cobble',
    path: [
      { x: 0, y: 520, area: 'street', halfWidth: 95 },
      { x: 420, y: 522, area: 'street', halfWidth: 95 },
      { x: 800, y: 506, area: 'street', halfWidth: 100 },
      { x: 1080, y: 506, area: 'street', halfWidth: 100 },
      { x: 1180, y: 500, area: 'street', halfWidth: 175 }, // beco lateral (alargamento)
      { x: 1380, y: 498, area: 'street', halfWidth: 175 },
      { x: 1520, y: 492, area: 'street', halfWidth: 100 },
      { x: 2000, y: 480, area: 'market', halfWidth: 110 },
    ],
  },
  {
    id: 'seg-02-market',
    area: 'market',
    startX: 2000,
    endX: 4000,
    groundStyle: 'cobble',
    path: [
      { x: 2000, y: 480, area: 'market', halfWidth: 110 },
      { x: 2400, y: 482, area: 'market', halfWidth: 145 },
      { x: 2900, y: 496, area: 'market', halfWidth: 155 },
      { x: 3400, y: 496, area: 'market', halfWidth: 155 },
      { x: 3800, y: 474, area: 'market', halfWidth: 125 },
      { x: 4000, y: 470, area: 'temple-approach', halfWidth: 112 },
    ],
  },
  {
    id: 'seg-03-approach',
    area: 'temple-approach',
    startX: 4000,
    endX: 6400,
    groundStyle: 'cobble',
    path: [
      { x: 4000, y: 470, area: 'temple-approach', halfWidth: 112 },
      { x: 4420, y: 468, area: 'temple-approach', halfWidth: 120 },
      { x: 4620, y: 468, area: 'temple-approach', halfWidth: 120, stairs: true },
      { x: 4900, y: 440, area: 'temple-approach', halfWidth: 125 },
      { x: 5400, y: 436, area: 'temple-approach', halfWidth: 135 },
      { x: 5800, y: 434, area: 'temple-approach', halfWidth: 135, stairs: true },
      { x: 6100, y: 404, area: 'temple-approach', halfWidth: 135 },
      { x: 6400, y: 400, area: 'temple-court', halfWidth: 135 },
    ],
  },
  {
    id: 'seg-04-court',
    area: 'temple-court',
    startX: 6400,
    endX: 8400,
    groundStyle: 'ashlar',
    path: [
      { x: 6400, y: 400, area: 'temple-court', halfWidth: 135 },
      { x: 6800, y: 396, area: 'temple-court', halfWidth: 150 },
      { x: 7400, y: 396, area: 'temple-court', halfWidth: 165 },
      { x: 8000, y: 396, area: 'temple-court', halfWidth: 165 },
      { x: 8400, y: 396, area: 'temple-court', halfWidth: 165 },
    ],
  },
];

/* ------------------------------------------------------------- UTILIDADES --- */

const smooth = (t: number): number => t * t * (3 - 2 * t);

export interface Band {
  top: number;
  center: number;
  bottom: number;
  halfWidth: number;
}

export class JerusalemPath {
  readonly points: PathPoint[];
  readonly segments: readonly LevelSegment[];
  readonly startX: number;
  readonly endX: number;

  constructor(segments: readonly LevelSegment[] = LEVEL_01_SEGMENTS) {
    this.segments = segments;
    const errors = JerusalemPath.validate(segments);
    if (errors.length) throw new Error('[JerusalemPath] dados inválidos:\n - ' + errors.join('\n - '));
    // junta os pontos, removendo o duplicado de emenda entre segmentos
    const pts: PathPoint[] = [];
    segments.forEach((s, i) => s.path.forEach((p, k) => (i > 0 && k === 0 ? undefined : pts.push(p))));
    this.points = pts;
    this.startX = segments[0].startX;
    this.endX = segments[segments.length - 1].endX;
  }

  /** Garante que não haverá lacunas nem saltos entre segmentos. */
  static validate(segments: readonly LevelSegment[]): string[] {
    const errs: string[] = [];
    if (!segments.length) errs.push('nenhum segmento');
    segments.forEach((s, i) => {
      if (s.path.length < 2) errs.push(`${s.id}: precisa de >= 2 pontos`);
      if (s.path[0]?.x !== s.startX) errs.push(`${s.id}: primeiro ponto deve estar em startX`);
      if (s.path[s.path.length - 1]?.x !== s.endX) errs.push(`${s.id}: último ponto deve estar em endX`);
      for (let k = 1; k < s.path.length; k++) {
        if (s.path[k].x <= s.path[k - 1].x) errs.push(`${s.id}: pontos devem ter x crescente`);
      }
      if (i > 0) {
        const prev = segments[i - 1];
        const a = prev.path[prev.path.length - 1];
        const b = s.path[0];
        if (prev.endX !== s.startX) errs.push(`${s.id}: startX (${s.startX}) != endX anterior (${prev.endX})`);
        if (a.y !== b.y || a.halfWidth !== b.halfWidth)
          errs.push(`${s.id}: ponto de emenda difere do segmento anterior (y/halfWidth)`);
      }
    });
    return errs;
  }

  private index(x: number): number {
    const p = this.points;
    if (x <= p[0].x) return 0;
    if (x >= p[p.length - 1].x) return p.length - 2;
    let lo = 0;
    let hi = p.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (p[mid].x <= x) lo = mid;
      else hi = mid;
    }
    return lo;
  }

  private sample(x: number, key: 'y' | 'halfWidth'): number {
    const i = this.index(x);
    const a = this.points[i];
    const b = this.points[i + 1];
    const t = Math.min(1, Math.max(0, (x - a.x) / (b.x - a.x)));
    // escadaria = rampa linear; resto = curva suave
    const k = a.stairs ? t : smooth(t);
    return a[key] + (b[key] - a[key]) * k;
  }

  centerY(x: number): number {
    return this.sample(x, 'y');
  }
  halfWidth(x: number): number {
    return this.sample(x, 'halfWidth');
  }
  band(x: number): Band {
    const c = this.centerY(x);
    const h = this.halfWidth(x);
    return { top: c - h, center: c, bottom: c + h, halfWidth: h };
  }
  /** Linha onde ficam as fachadas (fundo da banda). */
  backLineY(x: number): number {
    const b = this.band(x);
    return b.top - 6;
  }
  isStairs(x: number): boolean {
    return !!this.points[this.index(x)].stairs;
  }
  areaAt(x: number): AreaId {
    return this.points[this.index(x)].area;
  }
  segmentAt(x: number): LevelSegment {
    const s = this.segments.find((seg) => x >= seg.startX && x < seg.endX);
    return s ?? this.segments[x < this.startX ? 0 : this.segments.length - 1];
  }
  /** Intervalos de escadaria [x0, x1], úteis para o desenho do chão. */
  stairRanges(): Array<[number, number]> {
    const out: Array<[number, number]> = [];
    for (let i = 0; i < this.points.length - 1; i++)
      if (this.points[i].stairs) out.push([this.points[i].x, this.points[i + 1].x]);
    return out;
  }
  /** Mantém (x, y) dentro da faixa caminhável. */
  clamp(x: number, y: number, margin = 0): { x: number; y: number } {
    const cx = Math.min(this.endX - 4, Math.max(this.startX + 4, x));
    const b = this.band(cx);
    return { x: cx, y: Math.min(b.bottom - margin, Math.max(b.top + margin, y)) };
  }
  /** Posição inicial recomendada para o jogador. */
  spawn(): { x: number; y: number } {
    return { x: this.startX + 140, y: this.centerY(this.startX + 140) };
  }
}
