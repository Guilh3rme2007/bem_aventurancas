import Phaser from "phaser";
import { PHASES } from "../level/PhaseRegistry";
import { ProgressManager } from "../systems/ProgressManager";
import { GAME_THEME } from "../Styles/GameStyles";
import { GameRouter } from "../router/GameRouter";
import { APP_ROUTES } from "../router/routes";

export class EndingScene extends Phaser.Scene {

  constructor() {
    super("EndingScene");
  }

  init(data: { phaseId: number }) {
    this.registry.set("endingPhaseId", data.phaseId);
  }

  create() {

    const phaseId = this.registry.get("endingPhaseId") as number;

    const phase = PHASES.find(
      item => item.order === phaseId
    );

    if (!phase) {
      GameRouter.go(APP_ROUTES.MENU);
      return;
    }

    ProgressManager.completePhase(phaseId);

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
      "FASE CONCLUÍDA!",
      {
        fontSize: GAME_THEME.sizes.title,
        color: GAME_THEME.colors.text,
        fontStyle: "bold"
      }
    ).setOrigin(0.5);

    this.add.text(
      width / 2,
      height * 0.38,
      phase.title,
      {
        fontSize: GAME_THEME.sizes.title,
        color: GAME_THEME.colors.accent
      }
    ).setOrigin(0.5);

    this.add.text(
      width / 2,
      height * 0.48,
      phase.description,
      {
        fontSize: "18px",
        color: "#ffffff",
        align: "center",
        wordWrap: {
          width: width - 50
        }
      }
    ).setOrigin(0.5);

    this.add.text(
      width / 2,
      height * 0.6,
      `Referência bíblica: ${phase.verse}`,
      {
        fontSize: "17px",
        color: "#fff0cb"
      }
    ).setOrigin(0.5);

    if (phaseId < 9) {

      this.createButton(
        width / 2,
        height * 0.75,
        "PRÓXIMA FASE",
        () => {
          const nextPhase = PHASES.find(item => item.order === phaseId + 1);
          GameRouter.go(nextPhase?.route ?? APP_ROUTES.PHASE_SELECT);
        }
      );

    } else {

      this.createButton(
        width / 2,
        height * 0.75,
        "FINALIZAR JORNADA",
        () => {
          GameRouter.go(APP_ROUTES.MENU);
        }
      );

    }

    this.createButton(
      width / 2,
      height * 0.86,
      "VOLTAR AO MAPA",
      () => {
        GameRouter.go(APP_ROUTES.PHASE_SELECT);
      }
    );
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    callback: () => void
  ) {

    const button = this.add.text(
      x,
      y,
      label,
      {
        fontSize: "18px",
        color: "#493c2a",
        backgroundColor: "#e9c98d",
        padding: {
          x: 20,
          y: 12
        }
      }
    )
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

    button.on("pointerdown", callback);
  }
}
