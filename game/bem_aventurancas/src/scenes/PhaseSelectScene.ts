import Phaser from "phaser";
import { ProgressManager } from "../systems/ProgressManager";
import { GameRouter } from "../router/GameRouter";
import { APP_ROUTES } from "../router/routes";
import { PHASES } from "../level/PhaseRegistry";

export class PhaseSelectScene extends Phaser.Scene {
    constructor(){
        super("PhaseSelectScene");
    }

    create(){
        const width = this.scale.width;

        this.add.rectangle(
            width /2,
            this.scale.height / 2,
            width,
            this.scale.height,
            0x344b3b
        );

        this.add.text(
            width / 2,
            45,
            "Bem aventuranças",
            {
                fontSize: "28px",
                color: "#fff0cb",
                fontStyle: "bold"
            }
        ).setOrigin(0.5);

        const columns = width < 650 ? 2 : 3;
        const cardWidth = width < 650 ? 165 : 230;
        const cardHeight = 115;

        const gapX = 18;
        const gapY = 18;

        const totalWidth = columns * cardWidth + (columns - 1) * gapX;

        const startX = (width - totalWidth) / 2;
        const startY = 115;

        const progress = ProgressManager.getProgress();

        PHASES.forEach((phase, index) => {
            const column = index % columns;
            const row = Math.floor(index / columns);

            const x = startX + column * (cardWidth + gapX);
            const y = startY + row * (cardHeight + gapY);

            const implemented = phase.implemented;
            const available = phase.available;
            const unlocked = implemented && available && ProgressManager.isUnlocked(phase.order);
            const completed = progress.completedPhases.includes(phase.order);

            const background = this.add.rectangle(
                x + cardWidth / 2,
                y + cardHeight / 2,
                cardWidth,
                cardHeight,
                unlocked ? 0xe9c98d : 0x777777
            );

            background.setStrokeStyle(2, 0x493c2a);

            const title = this.add.text(
                x + cardWidth / 2,
                y + 30,
                `Fase ${phase.order}`,
                {
                    fontSize: "19px",
                    color: "#493c2a",
                    fontStyle: "bold"
                }
            ).setOrigin(0.5);

            const description = this.add.text(
                x + cardWidth / 2,
                y + 65,
                !implemented
                    ? "Em desenvolvimento"
                    : !available
                        ? "Indisponível"
                        : unlocked
                            ? phase.title
                            : "Bloqueada",
                {
                    fontSize: "13px",
                    color: "#493c2a",
                    align: "center",
                    wordWrap: {
                        width: cardWidth - 20
                    }
                }
            ).setOrigin(0.5)

            if (completed) {
                this.add.text(
                    x + cardWidth / 2,
                    y + 92,
                    "Concluida",
                    {
                        fontSize: "11px",
                        color: "#27613d",
                        fontStyle: "bold"
                    }
                ).setOrigin(0.5);
            }

            if (unlocked && phase.route) {
                background.setInteractive({ useHandCursor: true });
                background.on("pointerdown", () => {
                    GameRouter.go(phase.route);
                });
            }
        });

        const back = this.add.text(
            width / 2,
            this.scale.height - 35,
            "Voltar ao Menu",
            {
                fontSize : "18px",
                color: "#fff0cb"
            }
        ).setOrigin(0.5).setInteractive({ useHandCursor : true});

        back.on("pointerdown", () => {
            GameRouter.go(APP_ROUTES.MENU);
        });
    }
}