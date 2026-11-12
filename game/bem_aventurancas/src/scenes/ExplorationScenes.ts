
import Phaser from "phaser";
import { PHASES } from "../level/PhaseRegistry";
import { ProgressManager } from "../systems/ProgressManager";
import { GameRouter } from "../router/GameRouter";
import { APP_ROUTES } from "../router/routes";
import {
  GAME_THEME,
  createBackground,
  createPanel,
  createButton
} from "../Styles/GameStyles";

export class ExplorationScene extends Phaser.Scene {
  private phaseId = 1;
  private phase: (typeof PHASES)[number] | undefined;

  private title!: Phaser.GameObjects.Text;
  private information!: Phaser.GameObjects.Text;
  private status!: Phaser.GameObjects.Text;
  private panel!: Phaser.GameObjects.Rectangle;
  private backButton!: Phaser.GameObjects.Container;

  constructor() {
    super("ExplorationScene");
  }

  init(data: { phaseId?: number }) {
    this.phaseId = data.phaseId ?? 1;
  }

  preload() {
    this.load.image(
      "game-background",
      "/assets/backgrounds/monte-das-oliveiras.webp"
    );
  }

  create() {
    this.phase = PHASES.find(
      (item) => item.order === this.phaseId
    );

    if (
      !this.phase ||
      !this.phase.implemented ||
      !this.phase.available ||
      !ProgressManager.startPhase(this.phaseId)
    ) {
      GameRouter.go(APP_ROUTES.PHASE_SELECT);
      return;
    }

    createBackground(this, "game-background");

    this.add.rectangle(
      0, 0,
      this.scale.width,
      this.scale.height,
      0x101b15,
      0.45
    )
      .setOrigin(0)
      .setDepth(-5);

    this.panel = createPanel(
      this,
      this.scale.width / 2,
      this.scale.height / 2,
      700,
      430,
      0.88
    );

    this.title = this.add.text(
      this.scale.width / 2,
      0,
      "",
      {
        fontFamily: GAME_THEME.fonts.title,
        fontSize: GAME_THEME.sizes.title,
        color: GAME_THEME.colors.text,
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: 620 }
      }
    ).setOrigin(0.5);

    this.information = this.add.text(
      this.scale.width / 2,
      0,
      "",
      {
        fontFamily: GAME_THEME.fonts.body,
        fontSize: GAME_THEME.sizes.body,
        color: GAME_THEME.colors.text,
        align: "center",
        lineSpacing: 12,
        wordWrap: { width: 600 }
      }
    ).setOrigin(0.5);

    this.status = this.add.text(
      this.scale.width / 2,
      0,
      "FASE CARREGADA COM SUCESSO!",
      {
        fontFamily: GAME_THEME.fonts.body,
        fontSize: GAME_THEME.sizes.body,
        color: GAME_THEME.colors.text,
        fontStyle: "bold"
      }
    ).setOrigin(0.5);

    this.backButton = createButton(
      this,
      this.scale.width / 2,
      0,
      "VOLTAR À SELEÇÃO DE FASES",
      () => GameRouter.go(APP_ROUTES.PHASE_SELECT),
      320,
      55
    );

    this.updateInformation();
    this.layout();

    this.scale.on("resize", this.layout, this);
  }

  private updateInformation() {
    if (!this.phase) return;

    this.title.setText(
      `FASE ${this.phase.id}\n${this.phase.title}`
    );

    this.information.setText(
      `Personagem: ${this.phase.character}\n\n` +
      `Referência bíblica: ${this.phase.verse}\n\n` +
      `${this.phase.description}`
    );
  }

  private layout() {
    if (!this.title || !this.panel) return;

    const width = this.scale.width;
    const height = this.scale.height;
    const mobile = width < 700;

    this.panel
      .setPosition(width / 2, height / 2)
      .setSize(
        Math.min(width - 30, 700),
        Math.min(height - 40, 430)
      );

    this.title
      .setPosition(width / 2, height * 0.32)
      .setFontSize(mobile ? 24 : 34);

    this.information
      .setPosition(width / 2, height * 0.52)
      .setFontSize(mobile ? 15 : 21);

    this.status
      .setPosition(width / 2, height * 0.76)
      .setFontSize(mobile ? 14 : 18);

    this.backButton.setPosition(
      width / 2,
      height * 0.87
    ).setScale(mobile ? 0.85 : 1);
  }
}
