/**
 * PRÉ-VISUALIZAÇÃO (ferramenta de desenvolvimento): mostra todos os materiais (repetidos 3×2 para
 * conferir emendas) e todos os objetos da biblioteca de Jerusalém, sem iniciar o jogo.
 *
 *   npm run dev   →   abrir  http://localhost:5173/texture-preview.html
 *
 * Não é incluída no build de produção (o Vite só empacota o index.html).
 * Parâmetros opcionais na URL: ?mat=wall_plaster  (força o material de alvenaria dos objetos)
 */
import { registerMaterials, MATERIALS, MATERIAL_IDS, materialKey } from '../level/humildes_espirito/materials/MaterialLibrary';
import { ensurePropTexture, PROPS, PROP_KINDS } from '../worlds/jerusalem/JerusalemEnvironment';
import { getStoredCanvas } from '../level/humildes_espirito/style/CanvasStore';
import type { MaterialId } from '../level/humildes_espirito/materials/MaterialLibrary';

const params = new URLSearchParams(location.search);
const forcedMat = (params.get('mat') as MaterialId | null) ?? undefined;

registerMaterials(null);

const root = document.createElement('div');
root.style.cssText = 'font:13px system-ui;background:#d9c39a;color:#3b2a1e;padding:16px;min-height:100vh';
document.body.style.margin = '0';
document.body.appendChild(root);

const h = (text: string): HTMLElement => {
  const e = document.createElement('h2');
  e.textContent = text;
  e.style.cssText = 'margin:24px 0 8px;font:600 18px system-ui';
  return e;
};

/* Materiais: tile repetido 3×2 (as emendas não devem aparecer) */
root.appendChild(h('Materiais (cada um repetido 3×2)'));
const matGrid = document.createElement('div');
matGrid.style.cssText = 'display:flex;flex-wrap:wrap;gap:16px';
for (const id of MATERIAL_IDS) {
  const m = MATERIALS[id];
  const src = getStoredCanvas(materialKey(id))!;
  const cell = document.createElement('figure');
  cell.style.margin = '0';
  const c = document.createElement('canvas');
  const scale = 0.7;
  c.width = m.w * 3 * scale;
  c.height = m.h * 2 * scale;
  const ctx = c.getContext('2d')!;
  ctx.scale(scale, scale);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) ctx.drawImage(src, i * m.w, j * m.h);
  const cap = document.createElement('figcaption');
  cap.textContent = `${id} — ${m.label} (${m.w}×${m.h})`;
  cell.append(c, cap);
  matGrid.appendChild(cell);
}
root.appendChild(matGrid);

/* Objetos por categoria */
for (const cat of ['architecture', 'market', 'vegetation', 'decoration'] as const) {
  root.appendChild(h(`Objetos: ${cat}`));
  const grid = document.createElement('div');
  grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:18px;align-items:flex-end';
  for (const kind of PROP_KINDS.filter((k) => PROPS[k].category === cat)) {
    for (let v = 0; v < Math.min(PROPS[kind].variants, 3); v++) {
      const b = ensurePropTexture(null, kind, v, forcedMat);
      const src = getStoredCanvas(b.key)!;
      const fig = document.createElement('figure');
      fig.style.margin = '0';
      const cap = document.createElement('figcaption');
      cap.textContent = `${kind} #${v}`;
      fig.append(src, cap);
      grid.appendChild(fig);
    }
  }
  root.appendChild(grid);
}
