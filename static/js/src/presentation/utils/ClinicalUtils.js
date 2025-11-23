/**
 * Utility class for clinical calculations
 */
export class ClinicalUtils {
    static calculateAsymmetryPercentage(left, right) {
        if (left === 0 && right === 0)
            return 0;
        const max = Math.max(left, right);
        const min = Math.min(left, right);
        return max > 0 ? ((max - min) / max) * 100 : 0;
    }
    static classifySeverity(asymmetryPercentage) {
        if (asymmetryPercentage < 10)
            return 'Normal';
        if (asymmetryPercentage < 20)
            return 'Mild';
        if (asymmetryPercentage < 35)
            return 'Moderate';
        if (asymmetryPercentage < 55)
            return 'Moderately Severe';
        if (asymmetryPercentage < 80)
            return 'Severe';
        return 'Total Paralysis';
    }
    static getQualityGrade(landmarkCoverage, qualityScore = 1) {
        if (qualityScore > 0.8 && landmarkCoverage > 80)
            return 'Excellent';
        if (qualityScore > 0.6 && landmarkCoverage > 60)
            return 'Good';
        if (qualityScore > 0.4 && landmarkCoverage > 40)
            return 'Fair';
        return 'Poor';
    }
    static createErrorResult(errorMessage) {
        return {
            leftMovement: 0,
            rightMovement: 0,
            asymmetryIndex: 0,
            severity: 'Error',
            affectedSide: 'Unknown',
            dataQuality: 'error',
            error: errorMessage
        };
    }
}
