// Infrastructure: Exam Actions Configuration
import { FacialActions } from '../../domain/entities/ExamAction.js';
export class ExamActionsConfig {
    static getDefaultActions() {
        return [
            FacialActions.neutral,
            FacialActions.EyebrowRaise,
            FacialActions.EyeClosure,
            FacialActions.Smile
        ];
    }
}
