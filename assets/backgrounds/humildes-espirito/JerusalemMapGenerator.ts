import { WORLD } from './JerusalemBackgroundConfig';
import { createRng, Rng } from './HandDrawn';
import { JerusalemPath } from './JerusalemPath';
import { PROPS, VARIANTS, propSize, PropKind } from './JerusalemEnvironment';
import { JerusalemMap, Placement, PropLayer, SegmentPlan } from './JerusalemMap';
import { NPC_SPAWN_POINTS, NPCSpawnPoint } from '../../../../src/data/npcs/npcSpawnPoints';

/**
 * PLANEJADOR do mapa (dados puros, sem Phaser em tempo de execução).
 *
 * O nível inteiro é planejado de uma vez, em UMA passada contínua em X, com RNG semeado.
 * Cada objeto é "dono" do segmento onde está seu centro. Como o planejamento é contínuo
 * (e não segmento a segmento), não existem lacunas nem sobreposições nas emendas, e
 * descarregar/recarregar um segmento sempre reproduz exatamente o mesmo cenário.
 */

export function planMap(path: JerusalemPath, npcs: NPCSpawnPoint[] = NPC_SPAWN_POINTS, seed = 0xbee501): JerusalemMap {
  const rng = createRng(seed);
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

  const put = (kind: PropKind, x: number, y: number, o: Opts = {}): Placement => {
    const variant = o.variant ?? rng.int(0, VARIANTS[kind] - 1);
    const scale = o.scale ?? 1;
    const { w } = propSize(kind, variant);
    const plan = planOf(x);
    const def = PROPS[kind].solid;
    const fw = def ? w * scale * def.widthFrac : 0;
    const placement: Placement = {
      id: `${plan.segment.id}:${kind}:${uid++}`,
      segmentId: plan.segment.id,
      kind, variant, x, y, scale,
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

  /* ---- 1) Fileira de fundo contínua: fachadas, muros ---------------------- */
  let x = path.startX - 60;
  while (x < path.endX + 60) {
    const area = path.areaAt(Math.min(path.endX - 1, Math.max(path.startX, x)));
    let kind: PropKind = 'house';
    let scale = 1;
    if (area === 'market') kind = rng.chance(0.18) ? 'wall' : 'house';
    else if (area === 'street') kind = rng.chance(0.14) ? 'wall' : 'house';
    else if (area === 'temple-approach') kind = rng.chance(0.4) ? 'wall' : 'house';
    else if (area === 'temple-court') {
      kind = 'templeWall';
      scale = 0.5;
    }
    if (area === 'temple-court' && x > gateX - 170 && x < gateX + 170) {
      x = gateX + 170; // vão do portão
      continue;
    }
    const variant = rng.int(0, VARIANTS[kind] - 1);
    const { w } = sizeOf(kind, variant, scale);
    const xc = x + w / 2;
    const tallBoost = area === 'temple-approach' && kind === 'house' ? 1.1 : 1;
    put(kind, xc, backY(xc, w), { variant, scale: scale * tallBoost, layer: 'back' });
    x += w * tallBoost + (area === 'temple-court' ? 0 : rng.chance(0.18) ? rng.range(50, 80) : rng.range(0, 22));
  }

  // Portão monumental (fim do percurso). Só a fachada externa.
  put('gate', gateX, backY(gateX, 260), { variant: 0, scale: 0.78, layer: 'back', flip: false });

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

  /* ---- 3) Colunas -------------------------------------------------------- */
  // Pórtico no caminho de acesso (região arquitetonicamente apropriada: próxima ao complexo)
  for (let cx = 5500; cx <= 6300; cx += 170) put('column', cx, path.backLineY(cx) + 20, { scale: 0.85, variant: rng.int(0, 1), flip: false });
  // Colunata (stoa) no pátio, de cada lado do portão
  for (let cx = courtStart + 260; cx < path.endX - 100; cx += 150) {
    if (Math.abs(cx - gateX) < 200) continue;
    put('column', cx, path.backLineY(cx) + 22, { scale: 0.7, variant: rng.int(0, 1), flip: false });
  }

  /* ---- 4) Cenas por área: percorre o caminho em passos --------------------- */
  const area = (a: string) => (xx: number) => path.areaAt(xx) === a;
  const inStreet = area('street');
  const inMarket = area('market');
  const inCourt = area('temple-court');

  // 4a) Rua / acesso: vasos, cestos, caixas e tecidos junto às fachadas
  for (let sx = 120; sx < path.endX - 100; sx += rng.range(170, 300)) {
    if (inMarket(sx) || inCourt(sx)) continue;
    const b = path.band(sx);
    const kind = rng.pick<PropKind>(['pot', 'pot', 'amphora', 'basket', 'crate', 'sack']);
    put(kind, sx, b.top + rng.range(16, 38), { scale: rng.range(0.9, 1.25) });
    if (inStreet(sx) && rng.chance(0.55)) {
      put('cloth', sx + rng.range(-90, 90), b.top - 56, { depth: b.top - 3, sway: true, solid: false, layer: 'back' });
    }
  }

  // 4b) Mercado: barracas na parte alta e baixa da faixa, corredor livre no meio
  for (const marketSeg of path.segments.filter((seg) => seg.area === 'market')) {
    for (let sx = marketSeg.startX + 130, side = 0; sx < marketSeg.endX - 130; sx += rng.range(250, 330), side++) {
      const b = path.band(sx);
      const variant = rng.int(0, VARIANTS.stall - 1);
      const { w } = sizeOf('stall', variant, 1);
      const top = side % 2 === 0;
      const fy = top ? b.top + 52 + rng.range(0, 14) : b.bottom - 14 - rng.range(0, 8);
      put('stall', sx, fy, { variant });
      // mercadorias ao redor
      const nx = sx + (rng.chance(0.5) ? -1 : 1) * (w / 2 + 28);
      put(rng.pick<PropKind>(['basket', 'amphora', 'sack', 'crate']), nx, fy + rng.range(-4, 8), { scale: rng.range(0.9, 1.2) });
      if (rng.chance(0.5)) put('pot', nx + rng.range(-24, 24), fy + rng.range(8, 18), { scale: rng.range(0.9, 1.1) });
    }
  }

  // 4c) Árvores (oliveiras) e arbustos nas áreas abertas
  for (let tx = 360; tx < courtStart + 600; tx += rng.range(520, 900)) {
    const b = path.band(tx);
    put('tree', tx, b.top + rng.range(2, 14), { scale: rng.range(0.8, 1.05), solid: true });
  }
  for (let bx = 200; bx < path.endX; bx += rng.range(240, 520)) {
    const b = path.band(bx);
    put('bush', bx, b.bottom - rng.range(0, 6), { scale: rng.range(0.8, 1.2), solid: false });
  }

  // 4d) Luminárias
  for (let lx = 380; lx < path.endX - 200; lx += rng.range(420, 560)) {
    const b = path.band(lx);
    put('lamp', lx, b.top + 30, { flicker: true, variant: rng.int(0, 1), flip: false });
  }

  // 4e) Bancos no pátio
  for (let bx = courtStart + 500; bx < path.endX - 500; bx += rng.range(600, 800)) {
    const b = path.band(bx);
    put('bench', bx, b.top + 54, {});
  }

  // Rochas soltas (pequenas, não-sólidas) para quebrar a regularidade do calçamento
  for (let rx = 150; rx < path.endX; rx += rng.range(300, 560)) {
    if (inCourt(rx)) continue;
    const b = path.band(rx);
    put('rock', rx, b.bottom - rng.range(6, 40), { scale: rng.range(0.7, 1.2), solid: false });
  }

  /* ---- 5) Primeiro plano (sobrepõe o jogador quando ele passa por baixo) ---- */
  for (let fx = 160; fx < path.endX; fx += rng.range(300, 600)) {
    const b = path.band(fx);
    const kind = rng.pick<PropKind>(['bush', 'rock', 'pot', 'amphora', 'basket', 'sack']);
    const sc = rng.range(1.3, 1.7);
    put(kind, fx, b.bottom + rng.range(44, 78), { layer: 'fore', scale: sc, solid: false });
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
