# Plano de evolução — As Bem-aventuranças

**Auditoria do workspace:** 14/11/2026  
**Escopo:** aplicação Phaser em `game/bem_aventurancas`, configurações, cenas, dados, sistemas, assets, documentação e arquivos de teste presentes no workspace.  
**Tipo de entrega inicial:** diagnóstico e planejamento. Na auditoria inicial, nenhuma implementação de jogo, exclusão ou renomeação foi feita. A atualização da Tarefa 01 abaixo registra uma reorganização posterior do código-fonte.

**Atualização — Tarefa 01 (14/11/2026):** os dez módulos procedurais de Jerusalém foram migrados para `game/bem_aventurancas/src/worlds/jerusalem/`; a cena e os imports internos agora apontam para essa pasta. A antiga cópia de código e seu README foram removidos de `public/assets`, e a documentação técnica foi atualizada em `docs/AMBIENTE_JERUSALEM.md`. O build final e a inspeção do `dist` foram repetidos após a migração.

## Como interpretar os achados

- **[Confirmado]** observado diretamente nos arquivos ou reproduzido por comando.
- **[Observação]** comportamento ou lacuna evidente na estrutura/código, mas não testado no navegador.
- **[Hipótese]** risco que depende de execução, decisão narrativa ou validação externa.

Este relatório descreve o estado do workspace analisado, não substitui decisões de narrativa/design e não trata arquivos não referenciados como automaticamente descartáveis.

## 1. Diagnóstico da estrutura atual

### Organização encontrada

O jogo está concentrado em `game/bem_aventurancas/`. O repositório não contém uma aplicação backend reconhecível: `app/config`, `app/data` e `app/interface` estão sem código de aplicação. A persistência de jogo observada é local, via `localStorage`.

| Área | Estado atual e conexão |
|---|---|
| Inicialização | `src/main.ts` carrega o CSS, aguarda fontes, instancia `Phaser.Game` com `GAME_CONFIG` e cria `GameRouter`. |
| Configuração do jogo | `src/config/GameConfig.ts` seleciona Phaser `AUTO`, dimensões iniciais de 1280×720, escala `RESIZE` e registra as cenas. |
| Navegação | `src/router/GameRouter.ts` traduz o hash para cenas, verifica se a fase existe/está disponível/desbloqueada e delega navegação dos controles às rotas de `src/router/routes.ts`. |
| Dados de fase | `src/level/PhaseRegistry.ts` declara nove registros e metadados. `src/data/phases.ts` apenas reexporta o registro, sem ser a fonte de dados. |
| Menus e telas | Há cenas de menu, seleção, exploração informativa, encerramento e configurações em `src/scenes/`. |
| Fase 1 | `src/level/humildes_espirito/HumildesEspiritoScene.ts` conecta jogador provisório, input, `JerusalemLevel`, NPCs, UI e `ProgressManager`. |
| Ambiente 2.5D | O mapa procedural está em `src/worlds/jerusalem/*.ts`; a cena importa `JerusalemLevel` dessa pasta. O nível compõe mapa, geração/streaming de segmentos, fundo, câmera, colisão e profundidade. |
| NPCs | `src/entities/NPC.ts` implementa entidade reutilizável; `src/systems/NPCManager.ts` seleciona NPC próximo, exibe indicação de interação e emite evento. Dados e posições estão em `src/data/npcs/`. |
| Progresso | `src/systems/ProgressManager.ts` lê e grava a chave `bem_aventurancas_progress`; `GameRouter` usa `isUnlocked`, as cenas iniciam fase e `EndingScene` chama conclusão. |
| Visual e assets estáticos | `src/Styles/` fornece tema/utilitários e o CSS. `public/assets/` contém imagem, ícone, fontes e os módulos do mapa. |
| Áudio | Não foram encontrados arquivos de áudio nem carregamento/reprodução de música, efeitos ou voz. A tela de configurações apresenta controles, mas não existe pipeline de áudio funcional demonstrado. |
| Testes | `tests/` contém dois documentos de auditoria, não uma suíte automatizada. Os manifests não declaram scripts de teste ou lint. |

### Configuração e dependências

- **[Confirmado]** O `package.json` da raiz declara `phaser ^4.2.1`, `typescript ^7.0.2`, `vite ^8.3.5` e `gh-pages ^6.2.0`; o lockfile está na raiz.
- **[Confirmado]** O `package.json` interno do jogo declara scripts, mas não dependências. Os scripts na raiz executam Vite/TypeScript apontando para a aplicação.
- **[Confirmado]** `tsconfig.json` usa modo estrito, ES2022, resolução Bundler, `noEmit` e inclui `src/**/*.ts`.
- **[Confirmado]** `vite.config.ts` define `base: '/bem_aventurancas/'` e `assetsInlineLimit: 0`.
- **[Observação]** O build imprime aviso de configuração Vite relacionada ao carregador nativo/CommonJS e aviso de chunk JavaScript acima de 500 kB. São avisos, não falhas de compilação.
- **[Confirmado]** O comando `npm run build` executado na raiz concluiu a checagem TypeScript e o build Vite. O bundle JavaScript reportado tem aproximadamente 1,43 MB sem gzip (378,71 kB gzip).
- **[Confirmado]** A execução desse build não verificou renderização, controles, áudio ou comportamento de navegação no navegador.
- **[Confirmado]** `Phaser.Scale.RESIZE` está habilitado globalmente. Menu, exploração, fundo e nível Jerusalém têm tratamento de resize; seleção, encerramento e configurações não recalculam layout no resize.
- **[Observação]** `index.html` desabilita o zoom do navegador com `user-scalable=no`; revisar como questão de acessibilidade móvel.

### Fluxo de inicialização e navegação

`main.ts` cria o jogo e espera o evento de prontidão para iniciar o `GameRouter`. O `GameConfig` registra `MenuScene`, `PhaseSelectScene`, `ExplorationScene`, `EndingScene`, `SettingsScene` e `HumildesEspiritosScene`. A chave interna da última é `HumildesEspiritoScene`, que corresponde à referência da fase no registro.

O roteador lê `#/menu`, `#/fases`, `#/configuracoes`, `#/final` e rotas de fase definidas no registro. A fase só é iniciada se estiver marcada implementada/disponível, tiver chave de cena e passar por `ProgressManager.isUnlocked()`. A tela de seleção é gerada percorrendo os dados do registro.

- **[Confirmado]** O registro marca somente “Pobres de espírito” como implementada e disponível; fases 2–9 têm `sceneKey: null`, `implemented: false` e `available: false`.
- **[Confirmado]** A rota da fase 1 abre a cena 2.5D, não a `ExplorationScene` informativa. A `ExplorationScene` continua registrada, mas não está ligada a uma fase implementada no registro atual.
- **[Confirmado]** A tela `EndingScene` está registrada e acessível por rota, mas a cena da fase 1 não chama a rota final nem implementa conclusão de objetivo.
- **[Confirmado]** `EndingScene.create()` conclui a fase recebida. O roteador aceita `phaseId` inteiro entre 1 e 9 no hash final, sem comprovar que o objetivo da fase foi cumprido. `completePhase()` limita a conclusão à fase atualmente desbloqueada, mas a navegação direta pode avançar o desbloqueio sequencial sem jogar a fase. O bloqueio `available` ainda impede iniciar as fases desativadas.

### Player, movimentação, câmera e colisões

- **[Confirmado]** A fase 1 cria o jogador como `Phaser.GameObjects.Rectangle`, sem entidade própria, animações ou ciclo de vida compartilhado.
- **[Confirmado]** A cena lê setas e WASD diretamente. Movimento horizontal e movimento em profundidade são calculados no `update()` e delegados a `JerusalemLevel.moveBy()`.
- **[Confirmado]** `JerusalemLevel` posiciona o jogador no spawn, segue com a câmera, ajusta zoom/limites, ordena por Y dos pés, limita o jogador à faixa e oferece colisão geométrica manual com sólidos.
- **[Confirmado]** O nível pode criar um `StaticGroup` de Arcade Physics se houver física configurada; `GameConfig` não configura Arcade Physics. A cena atual usa a verificação geométrica de `moveBy()`.
- **[Observação]** Câmera, colisões, profundidade e movimento estão acoplados à fachada de Jerusalém. Ainda não há demonstração de que o mesmo contrato sirva para mapas com geometria ou câmera diferente.

### NPCs, interação, diálogo e missões

- **[Confirmado]** `NPC` é um `Container` com sprite, nome, raio e vetor de linhas de diálogo. A animação é opcional e só toca se a chave existir.
- **[Confirmado]** `NPCManager` escolhe o NPC mais próximo dentro do raio, mostra “Pressione E para interagir” e emite `npc: interact`. A fase escuta o mesmo nome de evento e imprime nome/falas no console.
- **[Confirmado]** O método `setUiDepth()` chamado pela fase existe no `NPCManager`; a documentação de auditoria anterior que dizia que ele faltava não representa o estado atual.
- **[Confirmado]** `JerusalemLevel` também calcula proximidade de NPC e emite `jerusalem:npc-enter`/`jerusalem:npc-leave`; a cena não assina esses eventos. Há duas rotinas de detecção próximas, com finalidades diferentes, sem integração explícita.
- **[Confirmado]** A configuração de NPCs menciona texturas `publicano` e `fariseu`, mas não há arquivos correspondentes na lista de assets nem chamada observada de carregamento dessas texturas. **[Hipótese]** A aparência resultante ao ativar/renderizar esses NPCs deve ser verificada em runtime.
- **[Confirmado]** Os módulos `MissionManager.ts`, `humilityMissions.ts`, os quatro módulos de diálogo, `entities/NPC.ts`, `Fariseu.ts` e `Publicano.ts` estão vazios (0 bytes).
- **[Confirmado]** Os diálogos efetivamente fornecidos estão embutidos em `data/npcs/humildesEspirito.ts`; não há UI que avance, conclua ou apresente essas falas como diálogo.
- **[Confirmado]** Não há evento de conclusão ou missão conectado ao sinal `jerusalem:reached-temple`.

### Progressão e conteúdo das fases

O progresso mantém a forma numérica legada: `unlockedPhases`, `completedPhases`, `lastPhase` e `hasStarted`. As chaves correspondem à ordem 1–9 do registro e a persistência é no `localStorage`.

- **[Confirmado]** `startPhase()` é chamado pela cena de Jerusalém. `completePhase()` só é chamado na cena de encerramento.
- **[Observação]** A leitura de JSON inválido retorna progresso inicial silenciosamente; campos são validados parcialmente e `completedPhases` não é deduplicado.
- **[Observação]** A fase é identificada simultaneamente por `id` textual, `order` numérica e rota; a ordem é compatibilidade da persistência atual e não deve ser alterada sem migração.
- **[Confirmado]** O registro atual não define cenário, mapa, posição de spawn, elenco de personagens, diálogos, missões, objetos, eventos, objetivos, condições de conclusão ou transição como campos da configuração.
- **[Hipótese/validação narrativa necessária]** Personagem, passagem bíblica, local e objetivo de cada fase devem ser confirmados com o responsável pelo conteúdo antes de implementar cenas. Os dados existentes são metadados curtos, não um roteiro suficiente para produção.

## 2. Funcionalidades implementadas, parciais e ausentes

| Status | Funcionalidade | Evidência / limite |
|---|---|---|
| Implementada | Bootstrap Phaser/Vite, tema e cenas do menu | Build passa; há cenas registradas para navegação e UI. |
| Implementada | Navegação por hash e guarda de disponibilidade/desbloqueio | `GameRouter` e `PhaseRegistry`; não equivale a teste de navegador. |
| Implementada | Metadados das nove fases | Existem nove registros, mas só uma fase é disponibilizada e os registros não definem gameplay completo. |
| Implementada | Persistência local básica | `ProgressManager` lê/grava progresso em `localStorage`. |
| Implementada | Ambiente procedimental de Jerusalém | Geração de fundo, mapa, objetos, segmentos, streaming, câmera e colisão manual aparecem integrados à cena 1. |
| Implementada | Movimento provisório da fase 1 | Retângulo movido por WASD/setas, sem personagem animado. |
| Implementada | NPC e interação por proximidade + E | A mensagem e evento estão conectados; o resultado é apenas log no console. |
| Parcial | Fase 1 | Ambiente e deslocamento existem, mas sem fluxo de diálogo, missão, objetivo completo ou encerramento normal. |
| Parcial | Navegação e progressão | Bloqueia fases indisponíveis e persiste início; fluxo de encerramento não é condicionado por objetivo. |
| Parcial | Responsividade | Resize no menu e no mundo; telas de seleção, fim e configurações têm layout calculado só no `create()`. |
| Parcial | Configurações de áudio | Os botões mudam texto/estado local; não há assets/reprodução. O mute é aplicado dentro de uma iteração sobre sons tocando e pode não ter efeito sem som ativo; o mute global pode incluir qualquer categoria. |
| Parcial | Assets de personagens | Configuração aponta para texturas ausentes/não carregadas no inventário atual. |
| Ausente | Player/Character compartilhado e animações | Nenhuma entidade jogável comum ou conjunto de animações identificado. |
| Ausente | UI de diálogo e fluxo de escolhas/encerramento | As falas são apenas dados e log. |
| Ausente | Missões/objetivos/condições de conclusão | Arquivos vazios e nenhum fluxo funcional conectado. |
| Ausente | Áudio real e persistência de preferências | Sem arquivos nem carregamento. |
| Ausente | Fases 2–9 jogáveis | Existem cartões/metadados bloqueados, sem cenas/configuração de gameplay. |
| Ausente | Suíte automatizada | Não há runner, testes de código ou scripts `test`/`lint`. |

## 3. Problemas de integração e duplicação

### Problemas confirmados ou lacunas concretas

1. **Empacotamento do código de ambiente — corrigido na Tarefa 01:** antes da migração, módulos `.ts` e o README de Jerusalém estavam sob `public/assets` e eram copiados para `dist`. Os dez módulos agora estão em `src/worlds/jerusalem/`, o README está em `docs/AMBIENTE_JERUSALEM.md` e uma nova inspeção do `dist` não encontrou código/documentação publicados nessa pasta.
2. **Conclusão sem objetivo — confirmado:** a cena final chama `completePhase()` ao criar e a rota admite `phaseId` na URL. O sinal de chegada ao templo não conclui missão nem é consumido pela cena.
3. **Interação sem diálogo — confirmado:** NPCManager, evento e listener estão conectados, mas o listener só escreve no console; não há manager/UI de diálogo.
4. **Responsabilidades de proximidade sobrepostas — confirmado:** NPCManager percorre seus NPCs para interação e Jerusalém percorre pontos de spawn para eventos de entrada/saída. Clarificar qual API é a fonte de cada tipo de interação antes de acrescentar objetos.
5. **Assets referenciados ausentes — confirmado por inventário:** chaves `publicano` e `fariseu` não correspondem a arquivos nem loaders encontrados.
6. **Código do ambiente no caminho de assets públicos — confirmado:** além de classificação equivocada, isso aumenta o conteúdo publicado com fontes TypeScript/README desnecessários.
7. **Responsividade incompleta — observação direta:** as cenas de seleção, encerramento e configurações usam dimensões em `create()` sem listener de resize.
8. **Validação de progresso incompleta — observação direta:** estrutura lida do armazenamento pode conter valores repetidos ou combinações inconsistentes; não há testes cobrindo dados corrompidos.
9. **Auditorias anteriores desatualizadas — confirmado:** os relatórios `tests/auditoria/AUDITORIA_TECNICA*.md` descrevem um estado anterior. A falha de build e ausência da cena atual relatadas neles não se repetem: o build atual passa e a fase 1 está registrada. Usar os documentos como histórico, não como retrato atual.

### Repetição / sobreposição que pode ser racionalizada

- **[Observação]** `NPC` funcional em `src/entities/NPC.ts` e `src/level/humildes_espirito/entities/NPC.ts` vazio têm nomes concorrentes. As classes vazias de publicano e fariseu também se sobrepõem conceitualmente a uma entidade NPC configurável.
- **[Observação]** Menu e exploração usam `createButton` de `GameStyles`; as telas de fase, final e configurações implementam elementos clicáveis próprios. Não são duplicatas idênticas, mas padrões de UI divergem e podem ser unificados depois de definir estados/estilo acessíveis.
- **[Observação]** Lógica de reposicionamento/resize aparece por cena, enquanto `createBackground()` e `JerusalemLevel` mantêm listeners próprios e os removem no shutdown. Padronizar lifecycle para evitar listener pendente.
- **[Importante]** `src/data/phases.ts` é uma reexportação de compatibilidade e não deve ser classificada como duplicação removível sem revisar consumidores externos/integradores.
- **[Importante]** Não há base para criar de imediato um `CharacterManager`, `CameraManager` ou `CollisionManager` global: o cenário e as outras fases ainda não fornecem casos comparáveis para definir contratos.

## 4. Arquivos e assets: classificação para limpeza segura

Nenhum arquivo foi excluído. “Sem utilização confirmada” significa que não foi encontrada referência estática nas buscas/imports executados; não prova ausência de uso por tooling, URL externa ou consumidores não incluídos no workspace.

| Classificação | Arquivos / grupo | Decisão recomendada |
|---|---|---|
| Necessários | `src/main.ts`, `config/GameConfig.ts`, cenas efetivamente registradas, `router/`, `level/PhaseRegistry.ts`, `systems/ProgressManager.ts`, `Styles/`, `index.html`, configs Vite/TS e manifests | Manter; alterar em etapas com testes de navegação/build. |
| Necessários, mas com problemas / dívida | `src/level/humildes_espirito/HumildesEspiritoScene.ts`; `src/systems/NPCManager.ts`; `src/entities/NPC.ts`; `src/systems/ProgressManager.ts`; `src/scenes/PhaseSelectScene.ts`, `EndingScene.ts`, `SettingsScene.ts` | Manter; incompletude e integrações descritas acima. |
| Necessários | `src/worlds/jerusalem/{HandDrawn,JerusalemAssets,JerusalemBackdrop,JerusalemBackgroundConfig,JerusalemEnvironment,JerusalemGround,JerusalemLevel,JerusalemMap,JerusalemMapGenerator,JerusalemPath}.ts` | Código-fonte do ambiente após a Tarefa 01; manter sob `src/`. |
| Documentação técnica atual | `docs/AMBIENTE_JERUSALEM.md` | Referência atual dos módulos, integração, assets estáticos e validação. |
| Vazio / candidato à limpeza após confirmação | `src/level/humildes_espirito/missions/{MissionManager,humilityMissions}.ts`, `dialog/{introduction,finalReflection,publicanDialogue,phariseeDialogue}.ts`, `entities/{NPC,Fariseu,Publicano}.ts` | Todos estão com 0 bytes e sem import estático encontrado. São candidatos à reorganização ou remoção futura, não apagar até validar branch/planejamento e consumidores dinâmicos. `Publicano.ts` foi indicado no contexto da auditoria e também está vazio. |
| Já ausentes na cópia de trabalho; não tocar nesta tarefa | `src/level/humildes_espirito/areas/{JerusalemStreet,Marketplace,ReflectionArea,TempleCourtyard,TemplePath}.ts` | O `git status` já os mostra como deletados; no HEAD inspecionado a diferença é de zero linhas (arquivos vazios). A origem dessas exclusões não foi confirmada. Não restaurar nem reclassificar como alteração desta auditoria. |
| Reexportação de compatibilidade | `src/data/phases.ts` | Baixo uso interno aparente, mas explicitamente documentado como alias de `PhaseRegistry`; manter até confirmar que nenhum consumidor externo depende dele. |
| Asset referenciado | `public/assets/backgrounds/monte-das-oliveiras.webp`, `public/assets/UI/icons/biblia.png`, `Livingst.ttf`, `AppleGaramond.ttf`, `AppleGaramond-Bold.ttf`, `AppleGaramond-Italic.ttf`, `Fragmentcore.otf` | Há referência em cena, HTML, CSS ou carregamento de fontes; manter. |
| Assets sem referência runtime confirmada | `AppleGaramond-BoldItalic.ttf`, `AppleGaramond-Light.ttf`, `AppleGaramond-LightItalic.ttf`, `fonts/livingstone/LIVINGST.TXT` | Não apagar nesta etapa. Confirmar intenção de design/licença/documentação e usos indiretos. |
| Asset ausente esperado pela configuração | Texturas `publicano` e `fariseu`; arquivos de áudio | Precisam ser providos/carregados, substituídos por placeholder graybox explicitamente, ou removidos da configuração quando as entidades forem implementadas. |
| Fora de escopo de limpeza | `node_modules/`, caches e `dist/` | Dependências instaladas, cache e saída gerada; não são fonte de verdade. A auditoria buildou `dist`, ignorado pelo Git, e observou as cópias estáticas do cenário. |
| Documentação de auditoria histórica | `tests/auditoria/AUDITORIA_TECNICA.md`, `AUDITORIA_TECNICA02.md` | Não são testes. Manter como histórico ou mover/classificar em futura organização documental após comparar e atualizar achados. |

**Estado do worktree:** além do documento desta entrega, a auditoria encontrou cinco exclusões pré-existentes sob `areas/`; nenhum outro arquivo-fonte foi editado por esta tarefa.

## 5. Reaproveitamento de Jerusalém e ambientes

### Componentes existentes do nível

O mapa atual já tem módulos relativamente distintos:

- **Percurso e áreas:** `JerusalemPath.ts` representa segmentos `street`, `market`, `temple-approach` e `temple-court`, faixas caminháveis e escadarias.
- **Planta e colocação:** `JerusalemMap.ts` contém planos, objetos colocados, sólidos e validação de posições de NPC.
- **Geração procedural:** `JerusalemMapGenerator.ts` semeia e planeja colocações; `SegmentStreamer` instancia/descarrega segmentos.
- **Vocabulário de objetos:** `JerusalemEnvironment.ts` gera casas, muros, barracas, vasos, ânforas, árvores, colunas, portão, tecidos, bancos e demais props.
- **Texturas e chão:** `JerusalemAssets.ts`, `HandDrawn.ts` e `JerusalemGround.ts` geram texturas por código e chão em `RenderTexture`.
- **Planos de fundo:** `JerusalemBackdrop.ts` desenha céu, nuvens, colinas, cidade distante, templo ao horizonte, textura de papel, vinheta e poeira.
- **Integração:** `JerusalemLevel.ts` coordena câmera, resize, profundidade, streaming, colisões e sinais.
- **Dados de NPC:** `src/data/npcs/npcSpawnPoints.ts` fornece coordenadas vinculadas a segmento e opcionalmente a `npcId`.

Casas, paredes de pedra, ruas, escadarias, pátios abertos, objetos de mercado, bancos, camadas de profundidade e colisões são bons candidatos a **módulos genéricos ou presets**, desde que sejam extraídos sem presumir que todo mapa é Jerusalém. Portão/templo, colunata, arquitetura, paleta, skyline e disposição atual são componentes com identidade local e não devem virar decoração universal.

### Adequação narrativa provável (precisa de validação de conteúdo)

| Fase / personagem do registro | Reuso sugerido |
|---|---|
| 1 — Publicano, Pobres de espírito | O cenário atual templo/cidade e personagens publicano/fariseu já pertencem a esta fase. Reaproveitar o ambiente diretamente como cenário-base da fase 1, validando o roteiro e a interação. |
| 2 — Neemias, Os que choram | Jerusalém e muralhas podem ser referência temática. Reaproveitar como biblioteca de pedras, muros e ruínas após ajustar período/estado de reconstrução; não assumir que o percurso do Templo e mercado serve como mapa pronto. |
| 3 — Moisés, Os mansos | Preferir ambiente próprio de deserto/Midiã/Sinai conforme narrativa. Reutilizar apenas tecnologia genérica de mapa, colisão e props compatíveis, não a cidade de Jerusalém. |
| 4 — Daniel, Fome e sede de justiça | Cenário deve seguir a narrativa escolhida (por exemplo, contexto babilônico/exílio); não reutilizar Jerusalém sem justificativa explícita. |
| 5 — José do Egito, Misericordiosos | Egito e/ou narrativa familiar exigem ambiente próprio; eventualmente reaproveitar itens genéricos (pedra, casas) após direção de arte. |
| 6 — Natanael, Puros de coração | Validar a passagem/local (por exemplo, contexto de Galileia) e criar aldeia/ambiente coerente. Não forçar Jerusalém. |
| 7 — Abigail, Pacificadores | Preferir caminho rural/propriedade e contexto narrativo apropriados; reaproveitar apenas props e colisões genéricas. |
| 8 — Paulo, Perseguidos por causa da justiça | O local depende do episódio escolhido. Uma cidade romana/genérica pode utilizar componentes modulares de ruas/muros, mas não o cenário inteiro do Templo. |
| 9 — Estêvão, Insultados/perseguidos por causa de Cristo | Se o episódio escolhido for o de Jerusalém, pedras/ruas/muros podem compor um conjunto urbano compartilhado. Não reutilizar o percurso da fase 1 sem confirmar local, época e narrativa. |

## 6. Avaliação das centralizações solicitadas

| Conceito | Avaliação e recomendação |
|---|---|
| `PlayerCharacter` | **Sim, prioridade alta.** Atualmente o player é um retângulo e a movimentação fica na cena. Criar uma entidade de jogador com posição/base dos pés, sprite/animações, estado e API de movimento usada pela cena. Manter controles/configuração fora do renderizador quando útil. |
| `BaseCharacter` | **Adiar e validar necessidade.** Uma classe base só se justifica quando jogador e NPC compartilham comportamentos reais (por exemplo, sprite/foot point, animação, direção, interação). Evitar uma hierarquia abstrata baseada apenas em “todos são personagens”. Pode bastar um contrato pequeno ou composição. |
| `CharacterManager` | **Não criar agora.** Não há fluxo de múltiplos personagens controláveis, troca, persistência de elenco ou coordenação demonstrada. A cena e os dados atuais não justificam mais um gerente. |
| `CharacterFactory` | **Opcional, após estabilizar configuração.** NPC já nasce via `NPCConfig`; para o primeiro player, criação direta é mais simples. Extrair factory quando múltiplas fases/variantes realmente compartilharem criação, texturas, spawn e validação. |
| `InputManager` | **Centralizar bindings, não necessariamente criar singleton/manager global.** As teclas são lidas na cena. Um serviço/configuração por cena pode padronizar setas/WASD e tecla de ação; precisa aceitar cenas com controles diferentes, foco e futura entrada touch. Phaser já é dono do input. |
| `CameraManager` | **Adiar como classe comum.** A câmera de Jerusalém está integrada ao ambiente e implementa zoom, follow e parallax 2.5D. Primeiro separar opções/contrato de câmera do `JerusalemLevel`; promover a manager somente quando outras fases compartilharem comportamento não específico. |
| `CollisionManager` | **Não criar como camada genérica de início.** Jerusalém tem sólidos por mapa e movimento com checagem geométrica; não é equivalente a toda colisão Phaser. Formalizar interface de colisão do mundo e manter implementação de mapa; revisar Arcade só se houver necessidade real. |
| `InteractionManager` | **Evoluir o atual `NPCManager`.** Renomear/expandir somente quando passar a tratar NPCs, objetos, prompts e ações. Reaproveitar seleção de alvo/tecla atuais e escolher uma única origem de proximidade. |
| `InteractableObject` | **Usar contrato/componente pequeno, não uma árvore de classes prematura.** Definir ID, alcance/forma de ativação, texto de ação e interação; adaptar NPCs e depois objetos. Uma classe base Phaser só se surgir comportamento compartilhado de ciclo de vida/render. |
| `DialogueManager` | **Necessário ao sair do log para diálogo jogável.** Separar estado/avanço/encerramento das falas da UI; dialogar com entidade/objetivo por ID e evitar falas embutidas na cena. |
| `MissionManager` | **Necessário após definir o formato de objetivos.** Arquivo com esse nome está vazio. Gerenciar eventos/objetivos/condições e progresso de missão, sem assumir responsabilidades do `ProgressManager`. |
| `ProgressManager` | **Manter e corrigir/fortalecer.** Seu escopo de save local e desbloqueio é distinto de objetivos de missão. Preservar a chave e dados numéricos atuais; introduzir validação/migração explícita antes de mudar formato. |
| Gerenciamento de ambientes | **Sim, incremental.** Extrair contrato/pipeline comum para carregar/configurar mapa e posição inicial. Manter `JerusalemLevel` como implementação/conteúdo específico, sem forçá-lo a representar deserto, aldeia ou Babilônia. |
| Configuração das fases | **Sim, prioridade arquitetural depois de validar a primeira fase.** Expandir os metadados atuais para `PhaseConfig` com mapa/spawn/elenco/conteúdo/objetivos/transição. Compartilhar runner/sistemas e permitir handlers específicos por fase, sem converter toda lógica narrativa em JSON rígido. |

## 7. Arquitetura-alvo incremental

Preservar a aplicação existente e reorganizar por extrações pequenas. Exemplo de destino, não instrução para renomear tudo de uma vez:

```text
game/bem_aventurancas/
  src/
    main.ts
    config/                 # Phaser config, input e constantes globais
    router/                 # hash -> cena/phase id
    scenes/                 # menu, seleção, diálogo/resultado e runner de fase
    level/
      PhaseRegistry.ts      # catálogo/ordem/disponibilidade e compatibilidade
      phases/
        humildes-espirito/  # config e handlers narrativos próprios
        os-que-choram/
        ...
    characters/
      PlayerCharacter.ts
      NPC.ts                # comportamento comum se confirmado
    systems/
      InteractionSystem.ts # evolução de NPCManager
      DialogueSystem.ts
      MissionSystem.ts
      ProgressManager.ts
    worlds/
      shared/               # contratos e módulos realmente reutilizáveis
      jerusalem/            # JerusalemLevel, caminho, props, mapa e gerador
      desert/               # somente quando o ambiente for desenvolvido
    data/
      phases/               # configs/dados; roteiro separado de código custom
      npcs/
    Styles/
  public/
    assets/                 # somente arquivos públicos: imagens, áudio, fontes, ícones
```

Princípios:

1. Uma fase descreve conteúdo e dependências; runner/sistemas comuns executam o que for compartilhável.
2. A fase fornece configuração narrativa/mapa e handlers explícitos quando uma mecânica for exclusiva.
3. `PhaseRegistry` permanece fonte única de ID/ordem/rota/disponibilidade; não manter cópia divergente em `data/phases.ts`.
4. Manter `order` como ID legado persistido até haver migração testada.
5. Assets estáticos ficam sob `public/assets`; código TypeScript fica sob `src`.
6. Tipar eventos (interação, objetivo, transição) e usar nomes/IDs estáveis, reduzindo strings ad hoc.
7. Evitar singleton global de sistema Phaser quando escopo por cena/partida é suficiente; destruir listeners/objetos no `shutdown`.
8. `MissionSystem` relata conclusão de objetivos; `ProgressManager` registra conclusão/desbloqueio. O roteador valida disponibilidade, mas não substitui o critério de conclusão do gameplay.

### Modelo proposto de fase

Uma fase deve ter estrutura tipada equivalente a:

- **Identificação:** `id`, `order`, `title`, rota e bem-aventurança/passagem.
- **Narrativa:** personagem foco, descrição, objetivo pedagógico e referência.
- **Ambiente:** `environmentId`/mapa, dimensões, paleta/asset set e opções de câmera/colisão.
- **Spawn:** coordenadas iniciais e, se necessário, facing/estado inicial.
- **Elenco:** player, NPCs (configuração, ID, spawn, alcance, textura/animação).
- **Conteúdo:** diálogos, missões/objetivos, objetos interativos e eventos.
- **Conclusão:** condição tipada/declarada, recompensas/sinal de fase concluída e rota/ID da próxima fase.
- **Extensão específica:** hook/handler limitado para mecânica que não cabe no modelo comum.

Dados editoriais podem ser declarativos, mas lógica complexa deve permanecer em TypeScript com tipos e testes, não em strings de evento interpretadas informalmente.

## 8. Plano de desenvolvimento por etapas

As etapas abaixo respeitam a ordem solicitada. A etapa seguinte depende dos critérios de aceitação da anterior; não há dependência inventada entre tarefas independentes fora desse encadeamento.

### 1 — Corrigir problemas que impedem execução

- **Arquivos envolvidos:** `package.json`, `game/bem_aventurancas/package.json`, `tsconfig.json`, `vite.config.ts`, `src/main.ts`, `src/config/GameConfig.ts`, cenas e imports do ambiente, conforme falhas encontradas no smoke test.
- **Dependências:** estado atual e ferramentas já instaladas; sem instalar dependências salvo necessidade justificada posterior.
- **O que já existe:** build TypeScript + Vite configurado na raiz; cenas e fase 1 registradas; resultado atual de build é sucesso.
- **O que precisa ser criado/alterado em implementação futura:** somente correções de bloqueio comprovadas por testes de execução (ex.: falha ao iniciar uma rota, erro de textura/cena, erro fatal em resize). Não há hoje bloqueador de compilação confirmado.
- **Riscos:** confundir aviso de chunk/Vite com falha fatal; tratar relato de auditoria antiga como atual; mexer em Phaser sem reprodução.
- **Critérios de aceitação:** `npm run build` permanece verde; menu e hash inicial iniciam sem erro; rotas implementadas abrem; ciclo de cena/resize não lança exceção.
- **Como testar:** build raiz; abrir em browser preview; smoke test de `#/menu`, `#/fases`, fase 1, voltar, alternar orientação/resize e conferir console.

### 2 — Organização e limpeza segura

**Status parcial:** a migração dos módulos de Jerusalém para `src/worlds/jerusalem/`, a atualização de imports e a remoção da cópia sob `public/assets` foram concluídas na Tarefa 01. A classificação dos demais módulos vazios, a revisão da documentação histórica e outras limpezas seguras continuam pendentes.

- **Arquivos envolvidos:** módulos de Jerusalém em `src/worlds/jerusalem/`, imports na cena 1, `public/assets`, `docs/AMBIENTE_JERUSALEM.md`, módulos vazios de `src/level/humildes_espirito/`, documentação histórica e manifests.
- **Dependências:** inventário de imports, URLs, cópias estáticas e confirmações de autoria/uso; manter intactas as exclusões já existentes sem instrução de restauração.
- **O que já existe:** ambiente modular migrado, documentação técnica atualizada, cinco áreas já deletadas no worktree e nove módulos vazios existentes.
- **O que precisa ser criado/alterado em implementação futura:** concluir a classificação dos módulos vazios e a revisão de documentos históricos; manter somente assets finais em `public`; remover placeholders apenas após validação de referências/branch.
- **Riscos:** remover módulo usado por import dinâmico externo; quebrar caminhos de imports ou URLs de deploy; descartar arquivos cuja exclusão não foi solicitada.
- **Critérios de aceitação:** build e preview funcionam com o novo caminho; arquivos `.ts` e README do ambiente deixam de ser publicados dentro de `dist/assets`; não há referência quebrada; nenhuma exclusão preexistente é inadvertidamente revertida.
- **Como testar:** busca de imports/referências; `npm run build`; listar `dist/assets`; abrir fase 1 em preview e confirmar cenário.

### 3 — Centralização do Player

- **Arquivos envolvidos:** `src/level/humildes_espirito/HumildesEspiritoScene.ts`, novo `src/characters/PlayerCharacter.ts` (ou `src/entities/` mantendo convenção existente), bindings/config de input e testes de personagem/movimento.
- **Dependências:** etapa 1 aprovada; cenário/câmera e escala de movimento da fase 1 entendidos.
- **O que já existe:** retângulo, WASD/setas, velocidades X/Y, posição dos pés, `moveBy()` e ajuste de profundidade.
- **O que precisa ser criado:** Player com API de posição/foot point, movimento e direção; sprite temporário/animações provisionais; estado suficiente para input e mundo. BaseCharacter só se o contrato com NPC for comprovado.
- **Riscos:** alterar origem/snapshot dos pés e quebrar alcance de NPC, colisões, profundidade ou spawn; depender de textura ausente.
- **Critérios de aceitação:** movimentação e colisão iguais ao protótipo, sem input dentro da lógica visual da cena; animação/direção podem ser evoluídas sem refazer mapa; dispose correto no shutdown.
- **Como testar:** testes unitários de velocidade/normalização/limites e teste manual com setas e WASD em resolução larga/estreita; validar profundidade, colisão e interação.

### 4 — Centralização das interações

- **Arquivos envolvidos:** `src/systems/NPCManager.ts` (evoluir sem duplicar), `src/entities/NPC.ts`, fase 1, dados/spawns de NPC e novo contrato/componente de objeto interativo quando necessário.
- **Dependências:** Player com posição de pés estável; definir tecla, alcance e prioridade quando houver mais de um alvo.
- **O que já existe:** busca do NPC mais próximo, texto de tecla E e evento `npc: interact`; mapa tem eventos separados de proximidade.
- **O que precisa ser criado:** API que interaja com diferentes tipos de alvo sem forçar NPC como única entidade; fonte de proximidade única por tipo; prompt e desregistro lifecycle; configuração de input reaproveitável.
- **Riscos:** dois alvos simultâneos, evento repetido por `JustDown`, UI escondida sob camadas, alvo descarregado pelo streaming.
- **Critérios de aceitação:** só o alvo elegível mais próximo aparece; uma interação por pressionamento; NPCs e objetos atendem ao mesmo contrato mínimo; eventos de entrada/saída são consistentes.
- **Como testar:** testes de seleção por distância/empate/saída de alcance e testes manuais de teclado, streaming e UI fixa na câmera.

### 5 — Integração de NPCs e diálogos

- **Arquivos envolvidos:** `src/entities/NPC.ts`, `src/data/npcs/*`, `src/level/humildes_espirito/dialog/*`, `src/level/humildes_espirito/entities/*`, cena 1, assets/fontes e novo sistema/UI de diálogo.
- **Dependências:** interação comum concluída; definições editoriais revisadas; texturas/animações próprias ou placeholder declarado.
- **O que já existe:** dois registros de NPC, falas curtas, spawn points, sprite/container genérico e evento.
- **O que precisa ser criado:** carregar asset correto, apresentar nome/fala, avanço/encerramento, bloquear/repassar input, emitir eventos que possam avançar missão; eliminar log-only do fluxo jogável.
- **Riscos:** colisão de input de diálogo com movimento; texto inacessível/cortado; excesso de responsabilidades em NPC; asset com chave não carregada.
- **Critérios de aceitação:** interação apresenta diálogo em UI, permite avançar e encerrar; o sistema sinaliza estados/eventos tipados; nenhuma entidade exige classe vazia especializada sem comportamento único.
- **Como testar:** testes de estado da conversa e eventos; teste manual com teclado e resize; verificar falas e assets carregados sem erro.

### 6 — Sistema de ambientes compartilhados

- **Arquivos envolvidos:** módulos de Jerusalém (após migração para `src/worlds/jerusalem/`), novo contrato de ambiente/mapa, loader/config de fase e assets.
- **Dependências:** organização segura da etapa 2; identificar ao menos um segundo cenário real antes de extrair o que seria “genérico”.
- **O que já existe:** `JerusalemLevel` e submódulos procedurais fornecem mapa, props, colisão, câmera, profundidade e streaming da fase 1.
- **O que precisa ser criado:** contrato reduzido para carregar mapa, spawns, bounds, colisões e câmera; separar assets/props genéricos de arquitetura de Jerusalém; implementação própria de outros biomas só quando sua fase estiver definida.
- **Riscos:** criar framework de ambientes sem segunda implementação; generalizar templo/mercado indevidamente; duplicar movimento/câmera em vez de compor.
- **Critérios de aceitação:** ambiente Jerusalém continua visual/funcionalmente equivalente; sistemas de fase dependem do contrato mínimo; um cenário distinto consegue implementar o contrato sem herdar conteúdo de Jerusalém.
- **Como testar:** testes puros de caminho/plano/validação e testes de integração da cena; comparação visual/smoke de carregamento e bounds.

### 7 — Modelo reutilizável de fases

- **Arquivos envolvidos:** `src/level/PhaseRegistry.ts`, `src/data/phases.ts`, `src/config/GameConfig.ts`, router, seleção, cenas de fase/final, novos tipos e dados de fase.
- **Dependências:** modelo de ambiente, player, interação e integração de diálogo suficientemente estáveis; preservar schema de progresso.
- **O que já existe:** nove metadados, chave numérica de ordem, rotas, guarda de disponibilidade e registro de cenas.
- **O que precisa ser criado:** configuração completa tipada por fase (narrativa, mapa, spawn, elenco, diálogos, missões, objetos, eventos, objetivos, condição final, transição), runner compartilhado e extensão de lógica específica onde necessária.
- **Riscos:** duplicar dados entre PhaseRegistry e arquivos de fase; misturar disponibilidade editorial com desbloqueio; alterar ordem e invalidar saves; configurar fase sem validar narrativa.
- **Critérios de aceitação:** cada requisito de configuração possui fonte única; fase nova não exige duplicar menu/roteador/sistemas; fase bloqueada não abre por URL; condição de conclusão não é acionável por hash.
- **Como testar:** validação estrutural de todas as nove configs; teste de rotas, disponibilidade e transição; testes de save legado e hash inválido/direto.

### 8 — Desenvolvimento funcional das fases 2 a 9

- **Arquivos envolvidos:** novos configs e handlers em `src/level/phases/` ou estrutura aprovada; mapas/ambientes, dados de personagens/NPCs, diálogos, missões, assets e `PhaseRegistry`.
- **Dependências:** modelo/configuração de fase aprovado; conteúdo narrativo/lugares revisados; missão, diálogo e condição de conclusão testados na fase 1.
- **O que já existe:** metadados e rota para as nove fases; somente Jerusalém da fase 1 está em cena; progresso local sequencial.
- **O que precisa ser criado:** uma fase completa por ciclo: cenário coerente, spawn, elenco, objetivo, interações, eventos, encerramento, desbloqueio e transição. Liberar fase apenas quando aceite.
- **Riscos:** tratar “cartão de fase” como fase pronta; forçar assets de Jerusalém; expandir fases antes de validar conteúdo; quebrar save/ordem.
- **Critérios de aceitação:** cada fase pode iniciar, ser jogada, concluir e habilitar a próxima; cada local e mecânica são coerentes com a história aprovada; navegar por URL não contorna condição.
- **Como testar:** smoke e integração por fase; provar conclusão e progressão em dados limpos e dados salvos; manter todas as fases existentes sem regressão.

#### Direção inicial para ambientes das fases

| Fase | Conteúdo/ambiente a especificar antes do graybox |
|---|---|
| 2 — Os que choram | Jerusalém e muralhas podem inspirar o conjunto; definir claramente reconstrução/época e objetivo narrativo antes de reutilizar mapa. |
| 3 — Os mansos | Região desértica/Sinai/Midiã conforme episódio escolhido; topografia, distância e mecânica próprias. |
| 4 — Fome e sede de justiça | Contexto de Daniel (por exemplo, exílio/Babilônia) a validar; sem cenário de Jerusalém como padrão. |
| 5 — Misericordiosos | Contexto de José/Egito a validar; ambiente e props próprios. |
| 6 — Puros de coração | Contexto de Natanael/passagem selecionada; aldeia ou outro lugar definido pelo roteiro. |
| 7 — Pacificadores | Contexto rural/familiar de Abigail; usar elementos genéricos só se compatíveis. |
| 8 — Perseguidos por causa da justiça | Selecionar episódio e local da vida de Paulo; cidade/estrada/prisão conforme gameplay. |
| 9 — Insultados e perseguidos por causa de Cristo | Selecionar episódio de Estêvão; reutilizar módulos urbanos de Jerusalém somente se cenário e período forem apropriados. |

### 9 — Testes de integração

- **Arquivos envolvidos:** suíte a introduzir (`tests/` ou `src/**/*.test.ts` conforme escolha), `ProgressManager`, router, sistemas, configs, cenas e build scripts.
- **Dependências:** runner definido sem instalar ferramenta nesta auditoria; interfaces das etapas anteriores.
- **O que já existe:** nenhum teste automatizado de aplicação; somente documentos de auditoria.
- **O que precisa ser criado:** testes para schema/registro, progresso e save, navegação por hash, interação/diálogo, conclusão protegida, loading de mapa e ciclo de vida/resize; smoke browser das nove fases.
- **Riscos:** testes que só repetem implementação; testar Phaser inteiro em ambiente inadequado; testes dependentes de `localStorage` compartilhado.
- **Critérios de aceitação:** regressões de desbloqueio, transição e evento detectáveis automaticamente; cenários de integração documentados e reproduzíveis; build/typecheck continua verde.
- **Como testar:** executar testes de unidade e integração; limpar/isolar storage; validar cada rota, fases bloqueadas e desbloqueadas; browser smoke em desktop e viewport móvel.

### 10 — Finalização visual

- **Arquivos envolvidos:** assets finais sob `public/assets`, configurações de ambiente, cena/UI, CSS/fontes, acessibilidade e eventualmente otimização Vite.
- **Dependências:** fases jogáveis aceitas em graybox; direção de arte/roteiro aprovada; resolução-alvo definida.
- **O que já existe:** imagem do Monte das Oliveiras, fontes, ícone e Jerusalém procedimental com estilo aquarelado.
- **O que precisa ser criado:** assets finais de personagens, cenários e interface; animações, áudio (se aprovado), feedback de interação, layouts para mobile e revisão de contraste/legibilidade.
- **Riscos:** polir cena que ainda muda; assets pesados; divergência entre arte e narrativa; acessibilidade e desempenho mobile.
- **Critérios de aceitação:** todas as nove fases têm conteúdo visual consistente, sem assets faltantes; layout atende resoluções-alvo; bundle e carregamento ficam dentro do orçamento definido pelo time.
- **Como testar:** revisão visual de cada fase, testes de responsividade/orientação, avaliação de desempenho em dispositivo-alvo, carregamento de áudio/fontes e smoke final em produção preview.

## 9. Grayboxing

Graybox deve validar escala, deslocamento, colisões e ritmo de objetivos antes de produzir arte final:

1. Definir o tamanho lógico de cada ambiente, spawn, limites caminháveis e zonas seguras em configuração de fase.
2. Usar cor sólida ou gradiente de fundo por bioma; representar caminho/chão com retângulos, polígonos e linhas.
3. Construir casas, muros, escadas, obstáculos, portões e áreas de missão com formas simples, cores identificáveis e profundidades separadas.
4. Usar player temporário com forma de cor contrastante e NPCs com formas/silhuetas diferentes e rótulos/IDs. Não depender de textura inexistente.
5. Marcar colisões com contorno visível em modo debug e desenhar faixa caminhável/spawn/raios de interação.
6. Criar pontos de interação como shapes/zones com prompt; testar tecla, alcance, prioridade, cooldown e feedback.
7. Renderizar caixas de diálogo e progresso de missão com texto simples; demonstrar início, sequência, condição de conclusão e transição.
8. Reservar uma paleta provisória consistente por classe de objeto (cenário, sólido, interativo, personagem, UI); permitir ativar/desativar debug.
9. Usar os mesmos eventos/configurações que a versão final deve consumir. O graybox não deve ser um caminho paralelo que depois precise ser refeito.
10. Substituir visualmente peça a peça mantendo IDs de objetos, spawns e dados de colisão; validar diferenças de hitbox ao trocar cada asset.

**Aceite de graybox por fase:** começo e fim alcançáveis; player não atravessa sólidos nem sai da faixa prevista; NPC/objeto pode ser acionado; missão progride e falha/sucesso são compreensíveis; condição final abre apenas a próxima fase autorizada; teste de resize não quebra UI.

## 10. Testes necessários e matriz mínima

| Camada | Casos mínimos |
|---|---|
| Build/tipos | `npm run build` na raiz; checagem estrita sem silenciar erros de código próprio. Confirmar warnings separadamente. |
| Registro e configuração | Nove IDs únicos; ordem/rota únicas; referências de mapa, spawn, personagem, diálogo e cena válidas; fase não implementada continua indisponível. |
| Router | Sem hash; rotas conhecidas; desconhecida; fase bloqueada; fase sem cena; rota final inválida; hash direto não concede conclusão. |
| Progresso | Estado inicial; início autorizado; conclusão idempotente; desbloqueio sequencial; limites 1–9; JSON inválido/campos faltantes/tipos errados; compatibilidade com chave e formato atual. |
| Movimento/colisão | Normalização diagonal; input por teclas; limites; colisão sólida e deslizamento; Y dos pés e profundidade; spawn em faixas válidas. |
| Ambiente | Validação de caminho sem lacuna; plano determinístico por seed; segmentos build/destroy; resize; bounds de câmera; colisões e NPCs dentro da área. |
| Interação | Alvo mais próximo; alvo dentro/fora de alcance; troca de alvo; apenas uma ação por tecla; remoção/descarregamento; prompt/UI sobre cenário. |
| Diálogo e missões | Avançar/encerrar; sequência e eventos; condição satisfeita somente após interações necessárias; estado em pausa sem mover player. |
| Integração de fases | Início → jogo → objetivo → encerramento → desbloqueio → próxima rota; retorno ao menu/seleção e recuperação de `lastPhase`. |
| UI responsiva | Desktop, viewport estreita, paisagem/retrato, redimensionamento em cada cena e encerramento de cena seguido de novo resize. |
| Assets e build publicado | Não publicar fontes TS/README dentro de assets; todo asset referenciado existe e carrega; confirmar base de deploy `/bem_aventurancas/`. |
| Áudio/acessibilidade | Só após áudio existir: mute persistente, separar música/voz/SFX, política de autoplay e controle acessível; revisar zoom, foco/teclado e contraste. |

## 11. Ordem e primeira implementação recomendada

Ordem de execução: **(1)** smoke/runtime e correções bloqueadoras; **(2)** mover código do ambiente para fora de `public` e limpar com segurança; **(3)** Player; **(4)** interação; **(5)** NPCs/diálogo; **(6)** ambientes; **(7)** configuração/runner de fases; **(8)** fases 2–9; **(9)** integração; **(10)** polimento visual. A migração principal da etapa 2 foi concluída na Tarefa 01; a limpeza pendente não foi ampliada.

**Próxima implementação recomendada:** centralizar o Player (etapa 3), após o smoke test já realizado durante a Tarefa 01. A migração do ambiente foi compilada e o cenário renderizou; movimento/câmera e ciclo completo de resize devem continuar como testes de regressão durante essa etapa. Preservar explicitamente os arquivos já deletados no worktree.

Em paralelo ao início técnico, obter aprovação do roteiro/local de cada fase antes de implementar conteúdo narrativo específico; isso não deve atrasar a correção de empacotamento.

## 12. Limites desta auditoria

- **Verificações feitas:** inventário do código-fonte e assets, inspeção dos pontos de entrada/cenas/sistemas/configurações/documentos e `npm run build` (TypeScript + Vite) na raiz.
- **Não verificado:** execução real no navegador, visualização de cada fase, controles em dispositivos, artefatos de deploy em servidor, áudio, desempenho de runtime e conteúdo narrativo com fontes editoriais.
- **Testes automatizados:** inexistentes no estado auditado.
- **Worktree:** cinco arquivos vazios em `src/level/humildes_espirito/areas/` já aparecem removidos no Git antes desta entrega; não foram restaurados nem alterados.
