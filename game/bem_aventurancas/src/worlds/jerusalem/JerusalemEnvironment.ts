import type Phaser from 'phaser';
import { bakeCanvas } from '../../level/humildes_espirito/style/CanvasStore';
import { Ink, createRng, hashSeed } from './HandDrawn';
import { registerMaterials, MaterialId } from '../../level/humildes_espirito/materials/MaterialLibrary';
import type { PropDef, PropKind, PropCategory } from '../../level/humildes_espirito/props/types';
import { ARCHITECTURE } from '../../level/humildes_espirito/props/architecture';
import { MARKET } from '../../level/humildes_espirito/props/market';
import { VEGETATION } from '../../level/humildes_espirito/props/vegetation';
import { DECORATIONS } from '../../level/humildes_espirito/props/decorations';

export type { PropKind, PropCategory, PropDef } from '../../level/humildes_espirito/props/types';

/**
 * REGISTRO e BAKING dos objetos do cenário.
 *
 * Cada objeto (casa, barraca, vaso, árvore...) é desenhado UMA vez em um canvas pequeno, com o
 * pincel `Ink` e os materiais da biblioteca, e vira uma textura do Phaser. As instâncias no mapa
 * são só `Image`s que reaproveitam essa textura.
 *
 * Os desenhos ficam em props/ (architecture, market, vegetation, decorations).
 */

/** Tabela exaustiva: o TypeScript acusa erro se um PropKind faltar (ou sobrar) aqui. */
const KIND_TABLE: Record<PropKind, true> = {
  house: true, houseSmall: true, houseTerrace: true, stairsExt: true, rampStone: true, wall: true, wallLow: true,
  archway: true, column: true, columnBase: true, templeWall: true, templeStairs: true, templeBlocks: true, gate: true, templeFar: true,
  stall: true, basket: true, crate: true, sack: true, pot: true, amphora: true,
  fruitCrate: true, breadBasket: true, sackPile: true, clothRolls: true, jarCluster: true,
  tree: true, bush: true, plantPot: true, oliveBranch: true, grassTuft: true, rock: true,
  lamp: true, cloth: true, bench: true, well: true, jarStand: true, brazier: true,
};
export const PROP_KINDS = Object.keys(KIND_TABLE) as PropKind[];

export const PROPS = { ...ARCHITECTURE, ...MARKET, ...VEGETATION, ...DECORATIONS } as Record<PropKind, PropDef>;
for (const k of PROP_KINDS) {
  if (!PROPS[k]) throw new Error(`[JerusalemEnvironment] objeto "${k}" não tem definição em props/*.ts`);
}

/** Quantidade de variantes visuais por tipo (derivada das definições). */
export const VARIANTS = Object.fromEntries(PROP_KINDS.map((k) => [k, PROPS[k].variants])) as Record<PropKind, number>;

export const PAD = 8;

const seedOf = (kind: PropKind, variant: number): number => hashSeed(`${kind}:${variant}`);

/** Material efetivo: só objetos com `materialRole` dependem de material. */
export function resolveMaterial(kind: PropKind, mat?: MaterialId): MaterialId | undefined {
  const def = PROPS[kind];
  return def.materialRole ? mat ?? def.defaultMaterial : undefined;
}

/** Tamanho (px) de uma variante, sem tocar no Phaser/DOM. Usado pelo planejador do mapa. */
export function propSize(kind: PropKind, variant: number): { w: number; h: number } {
  return PROPS[kind].size(createRng(seedOf(kind, variant)));
}

export function propKey(kind: PropKind, variant: number, mat?: MaterialId): string {
  const m = resolveMaterial(kind, mat);
  return `jr-prop-${kind}-${variant}${m ? '-' + m : ''}`;
}

export interface BakedProp {
  key: string;
  w: number;
  h: number;
  pad: number;
  /** Origem normalizada que coloca o "pé" do objeto (base, centro) na posição da instância. */
  originX: number;
  originY: number;
}

/**
 * Garante a textura da variante (gera uma única vez) e devolve os metadados.
 * `scene = null` gera apenas o canvas DOM (pré-visualização/testes).
 */
export function ensurePropTexture(scene: Phaser.Scene | null, kind: PropKind, variant: number, mat?: MaterialId): BakedProp {
  registerMaterials(scene); // idempotente: os materiais precisam existir antes dos objetos
  const key = propKey(kind, variant, mat);
  const rng = createRng(seedOf(kind, variant));
  const def = PROPS[kind];
  const { w, h } = def.size(rng);
  bakeCanvas(scene, key, w + PAD * 2, h + PAD * 2, (ctx) => {
    def.draw(new Ink(ctx, rng, PAD, PAD), w, h, rng, { mat: resolveMaterial(kind, mat), variant });
  });
  return { key, w, h, pad: PAD, originX: (PAD + w / 2) / (w + PAD * 2), originY: (PAD + h) / (h + PAD * 2) };
}
