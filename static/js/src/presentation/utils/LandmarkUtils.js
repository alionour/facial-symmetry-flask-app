/**
 * Utility class for landmark validation and processing
 */
export class LandmarkUtils {
    static validateLandmarks(landmarks) {
        return landmarks && landmarks.length >= this.REQUIRED_LANDMARK_COUNT;
    }
    static validateLandmarkPair(baseline, current) {
        return this.validateLandmarks(baseline) && this.validateLandmarks(current);
    }
    static copyLandmarks(landmarks) {
        return landmarks.map(landmark => ({
            x: landmark.x,
            y: landmark.y,
            z: landmark.z || 0
        }));
    }
    static calculateLandmarkQuality(baseline, current) {
        const validLandmarks = this.CRITICAL_LANDMARKS.filter(index => {
            const baseLM = baseline[index];
            const currLM = current[index];
            return baseLM && currLM &&
                baseLM.x >= 0.1 && baseLM.x <= 0.9 &&
                currLM.x >= 0.1 && currLM.x <= 0.9;
        }).length;
        const coverage = validLandmarks / this.CRITICAL_LANDMARKS.length;
        const quality = coverage >= 0.8 ? 'Excellent' :
            coverage >= 0.6 ? 'Good' :
                coverage >= 0.4 ? 'Fair' : 'Poor';
        return { coverage, quality, validCount: validLandmarks };
    }
    static distance3D(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dz = (a.z || 0) - (b.z || 0);
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
}
LandmarkUtils.REQUIRED_LANDMARK_COUNT = 468;
LandmarkUtils.CRITICAL_LANDMARKS = [33, 263, 61, 291, 48, 78, 80, 308, 328, 310];
