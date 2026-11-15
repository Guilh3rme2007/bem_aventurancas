import { JerusalemPath, LevelSegment } from './JerusalemPath';
import type { PropKind } from './JerusalemEnvironment';
import type { MaterialId } from '../../level/humildes_espirito/materials/MaterialLibrary';
import type { NPCSpawnPoint } from '../../data/npcs/npcSpawnPoints';

/**
 * Estrutura principal do mapa: dados puros (sem objetos Phaser).
 * O planejador (JerusalemMapGenerator) preenche; o streamer instancia sob demanda.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type PropLayer = 'back' | 'mid' | 'fore';

export interface Placement {
  id: string;
  segmentId: string;
  kind: PropKind;
  variant: number;
  /** Material de alvenaria escolhido pela região (só para objetos com `materialRole`). */
  mat?: MaterialId;
  /** X central e Y do "pé" (base) do objeto, em coordenadas de mundo. */
  x: number;
  y: number;
  scale: number;
  flipX: boolean;
  layer: PropLayer;
  /** Sobrescreve a profundidade (padrão: Y do pé, + foreBase na camada 'fore'). */
  depth?: number;
  tint?: number;
  /** Balanço suave (tecidos). O pivô vira o topo do objeto. */
  sway?: boolean;
  /** Oscilação de brilho (lamparinas). */
  flicker?: boolean;
  /** Pegada de colisão no chão (se o objeto for sólido). */
  solid?: Rect;
}

export interface SegmentPlan {
  segment: LevelSegment;
  placements: Placement[];
}

export class JerusalemMap {
  readonly width: number;
  private readonly byId = new Map<string, SegmentPlan>();

  constructor(
    readonly path: JerusalemPath,
    readonly plans: SegmentPlan[],
    readonly npcSpawns: NPCSpawnPoint[],
  ) {
    plans.forEach((p) => this.byId.set(p.segment.id, p));
    this.width = path.endX - path.startX;
  }

  plan(segmentId: string): SegmentPlan | undefined {
    return this.byId.get(segmentId);
  }

  /** Segmentos que intersectam [x0, x1]. */
  segmentsInRange(x0: number, x1: number): LevelSegment[] {
    return this.path.segments.filter((s) => s.endX >= x0 && s.startX <= x1);
  }

  /** Todos os sólidos próximos de uma posição (independe de o segmento estar instanciado). */
  solidsNear(x: number, radius = 400): Rect[] {
    const out: Rect[] = [];
    for (const seg of this.segmentsInRange(x - radius, x + radius))
      for (const p of this.plan(seg.id)?.placements ?? [])
        if (p.solid && Math.abs(p.x - x) <= radius + p.solid.w) out.push(p.solid);
    return out;
  }

  /** Consulta geométrica pura: útil se o seu sistema de movimento não usa Arcade Physics. */
  isBlocked(x: number, y: number): boolean {
    return this.solidsNear(x, 200).some((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  }

  /** Retângulo (x, y, w, h) intersecta algum sólido? Usado pelo movimento sem Arcade Physics. */
  overlapsSolid(x: number, y: number, w: number, h: number): boolean {
    return this.solidsNear(x + w / 2, 200).some((r) => x < r.x + r.w && x + w > r.x && y < r.y + r.h && y + h > r.y);
  }

  /** Verifica NPCs fora da faixa caminhável ou dentro de sólidos. Retorna avisos. */
  validateNpcSpawns(): string[] {
    const warnings: string[] = [];
    for (const n of this.npcSpawns) {
      const b = this.path.band(n.x);
      if (n.y < b.top || n.y > b.bottom) warnings.push(`${n.id}: fora da faixa caminhável (y=${n.y}, faixa ${b.top.toFixed(0)}-${b.bottom.toFixed(0)})`);
      const pad = 16;
      if (this.solidsNear(n.x, 200).some((r) => n.x >= r.x - pad && n.x <= r.x + r.w + pad && n.y >= r.y - pad && n.y <= r.y + r.h + pad))
        warnings.push(`${n.id}: dentro/colado em objeto sólido`);
      const seg = this.path.segmentAt(n.x);
      if (seg.id !== n.segmentId) warnings.push(`${n.id}: segmentId "${n.segmentId}" não confere com a posição (${seg.id})`);
    }
    return warnings;
  }
}
