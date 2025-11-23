export class ExamOrchestrator {
    constructor(startExamUseCase, processFacialDataUseCase, exportResultsUseCase) {
        this.startExamUseCase = startExamUseCase;
        this.processFacialDataUseCase = processFacialDataUseCase;
        this.exportResultsUseCase = exportResultsUseCase;
    }
    async startExam(request) {
        this.currentSession = await this.startExamUseCase.execute(request);
        return this.currentSession;
    }
    async processFacialData(landmarks) {
        if (!this.currentSession) {
            throw new Error('No active exam session');
        }
        await this.processFacialDataUseCase.execute({
            session: this.currentSession,
            landmarks
        });
    }
    async nextAction() {
        if (!this.currentSession) {
            return false;
        }
        return this.currentSession.nextAction();
    }
    getCurrentAction() {
        return this.currentSession?.getCurrentAction();
    }
    isExamCompleted() {
        return this.currentSession?.isCompleted() || false;
    }
    async exportResults(format) {
        if (!this.currentSession) {
            throw new Error('No active exam session');
        }
        return await this.exportResultsUseCase.execute({
            session: this.currentSession,
            format
        });
    }
    getCurrentSession() {
        return this.currentSession;
    }
}
