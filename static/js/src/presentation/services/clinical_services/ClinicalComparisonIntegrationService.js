// Presentation Service: Integration of Clinical Comparison with Facial Symmetry Application
// Provides left vs right movement comparison for clinical assessment
import { ClinicalComparisonService } from '../../../domain/services/ClinicalComparisonService.js';
export class ClinicalComparisonIntegrationService {
    constructor() {
        this.clinicalComparisonService = new ClinicalComparisonService();
    }
    /**
     * Perform comprehensive left vs right comparison analysis
     */
    async performClinicalComparison(examinationData) {
        console.log('Starting clinical left vs right comparison for patient:', examinationData.patientData.id);
        // Convert examination data to landmark points
        const landmarkData = this.convertToLandmarkData(examinationData.landmarkData);
        // Await promises for comparisons
        const eyebrowComparison = await this.clinicalComparisonService.compareSidesClinicalReport('eyebrow_raise', landmarkData.eyebrowRaise, landmarkData.baseline);
        const eyeComparison = await this.clinicalComparisonService.compareSidesClinicalReport('eye_close', landmarkData.eyeClose, landmarkData.baseline);
        const smileComparison = await this.clinicalComparisonService.compareSidesClinicalReport('smile', landmarkData.smile, landmarkData.baseline);
        // Generate detailed report
        const patientId = examinationData.patientData.id;
        const detailedReport = {
            patient_id: patientId,
            name: examinationData.patientData.name,
            age: parseInt(examinationData.patientData.age) || 0,
            examination_date: new Date().toISOString(),
            actions: {
                eyebrow_raise: eyebrowComparison,
                eye_closure: eyeComparison,
                smile: smileComparison,
            },
        };
        // Simplify logic by removing references to removed properties
        return detailedReport;
    }
    /**
     * Convert landmark data to Landmark format
     */
    convertToLandmarkData(landmarkData) {
        return {
            baseline: this.convertToLandmarks(landmarkData.baseline),
            eyebrowRaise: this.convertToLandmarks(landmarkData.eyebrowRaise),
            eyeClose: this.convertToLandmarks(landmarkData.eyeClose),
            smile: this.convertToLandmarks(landmarkData.smile),
        };
    }
    /**
     * Convert array to Landmark array
     */
    convertToLandmarks(landmarks) {
        return landmarks.map(landmark => ({
            x: landmark.x || 0,
            y: landmark.y || 0,
            z: landmark.z || 0
        }));
    }
    /**
     * Get priority color for UI display
     */
    getPriorityColor(priority) {
        switch (priority) {
            case 'urgent': return '#e74c3c'; // Red
            case 'high': return '#e67e22'; // Orange
            case 'medium': return '#f39c12'; // Yellow
            case 'low': return '#27ae60'; // Green
            default: return '#95a5a6'; // Gray
        }
    }
    /**
     * Get severity color for UI display
     */
    getSeverityColor(severity) {
        switch (severity) {
            case 'severe': return '#e74c3c'; // Red
            case 'moderate': return '#e67e22'; // Orange
            case 'mild': return '#f39c12'; // Yellow
            case 'normal': return '#27ae60'; // Green
            default: return '#95a5a6'; // Gray
        }
    }
}
