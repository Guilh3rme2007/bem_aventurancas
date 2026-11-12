import Phaser from "phaser";
import { APP_ROUTES } from "./routes";
import { PHASES } from "../level/PhaseRegistry";
import { ProgressManager } from "../systems/ProgressManager";

export class GameRouter {
    private static instance: GameRouter;
    private started = false;

    constructor(private game: Phaser.Game) {
        GameRouter.instance = this;
    }

    start(): void {
        if (this.started) {
            return;
        }

        this.started = true;
        window.addEventListener("hashchange", this.handleHashChange);

        if (!window.location.hash) {
            this.replaceRoute(APP_ROUTES.MENU);
        }

        this.openRouter(this.readRoute());
    }

    static go(path: string, query?: Record<string, string | number>): void {
        GameRouter.instance?.navigate(path, query);
    }

    private navigate(path: string, query?: Record<string, string | number>): void {
        const normalizedPath = this.normalizePath(path);
        const search = new URLSearchParams();

        for (const [key, value] of Object.entries(query ?? {})) {
            search.set(key, String(value));
        }

        const route = `${normalizedPath}${search.size ? `?${search}` : ""}`;
        const newHash = `#${route}`;

        if (window.location.hash === newHash) {
            this.openRouter(route);
            return;
        }

        window.location.hash = route;
    }

    private readRoute(): string {
        return window.location.hash.slice(1) || APP_ROUTES.MENU;
    }

    private handleHashChange = (): void => {
        this.openRouter(this.readRoute());
    };

    private openRouter(route: string): void {
        const separator = route.indexOf("?");
        const path = separator < 0 ? route : route.slice(0, separator);
        const query = new URLSearchParams(separator < 0 ? "" : route.slice(separator + 1));

        switch (path) {
            case APP_ROUTES.MENU:
                this.startScene("MenuScene");
                return;

            case APP_ROUTES.PHASE_SELECT:
                this.startScene("PhaseSelectScene");
                return;

            case APP_ROUTES.SETTINGS:
                this.startScene("SettingsScene");
                return;

            case APP_ROUTES.ENDING:
                this.startScene("EndingScene", {
                    phaseId: this.getEndingPhaseId(query)
                });
                return;
        }

        const phase = PHASES.find(item => item.route === path);

        if (phase) {
            if (
                phase.implemented &&
                phase.available &&
                phase.sceneKey &&
                ProgressManager.isUnlocked(phase.order)
            ) {
                this.startScene(phase.sceneKey, { phaseId: phase.order });
                return;
            }

            this.redirectToPhaseSelect();
            return;
        }

        this.redirectToPhaseSelect();
    }

    private getEndingPhaseId(query: URLSearchParams): number {
        const requestedPhase = Number(query.get("phaseId"));
        if (Number.isInteger(requestedPhase) && requestedPhase >= 1 && requestedPhase <= 9) {
            return requestedPhase;
        }

        const lastPhase = ProgressManager.getProgress().lastPhase;
        return lastPhase >= 1 && lastPhase <= 9 ? lastPhase : 1;
    }

    private startScene(sceneKey: string, data?: object): void {
        const activeScenes = this.game.scene.getScenes(true);
        const targetIsActive = this.game.scene.isActive(sceneKey);

        if (targetIsActive) {
            for (const activeScene of activeScenes) {
                if (activeScene.scene.key !== sceneKey) {
                    activeScene.scene.stop();
                }
            }
            return;
        }

        const currentScene = activeScenes.find(
            activeScene => activeScene.scene.key !== sceneKey
        );

        for (const activeScene of activeScenes) {
            if (
                activeScene.scene.key !== sceneKey &&
                activeScene !== currentScene
            ) {
                activeScene.scene.stop();
            }
        }

        if (currentScene) {
            currentScene.scene.start(sceneKey, data);
        } else {
            this.game.scene.start(sceneKey, data);
        }
    }

    private redirectToPhaseSelect(): void {
        this.replaceRoute(APP_ROUTES.PHASE_SELECT);
        this.startScene("PhaseSelectScene");
    }

    private replaceRoute(path: string): void {
        window.history.replaceState(null, "", `#${path}`);
    }

    private normalizePath(path: string): string {
        const trimmedPath = path.trim().replace(/^#/, "");
        const pathname = trimmedPath.split("?")[0];
        const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
        return normalizedPath.replace(/\/+$/, "") || "/";
    }
}
