# Controles adaptativos

## Situação da implementação

Os controles adaptativos foram integrados à fase 1, `HumildesEspiritoScene`. Os serviços e o componente são reutilizáveis, mas outras fases ainda precisam criar `InputManager` e `MobileControls` e passar o estado de entrada ao seu `PlayerCharacter`. As outras fases não foram alteradas nem testadas nesta implementação.

## Identificação do dispositivo

`DeviceDetector.detect()` é chamado uma vez ao criar `InputManager`. Usa `navigator.maxTouchPoints`, `pointer: coarse`, `hover: hover`, `pointer: fine` e dimensões físicas da tela para identificar capacidade de toque e distinguir celular/tablet por tamanho. Não usa User-Agent.

- `isTouchPrimary` controla a exibição dos controles visuais e o texto de instrução do NPCManager; dispositivos touch híbridos mantêm também controles visuais.
- A leitura de teclado continua habilitada em qualquer dispositivo com Keyboard Plugin; em dispositivos híbridos, touch e teclado permanecem funcionais.
- Navegadores não oferecem uma API confiável para detectar a existência de teclado físico. `hasKeyboard` é uma estimativa com base em ponteiro fino, não uma garantia.
- Uma tela touch com ponteiro fino/hover disponível é tratada como híbrida: controles touch são exibidos e o teclado continua funcional.

## Fluxo de entrada

`InputManager` centraliza setas, WASD, E e estado do direcional. `getState()` retorna `up`, `down`, `left`, `right` e `interact`.

O Player recebe esse estado em `PlayerCharacter.update(delta, level, input)`. A entidade preserva normalização diagonal, direção, animações configuradas, velocidade e movimento através de `JerusalemLevel.moveBy()`. Não há uma segunda implementação de movimento.

Quando o direcional touch está pressionado, sua direção tem prioridade sobre o teclado para não misturar eixos de fontes diferentes. Ao soltar, o teclado volta a ser considerado. Perda de foco da janela ou ocultação do documento limpa as teclas e o estado touch.

## Controles virtuais

`MobileControls` exibe, em dispositivos com toque primário:

- Um direcional inferior esquerdo que mantém movimento enquanto pressionado; arrastar ajusta a direção continuamente, com diagonal normalizada pelo Player.
- Um botão circular inferior direito, visualmente destacado e habilitado somente quando o NPCManager informa um alvo próximo.

O componente usa eventos de ponteiro do Phaser, suporta pointer up e pointer up outside, permite múltiplos ponteiros no jogo e libera o direcional em resize. Usa `JerusalemLevel.pinToScreen()` e o zoom atual da câmera, calcula margens conforme a viewport e ajusta escala em telas menores.

## Interação com NPCs

O teclado E e o botão touch chegam ao mesmo `NPCManager.requestInteraction()`, que emite o evento de cena `"npc: interact"` somente quando há NPC atual dentro do raio. O rótulo de disponibilidade também vem do NPCManager; não há cálculo de proximidade duplicado na interface.

**Limitação existente:** atualmente a cena ouve `"npc: interact"` e apenas registra o NPC e seus diálogos no console. Não há sistema de diálogo conectado, portanto não é possível validar início/avanço/fim de diálogos nem bloqueio durante uma conversa. O botão virtual não cria um fluxo separado para diálogos.

## Integração em outra fase

1. Criar um `InputManager` na Scene.
2. Construir o Player e nível atuais, sem duplicar o movimento.
3. Criar `MobileControls(scene, level, inputManager)`.
4. Em cada update, ler `const input = inputManager.getState()` e passar o estado para `player.update(delta, level, input)`.
5. Encaminhar `input.interact` para o sistema de interação existente da fase e atualizar `setInteractionAvailable()` conforme o alvo atual.
6. Destruir gestores/componentes no encerramento da Scene (eles também registram proteção idempotente para shutdown/destroy).

Atualmente a integração do botão de interação implementada é específica ao `NPCManager` da fase 1; fases com outros objetos interativos precisarão encaminhar o mesmo comando ao sistema de interação que já utilizam.

## Layout, toque e acessibilidade

Os controles usam cores e transparência do tema do jogo, áreas circulares amplas e feedback de pressão/disponibilidade. São posicionados por viewport em cada `RESIZE`, sem uma resolução fixa. O tamanho diminui em telas menores e os controles não impedem orientação retrato.

O CSS existente restringe `touch-action: none` ao contêiner/canvas do jogo, que ocupa a tela inteira; não foi aplicado ao documento fora da área do jogo.

## Como testar

- Desktop: abrir a fase 1, testar WASD, setas e E; controles touch não devem ser criados quando o browser reporta ponteiro fino com hover.
- Touch primário: emular dispositivo touch no navegador ou testar em aparelho, abrir fase 1 e testar pressão contínua, arraste, diagonais, soltura, botão de interação perto/longe de NPC e orientação retrato/paisagem.
- Híbrido: testar teclado e touch sem somar direções de fontes distintas.
- Redimensionar, ocultar/mostrar a aba e sair/reentrar na Scene; verificar que movimento pare e não se acumulem listeners.
- `npm run build` executa `tsc` e o bundle Vite. Não há script `test` ou suíte automatizada configurada no pacote.

## Limitações conhecidas

- Só a fase 1 foi ligada aos controles adaptativos; a aplicação às outras fases depende de cada uma usar o contrato de Player e seu sistema de interação.
- Não existe implementação de diálogo ativa na fase 1; o evento é apenas observado por logs.
- Classificação exata de teclado físico e identificação de híbridos não é possível de forma confiável apenas por APIs web, então `hasKeyboard` é uma aproximação.
- Emulador de mouse não prova comportamento real de multi-touch; validação final em dispositivo físico continua recomendada.
