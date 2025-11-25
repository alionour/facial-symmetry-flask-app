// Infrastructure: Exam Actions Configuration
import { FacialActions } from '/static/js/src/domain/entities/ExamAction.js';
export class ExamActionsConfig {
    static getDefaultActions() {
        return [
            FacialActions.neutral,
            FacialActions.EyebrowRaise,
            FacialActions.EyeClosure,
            FacialActions.Smile,
            FacialActions.Snarl,
            FacialActions.LipPucker
        ];
    }
}
