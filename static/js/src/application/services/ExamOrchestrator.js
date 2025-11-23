import { Patient } from '/static/js/src/domain/entities/Patient.js';
import { ExamSession } from '/static/js/src/domain/entities/ExamSession.js';

export class ExamOrchestrator {
    constructor(cameraRepository) {
        this.cameraRepository = cameraRepository;
    }

    async startExam(request) {
        const response = await fetch('/api/start-exam', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request.patientData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to start exam:', errorData);
            throw new Error('Failed to start exam: ' + (errorData.error || 'Unknown error'));
        }

        const { session: sessionData } = await response.json();

        const patient = new Patient(sessionData.patient.id, sessionData.patient.name, sessionData.patient.age, sessionData.patient.date);
        this.currentSession = new ExamSession(patient, sessionData.actions);

        // Manually set the state from the server
        this.currentSession._currentActionIndex = sessionData.currentActionIndex;
        this.currentSession._isStarted = sessionData.isStarted;
        this.currentSession._results = sessionData.results;

        // Now, start the camera
        await this.cameraRepository.startCamera(request.videoElement);

        return this.currentSession;
    }

    async processFacialData(landmarks) {
        if (!this.currentSession) {
            throw new Error('No active exam session');
        }

        const currentAction = this.currentSession.getCurrentAction();

        const response = await fetch('/api/process-facial-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                landmarks,
                currentAction,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to process facial data:', errorData);
            throw new Error('Failed to process facial data: ' + (errorData.error || 'Unknown error'));
        }

        const results = await response.json();

        if (results && results.length > 0) {
            results.forEach(result => {
                this.currentSession.addResult(result);
            });
        }
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

        const analysisData = {
            patientData: this.currentSession.patient,
            analysisResult: this.currentSession.getResults(),
        };

        const response = await fetch('/export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                analysisData,
                format,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to export results:', errorData);
            throw new Error('Failed to export results: ' + (errorData.error || 'Unknown error'));
        }

        // Trigger file download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `facial_symmetry_report.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    getCurrentSession() {
        return this.currentSession;
    }
}

