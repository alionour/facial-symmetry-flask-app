// Application Use Case: Start Exam
import { Patient } from '../../domain/entities/Patient.js';
import { ExamSession } from '../../domain/entities/ExamSession.js';
export class StartExamUseCase {
    constructor(examRepository, cameraRepository, examActions) {
        this.examRepository = examRepository;
        this.cameraRepository = cameraRepository;
        this.examActions = examActions;
    }
    async execute(request) {
        // Create patient entity
        const patient = Patient.create(request.patientData);
        if (!patient.isValid()) {
            throw new Error('Invalid patient data');
        }
        // Create exam session
        const session = new ExamSession(patient, this.examActions);
        // Start camera
        await this.cameraRepository.startCamera(request.videoElement);
        // Save session
        await this.examRepository.saveSession(session);
        // Start the exam
        session.start();
        return session;
    }
}
