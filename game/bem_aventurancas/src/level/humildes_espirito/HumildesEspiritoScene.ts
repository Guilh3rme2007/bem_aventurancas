import Phaser from "phaser";
import {NPC} from "../../entities/NPC";
import {NPCManager} from "../../systems/NPCManager";
import {humildesEspiritoNPC} from "../../data/npcs/humildesEspirito";
import {ProgressManager} from "../../systems/ProgressManager";
import {GameRouter} from "../../router/GameRouter";
import {APP_ROUTES} from "../../router/routes";

export class HumildesEspiritosScene extends Phaser.Scene{
    private npcManager!: NPCManager;

    private player!: Phaser.GameObjects.Rectangle;

    
    constructor(){
        super("HumildesEspiritoScene");

    }

    create(){
        if (!ProgressManager.startPhase(1)) {
            GameRouter.go(APP_ROUTES.PHASE_SELECT);
            return;
        }

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

        this.npcManager = new NPCManager(
            this,
            this.player,
            keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
        );

        humildesEspiritoNPC.forEach((config, index) => {
            const npc = new NPC(
                this,
                400 + index * 220,
                500,
                config
            );
            this.npcManager.addNPC(npc);
        });

        this.add.text(
            20,
            20,
            "Voltar às fases",
            { fontSize: "18px", color: "#fff0cb", backgroundColor: "#304b38", padding: { x: 10, y: 6 } }
        )
            .setInteractive({ useHandCursor: true })
            .on("pointerdown", () => GameRouter.go(APP_ROUTES.PHASE_SELECT));

        this.events.on(
            "npc: interact",
            (npc: NPC) => {
                console.log(`Interacting with NPC: ${npc.npcName}`);

                console.log("Dialogos do NPC:", npc.dialogue);
            }
        );

        this.events.once("shutdown", () => {
            this.events.off("npc: interact");
            this.npcManager.destroy();
        });
    }

    update(){
        this.npcManager.update();
    }
}