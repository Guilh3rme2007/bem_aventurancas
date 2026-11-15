import type Phaser from 'phaser';
import { JERUSALEM_VISUAL_THEME as T } from '../../level/humildes_espirito/style/JerusalemVisualTheme';
import { WORLD, DEPTH } from './JerusalemBackgroundConfig';
import { bakeCanvas, getPattern, releaseCanvas } from '../../level/humildes_espirito/style/CanvasStore';
import { createRng, mix, darken, rgba, Ink } from './HandDrawn';
import { JerusalemPath, LevelSegment, AreaId } from './JerusalemPath';
import { RegionStyles, resolveRegionStyles } from './JerusalemRegionStyles';
import { registerMaterials, materialKey, MaterialId } from '../../level/humildes_espirito/materials/MaterialLibrary';

const P = T.palette;

/**
 * Chão de UM segmento, pintado em um único canvas (1 textura, 1 Image):
 *  - piso de fundo (verge) e faixa de calçamento seguindo a curva do caminho;
 *  - o MATERIAL de cada região vem de JerusalemRegionStyles, com mistura suave nas fronteiras;
 *  - degraus nos trechos `stairs`, sombra sob as fachadas e pedrinhas na borda.
 *
 * Seamless entre segmentos: os materiais são padrões ancorados nas coordenadas do MUNDO (não do
 * segmento) e todo o resto é função determinística de X; a zona de sobreposição de 96 px é
 * desenhada igual nos dois segmentos.
 */

const noise = (x: number, seed = 0): number =>
  Math.sin(x * 0.071 + seed) * 2.6 + Math.sin(x * 0.173 + 1.3 + seed) * 1.8 + Math.sin(x * 0.0231 + 4 + seed) * 3;

export interface SegmentGround {
  image: Phaser.GameObjects.Image;
  key: string;
}

interface Span {
  a: number;
  b: number;
  area: AreaId;
}

/** Trechos contínuos de uma mesma região ao longo do caminho. */
function areaSpans(path: JerusalemPath): Span[] {
  const pts = path.points;
  const out: Span[] = [];
  let start = pts[0].x;
  let cur = pts[0].area;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].area !== cur) {
      out.push({ a: start, b: pts[i].x, area: cur });
      start = pts[i].x;
      cur = pts[i].area;
    }
  }
  out.push({ a: start, b: pts[pts.length - 1].x, area: cur });
  return out;
}

export function buildSegmentGround(scene: Phaser.Scene, path: JerusalemPath, seg: LevelSegment, styles: RegionStyles = resolveRegionStyles()): SegmentGround {
  registerMaterials(scene);
  const x0 = seg.startX - WORLD.groundOverlap;
  const x1 = seg.endX + WORLD.groundOverlap;
  const W = Math.ceil(x1 - x0);
  const H = WORLD.designHeight;
  const key = `jr-ground-${seg.id}`;

  bakeCanvas(scene, key, W, H, (ctx) => paintGround(ctx, path, styles, x0, x1, W, H));
  const image = scene.add.image(x0, 0, key).setOrigin(0, 0).setDepth(DEPTH.ground);
  return { image, key };
}

/** Pinta o chão de um segmento em um canvas DOM comum (pré-visualização e testes, sem Phaser). */
export function paintSegmentGroundToCanvas(path: JerusalemPath, seg: LevelSegment, styles: RegionStyles = resolveRegionStyles()): { canvas: HTMLCanvasElement; x0: number } {
  registerMaterials(null);
  const x0 = seg.startX - WORLD.groundOverlap;
  const x1 = seg.endX + WORLD.groundOverlap;
  const W = Math.ceil(x1 - x0);
  const canvas = bakeCanvas(null, `jr-ground-preview-${seg.id}`, W, WORLD.designHeight, (ctx) => paintGround(ctx, path, styles, x0, x1, W, WORLD.designHeight));
  return { canvas, x0 };
}

export function destroySegmentGround(scene: Phaser.Scene, g: SegmentGround): void {
  g.image.destroy();
  releaseCanvas(scene, g.key);
}

function paintGround(ctx: CanvasRenderingContext2D, path: JerusalemPath, styles: RegionStyles, x0: number, x1: number, W: number, H: number): void {
  const STEP = 32;
  const xs: number[] = [];
  for (let x = x0; x <= x1; x += STEP) xs.push(x);
  if (xs[xs.length - 1] < x1) xs.push(x1);
  const band = (x: number) => path.band(Math.max(path.startX, Math.min(path.endX, x)));

  /** Faixa entre duas curvas (coordenadas de MUNDO) como Path2D. */
  const strip = (topFn: (x: number) => number, botFn: (x: number) => number): Path2D => {
    const p = new Path2D();
    xs.forEach((x, i) => (i === 0 ? p.moveTo(x, topFn(x)) : p.lineTo(x, topFn(x))));
    for (let i = xs.length - 1; i >= 0; i--) p.lineTo(xs[i], botFn(xs[i]));
    p.closePath();
    return p;
  };

  const tmp = document.createElement('canvas');
  tmp.width = W;
  tmp.height = H;
  const t = tmp.getContext('2d')!;

  /**
   * Preenche `shape` com o material `mat` apenas entre a e b, com mistura suave de largura `blend`
   * nas pontas (a menos que a ponta seja o começo/fim do nível) e compõe sobre o canvas principal.
   */
  const layer = (shape: Path2D, mat: MaterialId, a: number, b: number, blend: number): void => {
    if (b < x0 - blend || a > x1 + blend) return;
    t.save();
    t.setTransform(1, 0, 0, 1, 0, 0);
    t.globalCompositeOperation = 'source-over';
    t.clearRect(0, 0, W, H);
    t.translate(-x0, 0); // padrão ancorado no mundo
    const pat = getPattern(t, materialKey(mat));
    if (pat) {
      if (typeof DOMMatrix !== 'undefined') pat.setTransform(new DOMMatrix());
      t.fillStyle = pat;
    } else {
      t.fillStyle = '#c8b18d';
    }
    t.fill(shape);
    t.restore();
    // máscara horizontal: opaco em [a, b], esmaecendo nas pontas
    const first = a <= path.startX;
    const last = b >= path.endX;
    const g = t.createLinearGradient(0, 0, W, 0);
    const n = (x: number) => Math.min(1, Math.max(0, (x - x0) / W));
    g.addColorStop(0, first ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0)');
    if (!first) {
      g.addColorStop(n(a - blend / 2), 'rgba(0,0,0,0)');
      g.addColorStop(n(a + blend / 2), 'rgba(0,0,0,1)');
    }
    if (!last) {
      g.addColorStop(n(b - blend / 2), 'rgba(0,0,0,1)');
      g.addColorStop(n(b + blend / 2), 'rgba(0,0,0,0)');
    }
    g.addColorStop(1, last ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0)');
    t.globalCompositeOperation = 'destination-in';
    t.fillStyle = g;
    t.fillRect(0, 0, W, H);
    t.globalCompositeOperation = 'source-over';
    ctx.drawImage(tmp, 0, 0);
  };

  const spans = areaSpans(path);
  const vergeShape = strip((x) => band(x).top - 80, () => H + 40);
  const walkShape = strip((x) => band(x).top - 6 + noise(x, 3) * 0.6, (x) => band(x).bottom + 12 + noise(x, 4) * 0.6);

  // 1) piso de fundo e faixa de calçamento, cada região com seu material
  for (const s of spans) layer(vergeShape, styles[s.area].verge, s.a, s.b, styles[s.area].blend);
  // zona à frente do caminho (primeiro plano): terra mais escura
  ctx.save();
  ctx.translate(-x0, 0);
  ctx.fillStyle = rgba(P.brownDark, 0.14);
  ctx.fill(strip((x) => band(x).bottom + 40, () => H + 40));
  ctx.restore();
  for (const s of spans) layer(walkShape, styles[s.area].walk, s.a, s.b, styles[s.area].blend);

  // 2) degraus nos trechos com stairs: true
  for (const [a, b] of path.stairRanges()) {
    const area = path.areaAt(a);
    layer(walkShape, styles[area].stairs, a, b, 28);
  }

  // 3) halo e borda irregular da faixa de calçamento (como se fosse pincelada) + sombra das fachadas
  ctx.save();
  ctx.translate(-x0, 0);
  const edge = (fn: (x: number) => number, color: number, alpha: number, width: number): void => {
    ctx.strokeStyle = rgba(color, alpha);
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    xs.forEach((x, i) => (i === 0 ? ctx.moveTo(x, fn(x)) : ctx.lineTo(x, fn(x))));
    ctx.stroke();
  };
  edge((x) => band(x).top - 6 + noise(x, 3) * 0.6, P.ink, 0.3, 2);
  edge((x) => band(x).bottom + 12 + noise(x, 4) * 0.6, P.ink, 0.3, 2);
  edge((x) => band(x).bottom + 14 + noise(x, 5) * 0.8, P.shadow, 0.14, 4);
  ctx.fillStyle = rgba(P.shadow, 0.2);
  ctx.fill(strip((x) => band(x).top - 6, (x) => band(x).top + 34));
  ctx.fillStyle = rgba(P.shadow, 0.16);
  ctx.fill(strip((x) => band(x).top - 6, (x) => band(x).top + 14));
  ctx.restore();

  // 4) pedrinhas e seixos junto à borda inferior (determinístico: grade GLOBAL + RNG por célula)
  const ink = new Ink(ctx, createRng(1), -x0, 0, 1.0);
  const cell = 70;
  for (let c = Math.floor(x0 / cell) - 1; c <= Math.ceil(x1 / cell) + 1; c++) {
    const r = createRng(((c * 73856093) ^ 0x51ed27) >>> 0);
    if (!r.chance(0.7)) continue;
    const x = c * cell + r.range(0, cell);
    if (x < x0 || x > x1) continue;
    const b = band(x);
    const y = b.bottom + r.range(14, 46);
    const w = r.range(5, 13);
    ink.rng = r;
    ink.contactShadow(x + 1, y + w * 0.3, w * 0.55, w * 0.25, 0.2);
    ink.ellipse(x, y, w * 0.55, w * 0.38, darken(mix(P.limestone, P.stoneAged, r.next()), r.range(0, 0.15)), { width: 1.1, bleed: false });
  }
}
