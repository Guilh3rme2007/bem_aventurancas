import { WORLD } from './JerusalemBackgroundConfig';
import { createRng, Rng } from './HandDrawn';
import { JerusalemPath } from './JerusalemPath';
import { PROPS, VARIANTS, propSize, PropKind } from './JerusalemEnvironment';
import { JerusalemMap, Placement, PropLayer, SegmentPlan } from './JerusalemMap';
import { RegionStyles, resolveRegionStyles, wallMaterialFor } from './JerusalemRegionStyles';
import { NPC_SPAWN_POINTS, NPCSpawnPoint } from '../../data/npcs/npcSpawnPoints';

/**
 * PLANEJADOR do mapa (dados puros, sem Phaser em tempo de execução).
 *
 * O nível inteiro é planejado de uma vez, em UMA passada contínua em X, com RNG semeado.
 * Cada objeto é "dono" do segmento onde está seu centro. Como o planejamento é contínuo
 * (e não segmento a segmento), não existem lacunas nem sobreposições nas emendas, e
 * descarregar/recarregar um segmento sempre reproduz exatamente o mesmo cenário.
 *
 * Os MATERIAIS de cada objeto vêm de JerusalemRegionStyles (por região), não daqui.
 */

export function planMap(path: JerusalemPath, npcs: NPCSpawnPoint[] = NPC_SPAWN_POINTS, seed = 0xbee501, styles: RegionStyles = resolveRegionStyles()): JerusalemMap {
  const rng = createRng(seed);
  const matRng = createRng(seed ^ 0x9e3779b9); // sorteio de materiais à parte: não altera o layout
  const plans: SegmentPlan[] = path.segments.map((segment) => ({ segment, placements: [] }));
  const planOf = (x: number): SegmentPlan => plans.find((p) => x >= p.segment.startX && x < p.segment.endX) ?? plans[x < path.startX ? 0 : plans.length - 1];
  let uid = 0;

  interface Opts {
    layer?: PropLayer;
    scale?: number;
    depth?: number;
    tint?: number;
    sway?: boolean;
    flicker?: boolean;
    solid?: boolean;
    variant?: number;
    flip?: boolean;
  }

  const clampX = (x: number): number => Math.min(path.endX - 1, Math.max(path.startX, x));

  const put = (kind: PropKind, x: number, y: number, o: Opts = {}): Placement => {
    const variant = o.variant ?? rng.int(0, VARIANTS[kind] - 1);
    const scale = o.scale ?? 1;
    const { w } = propSize(kind, variant);
    const plan = planOf(x);
    const def = PROPS[kind].solid;
    const fw = def ? w * scale * def.widthFrac : 0;
    const role = PROPS[kind].materialRole;
    const placement: Placement = {
      id: `${plan.segment.id}:${kind}:${uid++}`,
      segmentId: plan.segment.id,
      kind, variant, x, y, scale,
      mat: role ? wallMaterialFor(styles[path.areaAt(clampX(x))], role, matRng) : undefined,
      flipX: o.flip ?? rng.chance(0.5),
      layer: o.layer ?? 'mid',
      depth: o.depth,
      tint: o.tint,
      sway: o.sway,
      flicker: o.flicker,
      solid: def && o.solid !== false ? { x: x - fw / 2, y: y - WORLD.footprintDepth, w: fw, h: WORLD.footprintDepth } : undefined,
    };
    plan.placements.push(placement);
    return placement;
  };

  const sizeOf = (kind: PropKind, variant: number, scale: number) => {
    const s = propSize(kind, variant);
    return { w: s.w * scale, h: s.h * scale };
  };

  /** Altura mínima do fundo ao longo da largura do objeto: ele nunca invade a faixa caminhável. */
  const backY = (xc: number, w: number): number => Math.min(path.backLineY(xc - w / 2), path.backLineY(xc), path.backLineY(xc + w / 2));

  const courtStart = path.segments.find((s) => s.area === 'temple-court')?.startX ?? path.endX;
  const gateX = path.endX - 300;
  const area = (a: string) => (xx: number) => path.areaAt(clampX(xx)) === a;
  const inStreet = area('street');
  const inMarket = area('market');
  const inCourt = area('temple-court');

  /* ---- 1) Fileira de fundo contínua: fachadas, muros, passagens ----------- */
  let x = path.startX - 60;
  let archStreet = false;
  let archMarket = false;
  while (x < path.endX + 60) {
    const a = path.areaAt(clampX(x));
    let kind: PropKind = 'house';
    let scale = 1;
    const roll = rng.next();
    if (a === 'street') kind = roll < 0.45 ? 'house' : roll < 0.65 ? 'houseSmall' : roll < 0.78 ? 'houseTerrace' : roll < 0.9 ? 'wall' : 'archway';
    else if (a === 'market') kind = roll < 0.4 ? 'house' : roll < 0.65 ? 'houseSmall' : roll < 0.76 ? 'houseTerrace' : roll < 0.9 ? 'wall' : 'archway';
    else if (a === 'temple-approach') kind = roll < 0.35 ? 'house' : roll < 0.5 ? 'houseSmall' : roll < 0.62 ? 'houseTerrace' : 'wall';
    else {
      kind = 'templeWall';
      scale = 0.5;
    }
    // uma passagem em arco por região (garante que a peça apareça no percurso)
    if (a === 'street' && x > 700 && !archStreet) {
      kind = 'archway';
      archStreet = true;
    } else if (a === 'market' && x > 2700 && !archMarket) {
      kind = 'archway';
      archMarket = true;
    }
    if (a === 'temple-court' && x > gateX - 170 && x < gateX + 170) {
      x = gateX + 170; // vão do portão
      continue;
    }
    const variant = rng.int(0, VARIANTS[kind] - 1);
    const { w } = sizeOf(kind, variant, scale);
    const xc = x + w / 2;
    const tallBoost = a === 'temple-approach' && kind === 'house' ? 1.1 : 1;
    put(kind, xc, backY(xc, w), { variant, scale: scale * tallBoost, layer: 'back' });
    x += w * tallBoost + (a === 'temple-court' ? 0 : rng.chance(0.18) ? rng.range(50, 80) : rng.range(0, 22));
  }

  // Portão monumental (fim do percurso). Só a fachada externa, com escadaria ampla à frente.
  put('gate', gateX, backY(gateX, 260), { variant: 0, scale: 0.78, layer: 'back', flip: false });
  put('templeStairs', gateX, path.backLineY(gateX) + 40, { variant: 0, scale: 0.62, solid: false, flip: false });
  for (const dx of [-215, 215]) put('columnBase', gateX + dx, path.backLineY(gateX + dx) + 34, { variant: 0, scale: 1.15, flip: false });

  /* ---- 2) Segunda fileira (profundidade): casas menores e mais atrás ------- */
  x = path.startX - 100;
  while (x < courtStart + 200) {
    const variant = rng.int(0, VARIANTS.house - 1);
    const sc = rng.range(0.66, 0.8);
    const { w } = sizeOf('house', variant, sc);
    const xc = x + w / 2;
    put('house', xc, path.backLineY(xc) - 58 - rng.range(0, 16), { variant, scale: sc, layer: 'back', tint: 0xe6dcc8, solid: false });
    x += w + rng.range(-10, 40);
  }

  /* ---- 3) Escadarias e rampas junto aos trechos de degraus ---------------- */
  for (const [a, b] of path.stairRanges()) {
    put('stairsExt', a + 120, path.backLineY(a + 120) + 34, { flip: false });
    put('rampStone', b + 70, path.backLineY(b + 70) + 24, { flip: false });
  }

  /* ---- 4) Colunas -------------------------------------------------------- */
  // Pórtico no caminho de acesso (região arquitetonicamente apropriada: próxima ao complexo)
  for (let cx = 5500; cx <= 6300; cx += 170) put('column', cx, path.backLineY(cx) + 20, { scale: 0.85, variant: rng.int(0, 1), flip: false });
  // Colunata (stoa) no pátio, de cada lado do portão
  for (let cx = courtStart + 260; cx < path.endX - 100; cx += 150) {
    if (Math.abs(cx - gateX) < 200) continue;
    put('column', cx, path.backLineY(cx) + 22, { scale: 0.7, variant: rng.int(0, 1), flip: false });
  }

  /* ---- 5) Cenas por área ------------------------------------------------- */
  // 5a) Rua / acesso: vasos, cestos, plantas e tecidos junto às fachadas
  for (let sx = 120; sx < path.endX - 100; sx += rng.range(170, 300)) {
    if (inMarket(sx) || inCourt(sx)) continue;
    const b = path.band(sx);
    const kind = rng.pick<PropKind>(['pot', 'pot', 'amphora', 'basket', 'crate', 'sack', 'jarCluster', 'plantPot', 'oliveBranch', 'jarStand']);
    put(kind, sx, b.top + rng.range(16, 38), { scale: rng.range(0.9, 1.25) });
    if (inStreet(sx) && rng.chance(0.55)) {
      put('cloth', sx + rng.range(-90, 90), b.top - 56, { depth: b.top - 3, sway: true, solid: false, layer: 'back' });
    }
  }

  // 5b) Mercado: barracas na parte alta e baixa da faixa, corredor livre no meio
  const goods: PropKind[] = ['fruitCrate', 'breadBasket', 'clothRolls', 'sackPile', 'jarCluster', 'basket', 'amphora', 'sack', 'crate'];
  let goodsIndex = 0; // percorre todos os produtos em rodízio: cada tipo aparece no mercado
  const marketMid = path.segments.filter((seg) => seg.area === 'market').map((s) => (s.startX + s.endX) / 2)[0];
  for (const marketSeg of path.segments.filter((seg) => seg.area === 'market')) {
    for (let sx = marketSeg.startX + 130, side = 0; sx < marketSeg.endX - 130; sx += rng.range(250, 330), side++) {
      if (marketMid !== undefined && Math.abs(sx - marketMid) < 190) continue; // praça do poço livre
      const b = path.band(sx);
      const variant = rng.int(0, VARIANTS.stall - 1);
      const { w } = sizeOf('stall', variant, 1);
      const top = side % 2 === 0;
      const fy = top ? b.top + 52 + rng.range(0, 14) : b.bottom - 14 - rng.range(0, 8);
      put('stall', sx, fy, { variant });
      const nx = sx + (rng.chance(0.5) ? -1 : 1) * (w / 2 + 28);
      put(goods[goodsIndex++ % goods.length], nx, fy + rng.range(-4, 8), { scale: rng.range(0.9, 1.2) });
      if (rng.chance(0.5)) put(rng.pick<PropKind>(['pot', 'plantPot', 'jarStand']), nx + rng.range(-24, 24), fy + rng.range(8, 18), { scale: rng.range(0.9, 1.1) });
    }
  }

  // 5c) Poços: um no beco da rua residencial, um na praça do mercado
  const alleyX = 1280;
  put('well', alleyX, path.band(alleyX).top + 66, { flip: false });
  if (marketMid !== undefined) put('well', marketMid, path.band(marketMid).center + 6, { flip: false });

  // 5d) Árvores (oliveiras) e arbustos nas áreas abertas
  for (let tx = 360; tx < courtStart + 600; tx += rng.range(520, 900)) {
    const b = path.band(tx);
    put('tree', tx, b.top + rng.range(2, 14), { scale: rng.range(0.8, 1.05), solid: true });
  }
  for (let bx = 200; bx < path.endX; bx += rng.range(240, 520)) {
    const b = path.band(bx);
    put('bush', bx, b.bottom - rng.range(0, 6), { scale: rng.range(0.8, 1.2), solid: false });
  }
  for (let gx = 90; gx < path.endX; gx += rng.range(90, 220)) {
    const b = path.band(gx);
    put('grassTuft', gx, b.bottom + rng.range(14, 34), { scale: rng.range(0.9, 1.3), solid: false });
  }

  // 5e) Iluminação: lamparinas nas ruas, braseiros no pátio do Templo
  for (let lx = 380; lx < path.endX - 200; lx += rng.range(420, 560)) {
    const b = path.band(lx);
    if (inCourt(lx)) put('brazier', lx, b.top + 36, { flicker: true, flip: false });
    else put('lamp', lx, b.top + 30, { flicker: true, variant: rng.int(0, 1), flip: false });
  }

  // 5f) Bancos e blocos monumentais no pátio e no acesso ao Templo
  for (let bx = courtStart + 500; bx < path.endX - 500; bx += rng.range(600, 800)) {
    const b = path.band(bx);
    put('bench', bx, b.top + 54, {});
  }
  for (let tx = 4300; tx < path.endX - 600; tx += rng.range(850, 1200)) {
    const b = path.band(tx);
    put('templeBlocks', tx, b.bottom - rng.range(2, 14), { scale: rng.range(0.9, 1.15), solid: true });
  }

  // Rochas soltas (pequenas, não-sólidas) para quebrar a regularidade do calçamento
  for (let rx = 150; rx < path.endX; rx += rng.range(300, 560)) {
    if (inCourt(rx)) continue;
    const b = path.band(rx);
    put('rock', rx, b.bottom - rng.range(6, 40), { scale: rng.range(0.7, 1.2), solid: false });
  }

  /* ---- 6) Primeiro plano (sobrepõe o jogador quando ele passa por baixo) ---- */
  for (let fx = 160; fx < path.endX; fx += rng.range(300, 600)) {
    const b = path.band(fx);
    const kind = rng.pick<PropKind>(['bush', 'rock', 'pot', 'amphora', 'basket', 'sack', 'plantPot']);
    put(kind, fx, b.bottom + rng.range(44, 78), { layer: 'fore', scale: rng.range(1.3, 1.7), solid: false });
  }
  for (let wx = 4500; wx < path.endX; wx += rng.range(650, 900)) {
    const b = path.band(wx);
    put('wallLow', wx, b.bottom + rng.range(60, 80), { layer: 'fore', scale: rng.range(1.1, 1.4), solid: false });
  }

  return new JerusalemMap(path, plans, npcs);
}

/* ======================================================================== */

export interface StreamHooks<T> {
  /** Instancia os objetos de um segmento e devolve um handle para descarte. */
  build(plan: SegmentPlan): T;
  destroy(handle: T): void;
  /** Chamado quando os limites do mundo precisam crescer/encolher. */
  onBoundsChanged?(minX: number, maxX: number): void;
}

/**
 * Streaming de segmentos: instancia o próximo segmento quando o jogador se aproxima
 * do final do atual; descarrega os que ficaram bem para trás. Nunca recria um segmento
 * que já está vivo.
 */
export class SegmentStreamer<T> {
  private live = new Map<string, T>();
  private maxBuiltEnd = -Infinity;
  private minBuiltStart = Infinity;

  constructor(private readonly map: JerusalemMap, private readonly hooks: StreamHooks<T>) {}

  get liveIds(): string[] {
    return [...this.live.keys()];
  }
  /** Limite direito atual do mundo (fim do último segmento instanciado). */
  get boundsEnd(): number {
    return this.maxBuiltEnd;
  }

  update(playerX: number, camLeft: number, camRight: number): void {
    const want0 = Math.min(playerX, camLeft) - WORLD.preloadDistance * 0.5;
    const want1 = Math.max(playerX, camRight) + WORLD.preloadDistance;
    let changed = false;
    for (const seg of this.map.path.segments) {
      const needed = seg.endX >= want0 && seg.startX <= want1;
      const alive = this.live.has(seg.id);
      if (needed && !alive) {
        this.live.set(seg.id, this.hooks.build(this.map.plan(seg.id)!));
        changed = true;
      } else if (alive && (seg.endX < camLeft - WORLD.unloadDistance || seg.startX > camRight + WORLD.unloadDistance + WORLD.preloadDistance)) {
        this.hooks.destroy(this.live.get(seg.id)!);
        this.live.delete(seg.id);
        changed = true;
      }
    }
    if (changed) {
      const alive = this.map.path.segments.filter((s) => this.live.has(s.id));
      if (alive.length) {
        this.minBuiltStart = Math.min(...alive.map((s) => s.startX));
        this.maxBuiltEnd = Math.max(...alive.map((s) => s.endX));
        this.hooks.onBoundsChanged?.(this.minBuiltStart, this.maxBuiltEnd);
      }
    }
  }

  destroyAll(): void {
    this.live.forEach((h) => this.hooks.destroy(h));
    this.live.clear();
  }
}

export type { Rng };
