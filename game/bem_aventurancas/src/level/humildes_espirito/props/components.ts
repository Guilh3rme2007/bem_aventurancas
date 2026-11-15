import { JERUSALEM_VISUAL_THEME as T } from '../style/JerusalemVisualTheme';
import { Ink, Pt, Rng, darken, lighten, mix, varyTone } from '../HandDrawn';
import type { MaterialId } from '../materials/MaterialLibrary';

/**
 * COMPONENTES arquitetônicos reutilizáveis: usados dentro das casas, muros e portões.
 * Todos desenham com `Ink` e com os materiais da biblioteca, então herdam a identidade visual.
 */

const P = T.palette;

export const arc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 8): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
  }
  return out;
};

/** Cor média de um material de alvenaria (para sombras, vergas e tampas combinando com ele). */
export function toneOfMaterial(mat: MaterialId): number {
  switch (mat) {
    case 'wall_plaster': return mix(P.stoneLight, P.sand, 0.3);
    case 'wall_retaining': return mix(P.limestone, P.stoneAged, 0.4);
    case 'wall_temple': return mix(P.limestone, P.stoneLight, 0.45);
    default: return mix(P.limestone, P.stoneLight, 0.25);
  }
}

/** Corpo de parede: material + volume pintado (luz à esquerda) + contorno firme. */
export function wallBody(ink: Ink, x: number, y: number, w: number, h: number, mat: MaterialId, tint?: number, strength = 1): void {
  ink.rectMaterial(x, y, w, h, mat, { tint, tintAlpha: 0.14, width: 2.6 });
  ink.shadeBox(x, y, w, h, strength);
  ink.outlineRect(x, y, w, h, ink.inkColor, 2.6);
}

/** Tampa/parapeito do terraço plano. */
export function parapet(ink: Ink, x: number, y: number, w: number, tone: number): void {
  ink.rect(x - 3, y, w + 6, 10, darken(tone, 0.14), { width: 2 });
  ink.line(x - 3, y + 3, x + w + 3, y + 3, lighten(tone, 0.5), 1.4, 0.5);
  ink.soft(x - 3, y, w + 6, 10, P.shadow, 0.2, 'bottom');
}

/** Janela pequena com verga, peitoril, sombra interna e postigo opcional. */
export function windowAt(ink: Ink, rng: Rng, x: number, y: number, w: number, h: number, tone: number, arched = false): void {
  ink.rect(x - 3, y - 5, w + 6, 6, darken(tone, 0.22), { width: 1.4 }); // verga
  if (arched) {
    const pts: Pt[] = [{ x, y: y + h }, { x, y: y + 6 }, ...arc(x + w / 2, y + 6, w / 2, 6, Math.PI, Math.PI * 2, 6), { x: x + w, y: y + h }];
    ink.poly(pts, P.windowDark, { width: 1.6 });
    ink.clipped(pts, () => ink.soft(x, y, w, h * 0.5, P.brownDark, 0.45, 'top'));
  } else {
    ink.rect(x, y, w, h, P.windowDark, { width: 1.6 });
    ink.soft(x, y, w, h * 0.5, P.brownDark, 0.45, 'top'); // sombra da verga dentro do vão
  }
  ink.rect(x - 3, y + h, w + 6, 4, lighten(tone, 0.2), { width: 1.2 }); // peitoril
  if (rng.chance(0.4)) ink.rectMaterial(x - 1, y, w * 0.45, h, 'wood_planks', { width: 1.2, tint: P.brownDark, tintAlpha: 0.1 }); // postigo
}

/**
 * Porta de madeira. kind 'plank' = verga reta; 'arch' = arco de pedra (aduelas) com fecho.
 * `baseY` é o chão; a porta cresce para cima.
 */
export function doorAt(ink: Ink, rng: Rng, x: number, baseY: number, w: number, h: number, tone: number, kind: 'plank' | 'arch' = 'plank'): void {
  const top = baseY - h;
  if (kind === 'arch') {
    const cx = x + w / 2;
    const r = w / 2;
    // aduelas do arco: pequenos blocos em torno do vão
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a0 = Math.PI + (Math.PI * i) / n;
      const a1 = Math.PI + (Math.PI * (i + 1)) / n;
      const rr = r + 9;
      ink.poly(
        [{ x: cx + Math.cos(a0) * r, y: top + r + Math.sin(a0) * r }, { x: cx + Math.cos(a0) * rr, y: top + r + Math.sin(a0) * rr }, { x: cx + Math.cos(a1) * rr, y: top + r + Math.sin(a1) * rr }, { x: cx + Math.cos(a1) * r, y: top + r + Math.sin(a1) * r }],
        varyTone(lighten(tone, 0.15), rng, 0.08),
        { width: 1.3, bleed: false },
      );
    }
    ink.rect(x - 9, top + r, 9, h - r + 2, darken(tone, 0.12), { width: 1.6 }); // ombreiras
    ink.rect(x + w, top + r, 9, h - r + 2, darken(tone, 0.12), { width: 1.6 });
  } else {
    ink.rect(x - 5, top - 6, w + 10, h + 6, darken(tone, 0.2), { width: 1.6 }); // moldura/ombreira
  }
  const body: Pt[] = kind === 'arch'
    ? [{ x, y: baseY }, { x, y: top + w / 2 }, ...arc(x + w / 2, top + w / 2, w / 2, w / 2, Math.PI, Math.PI * 2, 8), { x: x + w, y: baseY }]
    : [{ x, y: baseY }, { x, y: top + 10 }, ...arc(x + w / 2, top + 10, w / 2, 10, Math.PI, Math.PI * 2, 6), { x: x + w, y: baseY }];
  ink.material(body, 'wood_planks', { width: 2, tint: rng.pick([P.brownDark, P.wood, P.brown]), tintAlpha: 0.18 });
  ink.clipped(body, () => {
    ink.soft(x, top + 4, w, h - 4, P.shadow, 0.3, 'right');
    ink.soft(x, top, w, 14, P.brownDark, 0.35, 'top'); // sombra do vão
  });
  for (let i = 0; i < 2; i++) ink.line(x + 1, baseY - h * (0.3 + i * 0.4), x + w - 1, baseY - h * (0.3 + i * 0.4), P.ink, 2.2, 0.55); // ferragens
  ink.ellipse(x + w * 0.78, baseY - h * 0.45, 2.4, 2.4, P.gold, { width: 1 });
  ink.poly([{ x: x - 7, y: baseY + 1 }, { x: x + w + 7, y: baseY + 1 }, { x: x + w + 3, y: baseY - 6 }, { x: x - 3, y: baseY - 6 }], lighten(tone, 0.12), { width: 1.4 }); // soleira
}

/** Degraus de pedra (vista frontal, subindo para a direita). Retorna a altura total. */
export function stepsRight(ink: Ink, rng: Rng, x: number, baseY: number, w: number, n: number, stepH: number, mat: MaterialId, tone: number): number {
  const sw = w / n;
  for (let i = 0; i < n; i++) {
    const h = stepH * (i + 1);
    ink.rectMaterial(x + i * sw, baseY - h, sw + 0.5, h, mat, { width: 1.8, tint: varyTone(tone, rng, 0.1), tintAlpha: 0.16 });
    ink.soft(x + i * sw, baseY - h, sw, stepH, P.cloudWhite, 0.35, 'top'); // piso do degrau (luz)
    ink.soft(x + i * sw, baseY - h + stepH, sw, h - stepH, P.shadow, 0.18, 'right');
  }
  return stepH * n;
}

/** Vaso/jarro de barro (reutilizado por vasos, ânforas, grupos e suportes). */
export function jar(ink: Ink, rng: Rng, cx: number, baseY: number, w: number, h: number, tone: number, kind: 'pot' | 'amphora' | 'bowl' = 'pot'): void {
  const nw = kind === 'amphora' ? w * 0.18 : w * 0.28;
  const bw = w / 2;
  ink.contactShadow(cx, baseY - 1, w * 0.5, 4, 0.3);
  const top = baseY - h;
  if (kind === 'amphora') {
    ink.curve([{ x: cx - 5, y: top + 10 }, { x: cx - bw + 2, y: top + 8 }, { x: cx - bw + 3, y: top + h * 0.32 }, { x: cx - w * 0.3, y: top + h * 0.34 }], T.palette.ink, 3);
    ink.curve([{ x: cx + 5, y: top + 10 }, { x: cx + bw - 2, y: top + 8 }, { x: cx + bw - 3, y: top + h * 0.32 }, { x: cx + w * 0.3, y: top + h * 0.34 }], T.palette.ink, 3);
  }
  const pts: Pt[] = kind === 'bowl'
    ? [{ x: cx - bw, y: top }, { x: cx + bw, y: top }, { x: cx + bw * 0.8, y: top + h * 0.6 }, { x: cx + bw * 0.4, y: baseY - 1 }, { x: cx - bw * 0.4, y: baseY - 1 }, { x: cx - bw * 0.8, y: top + h * 0.6 }]
    : [
        { x: cx - nw, y: top }, { x: cx + nw, y: top }, { x: cx + nw * 0.9, y: top + h * 0.18 }, { x: cx + bw, y: top + h * 0.45 },
        { x: cx + bw * 0.7, y: top + h * 0.86 }, { x: cx + bw * 0.4, y: baseY - 1 }, { x: cx - bw * 0.4, y: baseY - 1 },
        { x: cx - bw * 0.7, y: top + h * 0.86 }, { x: cx - bw, y: top + h * 0.45 }, { x: cx - nw * 0.9, y: top + h * 0.18 },
      ];
  ink.poly(pts, tone, { width: 1.8 });
  ink.line(cx - bw * 0.95, top + h * 0.5, cx + bw * 0.95, top + h * 0.5, P.brownDark, 1.4, 0.6); // friso pintado
  ink.line(cx - bw * 0.85, top + h * 0.56, cx + bw * 0.85, top + h * 0.56, P.brownDark, 1, 0.4);
  ink.clipped(pts, () => {
    ink.soft(cx - bw, top, w, h, P.shadow, 0.3, 'right');
    ink.soft(cx - bw, top, w * 0.3, h, P.cloudWhite, 0.26, 'left');
  });
  ink.ellipse(cx, top + 1, nw * 1.15, 2.6, darken(tone, 0.25), { width: 1.4 });
  void rng;
}

/** Folha de oliveira/louro: pequena lâmina pontiaguda. */
export function leaf(ink: Ink, x: number, y: number, len: number, angle: number, tone: number): void {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const w = len * 0.28;
  const p = (u: number, v: number): Pt => ({ x: x + c * u - s * v, y: y + s * u + c * v });
  ink.poly([p(0, 0), p(len * 0.5, -w), p(len, 0), p(len * 0.5, w)], tone, { width: 1, bleed: false, alpha: 0.95 });
}

/** Fruta com realce (cor em tom de paleta). */
export function fruit(ink: Ink, x: number, y: number, r: number, color: number): void {
  ink.ellipse(x, y, r, r * 0.92, color, { width: 1.1 });
  ink.ellipse(x - r * 0.3, y - r * 0.3, r * 0.35, r * 0.28, lighten(color, 0.5), { alpha: 0.55, outline: false, bleed: false });
  ink.clipped(ink.ellipsePts(x, y, r, r * 0.92), () => ink.soft(x - r, y - r, r * 2, r * 2, P.shadow, 0.2, 'right'));
}
