import Phaser from "phaser";

export const GAME_THEME = {
  colors: {
    primary: "#1C3025",
    secondary: "#304B38",
    accent: "#D9BD79",
    text: "#F5EDDA",
    dialogue: "#FFF8E9"
  },
  fonts: {
    title: "Livingst",
    body: "AppleGaramond",
    dialogue: "Fragmentcore"
  },
  sizes: 
  {
    title: "48px",
    subtitle: "32px",
    body: "20px",
    dialogue: "23px",
    button: "18px"
  }
}

const toPhaserColor = (hex: string): number => {
  return Phaser.Display.Color.HexStringToColor(hex).color;
}


export function createBackground(
  scene: Phaser.Scene,
  texture: string
): Phaser.GameObjects.Image | null {
  if (!scene.textures.exists(texture)) {
    console.warn(`Imagem não encontrada: ${texture}`);
    return null;
  }

  const background = scene.add
    .image(0, 0, texture)
    .setOrigin(0.5)
    .setDepth(-10);

  const resizeBackground = (
    gameSize: Phaser.Structs.Size
  ) => {
    const width = gameSize.width;
    const height = gameSize.height;

    // Escala proporcional para preencher toda a tela.
    const scaleX = width / background.width;
    const scaleY = height / background.height;

    // Utiliza a maior escala para não deixar espaços vazios.
    const scale = Math.max(scaleX, scaleY);

    background
      .setPosition(width / 2, height / 2)
      .setScale(scale);
  };

  // Aplica o tamanho inicial.
  resizeBackground(scene.scale.gameSize);

  scene.scale.on("resize", resizeBackground);

  scene.events.once("shutdown", () => {
    scene.scale.off("resize", resizeBackground);
  });

  return background;
}

export function createPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  alpha = 0.78
): Phaser.GameObjects.Rectangle {
  return scene.add
    .rectangle(x, y, width, height, toPhaserColor(GAME_THEME.colors.primary), alpha)
    .setStrokeStyle(2, toPhaserColor(GAME_THEME.colors.accent), 0.75);
}

export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  callback: () => void,
  width = 280,
  height = 52
): Phaser.GameObjects.Container {
  const background = scene.add
    .rectangle(0, 0, width, height, toPhaserColor(GAME_THEME.colors.secondary), 0.94)
    .setStrokeStyle(2, toPhaserColor(GAME_THEME.colors.accent), 0.9)
    .setInteractive({ useHandCursor: true });

  const text = scene.add.text(0, 0, label, {
    fontFamily: GAME_THEME.fonts.body,
    fontSize: GAME_THEME.sizes.button,
    color: GAME_THEME.colors.text,
    fontStyle: "bold"
  }).setOrigin(0.5);

  const button = scene.add.container(x, y, [
    background,
    text
  ]);

  background.on("pointerover", () => {
    background.setFillStyle(toPhaserColor(GAME_THEME.colors.accent), 1);
    text.setColor("#1C3025");
  });

  background.on("pointerout", () => {
    background.setFillStyle(toPhaserColor(GAME_THEME.colors.secondary), 0.94);
    text.setColor("#F5EDDA");
  });

  background.on("pointerdown", callback);

  return button;
}

export function createText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  content: string,
  fontSize = "20px",
  color = "#F5EDDA"
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, content, {
    fontFamily: GAME_THEME.fonts.body,
    fontSize: GAME_THEME.sizes.body,
    color: GAME_THEME.colors.text,
    align: "center",
    wordWrap: { width: 650 }
  }).setOrigin(0.5);
}
