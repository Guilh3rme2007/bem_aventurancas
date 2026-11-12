import Phaser from 'phaser';
import { PALETTE as P, WORLD, DEPTH, QUALITY } from './JerusalemBackgroundConfig';
import { createRng, mix, darken, toVec } from './HandDrawn';
import { JerusalemPath, LevelSegment } from './JerusalemPath';
import { TEX, DIRT_VARIANTS } from './JerusalemAssets';


const noise = (x: number, seed = 0): number =>
  Math.sin(x * 0.071 + seed) * 2.6 + Math.sin(x * 0.173 + 1.3 + seed) * 1.8 + Math.sin(x * 0.0231 + 4 + seed) * 3;

export interface SegmentGround {
  rt: Phaser.GameObjects.RenderTexture;
  x0: number;
}

export function buildSegmentGround(scene: Phaser.Scene, path: JerusalemPath, seg: LevelSegment): SegmentGround {
  const x0 = seg.startX - WORLD.groundOverlap;
  const x1 = seg.endX + WORLD.groundOverlap;
  const W = Math.ceil(x1 - x0);
  const H = WORLD.designHeight;
  const rt = scene.add.renderTexture(x0, 0, W, H).setOrigin(0, 0).setDepth(DEPTH.ground);

  const STEP = 32;
  const xs: number[] = [];
  for (let x = x0; x <= x1; x += STEP) xs.push(x);
  if (xs[xs.length - 1] < x1) xs.push(x1);

  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const strip = (topFn: (x: number) => number, botFn: (x: number) => number, color: number, alpha: number): void => {
    const pts = xs.map((x) => ({ x: x - x0, y: topFn(x) }));
    for (let i = xs.length - 1; i >= 0; i--) pts.push({ x: xs[i] - x0, y: botFn(xs[i]) });
    g.fillStyle(color, alpha);
    g.fillPoints(toVec(pts), true);
  };
  const ashlar = seg.groundStyle === 'ashlar';

  strip((x) => path.band(x).top - 80, () => H, P.sand, 1);
  strip((x) => path.band(x).center + path.band(x).halfWidth * 0.6, () => H, mix(P.sand, P.brown, 0.28), 0.55);
  strip((x) => path.band(x).bottom + 40, () => H, mix(P.sand, P.olive, 0.3), 0.35);

  const walk = ashlar ? mix(P.limestone, P.beigeLight, 0.62) : mix(P.limestone, P.beigeLight, 0.32);
  strip((x) => path.band(x).top - 14 + noise(x, 1), (x) => path.band(x).bottom + 20 + noise(x, 2), darken(walk, 0.12), 0.35);
  strip((x) => path.band(x).top - 6 + noise(x, 3) * 0.6, (x) => path.band(x).bottom + 12 + noise(x, 4) * 0.6, walk, 0.97);

  strip((x) => path.band(x).top - 6, (x) => path.band(x).top + 34, P.shadow, 0.2);
  strip((x) => path.band(x).top - 6, (x) => path.band(x).top + 14, P.shadow, 0.16);

  rt.draw(g);
  g.destroy();

  // Imagem de apoio para carimbar na RenderTexture: construída direto (não entra na cena).
  const scratch = new Phaser.GameObjects.Image(scene, 0, 0, TEX.cobble(0)).setOrigin(0.5, 0.5);
  const cellW = ashlar ? 96 : 52;
  const rowH = ashlar ? 46 : 28;
  const c0 = Math.floor(x0 / cellW) - 1;
  const c1 = Math.ceil(x1 / cellW) + 1;
  for (let cx = c0; cx <= c1; cx++) {
    const colX = cx * cellW;
    const b = path.band(Math.max(path.startX, Math.min(path.endX, colX)));
    const rStart = Math.floor((b.top - 24) / rowH);
    const rEnd = Math.ceil((b.bottom + 24) / rowH);
    for (let ry = rStart; ry <= rEnd; ry++) {
      const r = createRng(((cx * 73856093) ^ (ry * 19349663)) >>> 0);
      const stagger = ry % 2 ? cellW * 0.5 : 0;
      const x = colX + stagger + r.range(-4, 4);
      const y = ry * rowH + r.range(-3, 3);
      if (x < x0 || x > x1) continue;
      const bb = path.band(Math.max(path.startX, Math.min(path.endX, x)));
      if (y < bb.top - 10 || y > bb.bottom + 14) continue;
      const v = r.int(0, QUALITY.stoneTextureVariants - 1);
      scratch.setTexture(ashlar ? TEX.ashlar(v) : TEX.cobble(v));
      scratch.setScale(ashlar ? 1 : r.range(0.85, 1.2));
      scratch.setAngle(ashlar ? r.range(-1, 1) : r.range(-14, 14));
      rt.draw(scratch, x - x0, y, r.range(0.78, 0.98));
    }
  }

  const sg = scene.make.graphics({ x: 0, y: 0 }, false);
  for (const [a, b] of path.stairRanges()) {
    if (b < x0 || a > x1) continue;
    for (let x = a; x < b; x += 46) {
      const band = path.band(x);
      const lx = x - x0;
      sg.fillStyle(P.shadow, 0.3);
      sg.fillPoints(toVec([{ x: lx, y: band.top - 4 }, { x: lx + 7, y: band.top - 4 }, { x: lx + 11, y: band.bottom + 14 }, { x: lx + 3, y: band.bottom + 14 }]), true);
      sg.lineStyle(2.2, P.cloudWhite, 0.55);
      sg.lineBetween(lx + 8, band.top - 3, lx + 12, band.bottom + 13);
      sg.lineStyle(1.6, P.ink, 0.35);
      sg.lineBetween(lx + 1, band.top - 3, lx + 4, band.bottom + 13);
    }
  }
  rt.draw(sg);
  sg.destroy();

  if (!ashlar) {
    for (let i = 0; i < Math.floor(W / 220); i++) {
      const r = createRng((Math.floor(x0 / 220) + i) * 2654435761);
      const x = x0 + (i + r.next()) * 220;
      if (x > x1) break;
      const bb = path.band(Math.max(path.startX, Math.min(path.endX, x)));
      scratch.setTexture(TEX.dirt(r.int(0, DIRT_VARIANTS - 1)));
      scratch.setScale(r.range(0.9, 1.6));
      scratch.setAngle(r.range(-5, 5));
      rt.draw(scratch, x - x0, r.range(bb.top + 10, bb.bottom), 0.55);
    }
  }
  scratch.destroy();
  return { rt, x0 };
}


