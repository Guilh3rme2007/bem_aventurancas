import Phaser from "phaser";
import { DeviceDetector, DeviceInfo } from "./DeviceDetector";

export interface PlayerInputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  interact: boolean;
}

export class InputManager {
  readonly deviceInfo: DeviceInfo;

  private readonly keyboard?: Phaser.Input.Keyboard.KeyboardPlugin;
  private readonly cursorKeys?: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd?: Record<"W" | "A" | "S" | "D", Phaser.Input.Keyboard.Key>;
  private readonly interactKey?: Phaser.Input.Keyboard.Key;
  private touchDirection = new Phaser.Math.Vector2();
  private interactionRequested = false;
  private destroyed = false;

  constructor(private readonly scene: Phaser.Scene) {
    this.deviceInfo = DeviceDetector.detect();
    this.keyboard = scene.input.keyboard ?? undefined;

    if (this.keyboard) {
      this.cursorKeys = this.keyboard.createCursorKeys();
      this.wasd = this.keyboard.addKeys("W,A,S,D") as typeof this.wasd;
      this.interactKey = this.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    }

    window.addEventListener("blur", this.clearTransientInput);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    scene.events.once(Phaser.Scenes.Events.DESTROY, this.destroy, this);
  }

  getState(): PlayerInputState {
    const keyboardX = this.cursorKeys && this.wasd
      ? Number(this.cursorKeys.right.isDown || this.wasd.D.isDown) -
        Number(this.cursorKeys.left.isDown || this.wasd.A.isDown)
      : 0;
    const keyboardY = this.cursorKeys && this.wasd
      ? Number(this.cursorKeys.down.isDown || this.wasd.S.isDown) -
        Number(this.cursorKeys.up.isDown || this.wasd.W.isDown)
      : 0;

    // The virtual stick takes priority as a whole to avoid combining unrelated
    // keyboard and touch axes. Keyboard input resumes immediately on release.
    const touchActive = this.touchDirection.lengthSq() > 0;
    const horizontal = touchActive ? this.touchDirection.x : keyboardX;
    const vertical = touchActive ? this.touchDirection.y : keyboardY;
    const interact = this.interactionRequested ||
      Boolean(this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey));

    this.interactionRequested = false;

    return {
      up: vertical < 0,
      down: vertical > 0,
      left: horizontal < 0,
      right: horizontal > 0,
      interact,
    };
  }

  setTouchDirection(x: number, y: number): void {
    this.touchDirection.set(x, y).limit(1);
  }

  requestInteraction(): void {
    this.interactionRequested = true;
  }

  clearTransientInput = (): void => {
    this.touchDirection.set(0, 0);
    this.interactionRequested = false;
    for (const key of [
      this.cursorKeys?.up,
      this.cursorKeys?.down,
      this.cursorKeys?.left,
      this.cursorKeys?.right,
      this.wasd?.W,
      this.wasd?.A,
      this.wasd?.S,
      this.wasd?.D,
      this.interactKey,
    ]) {
      key?.reset();
    }
  };

  private readonly onVisibilityChange = (): void => {
    if (document.hidden) this.clearTransientInput();
  };

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    window.removeEventListener("blur", this.clearTransientInput);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.scene.events.off(Phaser.Scenes.Events.DESTROY, this.destroy, this);

    if (this.keyboard) {
      const keys = [
        this.cursorKeys?.up,
        this.cursorKeys?.down,
        this.cursorKeys?.left,
        this.cursorKeys?.right,
        this.wasd?.W,
        this.wasd?.A,
        this.wasd?.S,
        this.wasd?.D,
        this.interactKey,
      ];
      for (const key of keys) {
        if (key) this.keyboard.removeKey(key, true);
      }
    }

    this.clearTransientInput();
  }
}
