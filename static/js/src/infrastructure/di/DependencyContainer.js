// Infrastructure: Dependency Injection Container
import { CameraRepository } from '/static/js/src/infrastructure/repositories/CameraRepository.js';
import { ExamOrchestrator } from '/static/js/src/application/services/ExamOrchestrator.js';
import { ExamActionsConfig } from '/static/js/src/infrastructure/config/ExamActionsConfig.js';

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
        this._cameraRepository = new CameraRepository();

        // Initialize application services
        this._examOrchestrator = new ExamOrchestrator(
            this._cameraRepository
        );
    }

    // Getters for dependencies
    get examOrchestrator() {
        return this._examOrchestrator;
    }

    get cameraRepository() {
        return this._cameraRepository;
    }
}

