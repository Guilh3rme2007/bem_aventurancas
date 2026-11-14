# Auditoria técnica 02

**Data:** 12/11/2026  
**Escopo:** arquivos TypeScript em `public/assets/backgrounds/humildes-espirito/`, integração em `src/level/humildes_espirito/HumildesEspiritoScene.ts` e dependência direta `src/systems/NPCManager.ts`.  
**Restrição:** auditoria sem alterações no código-fonte.

## Resumo

O comando `npm run build` falha durante a checagem TypeScript. Foram encontrados erros concretos de tipos/API do Phaser e uma chamada a método inexistente na integração com `NPCManager`. A compilação isolada do Vite concluiu, mas isso não substitui a checagem de tipos nem comprova que o jogo executa corretamente.

## Achados

### 1. Bloqueador — pontos `{ x, y }` incompatíveis com `Vector2`

**Arquivos:** `HandDrawn.ts`, `JerusalemGround.ts` e `JerusalemLevel.ts`.

O código cria pontos como `Pt` ou objetos simples `{ x, y }` e os passa para `Graphics.fillPoints`/`strokePoints`. Com os tipos da versão Phaser instalada, esses métodos exigem `Vector2[]`.

- `HandDrawn.ts`: chamadas nas linhas 110, 117, 123, 125, 155, 160, 166, 168 e 178–182.
- `JerusalemGround.ts`: chamadas nas linhas 33 e 84.
- `JerusalemLevel.ts`: chamadas nas linhas 334–335.

O build reporta `TS2345`/`TS2740` nesses pontos. A estrutura com `x` e `y` não satisfaz o tipo de instância `Vector2`, que também exige métodos como `clone` e `set`.

### 2. Bloqueador — configuração de zona de partículas incompatível

**Arquivo:** `JerusalemBackdrop.ts`, linha 59.

O objeto passado em `emitZone` (`{ type: 'random', source: this.dustZone }`) não corresponde ao tipo aceito pelos tipos Phaser instalados. O build reporta `TS2322`. A configuração de emissão precisa seguir a API da versão Phaser usada pelo projeto.

### 3. Bloqueador — configuração de imagem inválida para `scene.make.image`

**Arquivo:** `JerusalemGround.ts`, linha 51.

O objeto `{ x, y, key, add }` passado a `scene.make.image` inclui `key`, que não é aceito pelo tipo `GameObjectConfig` da versão instalada. O build reporta `TS2353`. Esta chamada aparenta usar uma forma de configuração incompatível com a API/tipagem atual.

### 4. Bloqueador — chamada a método inexistente em `NPCManager`

**Arquivo:** `HumildesEspiritoScene.ts`, linha 64.

A cena chama `this.npcManager.setUiDepth(DEPTH.ui)`, mas `NPCManager` não declara `setUiDepth` (nem outro método público equivalente). O build reporta `TS2339`.

Há também uma consequência visual provável: o texto de interação do gerenciador recebe profundidade `1000` em `NPCManager.ts`, enquanto o papel e a vinheta do cenário usam profundidades `9000` e `9001`. A intenção aparente da chamada ausente era colocar a interface acima dessas camadas; sem isso, o aviso de interação pode ficar escurecido ou coberto.

### 5. Risco — dependência fixa do segundo segmento

**Arquivo:** `JerusalemMapGenerator.ts`, linha 135.

`planMap` acessa `path.segments[1]` para gerar o mercado. Um `JerusalemPath` válido com apenas um segmento passa pela validação do caminho, mas essa rotina acessaria propriedades de `undefined`. O mapa padrão tem quatro segmentos, então o risco ocorre ao fornecer um caminho customizado menor.

### 6. Documentação desatualizada em relação ao repositório

**Arquivo:** `public/assets/backgrounds/humildes-espirito/README.md`.

- O README indica caminhos em `src/level/humildes_espirito/background/` e `src/level/humildes_espirito/data/npcSpawnPoints.ts`; os arquivos auditados estão em `public/assets/backgrounds/humildes-espirito/` e `src/data/npcs/npcSpawnPoints.ts`.
- O documento cita Phaser 3.60+, mas o `package.json` da raiz declara `phaser: ^4.2.1`.
- A afirmação de que os módulos puros foram verificados com `tsc` não corresponde ao estado atual: a checagem completa falha nos erros listados acima.

## Verificações executadas

- `npm run build`: **falhou** na etapa TypeScript, com os erros descritos.
- `npx vite build game/bem_aventurancas`: **concluiu**, mas não verifica os tipos porque foi executado separadamente.
- Nas chamadas da classe `Ink` encontradas nos módulos revisados, os nomes correspondem a métodos declarados em `HandDrawn.ts`; não foi identificado outro método chamado e ausente, além de `setUiDepth`.

## Conclusão

O estado atual não passa pelo build oficial por incompatibilidades de tipos/API e pela chamada inexistente a `setUiDepth`. A compatibilidade com Phaser 4 deve ser resolvida antes de considerar o cenário validado; depois, é recomendável executar o jogo para verificar a renderização e a interface de interação.
