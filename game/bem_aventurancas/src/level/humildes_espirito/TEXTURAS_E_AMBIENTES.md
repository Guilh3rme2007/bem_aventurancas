# Texturas e ambientes — Jerusalém, Level 01 (O Caminho da Humildade)

Biblioteca visual completa e reutilizável da Jerusalém do século I (período do Segundo Templo):
**12 materiais repetíveis** (pisos, paredes, madeiras), **38 tipos de objeto** (124 variantes) e um **tema
visual central** que garante que tudo pareça ilustrado pelo mesmo artista.

> **Estado de verificação.** Todos os materiais e objetos foram gerados e inspecionados visualmente em
> um navegador (Chromium headless), incluindo a checagem das emendas (cada material repetido 3×2) e uma
> composição de cena (chão + objetos com ordenação por profundidade). O código passa no `tsc` contra um
> stub do Phaser, **mas ainda não foi executado dentro do jogo real com Phaser 4**. Rode
> `npm run build` e `npm run dev` e confira a cena. Veja "Pendências e riscos" no fim.

## 1. Como a identidade visual é garantida

1. **Um único pincel.** Tudo é desenhado pela classe `Ink` (`HandDrawn.ts`): contorno irregular de dois
   passes, preenchimento levemente desalinhado como aquarela (“escorrido”), pinceladas secas, sombras
   pintadas em degradê. Materiais, casas, vasos e árvores usam as mesmas funções, por isso compartilham
   o traço.
2. **Um único tema.** `style/JerusalemVisualTheme.ts` define paleta, espessura do contorno, irregularidade,
   desgaste, nível de detalhe, intensidade das sombras e direção da luz (**da esquerda**; sombras à direita).
3. **Um único conjunto de materiais.** Casas, muros, portas, bancadas e o chão do mapa preenchem suas formas
   com os *mesmos* padrões (`wall_limestone`, `wood_planks`, ...). Um muro e o chão ao lado dele são feitos
   da mesma pedra pintada.
4. **Tudo gerado por código.** Nenhum PNG: não há “outro artista” que possa destoar. Se um dia um PNG for
   necessário, siga o checklist da seção 7.

## 2. Estrutura de arquivos (`src/level/humildes_espirito/background/`)

```text
style/
  JerusalemVisualTheme.ts   tema central (paleta, traço, sombras, luz, escalas)
  CanvasStore.ts            cria/guarda os canvases e registra as texturas no Phaser (uma vez)
materials/
  MaterialLibrary.ts        registro dos 12 materiais (ids, tamanhos, usos) + registerMaterials()
  floors.ts  walls.ts  woods.ts    geradores (paintFloorStone, paintWallLimestone, paintWoodPlanks, ...)
  tileUtils.ts              wrapDraw (repetição sem emenda), blot, speckle, splitTotal, spans
props/
  types.ts                  PropKind, PropDef (contrato de cada objeto)
  components.ts             portas, janelas, parapeitos, degraus, jarros, folhas, frutas
  architecture.ts  market.ts  vegetation.ts  decorations.ts    definições dos objetos
HandDrawn.ts                RNG semeado, cores e o pincel Ink
JerusalemEnvironment.ts     registro de objetos (PROPS) + baking de texturas (ensurePropTexture)
JerusalemRegionStyles.ts    QUAIS materiais cada região usa (rua, mercado, acesso, pátio)
JerusalemGround.ts          chão de cada segmento, montado a partir dos materiais da região
JerusalemMapGenerator.ts    planejador do mapa: posiciona os objetos e sorteia materiais por região
JerusalemAssets.ts          texturas globais (papel, vinheta, céu, nuvens, colinas, poeira)
```

Pré-visualização para desenvolvedores: `npm run dev` e abrir **`/texture-preview.html`** (mostra todos os
materiais repetidos 3×2 e todos os objetos; `?mat=wall_plaster` força o material de alvenaria dos objetos).

## 3. Catálogo (gerado a partir do código)

#### MATERIAIS
| Id | Categoria | Tile (px) | Descrição | Uso | Gerador |
|---|---|---|---|---|---|
| `floor_stone` | floor | 384×384 | Pedra calcária | Ruas principais | `materials/floors.ts` |
| `floor_dirt` | floor | 384×384 | Terra compactada | Becos, áreas residenciais, bordas | `materials/floors.ts` |
| `floor_market` | floor | 384×384 | Chão de mercado | Mercado | `materials/floors.ts` |
| `floor_stairs` | floor | 192×256 | Escadaria de calcário | Trechos com stairs: true (degraus a cada 64 px em X) | `materials/floors.ts` |
| `floor_temple` | floor | 288×240 | Pavimentação do Templo | Pátio externo do Templo | `materials/floors.ts` |
| `wall_limestone` | wall | 256×192 | Parede de calcário | Casas, muros | `materials/walls.ts` |
| `wall_plaster` | wall | 256×192 | Reboco | Casas | `materials/walls.ts` |
| `wall_retaining` | wall | 256×192 | Muro de contenção | Muros, escadas externas, arcos | `materials/walls.ts` |
| `wall_temple` | wall | 256×192 | Alvenaria herodiana | Muros monumentais, portão, escadarias do Templo | `materials/walls.ts` |
| `wood_planks` | wood | 256×192 | Tábuas verticais | Portas, tapumes, caixas | `materials/woods.ts` |
| `wood_boards` | wood | 256×192 | Tábuas horizontais | Bancadas, tampos, estrados | `materials/woods.ts` |
| `wood_beam` | wood | 128×256 | Viga/poste | Postes de barraca, vigas | `materials/woods.ts` |
#### OBJETOS: architecture
| Id | Descrição | Variantes | Sólido | Material da região | Arquivo |
|---|---|---|---|---|---|
| `house` | Casa de dois pavimentos | 8 | sim | house (padrão `wall_limestone`) | `props/architecture.ts` |
| `houseSmall` | Casa pequena de pedra | 6 | sim | house (padrão `wall_limestone`) | `props/architecture.ts` |
| `houseTerrace` | Casa com escada externa e terraço | 5 | sim | house (padrão `wall_limestone`) | `props/architecture.ts` |
| `stairsExt` | Escada externa de pedra | 3 | sim | retaining (padrão `wall_retaining`) | `props/architecture.ts` |
| `rampStone` | Rampa de pedra | 2 | sim | retaining (padrão `wall_retaining`) | `props/architecture.ts` |
| `wall` | Muro de contenção | 4 | sim | retaining (padrão `wall_retaining`) | `props/architecture.ts` |
| `wallLow` | Muro baixo | 3 | sim | retaining (padrão `wall_retaining`) | `props/architecture.ts` |
| `archway` | Passagem em arco | 2 | sim | retaining (padrão `wall_retaining`) | `props/architecture.ts` |
| `column` | Coluna | 2 | sim | monumental (padrão `wall_temple`) | `props/architecture.ts` |
| `columnBase` | Base de coluna | 2 | sim | monumental (padrão `wall_temple`) | `props/architecture.ts` |
| `templeWall` | Muro monumental (herodiano) | 3 | sim | monumental (padrão `wall_temple`) | `props/architecture.ts` |
| `templeStairs` | Escadaria ampla do Templo | 2 | sim | monumental (padrão `wall_temple`) | `props/architecture.ts` |
| `templeBlocks` | Blocos monumentais empilhados | 3 | sim | monumental (padrão `wall_temple`) | `props/architecture.ts` |
| `gate` | Portão monumental | 1 | não | monumental (padrão `wall_temple`) | `props/architecture.ts` |
| `templeFar` | Templo ao horizonte | 1 | não | — | `props/architecture.ts` |
#### OBJETOS: market
| Id | Descrição | Variantes | Sólido | Material da região | Arquivo |
|---|---|---|---|---|---|
| `stall` | Barraca com toldo | 5 | sim | — | `props/market.ts` |
| `basket` | Cesto com frutas | 4 | sim | — | `props/market.ts` |
| `crate` | Caixa de madeira | 3 | sim | — | `props/market.ts` |
| `sack` | Saco de grãos | 3 | sim | — | `props/market.ts` |
| `pot` | Vaso de barro | 4 | sim | — | `props/market.ts` |
| `amphora` | Ânfora | 3 | sim | — | `props/market.ts` |
| `fruitCrate` | Caixa de frutas | 4 | sim | — | `props/market.ts` |
| `breadBasket` | Cesto de pães | 3 | sim | — | `props/market.ts` |
| `sackPile` | Pilha de sacos | 3 | sim | — | `props/market.ts` |
| `clothRolls` | Rolos de tecido | 4 | sim | — | `props/market.ts` |
| `jarCluster` | Grupo de jarros | 4 | sim | — | `props/market.ts` |
#### OBJETOS: vegetation
| Id | Descrição | Variantes | Sólido | Material da região | Arquivo |
|---|---|---|---|---|---|
| `tree` | Oliveira | 3 | sim | — | `props/vegetation.ts` |
| `bush` | Arbusto | 4 | não | — | `props/vegetation.ts` |
| `plantPot` | Planta em vaso | 4 | sim | — | `props/vegetation.ts` |
| `oliveBranch` | Ramo de oliveira em jarro | 3 | sim | — | `props/vegetation.ts` |
| `grassTuft` | Tufo de capim | 4 | não | — | `props/vegetation.ts` |
| `rock` | Pedra | 4 | sim | — | `props/vegetation.ts` |
#### OBJETOS: decoration
| Id | Descrição | Variantes | Sólido | Material da região | Arquivo |
|---|---|---|---|---|---|
| `lamp` | Luminária de azeite | 2 | sim | — | `props/decorations.ts` |
| `cloth` | Tecido pendurado | 4 | não | — | `props/decorations.ts` |
| `bench` | Banco de madeira | 2 | sim | — | `props/decorations.ts` |
| `well` | Poço de pedra | 2 | sim | — | `props/decorations.ts` |
| `jarStand` | Suporte com jarros | 3 | sim | — | `props/decorations.ts` |
| `brazier` | Braseiro | 2 | sim | — | `props/decorations.ts` |
#### REGIÕES
| Região | Piso do caminho | Piso de fundo | Degraus | Paredes de casas | Muros | Alvenaria monumental |
|---|---|---|---|---|---|---|
| `street` | `floor_stone` | `floor_dirt` | `floor_stairs` | `wall_limestone`, `wall_plaster` | `wall_retaining` | `wall_temple` |
| `market` | `floor_market` | `floor_dirt` | `floor_stairs` | `wall_plaster`, `wall_limestone` | `wall_retaining` | `wall_temple` |
| `temple-approach` | `floor_stone` | `floor_dirt` | `floor_stairs` | `wall_limestone`, `wall_plaster` | `wall_retaining` | `wall_temple` |
| `temple-court` | `floor_temple` | `floor_stone` | `floor_stairs` | `wall_temple` | `wall_temple` | `wall_temple` |


Paleta (tema): areia `#D9C39A`, pedra clara `#E8D8B8`, calcário `#C8B18D`, pedra envelhecida `#A58B68`,
marrom `#8B6749`, madeira `#79553B`, terracota `#B96F4C`, verde oliva `#85865B`, verde escuro `#4C5D43`,
tecido claro `#E8D9BD`, azul suave `#A9C5D1`, dourado `#D9BD79`.

## 4. Como usar

### 4.1 Material como textura (TileSprite)
```ts
import { registerMaterials, materialKey } from './materials/MaterialLibrary';
registerMaterials(this);                                   // uma vez; é idempotente
this.add.tileSprite(0, 0, 800, 300, materialKey('floor_market')).setOrigin(0);
```

### 4.2 Material como preenchimento de uma forma desenhada à mão
```ts
const ink = new Ink(ctx, createRng(1));                    // ctx = canvas 2D
ink.rectMaterial(0, 0, 120, 80, 'wood_boards', { tint: 0x594330, tintAlpha: 0.15 });
ink.shadeBox(0, 0, 120, 80);                               // volume: luz à esquerda, sombra à direita
ink.outlineRect(0, 0, 120, 80);                            // contorno firme por cima
```
Formas que não são retângulo: use `ink.clipped(pontos, () => ink.soft(...))` para a sombra não vazar.

### 4.3 Objeto isolado
```ts
const b = ensurePropTexture(this, 'stall', 2);             // gera a textura uma única vez
this.add.image(x, y, b.key).setOrigin(b.originX, b.originY).setDepth(y);   // y = pé do objeto
```
Objetos com alvenaria aceitam o material: `ensurePropTexture(this, 'house', 0, 'wall_plaster')`.

### 4.4 No mapa procedural
O planejador (`JerusalemMapGenerator.ts`) já posiciona todos os tipos. Para mudar **quais objetos** aparecem
onde, edite as listas em `planMap` (ex.: `goods` no mercado). Para mudar **quais materiais** cada região usa,
edite `JerusalemRegionStyles.ts` (4.5), sem tocar no gerador.

### 4.5 Trocar os materiais de uma região
```ts
// opção A: editar a tabela padrão (JerusalemRegionStyles.ts)
market: { walk: 'floor_stone', ... }
// opção B: sem editar a tabela, ao criar o nível
new JerusalemLevel(this, { player, regionStyles: { market: { walk: 'floor_stone' } } });
```
O chão do mercado, as paredes das casas dessa região e a mistura nas fronteiras seguem a nova escolha.

## 5. Como adicionar

**Novo material** (ex.: `floor_gravel`)
1. Em `materials/floors.ts`, escreva `paintFloorGravel(ctx, W, H, rng)`. Para repetir sem emenda, desenhe cada
   forma com `wrapDraw` (ele redesenha o que cruza a borda do outro lado, com a mesma semente de traço) e use
   ondas de período inteiro para estrias e veios.
2. Em `MaterialLibrary.ts`, acrescente `'floor_gravel'` ao tipo `FloorId` e uma entrada em `MATERIALS`.
3. Teste em `/texture-preview.html` (procure emendas e padrões óbvios) e use-o em `REGION_STYLES`.

**Novo objeto** (ex.: `oven`)
1. Em `props/types.ts`, acrescente `'oven'` a `PropKind`; em `JerusalemEnvironment.ts`, a `KIND_TABLE` (o TypeScript
   acusa erro se esquecer).
2. No arquivo da categoria, escreva o `PropDef`: `size(rng)`, `draw(ink, w, h, rng, ctx)`, `variants`, `solid?` e
   `materialRole?` (se tiver alvenaria que depende da região). Convenção: o **pé do objeto é o centro da base**
   `(w/2, h)`; comece o desenho com `ink.contactShadow(...)`.
3. Use no `planMap` com `put('oven', x, y, { scale, layer })`.

**Nova região**: acrescente o `AreaId` em `JerusalemPath.ts`, a entrada em `REGION_STYLES` e a regra de objetos em
`planMap`.

## 6. Desempenho (medido em Chromium)

| Item | Resultado |
|---|---|
| Gerar os 12 materiais (uma vez) | ~70 ms, 3,6 MB |
| Gerar os 92 objetos distintos usados no mapa (uma vez) | ~60 ms, 11 MB |
| Chão de um segmento (ao entrar nele) | ~70–150 ms, 7,5 MB (liberado ao descarregar) |
| Texturas vazias / erros de geração | nenhum |

- Nada é redesenhado por frame: materiais e objetos viram texturas na primeira vez e são reutilizados.
- O chão é **um canvas por segmento** (não uma imagem do mapa inteiro); ao descarregar o segmento, a textura é
  removida. A geração do chão (~100 ms) acontece quando o segmento entra na janela de pré-carga (1400 px à
  frente do jogador), não no frame de cruzamento. Em aparelhos fracos pode haver um pequeno engasgo uma vez a
  cada ~2000 px; se medir isso, reduza `groundOverlap`/`segmentWidth` ou gere o próximo chão em etapas.
- `QUALITY.prebakeProps` gera no início só as texturas realmente usadas pelo mapa.

## 7. Como manter a identidade visual nas próximas fases

1. **Copie o tema**, não os valores: crie `style/OutraFaseTheme.ts` com as mesmas chaves e ajuste cores/traço.
   Mantenha a luz vinda da esquerda e sombras sempre quentes (marrom escuro, nunca preto).
2. **Desenhe só com `Ink`** e preencha com materiais; evite `fillRect` chapado em objetos. Use `shadeBox`/`soft`
   para volume e `strokes` para pincelada.
3. **Regras de paleta:** variações de tom com `varyTone`, `lighten` (tende ao creme) e `darken` (tende ao marrom).
   Evite cores saturadas; frutas/tecidos usam tons da paleta misturados (`mix`).
4. **Escala:** o jogador tem ~65 px; porta ≈ 64 px; janela ≈ 22 px; degrau ≈ 64 px de largura. Pedras do piso ≈ 25–60 px.
5. **Sem pixel art e sem geometria perfeita:** todo contorno passa por `wobble`; nada de grades regulares
   (use `spans`/`splitTotal` para larguras variáveis).
6. Se usar **PNG externo**, pinte-o com o mesmo contorno (marrom escuro `#3B2A1E`, ~2 px, irregular), a mesma
   paleta e luz à esquerda, e ainda assim preencha formas via materiais quando possível.
7. Toda peça nova deve ser conferida em `/texture-preview.html` e numa composição de cena antes de entrar no mapa.

## 8. Base histórica: documentado x escolha artística

| Elemento | Situação |
|---|---|
| Casas de calcário com telhado em terraço plano e parapeito | Padrão arquitetônico do período; proporções são artísticas |
| Portas de madeira, arcos de pedra, janelas pequenas, escadas externas | Plausíveis para a época; os desenhos são interpretativos |
| Alvenaria do Templo com **pedras de margem rebaixada** (`wall_temple`) | Característica herodiana documentada; a escala e a distribuição dos blocos são artísticas |
| Colunas, bases, escadarias amplas, portão, blocos monumentais | Inspirados no complexo de Herodes; número, posição e ordem são artísticos |
| Mercado, barracas, toldos, frutas, pães, jarros, ânforas, oliveiras | Escolhas artísticas plausíveis; sem fonte arqueológica específica |

Não consegui consultar as fontes citadas no prompt original (sem acesso à internet neste ambiente). Esta tabela
vem de conhecimento geral e **precisa ser conferida** com um especialista ou com as fontes. Não há elementos
medievais ou bizantinos: telhados são planos, sem telhas inclinadas, cúpulas ou vitrais.

## 9. Pendências e riscos

- **Phaser 4 não foi exercitado.** As texturas usam `textures.createCanvas`, `getContext()`, `refresh()`,
  `textures.remove()` e `add.image` / `add.tileSprite`, que são as APIs documentadas de `CanvasTexture`; se o
  build ou o console acusar algo, envie a mensagem.
- Parte do realismo vem de gradientes e recortes do Canvas 2D (`clip`, `createPattern`, `setTransform`); todos
  são suportados pelos navegadores atuais, mas não foram testados no Safari/mobile.
- Alguns objetos podem pedir ajuste fino de escala quando vistos com o jogador real (portas ≈ 64 px).
- `archway` e `templeStairs` aparecem no mapa, mas ainda sem lógica de passagem (são decoração; o jogador
  não atravessa o arco, que fica na linha de fundo).
