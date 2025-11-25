// Presentation Service: Integration of Clinical Analysis with Facial Symmetry Application
// Bridges the clinical analysis service with the existing examination workflow
import { ClinicalAnalysisService } from '../../../domain/services/ClinicalAnalysisService.js';
export class ClinicalIntegrationService {
    constructor() {
        this.clinicalAnalysisService = new ClinicalAnalysisService();
    }
    /**
     * Perform comprehensive clinical analysis on examination data
     */
    async performClinicalAnalysis(examinationData) {
        // Convert examination data to clinical analysis format
        const movementData = this.convertToMovementData(examinationData.landmarkData);
        const baselineData = this.convertToLandmarks(examinationData.landmarkData.baseline);
        const patientMetadata = this.convertToPatientMetadata(examinationData.patientData, examinationData.timestamp);
        // Validate input data
        const validation = this.clinicalAnalysisService.validateInputData(movementData, baselineData, patientMetadata);
        if (!validation.valid) {
            throw new Error(`Clinical analysis validation failed: ${validation.errors.join(', ')}`);
        }
        // Perform core clinical analysis
        const clinicalResult = this.clinicalAnalysisService.performFacialRegionAnalysis(movementData, baselineData, patientMetadata);
        return clinicalResult;
    }
    /**
     * Convert landmark data to movement data format
     */
    convertToMovementData(landmarkData) {
        return {
            eyebrow_raise: this.convertToLandmarks(landmarkData.eyebrowRaise),
            eye_close: this.convertToLandmarks(landmarkData.eyeClose),
            smile: this.convertToLandmarks(landmarkData.smile),
            snarl: this.convertToLandmarks(landmarkData.snarl),
            lip_pucker: this.convertToLandmarks(landmarkData.lipPucker)
        };
    }
    /**
     * Convert Landmark array to Landmark array
     */
    convertToLandmarks(landmarks) {
        return landmarks.map(landmark => ({
            x: landmark.x,
            y: landmark.y,
            z: landmark.z
        }));
    }
    /**
     * Convert patient info to metadata format
     */
    convertToPatientMetadata(patientData, timestamp) {
        return {
            patient_id: patientData.id,
            age: parseInt(patientData.age) || 0,
            examination_date: timestamp
        };
    }
}
