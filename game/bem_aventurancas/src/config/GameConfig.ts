import Phaser from "phaser";
import { MenuScene } from "../scenes/MenuScenes";
import { PhaseSelectScene } from "../scenes/PhaseSelectScene";
import { ExplorationScene } from "../scenes/ExplorationScenes";
import { EndingScene } from "../scenes/EndingScene";
import { SettingsScene } from "../scenes/SettingsScene";
import { HumildesEspiritosScene } from "../level/humildes_espirito/HumildesEspiritoScene";

export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: "game-container",
    backgroundColor: "#1c3025",
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    input: {
        activePointers: 3
    },
    scene: [
        MenuScene,
        PhaseSelectScene,
        ExplorationScene,
        EndingScene,
        SettingsScene,
        HumildesEspiritosScene
    ]
};