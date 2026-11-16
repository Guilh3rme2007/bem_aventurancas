# Player reutilizável — fase 1

## Arquivos

- `game/bem_aventurancas/src/entities/PlayerCharacter.ts`: entidade e configuração tipada do jogador.
- `game/bem_aventurancas/src/level/humildes_espirito/HumildesEspiritoScene.ts`: cria e atualiza o Player; continua responsável pelo nível, NPCs e interface da fase.
- `game/bem_aventurancas/src/worlds/jerusalem/JerusalemLevel.ts`: aceita o Container do jogador com uma âncora explícita dos pés; mantém câmera, limites, colisão geométrica e profundidade.
- `game/bem_aventurancas/src/level/humildes_espirito/README.md`: descreve a integração e como conectar spritesheets posteriormente.

## APIs usadas

`PlayerCharacter` recebe `id`, `position`, `speed` por eixo, `scale`, `initialDirection` e `controlsEnabled`. `texture`, `displaySize`, `collision` e um mapa opcional de animações podem ser informados quando necessário.

- Setas e WASD são lidos pelo Keyboard Plugin do Phaser.
- O movimento usa o `delta` da Scene e normaliza o vetor de entrada diagonal.
- `PlayerCharacter.update(delta, level)` delega o deslocamento a `JerusalemLevel.moveBy(dx, dy, halfWidth, depth)`. Não usa Arcade Physics nem cria uma física concorrente.
- `JerusalemLevel.update(time, delta)` continua responsável pelo clamp da faixa caminhável, profundidade baseada nos pés, câmera e streaming.
- `getBottomCenter()` fornece a âncora usada pelo spawn, clamp e NPCManager.
- `setInteracting()` e `setDialogueActive()` bloqueiam movimento. São pontos de integração; nenhum sistema de diálogo foi criado ou conectado.
- `destroy()` remove as teclas associadas e o listener de encerramento da Scene.

## Aparência e animações

Como a textura final do personagem não está disponível, a fase usa o retângulo temporário com o rótulo `PLAYER TEMP`. Se `texture` for fornecida e já existir no Texture Manager, o Player usa um Sprite com o tamanho visual configurado.

O mapa opcional `animations` aceita chaves `idle-up`, `idle-down`, `idle-left`, `idle-right`, `walk-up`, `walk-down`, `walk-left` e `walk-right`, associadas a animações que já devem estar registradas no Phaser. Nenhuma spritesheet ou animação final é afirmada ou incluída.

## Validação desta tarefa

- `npm run build`: passou (typecheck e bundle de produção).
- Não existe script `test` nem suíte automatizada configurada; `npm test -- --run` retorna “Missing script: test”.
- No navegador, acesso direto a `#/fase/humildes-espirito` carregou o placeholder. As setas e WASD foram pressionados nas quatro direções e em diagonal; não ocorreram erros JavaScript. O movimento para a direita foi observado visualmente.
- A viewport foi alterada para 390×844 e restaurada a 1280×720 sem erros JavaScript.
- A cena foi encerrada via navegação para `#/fases` e reaberta pela rota direta; o canvas permaneceu único e não houve erro.
- Colisões geométricas, limites e profundidade continuam encaminhados às APIs de `JerusalemLevel`; sua implementação foi inspecionada. Não foi feita uma asserção automatizada de coordenadas contra cada obstáculo ou limite.
- O bloqueio por estado de interação/diálogo e o não processamento durante pausa foram verificados por inspeção do código; não há sistema de diálogo nesta tarefa nem harness de teste para pausar a Scene e consultar o estado interno do Player.

## Limitações restantes

- O personagem continua sendo um placeholder até uma textura/spritesheet ser produzida e carregada.
- O mapa de animações é apenas um contrato; só toca animações previamente registradas e presentes no mapa de configuração.
- Os controles de diálogo existem como métodos, mas ainda precisam ser chamados pelo futuro sistema de diálogo.
- A velocidade por eixo mantém os valores da fase anterior (X=200, Y=130) para preservar o movimento 2.5D existente.
