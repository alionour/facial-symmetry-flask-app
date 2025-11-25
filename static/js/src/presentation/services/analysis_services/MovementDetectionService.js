// Presentation Service: Movement Detection and Validation
// Validates facial movements for clinical examination progression
import { FacialActions } from '../../../domain/entities/ExamAction.js';
export class MovementDetectionService {
    constructor() {
        this.baselineLandmarks = null;
        this.detectionHistory = new Map();
        this.HISTORY_SIZE = 5; // Keep last 5 detection results for stability
        this.initializeDetectionHistory();
    }
    /**
     * Initialize detection history for all action types
     */
    initializeDetectionHistory() {
        const actionTypes = [
            FacialActions.neutral,
            FacialActions.EyebrowRaise,
            FacialActions.EyeClosure,
            FacialActions.Smile,
            FacialActions.Snarl,
            FacialActions.LipPucker
        ];
        actionTypes.forEach(action => {
            this.detectionHistory.set(action, []);
        });
    }
    /**
     * Set baseline landmarks for movement comparison
     */
    setBaseline(landmarks) {
        if (this.isValidLandmarkData(landmarks)) {
            this.baselineLandmarks = [...landmarks];
            console.log('✓ Baseline landmarks set:', landmarks.length, 'points');
        }
    }
    /**
     * Detect and validate facial movement for specific action
     */
    detectMovement(actionType, currentLandmarks) {
        console.log(`🔍 Detecting movement for ${actionType}:`, currentLandmarks.length, 'landmarks');
        const criteria = this.getValidationCriteria(actionType);
        const result = this.validateMovement(actionType, currentLandmarks, criteria);
        // Store result in history
        this.addToHistory(actionType, result);
        // Get stabilized result based on recent history
        const stabilizedResult = this.getStabilizedResult(actionType);
        console.log(`📊 ${actionType} detection result:`, {
            detected: stabilizedResult.isDetected,
            confidence: stabilizedResult.confidence.toFixed(2),
            intensity: stabilizedResult.movementIntensity.toFixed(2),
            errors: stabilizedResult.validationErrors
        });
        return stabilizedResult;
    }
    /**
     * Get validation criteria for specific action type
     */
    getValidationCriteria(actionType) {
        const baseCriteria = {
            minLandmarkCount: 468, // Accept both 468 and 478
            minConfidence: 0.7,
            minMovementIntensity: 0.01
        };
        switch (actionType) {
            case FacialActions.neutral:
                return {
                    ...baseCriteria,
                    minMovementIntensity: 0, // No movement required for baseline
                    requiredLandmarks: [10, 151, 9, 175] // Face center landmarks
                };
            case FacialActions.EyebrowRaise:
                return {
                    ...baseCriteria,
                    minMovementIntensity: 0.02,
                    requiredLandmarks: [70, 63, 105, 66, 107, 300, 293, 334, 296, 336] // Eyebrow landmarks
                };
            case FacialActions.EyeClosure:
                return {
                    ...baseCriteria,
                    minMovementIntensity: 0.015,
                    requiredLandmarks: [159, 145, 158, 153, 133, 173, 386, 374, 385, 380, 362, 398] // Eye landmarks
                };
            case FacialActions.Smile:
                return {
                    ...baseCriteria,
                    minMovementIntensity: 0.01, // Reduced from 0.02 for better detection
                    requiredLandmarks: [61, 291, 13, 14, 17, 18] // Mouth landmarks
                };
            case FacialActions.Snarl:
                return {
                    ...baseCriteria,
                    minMovementIntensity: 0.015, // Further increased to prevent false activation
                    requiredLandmarks: [0, 6, 98, 327, 61, 291] // Upper lip, nose bridge, nostrils
                };
            case FacialActions.LipPucker:
                return {
                    ...baseCriteria,
                    minMovementIntensity: 0.01,
                    requiredLandmarks: [13, 14, 61, 291, 0, 17] // Upper/lower lip centers, corners
                };
            default:
                return {
                    ...baseCriteria,
                    requiredLandmarks: []
                };
        }
    }
    /**
     * Validate movement against criteria
     */
    validateMovement(actionType, landmarks, criteria) {
        const errors = [];
        let confidence = 0;
        let movementIntensity = 0;
        // 1. Validate landmark count
        const isValidCount = landmarks.length >= criteria.minLandmarkCount || landmarks.length === 478;
        if (!isValidCount) {
            errors.push(`Insufficient landmarks: ${landmarks.length}/${criteria.minLandmarkCount} required`);
        }
        // 2. Validate landmark structure
        const validLandmarks = landmarks.filter(l => l && typeof l.x === 'number' && typeof l.y === 'number' &&
            !isNaN(l.x) && !isNaN(l.y) &&
            l.x >= 0 && l.x <= 1 && l.y >= 0 && l.y <= 1);
        if (validLandmarks.length < landmarks.length * 0.95) {
            errors.push(`Invalid landmark structure: ${validLandmarks.length}/${landmarks.length} valid`);
        }
        // 3. Calculate confidence based on landmark quality
        confidence = validLandmarks.length / Math.max(landmarks.length, criteria.minLandmarkCount);
        // 4. Calculate movement intensity (if baseline available)
        if (this.baselineLandmarks && actionType !== FacialActions.neutral) {
            movementIntensity = this.calculateMovementIntensity(validLandmarks, this.baselineLandmarks, criteria.requiredLandmarks);
            if (movementIntensity < criteria.minMovementIntensity) {
                errors.push(`Insufficient movement detected: ${movementIntensity.toFixed(3)} < ${criteria.minMovementIntensity}`);
            }
        }
        else if (actionType !== FacialActions.neutral) {
            errors.push('No baseline available for movement comparison');
        }
        // 5. Validate required landmarks are present and stable
        const requiredLandmarkErrors = this.validateRequiredLandmarks(validLandmarks, criteria.requiredLandmarks);
        errors.push(...requiredLandmarkErrors);
        // 6. Overall detection result
        const isDetected = errors.length === 0 &&
            confidence >= criteria.minConfidence &&
            (actionType === FacialActions.neutral || movementIntensity >= criteria.minMovementIntensity);
        return {
            isDetected,
            confidence: Math.min(confidence, 1.0),
            landmarkCount: validLandmarks.length,
            movementIntensity,
            validationErrors: errors
        };
    }
    /**
     * Calculate movement intensity between current and baseline landmarks
     */
    calculateMovementIntensity(currentLandmarks, baselineLandmarks, requiredLandmarks) {
        if (requiredLandmarks.length === 0)
            return 0;
        let totalMovement = 0;
        let validComparisons = 0;
        for (const landmarkIndex of requiredLandmarks) {
            if (landmarkIndex < currentLandmarks.length && landmarkIndex < baselineLandmarks.length) {
                const current = currentLandmarks[landmarkIndex];
                const baseline = baselineLandmarks[landmarkIndex];
                if (current && baseline) {
                    const distance = Math.sqrt(Math.pow(current.x - baseline.x, 2) +
                        Math.pow(current.y - baseline.y, 2));
                    totalMovement += distance;
                    validComparisons++;
                }
            }
        }
        return validComparisons > 0 ? totalMovement / validComparisons : 0;
    }
    /**
     * Validate that required landmarks are present and have valid coordinates
     */
    validateRequiredLandmarks(landmarks, requiredIndices) {
        const errors = [];
        for (const index of requiredIndices) {
            if (index >= landmarks.length) {
                errors.push(`Missing required landmark at index ${index}`);
            }
            else {
                const landmark = landmarks[index];
                if (!landmark || typeof landmark.x !== 'number' || typeof landmark.y !== 'number') {
                    errors.push(`Invalid required landmark at index ${index}`);
                }
            }
        }
        return errors;
    }
    /**
     * Add detection result to history
     */
    addToHistory(actionType, result) {
        const history = this.detectionHistory.get(actionType) || [];
        history.push(result);
        // Keep only recent results
        if (history.length > this.HISTORY_SIZE) {
            history.shift();
        }
        this.detectionHistory.set(actionType, history);
    }
    /**
     * Get stabilized result based on recent detection history
     */
    getStabilizedResult(actionType) {
        const history = this.detectionHistory.get(actionType) || [];
        if (history.length === 0) {
            return {
                isDetected: false,
                confidence: 0,
                landmarkCount: 0,
                movementIntensity: 0,
                validationErrors: ['No detection history available']
            };
        }
        // Use the most recent result but consider stability
        const recent = history[history.length - 1];
        // Calculate stability metrics
        const recentDetections = history.slice(-3); // Last 3 results
        const detectionRate = recentDetections.filter(r => r.isDetected).length / recentDetections.length;
        const avgConfidence = recentDetections.reduce((sum, r) => sum + r.confidence, 0) / recentDetections.length;
        // Require consistent detection for stability
        const isStableDetection = detectionRate >= 0.6 && avgConfidence >= 0.7;
        return {
            ...recent,
            isDetected: recent.isDetected && isStableDetection,
            confidence: avgConfidence
        };
    }
    /**
     * Check if landmark data is valid
     */
    isValidLandmarkData(landmarks) {
        return landmarks &&
            Array.isArray(landmarks) &&
            landmarks.length >= 468 &&
            landmarks.every(l => l && typeof l.x === 'number' && typeof l.y === 'number');
    }
    /**
     * Get current detection status for all actions
     */
    getDetectionStatus() {
        const status = new Map();
        for (const [actionType, history] of this.detectionHistory) {
            const latestResult = history[history.length - 1];
            status.set(actionType, latestResult?.isDetected || false);
        }
        return status;
    }
    /**
     * Reset detection history
     */
    reset() {
        this.baselineLandmarks = null;
        this.initializeDetectionHistory();
        console.log('🔄 Movement detection service reset');
    }
    /**
     * Check if all required movements have been detected
     */
    areAllMovementsDetected() {
        const requiredActions = [
            FacialActions.neutral,
            FacialActions.EyebrowRaise,
            FacialActions.EyeClosure,
            FacialActions.Smile,
            FacialActions.Snarl,
            FacialActions.LipPucker
        ];
        const status = this.getDetectionStatus();
        return requiredActions.every(action => status.get(action) === true);
    }
}
