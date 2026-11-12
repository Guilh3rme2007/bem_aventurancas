# Auditoria técnica — Game Bíblico

**Data:** 10/11/2026  
**Escopo:** arquivos presentes no workspace, build/type-check e verificação manual no navegador. Nenhuma regra de negócio, configuração ou dado foi alterado.

## 1. Visão geral

O workspace contém um protótipo frontend de jogo web. A aplicação implementada está em `game/bem_aventurancas`; a pasta `app/` contém apenas diretórios (`config/`, `data/`, `interface/`), sem arquivos de aplicação identificados. Não foi encontrado backend, API, serviço de autenticação ou banco de dados.

O fluxo de progresso é local ao navegador, via `localStorage`. O jogo usa Phaser e apresenta um menu, seleção de fases e uma tela genérica com informações da fase. A estrutura contém nove registros de fases, mas a implementação não oferece nove níveis jogáveis no estado atual.

### Diagrama simplificado

```text
Navegador
  └── Vite (dev/build/preview)
       └── index.html → src/main.ts
            └── Phaser.Game
                 ├── MenuScene
                 ├── PhaseSelectScene
                 ├── ExplorationScene (tela informativa genérica)
                 ├── EndingScene
                 └── SettingsScene
                      ├── data/ (fases e configuração de NPCs)
                      ├── entities/ e systems/
                      ├── public/assets/ (poucos recursos estáticos)
                      └── localStorage (progresso)
```

## 2. Estrutura das aplicações

### Frontend

- **Aplicação encontrada:** `game/bem_aventurancas/`.
- **Entrada HTML/JS:** [index.html](game/bem_aventurancas/index.html) carrega `/src/main.ts`; [main.ts](game/bem_aventurancas/src/main.ts) cria o `Phaser.Game`.
- **Tecnologias instaladas:** Phaser 4.2.1, TypeScript 7.0.2, Vite 8.3.5; Node.js 24.11.0 e npm 11.6.1 no ambiente de auditoria.
- As versões são declaradas no `package.json` da raiz (`^phaser`, `^typescript`, `^vite`) e registradas no `package-lock.json`. O [package.json do jogo](game/bem_aventurancas/package.json) declara somente scripts, sem declarar as dependências. Assim, a instalação isolada dentro da pasta do jogo não é autossuficiente; hoje ela depende das dependências instaladas na raiz.
- Os scripts disponíveis em ambos os `package.json` são `dev`, `build` e `preview`. Não há script de teste ou lint.
- [vite.config.ts](game/bem_aventurancas/vite.config.ts) e [tsconfig.json](game/bem_aventurancas/tsconfig.json) estão vazios (0 bytes); Vite e TypeScript usam seus comportamentos padrão.
- `main.ts` registra `MenuScene`, `PhaseSelectScene`, `ExplorationScene`, `EndingScene` e `SettingsScene`. A cena `HumildesEspiritosScene` não está registrada.

### Backend, dados e serviços

- **Backend:** não encontrado.
- **APIs/endpoints, rotas web e cliente HTTP:** não encontrados. A navegação é feita pelo gerenciador de cenas do Phaser.
- **Banco de dados:** não encontrado.
- **Autenticação/sessão:** não encontrada.
- **Persistência:** `localStorage` em [ProgressManager.ts](game/bem_aventurancas/src/systems/ProgressManager.ts).
- **Dependências externas em runtime:** não foram encontradas chamadas a URLs externas, `fetch`, Axios, WebSocket ou APIs remotas. Imagens e fontes são arquivos locais; as dependências npm são obtidas do registry durante a instalação, não em runtime.

## 3. Integração frontend/backend

Não há integração frontend/backend para auditar: o workspace não contém backend nem endpoints configurados. Não se aplicam testes de CORS, autenticação, tokens, compatibilidade de DTOs, portas ou disponibilidade de serviços. O frontend funciona sem serviço remoto, sujeito aos problemas funcionais e de build descritos abaixo.

## 4. Análise do jogo

### Cenas e navegação

- As chaves das cinco cenas registradas em `main.ts` correspondem às usadas em `scene.start()`.
- `EndingScene` está registrada, mas nenhum fluxo observado chama `scene.start("EndingScene")`. A tela de exploração oferece apenas retorno à seleção.
- `HumildesEspiritosScene` existe, mas não está registrada nem é aberta pela seleção; portanto, seus NPCs não fazem parte do fluxo executável atual.
- `ExplorationScene` apresenta título, personagem, referência e descrição dos dados de cada fase. Não inicia uma fase específica, missão, diálogo ou condição de conclusão.
- Os arquivos de áreas, diálogos, entidades e missões de `level/humildes_espirito/` estão vazios (0 bytes), incluindo `MissionManager.ts` e `humilityMissions.ts`.

### Fases e progresso

- [phases.ts](game/bem_aventurancas/src/data/phases.ts) tem IDs de 1 a 9; a tela de seleção percorre esses registros e passa o ID selecionado à cena genérica.
- `ProgressManager.startPhase()` persiste `lastPhase`; `completePhase()` desbloqueia a próxima fase. Como não há transição alcançável para `EndingScene` nem chamada de conclusão no fluxo normal, a conclusão/desbloqueio não ocorre pelo jogo observado. O progresso fica, na prática, restrito à primeira fase, salvo alteração manual do armazenamento local.
- A validação do progresso salvo contém uma condição incorreta: `Number.isInteger(progress.unlockedPhases)` é usado positivamente em um `||`. Valores inteiros válidos entram sempre no ramo de normalização; valores não inteiros em faixa, por outro lado, podem escapar da validação e ser aceitos. Também não são validados os tipos/faixas de todos os demais campos.

### Personagens, NPCs e interação

- Há uma implementação reutilizável de NPC em `src/entities/NPC.ts`, mas também existe `src/level/humildes_espirito/entities/NPC.ts` vazio. As classes `Fariseu.ts` e `Publicano.ts` também estão vazias.
- A configuração em `data/npcs/humildesEspirito.ts` referencia as texturas `publicano` e `fariseu`. Nenhum carregamento dessas texturas foi encontrado; a pasta pública contém apenas imagem de fundo, ícone e fontes. Se a cena de NPC for conectada, os sprites não terão as texturas declaradas disponíveis.
- `NPCManager` recebe `interactionKey`, mas ignora o argumento e registra novamente a tecla `E`.
- O gerenciador emite `npc: interact`, enquanto `HumildesEspiritoScene` ouve `npc-interaction`; os nomes não coincidem. Mesmo se a cena for ativada, o listener não recebe o evento de interação como está.
- Não há animações registradas nem imagens de personagens encontradas. O código de `NPC` apenas executa uma animação caso já exista.

### Diálogos e áudio

- Há uma linha de diálogo em cada configuração de NPC, mas não há sistema de avanço/encerramento de diálogo. A cena de NPC apenas tenta imprimir o conteúdo no console; além disso, ela não está no fluxo registrado.
- Não foram encontrados arquivos de áudio, carregamento de áudio, narração ou controle de reprodução.
- Em `SettingsScene`, o controle “Vozes” altera apenas o texto/estado local. O controle “Música” chama mute global somente dentro de uma iteração por sons que já estejam tocando; sem áudio carregado/tocando, não tem efeito. As preferências também não são persistidas.

### Interface, responsividade e assets

- O jogo usa `Phaser.Scale.RESIZE`, e o menu/exploração implementam reposicionamento; `PhaseSelectScene`, `SettingsScene` e `EndingScene` posicionam seus elementos apenas em `create()`, sem tratar redimensionamento.
- Teste manual em navegador a 320×640: o menu ajustou-se, mas a seleção de fases ficou cortada horizontal e verticalmente; parte das cartas e a fase 9 não cabem na tela.
- Foi reproduzida uma exceção ao iniciar a jornada, voltar à seleção e redimensionar: `TypeError: Cannot read properties of null (reading 'setSize')` em `ExplorationScene.layout()`. A cena registra `scale.on("resize", ...)`, mas não remove esse listener em `shutdown`; após a destruição dos objetos, a callback continua sendo chamada.
- O build Vite confirmou que os caminhos CSS de `AppleGaramondBold.ttf` e `AppleGaramondItalic.ttf` não são resolvidos. Os arquivos existentes usam hífen (`AppleGaramond-Bold.ttf` e `AppleGaramond-Italic.ttf`); há aviso explícito no build.
- O canvas e a imagem de fundo foram carregados no navegador a 1280×720. Isso não valida a disposição das telas menores nem o conteúdo das cenas não alcançáveis.

## 5. Problemas encontrados

| # | Arquivo/localização | Problema e causa provável | Impacto | Gravidade | Estado |
|---|---|---|---|---|---|
| 1 | [package.json da raiz](package.json), script `build`; [tsconfig.json](game/bem_aventurancas/tsconfig.json) | O build configurado para executar `tsc && vite build` falha no TypeScript 7.0.2 ao verificar declarações de Phaser 4.2.1 (`TS2526` e `TS2416` em `node_modules/phaser/types/phaser.d.ts`). O `tsconfig` do jogo está vazio, sem configurações explícitas de compilação. | O comando de build oficial não completa e não chega ao Vite; não há build integrado confiável. | **Alta** | Confirmado por execução |
| 2 | [ExplorationScenes.ts](game/bem_aventurancas/src/scenes/ExplorationScenes.ts:121) | Listener de `resize` não é removido no encerramento da cena. A callback tenta alterar um painel já destruído. | Exceção de runtime após retornar à seleção/menu e redimensionar; pode degradar o jogo em mudança de orientação ou viewport. | **Alta** | Reproduzido no navegador |
| 3 | [ExplorationScenes.ts](game/bem_aventurancas/src/scenes/ExplorationScenes.ts:42), [EndingScene.ts](game/bem_aventurancas/src/scenes/EndingScene.ts:29) e [main.ts](game/bem_aventurancas/src/main.ts:24) | A fase é apenas informativa, a cena final não é aberta pelo fluxo e a conclusão/desbloqueio só ocorre em `EndingScene`. | Não é possível concluir fases nem avançar normalmente pelas nove fases. | **Alta** | Confirmado por inspeção do fluxo |
| 4 | [PhaseSelectScene.ts](game/bem_aventurancas/src/scenes/PhaseSelectScene.ts:29) | Layout usa dimensões fixas e não é recalculado no redimensionamento; em 320×640, as cartas excedem a viewport. | Conteúdo fica cortado em celular e mudança de orientação não reorganiza a seleção. | **Alta** | Reproduzido visualmente em 320×640 |
| 5 | [style.css](game/bem_aventurancas/src/Styles/style.css:48) | Nomes dos arquivos bold/italic divergem dos arquivos presentes em `public/assets/fonts/apple_garamond/`; o build reporta que não os resolve. | As variações podem não carregar e o navegador usa fallback para esses estilos. | **Média** | Confirmado pelo build |
| 6 | [ProgressManager.ts](game/bem_aventurancas/src/systems/ProgressManager.ts:28) | Condição `Number.isInteger(...) || ...` não rejeita corretamente `unlockedPhases` inválido; validação incompleta do JSON do `localStorage`. | Dados persistidos malformados podem produzir estado incoerente de desbloqueio ou continuidade. | **Média** | Confirmado por inspeção |
| 7 | [NPCManager.ts](game/bem_aventurancas/src/systems/NPCManager.ts:21) e [HumildesEspiritoScene.ts](game/bem_aventurancas/src/level/humildes_espirito/HumildesEspiritoScene.ts:48) | O evento emitido (`npc: interact`) difere do evento ouvido (`npc-interaction`); a tecla recebida também é ignorada. | Interação NPC não aciona o listener esperado se a cena vier a ser utilizada. | **Média** | Confirmado por inspeção; cena não está no fluxo |
| 8 | [humildesEspirito.ts](game/bem_aventurancas/src/data/npcs/humildesEspirito.ts:7), [NPC.ts](game/bem_aventurancas/src/entities/NPC.ts:36) | Texturas `publicano`/`fariseu` são referenciadas, mas não são carregadas e não estão nos assets presentes. | Os sprites de NPC não podem ser renderizados corretamente ao ativar a cena. | **Média** | Confirmado no código e inventário de assets |
| 9 | [SettingsScene.ts](game/bem_aventurancas/src/scenes/SettingsScene.ts:46) | Configurações de música/voz são somente rótulos/estado em memória; não há áudio carregado, persistência ou controle de voz funcional. | A interface dá a entender que opções estão ativas quando não controlam recursos do jogo. | **Baixa** | Confirmado por inspeção |
| 10 | [package.json do jogo](game/bem_aventurancas/package.json) | O manifest da aplicação não declara Phaser, TypeScript ou Vite, embora os scripts os utilizem; depende do manifest e `node_modules` da raiz. | Instalação/execução isolada do pacote do jogo não é reproduzível. | **Média** | Confirmado por inspeção |
| 11 | [app/](app/) e `game/bem_aventurancas/src/level/humildes_espirito/` | Diretórios de backend/nível sugeridos pela estrutura estão vazios; há módulos de área, missão, diálogo e personagem com 0 bytes. | Estrutura sugere funcionalidades planejadas, mas não implementadas; imports dessas áreas não foram encontrados. | **Baixa** | Confirmado por inventário |

## 6. Resultados dos testes

| Verificação | Comando/ação | Resultado |
|---|---|---|
| Leitura de scripts | Inspeção dos `package.json` antes de executar comandos | Não há scripts `test`, lint ou integração. |
| Build a partir da raiz | `npm run build` | **Falhou** antes do Vite: `tsc` exibiu ajuda por não haver projeto TypeScript/configuração na raiz. |
| Build definido pelo jogo | `npm --prefix game/bem_aventurancas run build` | **Falhou** no `tsc`, com erros em declarações instaladas do Phaser (TS2526 e TS2416). |
| Checagem suplementar de tipos | `node_modules/.bin/tsc --noEmit --skipLibCheck -p game/bem_aventurancas` | **Passou**, ignorando erros de declarações de bibliotecas. Não substitui o build configurado nem resolve a incompatibilidade Phaser/TypeScript. |
| Bundle Vite isolado | `node_modules/.bin/vite build game/bem_aventurancas --outDir /tmp/game-biblico-audit-dist` | **Passou**, mas alertou sobre os dois caminhos de fonte e chunk JavaScript de aproximadamente 1,38 MB (acima do aviso padrão de 500 kB). A saída temporária foi removida após a verificação. |
| Servidor e navegador | Vite local + `curl -I http://127.0.0.1:4173/` e navegador | HTTP 200; menu e imagem de fundo carregaram em 1280×720. |
| Fluxo de resize | Iniciar jornada → voltar à seleção → alterar viewport | **Falhou** com exceção em `ExplorationScene.layout()`. |
| Layout mobile | Navegação manual em 320×640 | Menu ajustado; grade de fases cortada. |
| Testes automatizados | Scripts/manifests e inventário do projeto | **Não disponíveis**; não há framework nem suíte de testes encontrada. |
| Integração/backend | Busca por endpoints e serviços | Não aplicável: nenhum backend/API foi encontrado. |
| Orientação física, teclado/toque e dispositivos reais | — | **Não validado** em hardware; apenas viewport de navegador. |

## 7. Problemas de arquitetura

- `ExplorationScene` é uma tela informativa única para todos os IDs, não uma arquitetura de nove fases jogáveis ainda.
- Há dados e classes planejados para a primeira fase, mas as áreas/missões/diálogos estão vazios e a cena correspondente não está conectada ao registro principal.
- Há duplicidade nominal de `NPC` entre a entidade funcional e um arquivo vazio na pasta da fase; ainda não há uso suficiente para justificar abstração adicional.
- A persistência é global e síncrona via `localStorage`; não há camada de persistência remota.
- Responsabilidades gerais estão separadas em `scenes`, `systems`, `entities`, `data` e `Styles`, mas a ligação entre esses módulos ainda é parcial.
- O projeto tem manifests na raiz e no jogo com responsabilidades ambíguas, além de configurações TypeScript/Vite vazias.

## 8. Segurança e configuração

- Não foram encontrados arquivos `.env`, chamadas de API, tokens ou credenciais na busca dos arquivos de aplicação/configuração analisados. Nenhum valor sensível é reproduzido neste relatório.
- `.gitignore` ignora o nome exato `.env`, mas não declara padrões como `.env.*`. Não há arquivos de ambiente hoje; se futuramente forem criados arquivos locais como `.env.local`, eles podem não estar ignorados.
- Não foi identificado armazenamento de credenciais ou autenticação; o `localStorage` contém apenas progresso local, que não é confiável como controle de autorização (não há backend nem conteúdo protegido).
- Não foi executada auditoria de vulnerabilidades de dependências (por exemplo, `npm audit`), pois isso requer consulta a advisories externos e não havia pedido de instalação/alteração de dependências. Nenhuma conclusão sobre CVEs foi feita.
- `index.html` desativa zoom com `user-scalable=no`, o que reduz acessibilidade em dispositivos móveis.

## 9. Plano de correção

1. **Desbloquear build reproduzível:** alinhar versões suportadas de Phaser/TypeScript e declarar dependências no pacote que possui os scripts; adicionar configuração explícita de TypeScript. Reexecutar o build sem ignorar declarações de biblioteca.
2. **Corrigir ciclo de vida de cenas:** remover o listener de resize no shutdown e validar entrada/saída da exploração com redimensionamento.
3. **Definir conclusão real de fase:** conectar exploração a uma condição de conclusão e a `EndingScene`; só então validar desbloqueio sequencial das nove fases.
4. **Corrigir layout adaptativo:** recalcular grade e dimensões nas cenas de seleção, configurações e encerramento; testar larguras/orientações e áreas seguras de dispositivos.
5. **Completar integração de NPCs antes de ativar a cena:** disponibilizar/carregar texturas e alinhar nome do evento, tecla e tratamento de diálogo.
6. **Validar e proteger estado local:** corrigir o predicado de validação, validar o formato completo e cobrir dados ausentes/corrompidos em testes.
7. **Finalizar ou sinalizar controles de áudio:** conectar áudio e persistência ou apresentar as opções como indisponíveis até sua implementação.
8. **Adicionar testes automatizados:** começar por progresso (desbloqueio/conclusão), navegação entre cenas, eventos de NPC e smoke tests responsivos; adicionar integração real somente se backend for criado.
9. **Endurecer configuração:** ignorar padrões de arquivos de ambiente locais, rever zoom/acessibilidade e monitorar o tamanho do bundle.

## 10. Conclusão

- **Apto para continuar o desenvolvimento:** sim, como protótipo frontend; priorizar correção do build e do erro de resize.
- **Apto para testes integrados frontend/backend:** não aplicável no momento; não há backend.
- **Apto para demonstração:** parcialmente. Menu e navegação informativa funcionam, mas a seleção corta em viewport mobile, há erro após resize e não é possível concluir as fases. Para demonstração em desktop, evitar redimensionar após sair da exploração.
- **Necessita correções antes de avançar:** sim, se o próximo marco exigir build de produção confiável, nove fases jogáveis, progresso validado ou suporte mobile. Nenhuma correção foi aplicada nesta auditoria.
