/**
 * Utility class for consolidated logging
 */
export class LogUtils {
    static logAnalysisResults(title, results) {
        console.log(`🔬 ${title}`);
        if (results.left_movement !== undefined) {
            console.log(`   Left: ${results.left_movement.toFixed(6)}, Right: ${results.right_movement?.toFixed(6)}, Asymmetry: ${results.asymmetry_index?.toFixed(6)}`);
            console.log(`   Severity: ${results.severity}, Affected: ${results.affected_side}`);
        }
    }
    static logDistanceAnalysis(distances) {
        console.log('📐 DISTANCE ANALYSIS:');
        console.log(`   Vertical: L=${distances.leftVerticalDistance.toFixed(6)}, R=${distances.rightVerticalDistance.toFixed(6)}`);
        console.log(`   Horizontal: L=${distances.leftHorizontalDistance.toFixed(6)}, R=${distances.rightHorizontalDistance.toFixed(6)}`);
    }
    static logPeakTracking(actionType, movement, peak, frameCount) {
        if (frameCount % 10 === 0) {
            console.log(`🎯 ${actionType}: Current=${movement.toFixed(4)}, Peak=${peak.toFixed(4)}, Frame=${frameCount}`);
        }
    }
}
