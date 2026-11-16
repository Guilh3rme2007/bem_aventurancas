import Phaser from "phaser";
import { InputManager } from "../systems/InputManager";
import { JerusalemLevel } from "../worlds/jerusalem/JerusalemLevel";
import { DEPTH } from "../worlds/jerusalem/JerusalemBackgroundConfig";

const PAD_RADIUS = 62;
const BUTTON_RADIUS = 38;
const EDGE_MARGIN = 24;

export class MobileControls {
  private readonly pad?: Phaser.GameObjects.Container;
  private readonly padBase?: Phaser.GameObjects.Arc;
  private readonly padKnob?: Phaser.GameObjects.Arc;
  private readonly interactionButton?: Phaser.GameObjects.Container;
  private readonly interactionBackground?: Phaser.GameObjects.Arc;
  private activePointerId?: number;
  private padScreenPosition = { x: 0, y: 0 };
  private interactionAvailable?: boolean;
  private destroyed = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly level: JerusalemLevel,
    private readonly input: InputManager,
  ) {
    if (input.deviceInfo.isTouchPrimary) {
      const base = scene.add.circle(0, 0, PAD_RADIUS, 0x1c3025, 0.45)
        .setStrokeStyle(2, 0xf5edda, 0.6)
        .setInteractive(
          new Phaser.Geom.Circle(0, 0, PAD_RADIUS),
          Phaser.Geom.Circle.Contains,
        );
      const knob = scene.add.circle(0, 0, 24, 0xd9bd79, 0.72)
        .setStrokeStyle(2, 0xfff8e9, 0.8);
      const pad = scene.add.container(0, 0, [
        base,
        knob,
        scene.add.text(0, -PAD_RADIUS + 14, "▲", {
          fontSize: "16px",
          color: "#f5edda",
        }).setOrigin(0.5),
        scene.add.text(0, PAD_RADIUS - 12, "▼", {
          fontSize: "16px",
          color: "#f5edda",
        }).setOrigin(0.5),
        scene.add.text(-PAD_RADIUS + 14, 0, "◀", {
          fontSize: "16px",
          color: "#f5edda",
        }).setOrigin(0.5),
        scene.add.text(PAD_RADIUS - 12, 0, "▶", {
          fontSize: "16px",
          color: "#f5edda",
        }).setOrigin(0.5),
      ]).setDepth(DEPTH.ui + 10);
      this.pad = pad;
      this.padBase = base;
      this.padKnob = knob;

      base.on("pointerdown", this.onPadDown);
      scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove);
      scene.input.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp);
      scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onPointerUp);

      const interactionBackground = scene.add.circle(
        0,
        0,
        BUTTON_RADIUS,
        0x304b38,
        0.36,
      ).setStrokeStyle(3, 0xf5edda, 0.52);
      const interactionLabel = scene.add.text(0, 0, "E", {
        fontSize: "28px",
        fontStyle: "bold",
        color: "#f5edda",
      }).setOrigin(0.5);
      this.interactionButton = scene.add.container(
        0,
        0,
        [interactionBackground, interactionLabel],
      ).setDepth(DEPTH.ui + 10);
      this.interactionBackground = interactionBackground;
      this.interactionButton.setSize(BUTTON_RADIUS * 2, BUTTON_RADIUS * 2);
      this.interactionButton.setInteractive(
        new Phaser.Geom.Circle(0, 0, BUTTON_RADIUS),
        Phaser.Geom.Circle.Contains,
      );
      this.interactionButton.on("pointerdown", this.onInteractionDown);
      this.interactionButton.on("pointerup", this.onInteractionUp);
      this.interactionButton.on("pointerupoutside", this.onInteractionUp);
      this.interactionButton.on("pointerout", this.onInteractionUp);
      this.setInteractionAvailable(false);

      scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
      scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
      scene.events.once(Phaser.Scenes.Events.DESTROY, this.destroy, this);
      this.layout();
    }
  }

  setInteractionAvailable(available: boolean): void {
    if (!this.interactionButton || !this.interactionBackground) return;
    if (available === this.interactionAvailable) return;
    this.interactionAvailable = available;
    this.interactionButton.setAlpha(available ? 1 : 0.5);
    this.interactionBackground
      .setFillStyle(available ? 0x304b38 : 0x1c3025, available ? 0.85 : 0.36)
      .setStrokeStyle(3, available ? 0xd9bd79 : 0xf5edda, available ? 0.9 : 0.52);

    if (available) {
      this.interactionButton.setInteractive(
        new Phaser.Geom.Circle(0, 0, BUTTON_RADIUS),
        Phaser.Geom.Circle.Contains,
      );
    } else {
      this.interactionButton.disableInteractive();
    }
  }

  private readonly onPadDown = (pointer: Phaser.Input.Pointer): void => {
    if (this.activePointerId !== undefined) return;
    this.activePointerId = pointer.id;
    this.updatePad(pointer);
  };

  private readonly onPointerMove = (pointer: Phaser.Input.Pointer): void => {
    if (pointer.id !== this.activePointerId || !pointer.isDown) return;
    this.updatePad(pointer);
  };

  private readonly onPointerUp = (pointer: Phaser.Input.Pointer): void => {
    if (pointer.id !== this.activePointerId) return;
    this.releasePad();
  };

  private readonly onInteractionDown = (): void => {
    this.interactionBackground?.setFillStyle(0xd9bd79, 0.95);
    this.input.requestInteraction();
  };

  private readonly onInteractionUp = (): void => {
    if (this.interactionAvailable) {
      this.interactionBackground?.setFillStyle(0x304b38, 0.85);
    }
  };

  private updatePad(pointer: Phaser.Input.Pointer): void {
    const dx = pointer.x - this.padScreenPosition.x;
    const dy = pointer.y - this.padScreenPosition.y;
    const distance = Math.hypot(dx, dy);
    const deadZone = PAD_RADIUS * 0.18;

    if (distance <= deadZone) {
      this.input.setTouchDirection(0, 0);
      this.padKnob?.setPosition(0, 0);
      return;
    }

    const directionX = dx / distance;
    const directionY = dy / distance;
    this.input.setTouchDirection(directionX, directionY);
    const knobDistance = Math.min(distance, PAD_RADIUS * 0.42);
    this.padKnob?.setPosition(directionX * knobDistance, directionY * knobDistance);
  }

  private releasePad(): void {
    this.activePointerId = undefined;
    this.input.setTouchDirection(0, 0);
    this.padKnob?.setPosition(0, 0);
  }

  private layout(): void {
    if (!this.pad || !this.interactionButton) return;

    const { width, height } = this.scene.scale.gameSize;
    const uiScale = Phaser.Math.Clamp(Math.min(width, height) / 640, 0.68, 1);
    const bottom = Math.max(EDGE_MARGIN + PAD_RADIUS * uiScale, Math.min(110, height * 0.16));
    const left = Math.max(EDGE_MARGIN + PAD_RADIUS * uiScale, Math.min(104, width * 0.22));
    const right = Math.max(EDGE_MARGIN + BUTTON_RADIUS * uiScale, Math.min(76, width * 0.15));
    const zoom = this.scene.cameras.main.zoom;

    this.padScreenPosition = { x: left, y: height - bottom };
    this.level.pinToScreen(this.pad, left, height - bottom);
    this.level.pinToScreen(this.interactionButton, width - right, height - bottom);

    if (this.activePointerId !== undefined) this.releasePad();
    this.pad.setScale(uiScale / zoom);
    this.interactionButton.setScale(uiScale / zoom);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.releasePad();
    this.scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.onPointerUp);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onPointerUp);
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.scene.events.off(Phaser.Scenes.Events.DESTROY, this.destroy, this);
    this.pad?.destroy();
    this.interactionButton?.destroy();
  }
}
