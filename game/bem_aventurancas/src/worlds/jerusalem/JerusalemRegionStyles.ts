import type { AreaId } from './JerusalemPath';
import type { FloorId, WallId } from '../../level/humildes_espirito/materials/MaterialLibrary';
import type { MaterialRole } from '../../level/humildes_espirito/props/types';
import type { Rng } from './HandDrawn';

/**
 * ESTILO DE MATERIAIS POR REGIÃO.
 *
 * É aqui (e só aqui) que se decide qual material cada região usa. O gerador do mapa, o chão e os
 * objetos leem esta tabela; para trocar o piso do mercado ou o reboco da rua residencial basta
 * editar uma linha, sem tocar no código de geração.
 *
 * Módulo puro (sem Phaser).
 */
export interface RegionStyle {
  /** Piso da faixa caminhável. */
  walk: FloorId;
  /** Piso fora do caminho (bordas, becos, fundo). */
  verge: FloorId;
  /** Piso nos trechos com `stairs: true`. */
  stairs: FloorId;
  /** Materiais possíveis para paredes de casas (sorteados por casa). */
  houseWalls: WallId[];
  /** Material de muros de contenção, escadas externas, arcos. */
  retaining: WallId;
  /** Material de alvenaria monumental (Templo). */
  monumental: WallId;
  /** Largura (px) da mistura com a região vizinha no chão. */
  blend: number;
}

export const REGION_STYLES: Record<AreaId, RegionStyle> = {
  // Rua residencial: pedra calcária e terra
  street: { walk: 'floor_stone', verge: 'floor_dirt', stairs: 'floor_stairs', houseWalls: ['wall_limestone', 'wall_plaster'], retaining: 'wall_retaining', monumental: 'wall_temple', blend: 110 },
  // Mercado: terra compactada e pedra
  market: { walk: 'floor_market', verge: 'floor_dirt', stairs: 'floor_stairs', houseWalls: ['wall_plaster', 'wall_limestone'], retaining: 'wall_retaining', monumental: 'wall_temple', blend: 110 },
  // Caminho do Templo: pedra calcária e escadarias
  'temple-approach': { walk: 'floor_stone', verge: 'floor_dirt', stairs: 'floor_stairs', houseWalls: ['wall_limestone', 'wall_limestone', 'wall_plaster'], retaining: 'wall_retaining', monumental: 'wall_temple', blend: 110 },
  // Pátio do Templo: pavimentação de pedra clara
  'temple-court': { walk: 'floor_temple', verge: 'floor_stone', stairs: 'floor_stairs', houseWalls: ['wall_temple'], retaining: 'wall_temple', monumental: 'wall_temple', blend: 140 },
};

export type RegionStyles = Record<AreaId, RegionStyle>;

/** Mescla ajustes parciais (por região) sobre a tabela padrão. */
export function resolveRegionStyles(overrides?: Partial<Record<AreaId, Partial<RegionStyle>>>): RegionStyles {
  const out = { ...REGION_STYLES } as RegionStyles;
  if (overrides) for (const k of Object.keys(overrides) as AreaId[]) out[k] = { ...REGION_STYLES[k], ...overrides[k] };
  return out;
}

/** Material de alvenaria de um objeto, conforme o papel dele e a região onde está. */
export function wallMaterialFor(style: RegionStyle, role: MaterialRole, rng: Rng): WallId {
  if (role === 'house') return rng.pick(style.houseWalls);
  if (role === 'retaining') return style.retaining;
  return style.monumental;
}
