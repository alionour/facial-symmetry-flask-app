export class ExportResultsUseCase {
    constructor(examRepository) {
        this.examRepository = examRepository;
    }
    async execute(request) {
        const { session, format } = request;
        if (!session.isCompleted()) {
            throw new Error('Exam session is not completed');
        }
        return await this.examRepository.exportResults(format);
    }
}
