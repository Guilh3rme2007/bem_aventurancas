import Phaser from "phaser";
import {NPC} from "../entities/NPC";
import {GAME_THEME} from "../Styles/GameStyles";

type PlayerPosition = Pick<Phaser.GameObjects.Components.Transform, "x" | "y">;

export class NPCManager {

    private scene: Phaser.Scene;
    private player: PlayerPosition;
    private npcs: NPC[] = [];

    private interactionText: Phaser.GameObjects.Text;
    private readonly touchControlsEnabled: boolean;

    private currentNPC: NPC | null = null;

    constructor(
        scene: Phaser.Scene,
        player: PlayerPosition,
        touchControlsEnabled = false,
    ) {
        this.scene = scene;
        this.player = player;
        this.touchControlsEnabled = touchControlsEnabled;

        this.interactionText = scene.add.text(
            0,
            0,
            touchControlsEnabled ? "Toque no botão para interagir" : "Pressione 'E' para interagir",
            {
                fontFamily: GAME_THEME.fonts.dialogue,
                fontSize: GAME_THEME.sizes.dialogue,
                color: GAME_THEME.colors.text,
                backgroundColor: "#263729",
                padding: { x: 10, y: 5 }
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(1000).setVisible(false);
    }
    
    public setUiDepth(depth: number): void {
        this.interactionText.setDepth(depth);
    }

    public addNPC(npc: NPC): void {
        this.npcs.push(npc);
    }

    public get canInteract(): boolean {
        return this.currentNPC !== null;
    }

    public update(interactPressed = false): void {
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
            // Fixa na tela mesmo quando a câmera principal usa zoom (cenário 2.5D).
            const cam = this.scene.cameras.main;
            const zoom = cam.zoom;
            const cx = cam.width / 2;
            const cy = cam.height / 2;
            this.interactionText
                .setScale(1 / zoom)
                .setPosition(cx, (cam.height - 80 - cy) / zoom + cy);
        }

        if(interactPressed) this.requestInteraction();
    }

    public requestInteraction(): void {
        if (!this.currentNPC) return;
        this.scene.events.emit("npc: interact", this.currentNPC);
    }

    public destroy():void {
        this.interactionText.destroy();
        this.npcs = [];
        this.currentNPC = null;
    }
}