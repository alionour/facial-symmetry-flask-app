// Domain Service: Clinical Comparison of Left and Right Facial Movements
// Provides detailed asymmetry analysis for Bell's palsy and facial paralysis assessment
import { ClinicalIntegrationService } from '/static/js/src/presentation/services/clinical_services/ClinicalIntegrationService.js';
export class ClinicalComparisonService {
    constructor() {
        this.clinicalIntegrationService = new ClinicalIntegrationService();
    }
    /**
     * Main function to compare left and right facial movements for clinical assessment
     */
    async compareSidesClinicalReport(actionName, currentLandmarks, baselineLandmarks) {
        console.log(`Performing clinical comparison for action: ${actionName}`);
        // Validate inputs - support both MediaPipe v1 (468) and v2 (478) landmarks
        const expectedLandmarkCounts = [468, 478];
        if (!currentLandmarks || !baselineLandmarks ||
            !expectedLandmarkCounts.includes(currentLandmarks.length) ||
            !expectedLandmarkCounts.includes(baselineLandmarks.length)) {
            throw new Error(`Invalid landmark data: Expected ${expectedLandmarkCounts.join(' or ')} landmarks for current and baseline`);
        }
        // Prepare data for ClinicalIntegrationService
        const examinationData = {
            patientData: {
                id: 'N/A',
                name: 'N/A',
                age: '0'
            },
            landmarkData: {
                baseline: baselineLandmarks, // Cast to match expected type
                eyebrowRaise: [],
                eyeClose: [],
                smile: []
            },
            timestamp: new Date().toISOString()
        };
        // Perform analysis
        const analysisResult = await this.clinicalIntegrationService.performClinicalAnalysis(examinationData);
        // Extract region-specific analysis based on actionName
        let result;
        switch (actionName.toLowerCase()) {
            case 'eyebrow_raise': {
                const eyebrowAnalysis = analysisResult.eyebrow_raise;
                if (!eyebrowAnalysis) {
                    throw new Error(`No eyebrow analysis result found for action: ${actionName}`);
                }
                result = {
                    action: actionName,
                    left_movement: eyebrowAnalysis.left_eyebrow_displacement,
                    right_movement: eyebrowAnalysis.right_eyebrow_displacement,
                };
                break;
            }
            case 'eye_close': {
                const eyeAnalysis = analysisResult.eye_close;
                if (!eyeAnalysis) {
                    throw new Error(`No eye analysis result found for action: ${actionName}`);
                }
                result = {
                    action: actionName,
                    left_movement: eyeAnalysis.left_eye_closure,
                    right_movement: eyeAnalysis.right_eye_closure,
                };
                break;
            }
            case 'smile': {
                const mouthAnalysis = analysisResult.smile;
                if (!mouthAnalysis) {
                    throw new Error(`No mouth analysis result found for action: ${actionName}`);
                }
                result = {
                    action: actionName,
                    left_movement: mouthAnalysis.left_mouth_horizontal_displacement + mouthAnalysis.left_mouth_vertical_displacement,
                    right_movement: mouthAnalysis.right_mouth_horizontal_displacement + mouthAnalysis.right_mouth_vertical_displacement,
                };
                break;
            }
            default:
                throw new Error(`Unsupported action: ${actionName}`);
        }
        return result;
    }
    /**
     * Generate comprehensive clinical report for all facial actions
     */
    async generateDetailedComparisonReport(patientId, landmarkData) {
        console.log(`Generating detailed comparison report for patient: ${patientId}`);
        // Perform comparison for each action
        const eyebrowResult = await this.compareSidesClinicalReport('Eyebrow Raise', landmarkData.eyebrow_raise, landmarkData.baseline);
        const eyeResult = await this.compareSidesClinicalReport('Eye Closure', landmarkData.eye_closure, landmarkData.baseline);
        const smileResult = await this.compareSidesClinicalReport('Smile', landmarkData.smile, landmarkData.baseline);
        const report = {
            patient_id: patientId,
            examination_date: new Date().toISOString(),
            actions: {
                eyebrow_raise: eyebrowResult,
                eye_closure: eyeResult,
                smile: smileResult,
            },
        };
        console.log('Detailed comparison report generated:', report);
        return report;
    }
}
