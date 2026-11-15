# Ambiente procedural de Jerusalém

## Localização

O código do ambiente está em `game/bem_aventurancas/src/worlds/jerusalem/`. Imagens, fontes,
áudio e demais recursos servidos diretamente pelo Vite devem ficar em
`game/bem_aventurancas/public/assets/`; os módulos TypeScript do ambiente não pertencem a `public/`.

| Módulo | Responsabilidade |
|---|---|
| `JerusalemLevel.ts` | Fachada do ambiente: câmera, bounds, profundidade, streaming, colisões, sinais e lifecycle. |
| `JerusalemPath.ts` | Segmentos, áreas do percurso, faixa caminhável, escadas e validação geométrica. |
| `JerusalemMap.ts` | Plano de objetos/spawns e consultas de colisão/validação. |
| `JerusalemMapGenerator.ts` | Geração procedural determinística, colocações e streaming por segmentos. |
| `JerusalemEnvironment.ts` | Tipos, dimensões, variantes, desenho e texturas dos objetos do ambiente. |
| `JerusalemAssets.ts` | Registro de texturas geradas no runtime para o fundo e materiais do chão. |
| `JerusalemGround.ts` | Construção do chão segmentado e detalhes de superfície. |
| `JerusalemBackdrop.ts` | Céu, nuvens, cidade distante, templo ao horizonte, papel, vinheta e poeira. |
| `JerusalemBackgroundConfig.ts` | Paleta, dimensões, profundidades, parallax e opções de qualidade. |
| `HandDrawn.ts` | RNG determinístico, desenho procedural, cores e primitivas artísticas. |

As posições dos NPCs ficam em `game/bem_aventurancas/src/data/npcs/npcSpawnPoints.ts`;
configuração e falas de NPC ficam em `src/data/npcs/humildesEspirito.ts`.

## Integração atual

`HumildesEspiritoScene` cria o jogador provisório e entrega sua instância ao nível:

```ts
import { JerusalemLevel } from "../../worlds/jerusalem/JerusalemLevel";

this.level = new JerusalemLevel(this, { player: this.player });
```

O nível usa o jogador fornecido, posiciona-o no spawn do percurso e configura o follow/zoom da
câmera. A cena chama `moveBy(dx, dy)` para a movimentação e `update(time, delta)` a cada frame.
O movimento, input e personagem continuam sendo responsabilidade da cena nesta etapa; esta
documentação não define uma abstração nova de Player.

Sem Arcade Physics habilitado, `moveBy()` testa as áreas sólidas do mapa e mantém o deslocamento
atual. `JerusalemLevel` também fornece clamp do percurso, profundidade pela posição dos pés,
streaming dos segmentos e atualização da câmera no resize. A configuração pode ser consultada em
`JerusalemLevelOptions`; mantenha a cena responsável por encerrar o nível no shutdown.

## Desenho e assets

O caminho, o chão e a maior parte do cenário são gerados no runtime usando Graphics/Canvas e
texturas Phaser. Não há arquivo de imagem de fundo de Jerusalém requerido pelo nível. Assets
estáticos (por exemplo, imagem do menu, ícone e fontes) permanecem em `public/assets`.

O mapa padrão contém rua, mercado, acesso ao Templo e pátio externo. Os dados de percurso ficam
em `LEVEL_01_SEGMENTS`, no `JerusalemPath.ts`; objetos, variantes e regras de colisão ficam em
`JerusalemEnvironment.ts` e `JerusalemMapGenerator.ts`. A alteração desses dados muda o conteúdo
do cenário e deve ser tratada separadamente de uma reorganização de arquivos.

## Validação

Na raiz do repositório:

```sh
npm run build
```

Para validação de runtime, abrir a rota `#/fase/humildes-espirito` no servidor Vite e conferir
carregamento do cenário, movimento, câmera, colisões e resize. A saída `dist/assets` deve conter
somente recursos estáticos, não módulos `.ts` nem esta documentação.
