import type Phaser from 'phaser';
import { bakeCanvas } from '../style/CanvasStore';
import { createRng, hashSeed, Rng } from '../../../worlds/jerusalem/HandDrawn';
import { paintFloorStone, paintFloorDirt, paintFloorMarket, paintFloorStairs, paintFloorTemple } from './floors';
import { paintWallLimestone, paintWallPlaster, paintWallRetaining, paintWallTemple } from './walls';
import { paintWoodPlanks, paintWoodBoards, paintWoodBeam } from './woods';

/**
 * BIBLIOTECA DE MATERIAIS: texturas repetíveis (sem emendas) geradas por código, uma única vez.
 *
 * Cada material é um canvas pequeno, registrado no Phaser com a chave `jr-mat-<id>`:
 *   - como textura:  scene.add.tileSprite(x, y, w, h, materialKey('floor_stone'))
 *   - como preenchimento de formas à mão:  ink.material(pontos, 'wall_limestone')
 *
 * Para ADICIONAR um material: escreva um `paintXxx(ctx, W, H, rng)` (use `Ink` + `wrapDraw` para
 * repetir sem emenda), acrescente o id aos tipos e uma entrada em MATERIALS. Nada mais muda.
 */

export type FloorId = 'floor_stone' | 'floor_dirt' | 'floor_market' | 'floor_stairs' | 'floor_temple';
export type WallId = 'wall_limestone' | 'wall_plaster' | 'wall_retaining' | 'wall_temple';
export type WoodId = 'wood_planks' | 'wood_boards' | 'wood_beam';
export type MaterialId = FloorId | WallId | WoodId;

export interface MaterialDef {
  id: MaterialId;
  category: 'floor' | 'wall' | 'wood';
  /** Tamanho do tile em px. O tile se repete nos dois eixos. */
  w: number;
  h: number;
  label: string;
  /** Onde é usado no jogo. */
  use: string;
  /** Arquivo-fonte do gerador. */
  source: string;
  paint(ctx: CanvasRenderingContext2D, w: number, h: number, rng: Rng): void;
}

export const MATERIALS: Record<MaterialId, MaterialDef> = {
  floor_stone: { id: 'floor_stone', category: 'floor', w: 384, h: 384, label: 'Pedra calcária', use: 'Ruas principais', source: 'materials/floors.ts', paint: paintFloorStone },
  floor_dirt: { id: 'floor_dirt', category: 'floor', w: 384, h: 384, label: 'Terra compactada', use: 'Becos, áreas residenciais, bordas', source: 'materials/floors.ts', paint: paintFloorDirt },
  floor_market: { id: 'floor_market', category: 'floor', w: 384, h: 384, label: 'Chão de mercado', use: 'Mercado', source: 'materials/floors.ts', paint: paintFloorMarket },
  floor_stairs: { id: 'floor_stairs', category: 'floor', w: 192, h: 256, label: 'Escadaria de calcário', use: 'Trechos com stairs: true (degraus a cada 64 px em X)', source: 'materials/floors.ts', paint: paintFloorStairs },
  floor_temple: { id: 'floor_temple', category: 'floor', w: 288, h: 240, label: 'Pavimentação do Templo', use: 'Pátio externo do Templo', source: 'materials/floors.ts', paint: paintFloorTemple },
  wall_limestone: { id: 'wall_limestone', category: 'wall', w: 256, h: 192, label: 'Parede de calcário', use: 'Casas, muros', source: 'materials/walls.ts', paint: paintWallLimestone },
  wall_plaster: { id: 'wall_plaster', category: 'wall', w: 256, h: 192, label: 'Reboco', use: 'Casas', source: 'materials/walls.ts', paint: paintWallPlaster },
  wall_retaining: { id: 'wall_retaining', category: 'wall', w: 256, h: 192, label: 'Muro de contenção', use: 'Muros, escadas externas, arcos', source: 'materials/walls.ts', paint: paintWallRetaining },
  wall_temple: { id: 'wall_temple', category: 'wall', w: 256, h: 192, label: 'Alvenaria herodiana', use: 'Muros monumentais, portão, escadarias do Templo', source: 'materials/walls.ts', paint: paintWallTemple },
  wood_planks: { id: 'wood_planks', category: 'wood', w: 256, h: 192, label: 'Tábuas verticais', use: 'Portas, tapumes, caixas', source: 'materials/woods.ts', paint: paintWoodPlanks },
  wood_boards: { id: 'wood_boards', category: 'wood', w: 256, h: 192, label: 'Tábuas horizontais', use: 'Bancadas, tampos, estrados', source: 'materials/woods.ts', paint: paintWoodBoards },
  wood_beam: { id: 'wood_beam', category: 'wood', w: 128, h: 256, label: 'Viga/poste', use: 'Postes de barraca, vigas', source: 'materials/woods.ts', paint: paintWoodBeam },
};

export const MATERIAL_IDS = Object.keys(MATERIALS) as MaterialId[];

/** Chave da textura no Phaser (e no CanvasStore). */
export const materialKey = (id: MaterialId): string => `jr-mat-${id}`;

/**
 * Gera (uma única vez) todos os materiais. Seguro chamar várias vezes.
 * `scene = null` gera só os canvases DOM (usado na pré-visualização e nos testes).
 */
export function registerMaterials(scene: Phaser.Scene | null): void {
  for (const id of MATERIAL_IDS) {
    const m = MATERIALS[id];
    bakeCanvas(scene, materialKey(id), m.w, m.h, (ctx) => m.paint(ctx, m.w, m.h, createRng(hashSeed('material:' + id))));
  }
}
