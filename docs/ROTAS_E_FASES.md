# Rotas e fases

## Navegação

O Phaser continua responsável por renderizar e executar as cenas. `GameRouter` (`game/bem_aventurancas/src/router/GameRouter.ts`) conecta a URL com hash à cena ativa. A navegação de botões passa por `GameRouter.go()`; o evento `hashchange` cobre voltar/avançar do navegador e alterações de hash.

| Hash | Destino |
|---|---|
| `#/menu` | `MenuScene` |
| `#/fases` | `PhaseSelectScene` |
| `#/configuracoes` | `SettingsScene` |
| `#/final` | `EndingScene`, usando a última fase iniciada ou a fase 1 |
| `#/final?phaseId=1` | `EndingScene` para a fase indicada |
| `#/fase/humildes-espirito` | `HumildesEspiritoScene`, se disponível e desbloqueada |
| `#/fase/os-que-choram` | Ainda indisponível; redireciona para `#/fases` |
| `#/fase/mansos` | Ainda indisponível; redireciona para `#/fases` |
| Demais rotas de fase no registro | Ainda indisponíveis; redirecionam para `#/fases` |
| Hash/rota desconhecida | Redireciona para `#/fases` |

Ao abrir o jogo sem hash, o roteador define `#/menu`. As rotas inacessíveis são substituídas no histórico pela seleção, evitando que “Voltar” retorne imediatamente para a mesma URL inválida. Ao mudar de destino, o roteador encerra a Scene anterior; navegar para a Scene já ativa não a reinicia.

## Registro central de fases

`game/bem_aventurancas/src/level/PhaseRegistry.ts` é a fonte única dos metadados. Cada entrada define ID, ordem, nome, personagem, versículo, descrição, rota, Scene (ou `null` quando não implementada), implementação e disponibilidade. `PhaseSelectScene` gera os cartões diretamente desse registro.

As nove fases e seus metadados já existentes estão listados. Somente “Pobres de espírito” tem Scene registrada e está marcada como implementada/disponível. As outras entradas não têm Scene e não são tratadas como fases implementadas.

## Desbloqueio e progresso

O `ProgressManager` mantém o formato e a chave local já usados (`bem_aventurancas_progress`), com `unlockedPhases`, `completedPhases`, `lastPhase` e `hasStarted`. O número de ordem no registro corresponde ao `phaseId` numérico legado; os dados existentes no `localStorage` não precisam ser migrados.

Uma fase só abre quando satisfaz todas as condições:

1. Possui Scene implementada (`implemented` e `sceneKey`).
2. Está disponível (`available`).
3. Está desbloqueada pelo progresso (`ProgressManager.isUnlocked(order)`).

Assim, digitar a URL de uma fase em desenvolvimento ou bloqueada não contorna a seleção nem o progresso.

## Como adicionar uma fase

1. Criar a pasta e implementar uma Scene própria.
2. Registrar a classe da Scene em `game/bem_aventurancas/src/config/GameConfig.ts`.
3. Adicionar uma entrada em `PhaseRegistry.ts`, com ID, ordem, metadados, rota `"/fase/<slug>"` e chave exatamente igual à usada pela Scene.
4. Definir `implemented: true` e `available: true` somente quando a Scene estiver pronta para uso. Antes disso, manter `sceneKey: null`, `implemented: false` e `available: false`.
5. Configurar a ordem/desbloqueio pela regra do `ProgressManager`. A ordem continua compatível com os números persistidos no navegador.
6. Usar `GameRouter.go()` nos controles para preservar URL e histórico. O roteador e a tela de seleção não precisam de novos casos por fase.

Os metadados não devem ser repetidos em `data/phases.ts`; esse módulo existe apenas como reexportação de compatibilidade do registro.

## Executar e testar acesso direto

Na raiz do repositório:

```sh
npm run dev
```

O Vite usa `game/bem_aventurancas` como root e serve o `index.html` da aplicação. Para testar, abra a URL local exibida no terminal e acrescente um hash:

```text
http://localhost:5173/#/fase/humildes-espirito
```

Também é possível testar `#/menu`, `#/fases`, `#/configuracoes`, `#/fase/os-que-choram` e `#/fase/mansos`. As duas últimas devem voltar à seleção por ainda não estarem implementadas. Use voltar/avançar do navegador para validar a navegação entre cenas.

Build/typecheck:

```sh
npm run build
```

O projeto não possui suíte automatizada configurada. Os testes de navegação devem ser feitos no navegador até que sejam adicionados testes para o roteador, progresso e Scenes.
