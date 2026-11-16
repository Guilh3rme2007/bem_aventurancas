import Phaser from "phaser";
import {NPC} from "../../entities/NPC";
import {NPCManager} from "../../systems/NPCManager";
import {humildesEspiritoNPC} from "../../data/npcs/humildesEspirito";
import {ProgressManager} from "../../systems/ProgressManager";
import {GameRouter} from "../../router/GameRouter";
import {APP_ROUTES} from "../../router/routes";
import {JerusalemLevel} from "../../worlds/jerusalem/JerusalemLevel";
import {DEPTH} from "../../worlds/jerusalem/JerusalemBackgroundConfig";
import {PlayerCharacter} from "../../entities/PlayerCharacter";
import {MobileControls} from "../../entities/MobileControls";
import {InputManager} from "../../systems/InputManager";

export class HumildesEspiritosScene extends Phaser.Scene{
    private npcManager!: NPCManager;
    private level!: JerusalemLevel;

    private player!: PlayerCharacter;
    private inputManager!: InputManager;
    private mobileControls!: MobileControls;
    private backButton!: Phaser.GameObjects.Text;

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

        this.inputManager = new InputManager(this);

        this.player = new PlayerCharacter(this, {
            id: "humildes-espirito-player",
            position: { x: 200, y: 500 },
            speed: { x: 200, y: 130 },
            scale: 1,
            texture: "humildes-espirito-player",
            initialDirection: "down",
            controlsEnabled: true,
        });

        // Cenário procedural 2.5D de Jerusalém: câmera, profundidade, limites e streaming.
        this.level = new JerusalemLevel(this, { player: this.player });
        this.mobileControls = new MobileControls(this, this.level, this.inputManager);

        this.npcManager = new NPCManager(
            this,
            this.playerFeet,
            this.inputManager.deviceInfo.isTouchPrimary
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
            this.mobileControls.destroy();
            this.inputManager.destroy();
        });
    }

    /** Mantém a interface fixa na tela independentemente do zoom da câmera. */
    private layoutUi(): void {
        if (!this.level || !this.backButton) return;
        this.level.pinToScreen(this.backButton, 20, 20);
    }

    update(time: number, delta: number){
        if (!this.level || !this.player) return;

        const input = this.inputManager.getState();
        this.player.update(delta, this.level, input);

        // Clamp, profundidade, câmera, streaming e parallax.
        this.level.update(time, delta);

        const feet = this.player.getBottomCenter();
        this.playerFeet.x = feet.x;
        this.playerFeet.y = feet.y;

        this.npcManager.update(input.interact);
        this.mobileControls.setInteractionAvailable(this.npcManager.canInteract);
    }
}
