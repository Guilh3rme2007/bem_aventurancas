import type { Ink, Rng } from '../HandDrawn';
import type { MaterialId } from '../materials/MaterialLibrary';

/**
 * Todos os tipos de objeto da biblioteca. Para criar um novo: acrescente o nome aqui, escreva o
 * `PropDef` no arquivo da categoria (architecture / market / vegetation / decorations) e use-o
 * no planejador do mapa (JerusalemMapGenerator.ts). Nada mais precisa mudar.
 */
export type PropKind =
  // arquitetura
  | 'house' | 'houseSmall' | 'houseTerrace' | 'stairsExt' | 'rampStone' | 'wall' | 'wallLow'
  | 'archway' | 'column' | 'columnBase' | 'templeWall' | 'templeStairs' | 'templeBlocks' | 'gate' | 'templeFar'
  // mercado
  | 'stall' | 'basket' | 'crate' | 'sack' | 'pot' | 'amphora'
  | 'fruitCrate' | 'breadBasket' | 'sackPile' | 'clothRolls' | 'jarCluster'
  // vegetação
  | 'tree' | 'bush' | 'plantPot' | 'oliveBranch' | 'grassTuft' | 'rock'
  // decoração
  | 'lamp' | 'cloth' | 'bench' | 'well' | 'jarStand' | 'brazier';

export type PropCategory = 'architecture' | 'market' | 'vegetation' | 'decoration';

/** Papel do material de alvenaria do objeto: a REGIÃO escolhe o material (ver JerusalemRegionStyles). */
export type MaterialRole = 'house' | 'retaining' | 'monumental';

export interface PropContext {
  /** Material de parede escolhido pela região (se o objeto tiver `materialRole`). */
  mat?: MaterialId;
  variant: number;
}

export interface PropDef {
  category: PropCategory;
  label: string;
  /** Quantidade de variantes visuais (cada uma gera uma textura). */
  variants: number;
  size(rng: Rng): { w: number; h: number };
  draw(ink: Ink, w: number, h: number, rng: Rng, ctx: PropContext): void;
  /** Se definido, bloqueia o jogador: largura = widthFrac * largura do sprite. */
  solid?: { widthFrac: number };
  materialRole?: MaterialRole;
  /** Material usado quando nenhum é informado. */
  defaultMaterial?: MaterialId;
}
