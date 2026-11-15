import Phaser from 'phaser';
import { DEPTH, PARALLAX, PAPER, QUALITY } from './JerusalemBackgroundConfig';
import { TEX } from './JerusalemAssets';
import { ensurePropTexture } from './JerusalemEnvironment';
import { JerusalemPath } from './JerusalemPath';

const HORIZON = 340;
const DUST_COUNT = 16;

interface DustMote {
  img: Phaser.GameObjects.Image;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  ttl: number;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const smooth = (t: number): number => t * t * (3 - 2 * t);

interface View {
  x: number;
  y: number;
  w: number;
  h: number;
}

function viewOf(cam: Phaser.Cameras.Scene2D.Camera): View {
  const w = cam.width / cam.zoom;
  const h = cam.height / cam.zoom;
  return { x: cam.scrollX + cam.width * 0.5 - w * 0.5, y: cam.scrollY + cam.height * 0.5 - h * 0.5, w, h };
}

export class JerusalemBackdrop {
  private readonly sky: Phaser.GameObjects.Image;
  private readonly clouds: Phaser.GameObjects.TileSprite;
  private readonly mountains: Phaser.GameObjects.TileSprite;
  private readonly farCity: Phaser.GameObjects.TileSprite;
  private readonly temple: Phaser.GameObjects.Image;
  private readonly paper: Phaser.GameObjects.TileSprite;
  private readonly vignette: Phaser.GameObjects.Image;
  /** Grãos de poeira: pool fixo de imagens reaproveitadas (sem sistema de partículas). */
  private readonly motes: DustMote[] = [];
  private lastTime = 0;

  constructor(scene: Phaser.Scene, private readonly path: JerusalemPath) {
    
    this.sky = scene.add.image(0, 0, TEX.sky).setOrigin(0, 0).setDepth(DEPTH.sky);
    this.clouds = scene.add.tileSprite(0, 0, 64, 200, TEX.clouds).setOrigin(0, 0).setDepth(DEPTH.sky + 1).setAlpha(0.85);
    this.mountains = scene.add.tileSprite(0, HORIZON - 215, 64, 240, TEX.mountains).setOrigin(0, 0).setDepth(DEPTH.far);
    this.farCity = scene.add.tileSprite(0, HORIZON - 190, 64, 220, TEX.farCity).setOrigin(0, 0).setDepth(DEPTH.far + 1);

    const baked = ensurePropTexture(scene, 'templeFar', 0);
    this.temple = scene.add.image(0, HORIZON, baked.key).setOrigin(baked.originX, baked.originY).setDepth(DEPTH.temple);

    this.paper = scene.add.tileSprite(0, 0, 64, 64, TEX.paper).setOrigin(0, 0).setDepth(DEPTH.paper).setBlendMode(Phaser.BlendModes.MULTIPLY).setAlpha(PAPER.alpha);
    this.vignette = scene.add.image(0, 0, TEX.vignette).setOrigin(0.5, 0.5).setDepth(DEPTH.vignette).setAlpha(PAPER.vignetteAlpha);

    if (QUALITY.ambientDust) {
      for (let i = 0; i < DUST_COUNT; i++) {
        const img = scene.add.image(0, 0, TEX.dust).setDepth(DEPTH.foreBase + 900).setAlpha(0);
        this.motes.push({ img, x: 0, y: 0, vx: 0, vy: 0, life: 0, ttl: 0 });
      }
    }
  }

  update(cam: Phaser.Cameras.Scene2D.Camera, time: number): void {
    const v = viewOf(cam);
    const pad = 48;

    this.sky.setPosition(v.x - pad, v.y - pad).setDisplaySize(v.w + pad * 2, v.h + pad * 2);

    this.clouds.setPosition(v.x, v.y + v.h * 0.04).setSize(v.w, 200);
    this.clouds.tilePositionX = cam.scrollX * PARALLAX.clouds + time * 0.004;

    this.mountains.setPosition(v.x, HORIZON - 215).setSize(v.w, 240);
    this.mountains.tilePositionX = cam.scrollX * PARALLAX.mountains;

    this.farCity.setPosition(v.x, HORIZON - 190).setSize(v.w, 220);
    this.farCity.tilePositionX = cam.scrollX * PARALLAX.farCity;

    const maxScroll = Math.max(1, this.path.endX - v.w);
    const p = Math.min(1, Math.max(0, v.x / maxScroll));
    const e = smooth(p);
    this.temple.setPosition(v.x + v.w * lerp(1.38, 0.64, e), lerp(HORIZON + 14, 312, e));
    this.temple.setScale(lerp(0.46, 0.92, e));
    this.temple.setAlpha(lerp(0.78, 1, e));

    this.paper.setPosition(v.x, v.y).setSize(v.w, v.h);
    this.paper.tilePositionX = v.x;
    this.paper.tilePositionY = v.y;

    this.vignette.setPosition(v.x + v.w / 2, v.y + v.h / 2).setDisplaySize(v.w * 1.1, v.h * 1.1);

    this.updateDust(v, time);
  }

  private updateDust(v: View, time: number): void {
    const dt = this.lastTime ? Math.min(100, time - this.lastTime) : 16;
    this.lastTime = time;
    for (const m of this.motes) {
      m.life += dt;
      const outside = m.x < v.x - 60 || m.x > v.x + v.w + 60;
      if (m.ttl === 0 || m.life >= m.ttl || outside) {
        m.x = v.x + Math.random() * v.w;
        m.y = v.y + v.h * (0.3 + Math.random() * 0.55);
        m.vx = 8 + Math.random() * 14;
        m.vy = -5 + Math.random() * 9;
        m.ttl = 4000 + Math.random() * 3000;
        m.life = Math.random() * m.ttl * 0.5; // espalha as fases para não nascerem juntos
      }
      m.x += (m.vx * dt) / 1000;
      m.y += (m.vy * dt) / 1000;
      const t = m.life / m.ttl;
      m.img.setPosition(m.x, m.y).setAlpha(Math.sin(Math.PI * t) * 0.35).setScale(0.9 - 0.6 * t);
    }
  }

  destroy(): void {
    [this.sky, this.clouds, this.mountains, this.farCity, this.temple, this.paper, this.vignette].forEach((o) => o.destroy());
    this.motes.forEach((m) => m.img.destroy());
    this.motes.length = 0;
  }
}

export { HORIZON };
