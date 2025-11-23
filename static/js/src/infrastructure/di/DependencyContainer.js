// Infrastructure: Dependency Injection Container
import { MetricCalculationService } from '../../domain/services/MetricCalculationService.js';
import { ExamRepository } from '../repositories/ExamRepository.js';
import { CameraRepository } from '../repositories/CameraRepository.js';
import { StartExamUseCase } from '../../application/use-cases/StartExamUseCase.js';
import { ProcessFacialDataUseCase } from '../../application/use-cases/ProcessFacialDataUseCase.js';
import { ExportResultsUseCase } from '../../application/use-cases/ExportResultsUseCase.js';
import { ExamOrchestrator } from '../../application/services/ExamOrchestrator.js';
import { ExamActionsConfig } from '../config/ExamActionsConfig.js';
export class DependencyContainer {
    constructor() {
        this.initializeDependencies();
    }
    static getInstance() {
        if (!DependencyContainer.instance) {
            DependencyContainer.instance = new DependencyContainer();
        }
        return DependencyContainer.instance;
    }
    initializeDependencies() {
        // Initialize repositories
        this._examRepository = new ExamRepository();
        this._cameraRepository = new CameraRepository();
        // Initialize services
        this._metricCalculationService = new MetricCalculationService();
        // Initialize use cases
        const examActions = ExamActionsConfig.getDefaultActions();
        this._startExamUseCase = new StartExamUseCase(this._examRepository, this._cameraRepository, examActions);
        this._processFacialDataUseCase = new ProcessFacialDataUseCase(this._metricCalculationService, this._examRepository);
        this._exportResultsUseCase = new ExportResultsUseCase(this._examRepository);
        // Initialize application services
        this._examOrchestrator = new ExamOrchestrator(this._startExamUseCase, this._processFacialDataUseCase, this._exportResultsUseCase);
    }
    // Getters for dependencies
    get examOrchestrator() {
        return this._examOrchestrator;
    }
    get cameraRepository() {
        return this._cameraRepository;
    }
    get examRepository() {
        return this._examRepository;
    }
}
