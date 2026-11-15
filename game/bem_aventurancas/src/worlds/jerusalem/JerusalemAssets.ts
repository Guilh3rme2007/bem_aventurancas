import type Phaser from 'phaser';
import { PALETTE as P } from './JerusalemBackgroundConfig';
import { bakeCanvas } from '../../level/humildes_espirito/style/CanvasStore';
import { createRng, hex, lighten, darken, mix, varyTone } from './HandDrawn';
import { registerMaterials } from '../../level/humildes_espirito/materials/MaterialLibrary';

/**
 * Registro de TEXTURAS GLOBAIS do cenário (plano distante e sobreposições de pintura):
 * papel, vinheta, céu, nuvens, colinas, silhuetas da cidade e poeira. Também garante que a
 * biblioteca de MATERIAIS (pisos, paredes, madeiras) esteja registrada.
 *
 * Tudo é gerado por código, uma única vez por jogo (idempotente), e reaproveitado.
 * Nenhuma imagem grande é carregada nem criada.
 */

export const TEX = {
  paper: 'jr-paper',
  vignette: 'jr-vignette',
  sky: 'jr-sky',
  clouds: 'jr-clouds',
  mountains: 'jr-mountains',
  farCity: 'jr-farcity',
  dust: 'jr-dust',
} as const;

/** Desenha duas vezes (x e x±w) para que formas que cruzam a borda continuem no outro lado. */
function wrapDraw(w: number, x: number, draw: (ox: number) => void): void {
  draw(0);
  if (x < w * 0.25) draw(w);
  if (x > w * 0.75) draw(-w);
}

export function registerJerusalemAssets(scene: Phaser.Scene): void {
  registerMaterials(scene);
  const rng = createRng(0x1e2a5a);

  /* Papel: grão + fibras. Ladrilhável. Usado em MULTIPLY sobre a tela. */
  bakeCanvas(scene, TEX.paper, 256, 256, (ctx) => {
    ctx.fillStyle = 'rgb(240,229,204)';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 5200; i++) {
      const dark = rng.chance(0.62);
      ctx.fillStyle = dark ? `rgba(120,92,58,${rng.range(0.03, 0.12)})` : `rgba(255,252,240,${rng.range(0.1, 0.3)})`;
      const s = rng.range(0.8, 2.2);
      ctx.fillRect(rng.range(0, 256), rng.range(0, 256), s, s);
    }
    ctx.lineWidth = 0.7;
    for (let i = 0; i < 110; i++) {
      const x = rng.range(0, 256);
      const y = rng.range(0, 256);
      const l = rng.range(6, 22);
      const a = rng.range(0, Math.PI * 2);
      ctx.strokeStyle = `rgba(110,85,55,${rng.range(0.04, 0.1)})`;
      wrapDraw(256, x, (ox) => {
        ctx.beginPath();
        ctx.moveTo(x + ox, y);
        ctx.quadraticCurveTo(x + ox + Math.cos(a) * l * 0.5, y + Math.sin(a) * l * 0.8, x + ox + Math.cos(a) * l, y + Math.sin(a) * l);
        ctx.stroke();
      });
    }
  });

  /* Vinheta (bordas escurecidas como pintura sobre papel). */
  bakeCanvas(scene, TEX.vignette, 512, 512, (ctx) => {
    const g = ctx.createRadialGradient(256, 256, 120, 256, 256, 362);
    g.addColorStop(0, 'rgba(70,48,30,0)');
    g.addColorStop(0.62, 'rgba(70,48,30,0.04)');
    g.addColorStop(1, 'rgba(70,48,30,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
  });

  /* Céu em aquarela: degradê + manchas claras. */
  bakeCanvas(scene, TEX.sky, 512, 512, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, hex(darken(P.sky, 0.05)));
    g.addColorStop(0.55, hex(lighten(P.sky, 0.35)));
    g.addColorStop(1, hex(P.beigeLight));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 46; i++) {
      const x = rng.range(0, 512);
      const y = rng.range(0, 460);
      const r = rng.range(30, 90);
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, rng.chance(0.6) ? 'rgba(255,248,230,0.16)' : 'rgba(120,150,165,0.09)');
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });

  /* Nuvens (ladrilhável na horizontal). */
  bakeCanvas(scene, TEX.clouds, 1024, 200, (ctx) => {
    for (let c = 0; c < 6; c++) {
      const cx = rng.range(0, 1024);
      const cy = rng.range(40, 140);
      const n = rng.int(5, 8);
      const parts = Array.from({ length: n }, (_, i) => ({ x: (i - n / 2) * 26 + rng.range(-8, 8), y: rng.range(-10, 8), r: rng.range(22, 40) }));
      wrapDraw(1024, cx, (ox) => {
        parts.forEach((p) => {
          ctx.fillStyle = 'rgba(244,236,216,0.6)';
          ctx.beginPath();
          ctx.arc(cx + ox + p.x, cy + p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(217,189,121,0.14)';
          ctx.beginPath();
          ctx.arc(cx + ox + p.x + 4, cy + p.y + p.r * 0.35, p.r * 0.8, 0, Math.PI * 2);
          ctx.fill();
        });
      });
    }
  });

  /* Montanhas / colinas (ladrilhável: ondas com período inteiro). */
  bakeCanvas(scene, TEX.mountains, 1024, 240, (ctx) => {
    const ridge = (base: number, amp: number, color: number, seed: number): void => {
      const r = createRng(seed);
      const ph = [r.range(0, 6.28), r.range(0, 6.28), r.range(0, 6.28)];
      ctx.fillStyle = hex(color);
      ctx.beginPath();
      ctx.moveTo(0, 240);
      for (let x = 0; x <= 1024; x += 8) {
        const t = (x / 1024) * Math.PI * 2;
        ctx.lineTo(x, base + Math.sin(t * 2 + ph[0]) * amp + Math.sin(t * 5 + ph[1]) * amp * 0.45 + Math.sin(t * 11 + ph[2]) * amp * 0.15);
      }
      ctx.lineTo(1024, 240);
      ctx.closePath();
      ctx.fill();
    };
    ridge(120, 36, mix(P.sand, P.sky, 0.5), 11);
    ridge(160, 28, mix(P.limestone, P.sky, 0.35), 29);
    ridge(205, 16, mix(P.olive, P.sand, 0.45), 47);
    ctx.strokeStyle = 'rgba(89,67,48,0.08)';
    for (let i = 0; i < 70; i++) {
      const x = rng.range(0, 1024);
      const y = rng.range(120, 235);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + rng.range(20, 60), y + rng.range(-3, 3));
      ctx.stroke();
    }
  });

  /* Silhuetas distantes da cidade: terraços planos, duas fiadas. */
  bakeCanvas(scene, TEX.farCity, 1024, 220, (ctx) => {
    const row = (baseY: number, hMin: number, hMax: number, color: number, seed: number): void => {
      const r = createRng(seed);
      let x = -r.range(0, 40);
      while (x < 1024) {
        const w = r.range(44, 112);
        const h = r.range(hMin, hMax);
        ctx.fillStyle = hex(varyTone(color, r, 0.06));
        ctx.fillRect(x, baseY - h, w, h + 40);
        ctx.fillStyle = hex(darken(color, 0.16));
        ctx.fillRect(x - 2, baseY - h - 4, w + 4, 6);
        ctx.fillStyle = 'rgba(60,44,32,0.35)';
        if (r.chance(0.7)) ctx.fillRect(x + w * r.range(0.2, 0.7), baseY - h + 16, 7, 11);
        if (r.chance(0.2)) {
          ctx.fillStyle = hex(darken(color, 0.3));
          ctx.beginPath();
          ctx.arc(x + w / 2, baseY - h - 4, w * 0.18, Math.PI, 0);
          ctx.fill();
        }
        x += w + r.range(-4, 10);
      }
    };
    row(190, 40, 100, mix(P.limestone, P.sky, 0.5), 5);
    row(220, 50, 130, mix(P.limestone, P.sky, 0.28), 9);
  });

  /* Poeira (grão suave). */
  bakeCanvas(scene, TEX.dust, 16, 16, (ctx) => {
    const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    g.addColorStop(0, 'rgba(240,226,190,0.9)');
    g.addColorStop(1, 'rgba(240,226,190,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 16, 16);
  });
}
