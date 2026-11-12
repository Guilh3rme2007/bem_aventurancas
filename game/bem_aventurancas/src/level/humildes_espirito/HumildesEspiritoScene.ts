import Phaser from "phaser";
import {NPC} from "../../entities/NPC";
import {NPCManager} from "../../systems/NPCManager";
import {humildesEspiritoNPC} from "../../data/npcs/humildesEspirito";
import {ProgressManager} from "../../systems/ProgressManager";
import {GameRouter} from "../../router/GameRouter";
import {APP_ROUTES} from "../../router/routes";
import {JerusalemLevel} from "../../../public/assets/backgrounds/humildes-espirito/JerusalemLevel";
import {DEPTH} from "../../../public/assets/backgrounds/humildes-espirito/JerusalemBackgroundConfig";

const PLAYER_SPEED_X = 200;
const PLAYER_SPEED_Y = 130;

export class HumildesEspiritosScene extends Phaser.Scene{
    private npcManager!: NPCManager;
    private level!: JerusalemLevel;

    private player!: Phaser.GameObjects.Rectangle;
    private backButton!: Phaser.GameObjects.Text;

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: Record<"W" | "A" | "S" | "D", Phaser.Input.Keyboard.Key>;

    /** Posição dos PÉS do jogador, usada pelo NPCManager (os NPCs têm origem nos pés). */
    private playerFeet = { x: 0, y: 0 };

    constructor(){
        super("HumildesEspiritoScene");

    }

    create(){
        if (!ProgressManager.startPhase(1)) {
            GameRouter.go(APP_ROUTES.PHASE_SELECT);
            return;
        }

        // Jogador existente (retângulo). A posição inicial é definida pelo cenário.
        this.player = this.add.rectangle(
        200,
        500,
        35,
        65,
        0xffffff
        );

        const keyboard = this.input.keyboard;
        
        if(!keyboard) {
            throw new Error("Keyboard input is not available in the scene.");
        }   

        this.cursors = keyboard.createCursorKeys();
        this.wasd = keyboard.addKeys("W,A,S,D") as typeof this.wasd;

        // Cenário procedural 2.5D de Jerusalém: câmera, profundidade, limites e streaming.
        this.level = new JerusalemLevel(this, { player: this.player });

        this.npcManager = new NPCManager(
            this,
            this.playerFeet,
            keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
        );
        this.npcManager.setUiDepth(DEPTH.ui);

        // NPCs nascem nos pontos previstos do mapa (data/npcSpawnPoints.ts), via npcId.
        humildesEspiritoNPC.forEach((config) => {
            const spawn = this.level.map.npcSpawns.find((point) => point.npcId === config.id);

            if (!spawn) {
                console.warn(`NPC "${config.id}" sem ponto em npcSpawnPoints.ts; não foi posicionado.`);
                return;
            }

            const npc = new NPC(
                this,
                spawn.x,
                spawn.y,
                { ...config, interactionRadius: spawn.interactionRadius }
            );
            npc.setDepth(DEPTH.midBase + spawn.y);
            this.npcManager.addNPC(npc);
        });

        const warnings = this.level.map.validateNpcSpawns();
        if (warnings.length) {
            console.warn("Pontos de NPC inválidos:", warnings);
        }

        this.backButton = this.add.text(
            0,
            0,
            "Voltar às fases",
            { fontSize: "18px", color: "#fff0cb", backgroundColor: "#304b38", padding: { x: 10, y: 6 } }
        )
            .setInteractive({ useHandCursor: true })
            .on("pointerdown", () => GameRouter.go(APP_ROUTES.PHASE_SELECT));

        this.layoutUi();
        this.scale.on(Phaser.Scale.Events.RESIZE, this.layoutUi, this);

        this.events.on(
            "npc: interact",
            (npc: NPC) => {
                console.log(`Interacting with NPC: ${npc.npcName}`);

                console.log("Dialogos do NPC:", npc.dialogue);
            }
        );

        this.events.once("shutdown", () => {
            this.events.off("npc: interact");
            this.scale.off(Phaser.Scale.Events.RESIZE, this.layoutUi, this);
            this.npcManager.destroy();
        });
    }

    /** Mantém a interface fixa na tela independentemente do zoom da câmera. */
    private layoutUi(): void {
        if (!this.level || !this.backButton) return;
        this.level.pinToScreen(this.backButton, 20, 20);
    }

    update(time: number, delta: number){
        if (!this.level) return;

        // Movimento 2.5D: X lateral, Y é profundidade no chão. Colisões com os sólidos do cenário.
        const left = this.cursors.left.isDown || this.wasd.A.isDown;
        const right = this.cursors.right.isDown || this.wasd.D.isDown;
        const up = this.cursors.up.isDown || this.wasd.W.isDown;
        const down = this.cursors.down.isDown || this.wasd.S.isDown;
        const dt = delta / 1000;
        const dir = new Phaser.Math.Vector2((right ? 1 : 0) - (left ? 1 : 0), (down ? 1 : 0) - (up ? 1 : 0));
        if (dir.lengthSq() > 0) dir.normalize();
        this.level.moveBy(dir.x * PLAYER_SPEED_X * dt, dir.y * PLAYER_SPEED_Y * dt);

        // Clamp, profundidade, câmera, streaming e parallax.
        this.level.update(time, delta);

        const feet = this.player.getBottomCenter();
        this.playerFeet.x = feet.x;
        this.playerFeet.y = feet.y;

        this.npcManager.update();
    }
}
