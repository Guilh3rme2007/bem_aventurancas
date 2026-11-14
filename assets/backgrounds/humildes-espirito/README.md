# Jerusalém — Level 01 (O Caminho da Humildade)

> **Adaptado ao repositório bem_aventurancas.** Código em `src/level/humildes_espirito/background/`,
> posições de NPC em `src/level/humildes_espirito/data/npcSpawnPoints.ts` (campo `npcId` liga ao
> `src/data/npcs/humildesEspirito.ts`). A Scene `HumildesEspiritoScene.ts` já está integrada; os
> trechos "sua Scene" e `scenes/...example.ts` abaixo são do pacote genérico original.

Cenário 2.5D **100% procedural** (Phaser 3.60+ e TypeScript). Nenhuma imagem de fundo é carregada:
papel, céu, colinas, pedras, casas, barracas, o Templo etc. são desenhados por código (`Graphics` +
`Canvas` 2D), "assados" uma vez em texturas pequenas e reutilizados.

> **Estado de verificação:** este código foi escrito sem acesso ao seu repositório e ainda **não foi
> executado** contra o Phaser. Os módulos puros (caminho, planejador, RNG) foram verificados com `tsc`.
> O restante precisa do seu `npm run typecheck && npm run build` e de uma olhada visual. Veja
> "Ajustes esperados" no fim.

## Arquivos

```
background/
  JerusalemBackgroundConfig.ts  paleta, dimensões, profundidades, parallax, qualidade
  HandDrawn.ts                  RNG semeado, cores e o pincel "Ink" (contorno irregular, aquarela, dry-brush)
  JerusalemPath.ts              percurso (PathPoint/LevelSegment), faixa caminhável, escadas, validação
  JerusalemEnvironment.ts       desenho de casas, barracas, muros, vasos, árvores, colunas, portão, Templo...
  JerusalemAssets.ts            texturas globais: papel, vinheta, céu, nuvens, colinas, cidade distante, pedras
  JerusalemGround.ts            chão de cada segmento (1 RenderTexture), pedras, degraus, sombras
  JerusalemMap.ts               estrutura do mapa (Placement, SegmentPlan), consultas, validação de NPCs
  JerusalemMapGenerator.ts      planejador do nível inteiro + SegmentStreamer (carrega/descarrega)
  JerusalemBackdrop.ts          plano distante com parallax, Templo que se revela, papel/vinheta/poeira
  JerusalemLevel.ts             fachada: câmera, streaming, colisões, profundidade, eventos
data/npcSpawnPoints.ts          posições previstas de NPCs (sem falas/missões)
scenes/HumildesEspiritoScene.example.ts   cena de teste com jogador provisório
```

## Integração com a sua Scene (3 passos)

```ts
import { JerusalemLevel, LEVEL_EVENTS } from '../background/JerusalemLevel';

create() {
  // ... seu Player já criado:
  this.level = new JerusalemLevel(this, { player: this.player });
}
update(t: number, dt: number) {
  // ... sua movimentação existente
  this.level.update(t, dt);
}
```

O que `JerusalemLevel` faz com o seu Player (sem substituí-lo):

- posiciona no início do percurso (`placePlayerAtSpawn: false` desliga);
- `setDepth(Y do pé)` a cada frame (`autoDepth: false` desliga) — assim ele passa à frente/atrás dos objetos;
- mantém dentro da faixa caminhável (`clampPlayer: false` desliga);
- se houver Arcade Physics e o Player tiver corpo, cria o `collider` com os sólidos;
- configura a câmera (seguimento suave, limites, zoom pela altura de projeto 720).

**Pressupostos sobre o movimento (confirme no seu projeto):** movimento livre em X e Y (estilo beat'em up
2.5D), origem do Player nos pés (ou use `getBottomCenter`, que já é o que o código usa), e corpo de colisão
pequeno na base do sprite (os sólidos têm só ~26 px de profundidade no chão). Se seu jogo não usa Arcade,
use `level.map.isBlocked(x, y)` e `level.path.clamp(x, y)` no seu próprio movimento.

Eventos (`this.events.on(...)`): `reachedTemple`, `npcEnter`, `npcLeave`, `segmentBuilt`, `segmentDestroyed`.

## Como ampliar o mapa

1. Em `JerusalemPath.ts`, acrescente um `LevelSegment` ao final de `LEVEL_01_SEGMENTS`:
   `startX` = `endX` do anterior; o **primeiro ponto repete o último ponto** do anterior (mesmos `y` e
   `halfWidth`). `JerusalemPath.validate` lança erro descritivo se houver lacuna ou salto.
2. `halfWidth` maior = beco/praça; `stairs: true` num ponto = rampa de degraus até o próximo ponto.
3. Para uma nova área, acrescente o id em `AreaId` e trate-a em `planMap` (JerusalemMapGenerator.ts).
4. Novo objeto: adicione um `PropKind` em `JerusalemEnvironment.ts` (`size`, `draw`, `solid?`) e `VARIANTS`.
5. NPCs: edite `data/npcSpawnPoints.ts`; `level.map.validateNpcSpawns()` avisa se algum estiver fora da faixa
   ou dentro de um sólido.

Como não há lacunas: o nível inteiro é planejado numa passada contínua em X; o chão usa ruído e grade
globais (mesmo desenho na zona de sobreposição de 96 px). Segmentos são carregados `preloadDistance`
(1400 px) à frente e descarregados `unloadDistance` (1800 px) atrás; nunca se recria um segmento vivo.

## Profundidade 2.5D

`DEPTH.midBase + Y do pé` para casas, barracas, NPCs e jogador; primeiro plano em `foreBase + Y` (sempre acima
do jogador, sobrepõe quando ele passa por baixo); céu/colinas/cidade/Templo em profundidades negativas com
parallax (0.04 / 0.1 / 0.28); o Templo entra pela direita e cresce conforme o progresso.

## Base histórica: documentado x escolha artística

| Item | Situação |
|---|---|
| Casas de calcário com **telhado em terraço plano** e parapeito | Padrão arquitetônico do período; proporções são artísticas |
| Ruas escalonadas / via monumental até o Templo | Documentadas (Stepped Street, via Siloé–Templo); o traçado aqui é **simplificado** |
| Muro do Templo com **pedras de margem rebaixada** | Característica herodiana documentada |
| Colunas em pórtico/colunata | Documentadas no complexo (Pórtico Real etc.); número, posição e ordem aqui são artísticos |
| Santuário dourado ao horizonte | Inspirado em maquetes/descrições; **reconstrução interpretativa** |
| Mercado, barracas, toldos, cores, vegetação | Escolhas artísticas plausíveis; **sem** fonte arqueológica específica |

Não consegui consultar as URLs do prompt (sem acesso à internet neste ambiente). Esta tabela vem de
conhecimento geral e **precisa ser conferida** contra as fontes que você listou. Sem pátios internos
sagrados representados como espaço público: o portão é só a fachada externa, no fim do percurso.

## Ajustes esperados (não verificados)

- Versão do Phaser: o código usa `add.particles(x, y, key, config)` e `RenderTexture.draw`, de **3.60+**.
  Em versões anteriores, ajuste `JerusalemBackdrop` (partículas).
- `tsconfig` com `verbatimModuleSyntax`/`erasableSyntaxOnly`: pode exigir `import type` em alguns pontos.
- Telas verticais (celular): a câmera limita a largura mínima visível a 560 px de mundo; sobra faixa de
  terreno acima/abaixo. Ajuste `minViewWidth`.
- O parallax usa a câmera do frame anterior (diferença de 1 frame ao mover rápido); imperceptível em geral.
- Desempenho: ~70 texturas de objetos são geradas no início (`prebake`); chão = 1 RenderTexture por segmento.
  Meça em celular e reduza `QUALITY`/`prebake` se necessário.
- Visual: cores/densidades foram escolhidas sem ver o resultado renderizado. Espere iterar em paleta,
  escala dos objetos e densidade (tudo em `JerusalemBackgroundConfig`, `planMap` e `PROPS`).
