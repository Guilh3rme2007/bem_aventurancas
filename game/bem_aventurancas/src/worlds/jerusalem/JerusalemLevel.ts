import Phaser from 'phaser';
import { DEPTH, DESIGN_HEIGHT, PALETTE, QUALITY } from './JerusalemBackgroundConfig';
import { mix } from './HandDrawn';
import { JerusalemPath, AreaId } from './JerusalemPath';
import { JerusalemMap, Placement, SegmentPlan } from './JerusalemMap';
import { planMap, SegmentStreamer } from './JerusalemMapGenerator';
import { registerJerusalemAssets, TEX } from './JerusalemAssets';
import { ensurePropTexture, PAD } from './JerusalemEnvironment';
import { RegionStyle, RegionStyles, resolveRegionStyles } from './JerusalemRegionStyles';
import { buildSegmentGround, destroySegmentGround, SegmentGround } from './JerusalemGround';
import { JerusalemBackdrop } from './JerusalemBackdrop';
import { NPC_SPAWN_POINTS, NPCSpawnPoint } from '../../data/npcs/npcSpawnPoints';

/** GameObjects usados como jogador; um Container precisa expor a âncora de seus pés. */
export type PlayerLike =
  | Phaser.GameObjects.Sprite
  | Phaser.GameObjects.Image
  | Phaser.GameObjects.Rectangle
  | (Phaser.GameObjects.Container & {
      getBottomCenter(): Phaser.Math.Vector2;
    })
  | Phaser.Physics.Arcade.Sprite
  | Phaser.Physics.Arcade.Image;

export interface JerusalemLevelOptions {
  /** Jogador EXISTENTE (não é criado aqui). Opcional: sem ele, só o cenário é montado. */
  player?: PlayerLike;
  npcSpawns?: NPCSpawnPoint[];
  /** Se true, posiciona o jogador no ponto inicial do caminho. Padrão: true. */
  placePlayerAtSpawn?: boolean;
  /** Ajusta a profundidade do jogador a cada frame pelo Y do pé. Padrão: true. */
  autoDepth?: boolean;
  /** Mantém o jogador dentro da faixa caminhável. Padrão: true. */
  clampPlayer?: boolean;
  /** Cria colisão Arcade entre o jogador e os sólidos (se houver physics Arcade). Padrão: true. */
  collide?: boolean;
  /** Largura mínima (px de mundo) visível: evita câmera estreita em telas verticais. Padrão: 560. */
  minViewWidth?: number;
  followLerp?: number;
  /** Gera no início as texturas de todos os objetos do mapa (evita engasgos ao entrar em novos segmentos). */
  prebake?: boolean;
  /** Troca materiais de uma região sem mexer na geração (ver JerusalemRegionStyles.ts). */
  regionStyles?: Partial<Record<AreaId, Partial<RegionStyle>>>;
  debug?: boolean;
}

export const LEVEL_EVENTS = {
  reachedTemple: 'jerusalem:reached-temple',
  npcEnter: 'jerusalem:npc-enter',
  npcLeave: 'jerusalem:npc-leave',
  segmentBuilt: 'jerusalem:segment-built',
  segmentDestroyed: 'jerusalem:segment-destroyed',
} as const;

interface SegmentView {
  id: string;
  ground: SegmentGround;
  objects: Phaser.GameObjects.GameObject[];
  tweens: Phaser.Tweens.Tween[];
  zones: Phaser.GameObjects.Zone[];
}

/**
 * Fachada do cenário: cria mapa, streaming, câmera, parallax, colisões e profundidade 2.5D,
 * sem criar Player nem substituir a movimentação existente.
 *
 *   const level = new JerusalemLevel(this, { player: this.player });
 *   update(t, dt) { level.update(t, dt); }
 */
export class JerusalemLevel {
  readonly path: JerusalemPath;
  readonly map: JerusalemMap;
  /** Grupo estático Arcade com os sólidos instanciados (ou undefined sem Arcade Physics). */
  readonly solids?: Phaser.Physics.Arcade.StaticGroup;

  private readonly backdrop: JerusalemBackdrop;
  private readonly streamer: SegmentStreamer<SegmentView>;
  private readonly player?: PlayerLike;
  private readonly opts: Required<Pick<JerusalemLevelOptions, 'autoDepth' | 'clampPlayer' | 'minViewWidth' | 'followLerp'>>;
  private readonly gateX: number;
  private readonly styles: RegionStyles;
  private debugGfx?: Phaser.GameObjects.Graphics;
  private reachedTemple = false;
  private nearNpc?: NPCSpawnPoint;
  private destroyed = false;

  constructor(private readonly scene: Phaser.Scene, options: JerusalemLevelOptions = {}) {
    this.opts = {
      autoDepth: options.autoDepth ?? true,
      clampPlayer: options.clampPlayer ?? true,
      minViewWidth: options.minViewWidth ?? 560,
      followLerp: options.followLerp ?? 0.09,
    };
    this.player = options.player;

    registerJerusalemAssets(scene);

    this.styles = resolveRegionStyles(options.regionStyles);
    this.path = new JerusalemPath();
    this.map = planMap(this.path, options.npcSpawns ?? NPC_SPAWN_POINTS, undefined, this.styles);
    if (options.prebake ?? QUALITY.prebakeProps) {
      // gera só as texturas que o mapa realmente usa (cada combinação objeto/variante/material, uma vez)
      ensurePropTexture(scene, 'templeFar', 0);
      for (const plan of this.map.plans) for (const p of plan.placements) ensurePropTexture(scene, p.kind, p.variant, p.mat);
    }
    this.gateX = this.path.endX - 300;

    if (scene.physics?.add) this.solids = scene.physics.add.staticGroup();
    this.backdrop = new JerusalemBackdrop(scene, this.path);

    this.streamer = new SegmentStreamer<SegmentView>(this.map, {
      build: (plan) => this.buildSegment(plan),
      destroy: (v) => this.destroySegment(v),
      onBoundsChanged: (_min, max) => this.applyBounds(max),
    });

    const cam = scene.cameras.main;
    cam.setBackgroundColor(mix(PALETTE.sand, PALETTE.brown, 0.28));
    this.fitCamera();
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);

    if (this.player) {
      if (options.placePlayerAtSpawn ?? true) {
        const s = this.path.spawn();
        this.player.setPosition(s.x, s.y - (this.player.getBottomCenter().y - this.player.y));
      }
      cam.startFollow(this.player, true, this.opts.followLerp, this.opts.followLerp);
      cam.centerOn(this.player.x, DESIGN_HEIGHT / 2);
      if (
        (options.collide ?? true) &&
        this.solids &&
        (this.player instanceof Phaser.Physics.Arcade.Sprite ||
          this.player instanceof Phaser.Physics.Arcade.Image)
      ) {
        scene.physics.add.collider(this.player, this.solids);
      }
    }

    // Primeira carga: monta o que está ao redor do jogador antes do primeiro frame.
    const px = this.player ? this.player.x : this.path.startX;
    const v = this.viewRect();
    this.streamer.update(px, v.x, v.x + v.w);
    if (options.debug) this.setDebug(true);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    scene.events.once(Phaser.Scenes.Events.DESTROY, this.destroy, this);
  }

  /* --------------------------------------------------------------- câmera --- */

  private viewRect(): { x: number; w: number } {
    const cam = this.scene.cameras.main;
    const w = cam.width / cam.zoom;
    return { x: cam.scrollX + cam.width * 0.5 - w * 0.5, w };
  }

  /** Ajusta zoom para manter a altura de projeto; em telas estreitas, limita a largura mínima visível. */
  fitCamera(): void {
    const cam = this.scene.cameras.main;
    cam.setZoom(Math.min(cam.height / DESIGN_HEIGHT, cam.width / this.opts.minViewWidth));
  }

  private onResize(): void {
    if (this.destroyed) return;
    this.fitCamera();
    this.applyBounds(this.streamer.boundsEnd);
  }

  private applyBounds(maxX: number): void {
    if (!Number.isFinite(maxX)) return;
    const width = maxX - this.path.startX;
    this.scene.cameras.main.setBounds(this.path.startX, 0, width, DESIGN_HEIGHT);
    this.scene.physics?.world?.setBounds(this.path.startX, 0, width, DESIGN_HEIGHT);
  }

  /* ------------------------------------------------------------- segmentos --- */

  private buildSegment(plan: SegmentPlan): SegmentView {
    const scene = this.scene;
    const ground = buildSegmentGround(scene, this.path, plan.segment, this.styles);
    const view: SegmentView = { id: plan.segment.id, ground, objects: [], tweens: [], zones: [] };

    let swayCount = 0;
    for (const p of plan.placements) {
      const baked = ensurePropTexture(scene, p.kind, p.variant, p.mat);
      const depth = p.depth ?? (p.layer === 'fore' ? DEPTH.foreBase + p.y : DEPTH.midBase + p.y);
      const wantSway = !!p.sway && swayCount < QUALITY.maxSwayObjectsPerSegment;

      const img = scene.add.image(p.x, p.y, baked.key).setOrigin(baked.originX, baked.originY).setScale(p.scale).setFlipX(p.flipX).setDepth(depth);
      if (p.tint !== undefined) img.setTint(p.tint);
      view.objects.push(img);

      if (wantSway) {
        swayCount++;
        // pivô no topo (o tecido pende de um varal): sobe o pé pela altura do objeto
        img.setOrigin(baked.originX, PAD / (baked.h + PAD * 2));
        img.y = p.y - baked.h * p.scale;
        img.setAngle(-2.2);
        view.tweens.push(
          scene.tweens.add({
            targets: img,
            angle: 2.2,
            duration: Phaser.Math.Between(1700, 2600),
            delay: Phaser.Math.Between(0, 1200),
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          }),
        );
      }
      if (p.flicker) this.addGlow(view, p, baked.h, depth);

      if (p.solid && this.solids) {
        const r = p.solid;
        const zone = scene.add.zone(r.x + r.w / 2, r.y + r.h / 2, r.w, r.h);
        this.solids.add(zone); // StaticGroup habilita o corpo estático
        view.zones.push(zone);
      }
    }
    scene.events.emit(LEVEL_EVENTS.segmentBuilt, plan.segment.id);
    return view;
  }

  private addGlow(view: SegmentView, p: Placement, texH: number, depth: number): void {
    const gx = p.x;
    const gy = p.y - (texH - 6) * p.scale;
    const glow = this.scene.add.image(gx, gy, TEX.dust).setTint(PALETTE.gold).setScale(4.2).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD).setDepth(depth + 1);
    view.objects.push(glow);
    view.tweens.push(
      this.scene.tweens.add({
        targets: glow,
        alpha: { from: 0.3, to: 0.65 },
        scale: { from: 3.8, to: 4.6 },
        duration: Phaser.Math.Between(260, 520),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      }),
    );
  }

  private destroySegment(v: SegmentView): void {
    v.tweens.forEach((t) => t.remove());
    v.zones.forEach((z) => (this.solids ? this.solids.remove(z, true, true) : z.destroy()));
    v.objects.forEach((o) => o.destroy());
    destroySegmentGround(this.scene, v.ground);
    this.scene.events.emit(LEVEL_EVENTS.segmentDestroyed, v.id);
  }

  /* ---------------------------------------------------------------- update --- */

  update(time: number, _delta: number): void {
    if (this.destroyed) return;
    const cam = this.scene.cameras.main;
    const v = this.viewRect();
    const pl = this.player;

    if (pl) {
      let foot = pl.getBottomCenter();
      if (this.opts.clampPlayer) {
        const c = this.path.clamp(foot.x, foot.y);
        if (c.x !== foot.x || c.y !== foot.y) {
          pl.setPosition(pl.x + (c.x - foot.x), pl.y + (c.y - foot.y));
          foot = pl.getBottomCenter();
        }
      }
      if (this.opts.autoDepth) pl.setDepth(DEPTH.midBase + foot.y);
      this.streamer.update(foot.x, v.x, v.x + v.w);
      this.checkTriggers(foot.x, foot.y);
    } else {
      this.streamer.update(v.x + v.w / 2, v.x, v.x + v.w);
    }
    this.backdrop.update(cam, time);
    if (this.debugGfx) this.drawDebug(v.x, v.w);
  }

  private checkTriggers(x: number, y: number): void {
    const b = this.path.band(x);
    if (!this.reachedTemple && Math.abs(x - this.gateX) < 90 && y < b.top + 70) {
      this.reachedTemple = true;
      this.scene.events.emit(LEVEL_EVENTS.reachedTemple, { x, y });
    }
    let nearest: NPCSpawnPoint | undefined;
    let best = Infinity;
    for (const n of this.map.npcSpawns) {
      const d = Math.hypot(n.x - x, n.y - y);
      if (d <= n.interactionRadius && d < best) {
        best = d;
        nearest = n;
      }
    }
    if (nearest?.id !== this.nearNpc?.id) {
      if (this.nearNpc) this.scene.events.emit(LEVEL_EVENTS.npcLeave, this.nearNpc);
      if (nearest) this.scene.events.emit(LEVEL_EVENTS.npcEnter, nearest);
      this.nearNpc = nearest;
    }
  }

  /**
   * Movimento com colisão SEM Arcade Physics: desloca o jogador por (dx, dy) px, testando X e Y
   * separadamente (desliza ao longo dos obstáculos). A caixa de colisão é só a base (pés).
   */
  moveBy(dx: number, dy: number, halfWidth = 13, depth = 12): void {
    const pl = this.player;
    if (!pl || (dx === 0 && dy === 0)) return;
    const hit = (x: number, y: number): boolean => this.map.overlapsSolid(x - halfWidth, y - depth, halfWidth * 2, depth);
    let f = pl.getBottomCenter();
    if (hit(f.x, f.y)) {
      pl.setPosition(pl.x + dx, pl.y + dy); // já está preso dentro de algo: deixa sair
      return;
    }
    if (dx !== 0 && !hit(f.x + dx, f.y)) pl.x += dx;
    f = pl.getBottomCenter();
    if (dy !== 0 && !hit(f.x, f.y + dy)) pl.y += dy;
  }

  /**
   * Fixa um objeto de interface (scrollFactor 0) em uma posição da TELA, compensando o zoom
   * da câmera. Chame de novo após o resize. `ax, ay` = âncora do objeto (0..1).
   */
  pinToScreen(obj: Phaser.GameObjects.Text | Phaser.GameObjects.Image | Phaser.GameObjects.Container, sx: number, sy: number): void {
    const cam = this.scene.cameras.main;
    const z = cam.zoom;
    const cx = cam.width / 2;
    const cy = cam.height / 2;
    obj.setScrollFactor(0).setDepth(DEPTH.ui).setScale(1 / z).setPosition((sx - cx) / z + cx, (sy - cy) / z + cy);
  }

  /** NPC cujo raio de interação contém o jogador agora (se houver). */
  getNearbyNpc(): NPCSpawnPoint | undefined {
    return this.nearNpc;
  }

  /* ----------------------------------------------------------------- debug --- */

  setDebug(on: boolean): void {
    if (on && !this.debugGfx) this.debugGfx = this.scene.add.graphics().setDepth(DEPTH.foreBase + 2000);
    if (!on && this.debugGfx) {
      this.debugGfx.destroy();
      this.debugGfx = undefined;
    }
  }

  private drawDebug(vx: number, vw: number): void {
    const g = this.debugGfx!;
    g.clear();
    g.lineStyle(2, 0x00ff88, 0.9);
    const tops: Array<{ x: number; y: number }> = [];
    const bots: Array<{ x: number; y: number }> = [];
    for (let x = Math.max(this.path.startX, vx); x <= Math.min(this.path.endX, vx + vw); x += 24) {
      const b = this.path.band(x);
      tops.push({ x, y: b.top });
      bots.push({ x, y: b.bottom });
    }
    if (tops.length > 1) {
      g.strokePoints(tops.map((p) => new Phaser.Math.Vector2(p.x, p.y)), false);
      g.strokePoints(bots.map((p) => new Phaser.Math.Vector2(p.x, p.y)), false);
    }
    g.lineStyle(1, 0xff3344, 0.9);
    for (const id of this.streamer.liveIds)
      for (const p of this.map.plan(id)?.placements ?? []) if (p.solid) g.strokeRect(p.solid.x, p.solid.y, p.solid.w, p.solid.h);
    g.fillStyle(0x3377ff, 0.8);
    this.map.npcSpawns.forEach((n) => g.fillCircle(n.x, n.y, 6));
  }

  /* --------------------------------------------------------------- destroy --- */

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this);
    this.streamer.destroyAll();
    this.backdrop.destroy();
    this.debugGfx?.destroy();
    this.solids?.destroy(true);
  }
}


