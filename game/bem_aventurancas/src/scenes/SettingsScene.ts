import Phaser from "phaser";
import { GameRouter } from "../router/GameRouter";
import { APP_ROUTES } from "../router/routes";

export class SettingsScene extends Phaser.Scene {

  private musicEnabled = true;
  private voiceEnabled = true;

  constructor() {
    super("SettingsScene");
  }

  create() {

    const width = this.scale.width;
    const height = this.scale.height;

    this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x344b3b
    );

    this.add.text(
      width / 2,
      height * 0.2,
      "CONFIGURAÇÕES",
      {
        fontSize: "32px",
        color: "#fff0cb"
      }
    ).setOrigin(0.5);

    const music = this.add.text(
      width / 2,
      height * 0.4,
      "Música: LIGADA",
      {
        fontSize: "20px",
        color: "#ffffff"
      }
    ).setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    music.on("pointerdown", () => {

      this.musicEnabled = !this.musicEnabled;

      music.setText(
        `Música: ${this.musicEnabled ? "LIGADA" : "DESLIGADA"}`
      );

      this.sound.getAllPlaying().forEach(sound => {
        this.sound.setMute(!this.musicEnabled);
      });
    });

    const voice = this.add.text(
      width / 2,
      height * 0.5,
      "Vozes: LIGADAS",
      {
        fontSize: "20px",
        color: "#ffffff"
      }
    ).setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    voice.on("pointerdown", () => {

      this.voiceEnabled = !this.voiceEnabled;

      voice.setText(
        `Vozes: ${this.voiceEnabled ? "LIGADAS" : "DESLIGADAS"}`
      );

    });

    const back = this.add.text(
      width / 2,
      height * 0.75,
      "VOLTAR",
      {
        fontSize: "20px",
        color: "#e9c98d"
      }
    ).setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    back.on("pointerdown", () => {
      GameRouter.go(APP_ROUTES.MENU);
    });
  }
}
