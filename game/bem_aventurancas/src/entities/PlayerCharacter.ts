import Phaser from "phaser";
import type { PlayerInputState } from "../systems/InputManager";
import type { JerusalemLevel } from "../worlds/jerusalem/JerusalemLevel";

export type PlayerDirection = "up" | "down" | "left" | "right";
export type PlayerAnimation =
  | `idle-${PlayerDirection}`
  | `walk-${PlayerDirection}`;
export type PlayerState = "idle" | "walking" | "interacting" | "dialogue";

export interface PlayerCharacterConfig {
  id: string;
  position: { x: number; y: number };
  speed: { x: number; y: number };
  scale: number;
  texture?: string;
  initialDirection: PlayerDirection;
  controlsEnabled: boolean;
  displaySize?: { width: number; height: number };
  collision?: { halfWidth: number; depth: number };
  animations?: Partial<Record<PlayerAnimation, string>>;
}

const DEFAULT_DISPLAY_SIZE = { width: 35, height: 65 };
const DEFAULT_COLLISION = { halfWidth: 13, depth: 12 };

export class PlayerCharacter extends Phaser.GameObjects.Container {
  readonly id: string;

  private readonly speed: PlayerCharacterConfig["speed"];
  private readonly displaySize: { width: number; height: number };
  private readonly collision: { halfWidth: number; depth: number };
  private readonly animationKeys: PlayerCharacterConfig["animations"];
  private readonly sprite?: Phaser.GameObjects.Sprite;
  private facing: PlayerDirection;
  private moving = false;
  private interacting = false;
  private inDialogue = false;
  private controlsEnabled: boolean;
  private destroyed = false;
  private currentAnimation?: string;

  constructor(
    scene: Phaser.Scene,
    config: PlayerCharacterConfig,
  ) {
    super(scene, config.position.x, config.position.y);

    this.id = config.id;
    this.speed = config.speed;
    this.displaySize = config.displaySize ?? DEFAULT_DISPLAY_SIZE;
    this.collision = config.collision ?? DEFAULT_COLLISION;
    this.animationKeys = config.animations;
    this.facing = config.initialDirection;
    this.controlsEnabled = config.controlsEnabled;

    const textureAvailable = Boolean(
      config.texture && scene.textures.exists(config.texture),
    );

    if (config.texture && !textureAvailable) {
      console.warn(
        `Player "${config.id}" texture "${config.texture}" is unavailable; using the temporary placeholder.`,
      );
    }

    if (textureAvailable && config.texture) {
      this.sprite = scene.add
        .sprite(0, 0, config.texture)
        .setOrigin(0.5)
        .setDisplaySize(this.displaySize.width, this.displaySize.height);
      this.add(this.sprite);
    } else {
      const placeholder = scene.add.rectangle(
        0,
        0,
        this.displaySize.width,
        this.displaySize.height,
        0xf5edda,
      ).setStrokeStyle(2, 0x304b38);

      const placeholderLabel = scene.add.text(
        0,
        -this.displaySize.height / 2 - 10,
        "PLAYER TEMP",
        {
          fontSize: "11px",
          color: "#1c3025",
          backgroundColor: "#f5edda",
          padding: { x: 3, y: 1 },
        },
      ).setOrigin(0.5, 1);

      this.add([placeholder, placeholderLabel]);
    }

    this.setScale(config.scale);
    scene.add.existing(this);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.updateAnimation();
  }

  get direction(): PlayerDirection {
    return this.facing;
  }

  get isMoving(): boolean {
    return this.moving;
  }

  get isInteracting(): boolean {
    return this.interacting;
  }

  get isInDialogue(): boolean {
    return this.inDialogue;
  }

  get movementState(): PlayerState {
    if (this.inDialogue) return "dialogue";
    if (this.interacting) return "interacting";
    return this.moving ? "walking" : "idle";
  }

  getBottomCenter(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(
      this.x,
      this.y + (this.displaySize.height * this.scaleY) / 2,
    );
  }

  setControlsEnabled(enabled: boolean): void {
    if (enabled === this.controlsEnabled) return;
    this.controlsEnabled = enabled;

    if (!enabled) this.moving = false;
    this.updateAnimation();
  }

  setInteracting(interacting: boolean): void {
    this.interacting = interacting;
    if (interacting) this.moving = false;
    this.updateAnimation();
  }

  setDialogueActive(active: boolean): void {
    this.inDialogue = active;
    if (active) this.moving = false;
    this.updateAnimation();
  }

  update(delta: number, level: JerusalemLevel, input: PlayerInputState): void {
    if (!this.controlsEnabled || this.interacting || this.inDialogue) {
      this.moving = false;
      this.updateAnimation();
      return;
    }

    const horizontal = Number(input.right) - Number(input.left);
    const vertical = Number(input.down) - Number(input.up);

    if (horizontal === 0 && vertical === 0) {
      this.moving = false;
      this.updateAnimation();
      return;
    }

    const direction = new Phaser.Math.Vector2(horizontal, vertical).normalize();
    if (horizontal !== 0) {
      this.facing = horizontal < 0 ? "left" : "right";
    } else {
      this.facing = vertical < 0 ? "up" : "down";
    }

    const previousX = this.x;
    const previousY = this.y;
    const seconds = Math.max(0, delta) / 1000;

    level.moveBy(
      direction.x * this.speed.x * seconds,
      direction.y * this.speed.y * seconds,
      this.collision.halfWidth,
      this.collision.depth,
    );

    this.moving = this.x !== previousX || this.y !== previousY;
    this.updateAnimation();
  }

  destroy(fromScene?: boolean): void {
    if (this.destroyed) return;
    this.destroyed = true;

    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);

    super.destroy(fromScene);
  }

  private updateAnimation(): void {
    if (!this.sprite) return;

    const animation: PlayerAnimation =
      `${this.moving ? "walk" : "idle"}-${this.facing}`;
    const key = this.animationKeys?.[animation];

    if (key && this.scene.anims.exists(key) && key !== this.currentAnimation) {
      this.sprite.play(key);
      this.currentAnimation = key;
    } else if ((!key || !this.scene.anims.exists(key)) && this.currentAnimation) {
      this.sprite.anims.stop();
      this.currentAnimation = undefined;
    }
  }
}
