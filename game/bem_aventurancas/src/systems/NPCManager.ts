import Phaser from "phaser";
import {NPC} from "../entities/NPC";
import {GAME_THEME} from "../Styles/GameStyles";

type PlayerPosition = Pick<Phaser.GameObjects.Components.Transform, "x" | "y">;

export class NPCManager {

    private scene: Phaser.Scene;
    private player: PlayerPosition;
    private npcs: NPC[] = [];

    private interactionKey: Phaser.Input.Keyboard.Key;
    private interactionText: Phaser.GameObjects.Text;

    private currentNPC: NPC | null = null;

    constructor(
        scene: Phaser.Scene,
        player: PlayerPosition,
        interactionKey: Phaser.Input.Keyboard.Key
    ) {
        this.scene = scene;
        this.player = player;

        this.interactionKey = interactionKey;

        this.interactionText = scene.add.text(
            0,
            0,
            "Pressione 'E' para interagir",
            {
                fontFamily: GAME_THEME.fonts.dialogue,
                fontSize: GAME_THEME.sizes.dialogue,
                color: GAME_THEME.colors.text,
                backgroundColor: "#263729",
                padding: { x: 10, y: 5 }
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(1000).setVisible(false);
    }
    
    public addNPC(npc: NPC): void {
        this.npcs.push(npc);
    }

    public update(): void {
        const playerPosition = this.player;
        let nearestNPC: NPC | null = null;
        let nearestDistance = Infinity;

        for(const npc of this.npcs) {
            const distance = Phaser.Math.Distance.Between(
                playerPosition.x,
                playerPosition.y,
                npc.x,
                npc.y
            );
            if(distance <= npc.interactionDistance && distance < nearestDistance) {
                nearestDistance = distance;
                nearestNPC = npc;
            }
        }

        this.currentNPC = nearestNPC;

        this.interactionText.setVisible(this.currentNPC !== null);

        if(this.currentNPC) {
            this.interactionText.setPosition(
                this.scene.scale.width / 2,
                this.scene.scale.height - 80
            );
        }

        if(this.currentNPC && Phaser.Input.Keyboard.JustDown(this.interactionKey)) {
            this.scene.events.emit(
                "npc: interact",
                this.currentNPC
            );
        }
    }

    public destroy():void {
        this.interactionText.destroy();
        this.npcs = [];
        this.currentNPC = null;
    }
}