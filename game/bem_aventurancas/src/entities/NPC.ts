import Phaser from "phaser";
import { GAME_THEME } from "../Styles/GameStyles";

export interface NPCConfig {
    id: string;
    name: string;
    texture: string;
    animation?: string;
    scale?: number;
    interactionRadius?: number;
    dialogue: string[];
}

export class NPC extends Phaser.GameObjects.Container {
    public readonly id: string;
    public readonly npcName: string;
    public readonly interactionDistance: number;
    public readonly dialogue: string[];

    private characterSprite: Phaser.GameObjects.Sprite;
    private nameLabel: Phaser.GameObjects.Text;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        config: NPCConfig
    ) {
        super(scene, x, y);

        this.id = config.id;
        this.npcName = config.name;
        this.interactionDistance = config.interactionRadius ?? 100;
        this.dialogue = config.dialogue;

        this.characterSprite = scene.add.sprite(0, 0, config.texture);
        this.characterSprite.setOrigin(0.5, 1).setScale(config.scale ?? 1);

        this.add(this.characterSprite);

        this.nameLabel = scene.add.text(0,
            -this.characterSprite.displayHeight - 10,
            config.name, {
                fontFamily: GAME_THEME.fonts.dialogue,
                fontSize: GAME_THEME.sizes.dialogue,
                color: GAME_THEME.colors.text,
                stroke: "#263729",
                strokeThickness: 3
            }
        ).setOrigin(0.5, 1);

        this.add(this.nameLabel);

        if(config.animation && scene.anims.exists(config.animation)) {
            this.characterSprite.play(config.animation);
        }
    }

    public getSprite(): Phaser.GameObjects.Sprite {
        return this.characterSprite;
    }

    public destroy(fromScene?: boolean): void {
        super.destroy(fromScene);
    }
}