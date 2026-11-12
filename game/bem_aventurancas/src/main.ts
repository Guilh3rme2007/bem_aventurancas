import Phaser from "phaser";
import "./Styles/style.css";
import { GameRouter } from "./router/GameRouter";
import { GAME_CONFIG } from "./config/GameConfig";

async function startGame() {
  await document.fonts.load('500 48px Livingst');
  await document.fonts.load('400 32px AppleGaramond');
  await document.fonts.load('400 20px AppleGaramond');
  await document.fonts.load('400 23px Fragmentcore');

  const game = new Phaser.Game(GAME_CONFIG);
  const router = new GameRouter(game);

  game.events.once(Phaser.Core.Events.READY, () => {
    if (game.scene.isActive("MenuScene")) {
      router.start();
      return;
    }

    game.scene.getScene("MenuScene").events.once(
      Phaser.Scenes.Events.CREATE,
      () => router.start()
    );
  });
}

void startGame();