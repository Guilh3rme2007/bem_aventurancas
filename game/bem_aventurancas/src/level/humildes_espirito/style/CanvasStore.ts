import type Phaser from 'phaser';

/**
 * Armazena os canvases gerados (materiais, texturas de objetos) e cria as texturas do Phaser
 * a partir deles UMA vez. O mesmo canvas serve de textura (TileSprite/Image) e de padrão
 * repetível (`createPattern`) para preencher formas desenhadas à mão.
 *
 * Sem `scene` (null) o canvas é um elemento DOM comum: é assim que a página de pré-visualização
 * e os testes geram as texturas sem precisar do Phaser.
 */

const canvases = new Map<string, HTMLCanvasElement>();
const patterns = new WeakMap<CanvasRenderingContext2D, Map<string, CanvasPattern>>();

export function hasCanvas(key: string): boolean {
  return canvases.has(key);
}

export function getStoredCanvas(key: string): HTMLCanvasElement | undefined {
  return canvases.get(key);
}

/** Padrão repetível do material, para `ctx.fillStyle`. Retorna null se o material não foi gerado. */
export function getPattern(ctx: CanvasRenderingContext2D, key: string): CanvasPattern | null {
  let perCtx = patterns.get(ctx);
  if (!perCtx) {
    perCtx = new Map();
    patterns.set(ctx, perCtx);
  }
  const cached = perCtx.get(key);
  if (cached) return cached;
  const src = canvases.get(key);
  if (!src) return null;
  const pat = ctx.createPattern(src, 'repeat');
  if (pat) perCtx.set(key, pat);
  return pat;
}

/**
 * Gera um canvas `w x h` e o registra como textura `key` no Phaser (se houver `scene`).
 * Idempotente: se `key` já existe, devolve o canvas existente sem redesenhar.
 */
export function bakeCanvas(
  scene: Phaser.Scene | null,
  key: string,
  w: number,
  h: number,
  paint: (ctx: CanvasRenderingContext2D) => void,
): HTMLCanvasElement {
  const known = canvases.get(key);
  if (known) return known;

  if (!scene) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d')!;
    paint(ctx);
    canvases.set(key, c);
    return c;
  }

  if (scene.textures.exists(key)) {
    // textura já no Phaser (ex.: recarga a quente): reaproveita o canvas de origem
    const existing = scene.textures.get(key).getSourceImage() as HTMLCanvasElement;
    canvases.set(key, existing);
    return existing;
  }
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) throw new Error(`[CanvasStore] não foi possível criar a textura "${key}"`);
  const ctx = tex.getContext();
  paint(ctx);
  tex.refresh();
  canvases.set(key, ctx.canvas);
  return ctx.canvas;
}

/** Remove a textura e o canvas (usado pelo chão de segmentos descarregados). */
export function releaseCanvas(scene: Phaser.Scene, key: string): void {
  canvases.delete(key);
  if (scene.textures.exists(key)) scene.textures.remove(key);
}
