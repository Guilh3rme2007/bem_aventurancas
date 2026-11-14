import Phaser from "phaser";
import { GameRouter } from "../router/GameRouter";
import { APP_ROUTES } from "../router/routes";
import { PHASES } from "../level/PhaseRegistry";

import {
  GAME_THEME,
  createBackground,
  createPanel,
  createButton,
} from "../Styles/GameStyles";

import { ProgressManager } from "../systems/ProgressManager";

export class MenuScene extends Phaser.Scene {
  private title!: Phaser.GameObjects.Text;
  private subtitle!: Phaser.GameObjects.Text;
  private panel!: Phaser.GameObjects.Rectangle;
  private overlay!: Phaser.GameObjects.Rectangle;

  private buttons: Phaser.GameObjects.Container[] = [];

  constructor() {
    super("MenuScene");
  }

  preload() {
    this.load.image(
      "menu-background",
      "assets/backgrounds/monte-das-oliveiras.webp"
    );
  }

  create() {
    createBackground(this, "menu-background");

    this.overlay = this.add.rectangle(
      0,
      0,
      this.scale.width,
      this.scale.height,
      0x101b15,
      0.28
    )
      .setOrigin(0)
      .setDepth(-5);

    this.title = this.add.text(
      0,
      0,
      "AS BEM-AVENTURANÇAS",
      {
        fontFamily: GAME_THEME.fonts.title,
        fontSize: GAME_THEME.sizes.title,
        color: GAME_THEME.colors.text,
        fontStyle: "bold",
        stroke: GAME_THEME.colors.accent,
        strokeThickness: 4,
        align: "center"
      }
    ).setOrigin(0.5);

    this.subtitle = this.add.text(
      0,
      0,
      "Uma jornada de fé, aprendizado e descoberta",
      {
        fontFamily: GAME_THEME.fonts.body,
        fontSize: GAME_THEME.sizes.body,
        color: GAME_THEME.colors.text,
        stroke: GAME_THEME.colors.accent,
        strokeThickness: 2,
        align: "center"
      }
    ).setOrigin(0.5);

    this.panel = createPanel(
      this,
      0,
      0,
      380,
      400,
      0.78
    );

    this.createMenuButtons();

    this.layout();

    this.scale.on("resize", this.layout, this);

    

    this.events.once("shutdown", () => {
      this.scale.off("resize", this.layout, this);
    });
  }

  private createMenuButtons() {
    const progress = ProgressManager.getProgress();

    this.buttons = [];

    this.buttons.push(
      createButton(
        this,
        0,
        0,
        "INICIAR JORNADA",
        () => {
          GameRouter.go(APP_ROUTES.PHASE_SELECT);
        }
      )
    );

    if (progress.hasStarted) {
      this.buttons.push(
        createButton(
          this,
          0,
          0,
          "CONTINUAR",
          () => {
            const phase = PHASES.find(item => item.order === progress.lastPhase);
            GameRouter.go(
              phase?.route ?? APP_ROUTES.PHASE_SELECT
            );
          }
        )
      );
    }

    this.buttons.push(
      createButton(
        this,
        0,
        0,
        "SELECIONAR FASE",
        () => {
          GameRouter.go(APP_ROUTES.PHASE_SELECT)
        }
      )
    );

    this.buttons.push(
      createButton(
        this,
        0,
        0,
        "CONFIGURAÇÕES",
        () => {
          GameRouter.go(APP_ROUTES.SETTINGS);
        }
      )
    );
  }

  private layout = () => {
    if (!this.title || !this.panel) return;

    const width = this.scale.width;
    const height = this.scale.height;

    const isLandscape = width > height;

    const isSmallScreen =
      width < 760 || (isLandscape && height < 500 && width < 1000);

    const isSmallLandscape =
      isLandscape && height < 500 && width < 1000;

    this.overlay
      .setPosition(0, 0)
      .setSize(width, height);

    if (isSmallLandscape) {
      this.title
        .setPosition(width / 2, 25)
        .setFontSize(Math.min(25, width * 0.045));

      this.subtitle
        .setPosition(width / 2, 55)
        .setFontSize(12);

    } else if (isSmallScreen) {
      this.title
        .setPosition(width / 2, height * 0.09)
        .setFontSize(Math.min(30, width * 0.075));

      this.subtitle
        .setPosition(width / 2, height * 0.145)
        .setFontSize(Math.min(14, width * 0.035));

    } else {
      this.title
        .setPosition(width / 2, 65)
        .setFontSize(42);

      this.subtitle
        .setPosition(width / 2, 112)
        .setFontSize(17);
    }

    const buttonCount = this.buttons.length;

    let panelX: number;
    let panelY: number;
    let panelWidth: number;
    let panelHeight: number;

    if (isSmallLandscape) {
      panelX = width / 2;
      panelY = height * 0.59;
      panelWidth = Math.min(width - 30, 380);
      panelHeight = Math.min(height * 0.76, 300);

    } else if (isSmallScreen) {
      panelX = width / 2;
      panelY = height * 0.60;
      panelWidth = Math.min(width - 30, 380);
      panelHeight = Math.min(height * 0.58, 410);

    } else {
      panelX = Math.min(230, width * 0.20);
      panelY = height / 2 + 35;
      panelWidth = 380;
      panelHeight = 400;
    }

    this.panel
      .setPosition(panelX, panelY)
      .setSize(panelWidth, panelHeight);


    const availableHeight = panelHeight - 60;

    const spacing = Math.min(
      68,
      availableHeight / Math.max(buttonCount, 1)
    );

    const buttonScale = Math.min(
      1,
      (panelWidth - 35) / 280,
      (spacing - 4) / 52
    );

    this.buttons.forEach((button, index) => {
      const offset =
        (index - (buttonCount - 1) / 2) * spacing;

      button
        .setPosition(
          panelX,
          panelY + offset
        )
        .setScale(buttonScale);
    });
  };
}