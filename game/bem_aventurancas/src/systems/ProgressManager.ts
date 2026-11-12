const STOREGE_KEY = "bem_aventurancas_progress";
export interface GameProgress {
    unlockedPhases: number;
    completedPhases: number[];
    lastPhase: number;
    hasStarted: boolean;
}
const initialProgress: GameProgress = {
    unlockedPhases: 1,
    completedPhases: [],
    lastPhase: 0,
    hasStarted: false
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isPhaseNumber(value: unknown): value is number {
    return typeof value === "number" &&
        Number.isInteger(value) &&
        value >= 1 &&
        value <= 9;
}

export class ProgressManager {
    static getProgress(): GameProgress {
        const saved = localStorage.getItem(STOREGE_KEY);
        if (!saved) {
            return {...initialProgress};
        }
        try{
            const progress: unknown = JSON.parse(saved);
            if (!isRecord(progress)) {
                return {...initialProgress};
            }

            const completedPhases = Array.isArray(progress.completedPhases)
                ? progress.completedPhases.filter(isPhaseNumber)
                : initialProgress.completedPhases;

            return {
                unlockedPhases: isPhaseNumber(progress.unlockedPhases)
                    ? progress.unlockedPhases
                    : initialProgress.unlockedPhases,
                completedPhases,
                lastPhase: progress.lastPhase === 0 || isPhaseNumber(progress.lastPhase)
                    ? progress.lastPhase
                    : initialProgress.lastPhase,
                hasStarted: typeof progress.hasStarted === "boolean"
                    ? progress.hasStarted
                    : initialProgress.hasStarted
            };
        } catch {
            return {...initialProgress};
        }
    }
    static saveProgress(progress: GameProgress): void {
        localStorage.setItem(STOREGE_KEY, JSON.stringify(progress));
    }
    static isUnlocked(phaseId: number): boolean {
        if (!isPhaseNumber(phaseId)) {
            return false;
        }
        const progress = this.getProgress();
        return phaseId <= progress.unlockedPhases;
    }
    static startPhase(phaseId: number): boolean {
        if(!Number.isInteger(phaseId) || phaseId < 1 || phaseId > 9 || !this.isUnlocked(phaseId)) {
            return false;
        }
        const progress = this.getProgress();
        progress.lastPhase = phaseId;
        progress.hasStarted = true;
        this.saveProgress(progress);
        return true;
    }
    static completePhase(phaseId: number): void {
        const progress = this.getProgress();
        if(!Number.isInteger(phaseId) || phaseId < 1 || phaseId > 9 || phaseId > progress.unlockedPhases) {
            return;
        }
        if(!progress.completedPhases.includes(phaseId)) {
            progress.completedPhases.push(phaseId);
        }
        if(phaseId < 9) {
            progress.unlockedPhases = Math.max(progress.unlockedPhases, phaseId + 1);
        }
        this.saveProgress(progress);
    }
    static resetProgress(): void {
        localStorage.removeItem(STOREGE_KEY);
    }
}