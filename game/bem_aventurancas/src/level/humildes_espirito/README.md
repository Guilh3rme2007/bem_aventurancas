# Jerusalém — Level 01 (O Caminho da Humildade)

Cenário 2.5D **100% procedural** (Phaser 4 + TypeScript). Nenhuma imagem de fundo é carregada: materiais, casas,
barraca, vasos, árvores, o Templo, céu e papel são desenhados por código com um único pincel (`Ink`), viram
texturas pequenas (uma vez) e são reutilizados.

**Biblioteca de texturas, materiais, objetos e tema visual: veja [`TEXTURAS_E_AMBIENTES.md`](./TEXTURAS_E_AMBIENTES.md).**

## Arquivos principais

| Arquivo | Função |
|---|---|
| `JerusalemLevel.ts` | Fachada: câmera, streaming de segmentos, colisões, profundidade 2.5D, eventos |
| `JerusalemPath.ts` | Percurso (rua → mercado → acesso ao Templo → pátio), faixa caminhável, escadas |
| `JerusalemMapGenerator.ts` | Planejador do mapa (posiciona objetos) + streaming de segmentos |
| `JerusalemRegionStyles.ts` | Materiais de cada região (editar aqui para trocar pisos/paredes) |
| `JerusalemGround.ts` | Chão de cada segmento a partir dos materiais da região |
| `JerusalemEnvironment.ts` | Registro e baking dos objetos (`props/`) |
| `materials/`, `props/`, `style/` | Materiais repetíveis, definições de objetos, tema visual central |
| `JerusalemAssets.ts`, `JerusalemBackdrop.ts` | Céu, colinas, Templo ao horizonte, papel, vinheta, poeira |
| `JerusalemBackgroundConfig.ts` | Dimensões, profundidades, parallax, qualidade |

## Integração com a Scene

```ts
import { JerusalemLevel } from "./background/JerusalemLevel";

create() {
  this.level = new JerusalemLevel(this, { player: this.player });
  // opcional: trocar materiais de uma região sem editar o gerador
  // new JerusalemLevel(this, { player, regionStyles: { market: { walk: 'floor_stone' } } });
}
update(t: number, dt: number) {
  // ... movimento (use this.level.moveBy(dx, dy) para colisão com os objetos sólidos)
  this.level.update(t, dt);
}
```

Eventos (`this.events.on(...)`): `jerusalem:reached-temple`, `jerusalem:npc-enter`, `jerusalem:npc-leave`,
`jerusalem:segment-built`, `jerusalem:segment-destroyed` (constantes em `LEVEL_EVENTS`).

## Como ampliar o mapa

1. Em `JerusalemPath.ts`, acrescente um `LevelSegment` ao fim de `LEVEL_01_SEGMENTS` (o primeiro ponto repete o
   último do anterior; `JerusalemPath.validate` acusa lacunas e saltos). `halfWidth` maior = beco/praça;
   `stairs: true` = rampa de degraus até o próximo ponto.
2. Para nova região, acrescente o `AreaId`, a entrada em `REGION_STYLES` e as regras em `planMap`.
3. NPCs: edite `src/data/npcs/npcSpawnPoints.ts`; `level.map.validateNpcSpawns()` avisa se algum estiver fora da
   faixa caminhável ou dentro de um objeto sólido.

## Profundidade 2.5D

`DEPTH.midBase + Y do pé` para objetos, NPCs e jogador; primeiro plano em `foreBase + Y` (sobrepõe o jogador);
céu/colinas/cidade/Templo em profundidades negativas com parallax; o Templo entra pela direita e cresce
conforme o progresso. Chão em `DEPTH.ground`; papel e vinheta acima de tudo, interface em `DEPTH.ui`.
