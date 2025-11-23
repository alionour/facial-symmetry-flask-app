// All interfaces now imported from shared types
export class ClinicalAnalysisService {
    constructor() {
        // MediaPipe landmark indices for clinical analysis
        this.LANDMARK_INDICES = {
            // Eyebrow landmarks
            LEFT_EYEBROW: [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
            RIGHT_EYEBROW: [300, 293, 334, 296, 336, 285, 295, 282, 283, 276],
            // Eye landmarks for closure analysis
            LEFT_EYE_VERTICAL: [159, 145, 153, 154],
            RIGHT_EYE_VERTICAL: [386, 374, 380, 381],
            LEFT_EYE_HORIZONTAL: [33, 133],
            RIGHT_EYE_HORIZONTAL: [362, 263],
            // Mouth landmarks for smile analysis
            LEFT_MOUTH_CORNER: 61,
            RIGHT_MOUTH_CORNER: 291,
            MOUTH_CENTER: 13,
            UPPER_LIP_CENTER: 12,
            LOWER_LIP_CENTER: 15,
            // Additional mouth landmarks for comprehensive analysis
            MOUTH_OUTLINE: [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 191, 80, 81, 82]
        };
    }
    /**
     * Main analysis function for Bell's palsy assessment
     */
    performFacialRegionAnalysis(movementData, baselineData, patientMetadata) {
        console.log('Starting clinical facial asymmetry analysis for patient:', patientMetadata.patient_id); // Calculate raw movement metrics
        const eyebrowResults = this.calculateEyebrowElevations(baselineData, movementData.eyebrow_raise);
        const eyeResults = this.calculateEyeClosures(baselineData, movementData.eye_close);
        const smileResults = this.analyzeSmileMovement(movementData.smile, baselineData);
        // Calculate symmetry metrics
        const symmetryMetrics = this.calculateSymmetryMetrics(eyebrowResults, eyeResults, smileResults);
        return {
            eyebrow_raise: eyebrowResults,
            eye_close: eyeResults,
            smile: smileResults,
            symmetryMetrics: symmetryMetrics
        };
    }
    /**
     * Public method for analyzing smile movement (for peak frame tracking)
     */
    analyzeSmileMovementForPeakTracking(smile, baseline) {
        return this.analyzeSmileMovement(smile, baseline);
    }
    /**
     * Public method for analyzing eyebrow elevations (for peak frame tracking)
     */
    analyzeEyebrowElevationForPeakTracking(baseline, eyebrowRaise) {
        return this.calculateEyebrowElevations(baseline, eyebrowRaise);
    }
    /**
     * Public method for analyzing eye closures (for peak frame tracking)
     */
    analyzeEyeClosureForPeakTracking(baseline, eyeClose) {
        return this.calculateEyeClosures(baseline, eyeClose);
    }
    /**
     * Analyze smile movement for commissure asymmetry with vertical line stability analysis
     */
    analyzeSmileMovement(smile, baseline) {
        // Enhanced smile analysis with vertical and tilted reference lines
        try {
            if (baseline.length < 468 || smile.length < 468) {
                throw new Error(`Insufficient landmark data for smile analysis. Expected at least 468 landmarks, but received baseline: ${baseline.length}, smile: ${smile.length}`);
            }
            // Define mouth corner landmarks
            const leftCornerIndex = 61;
            const rightCornerIndex = 291;
            const baselineLeftCorner = baseline[leftCornerIndex];
            const baselineRightCorner = baseline[rightCornerIndex];
            const smileLeftCorner = smile[leftCornerIndex];
            const smileRightCorner = smile[rightCornerIndex];
            if (!baselineLeftCorner || !baselineRightCorner || !smileLeftCorner || !smileRightCorner) {
                throw new Error(`Missing mouth corner/center/nose landmarks for smile analysis.`);
            }
            // Calculate interpupillary distance (IPD) for normalization (distance between outer canthi in normalized coordinates)
            const ipdNormalized = Math.sqrt(Math.pow(baseline[454].x - baseline[234].x, 2) +
                Math.pow(baseline[454].y - baseline[234].y, 2));
            const estimatedIPDMm = 63;
            // --- Utility: Perpendicular distance from point to line ---
            function pointToLineDistance(pt, lineA, lineB) {
                const numerator = Math.abs((lineB.y - lineA.y) * pt.x - (lineB.x - lineA.x) * pt.y + lineB.x * lineA.y - lineB.y * lineA.x);
                const denominator = Math.sqrt(Math.pow(lineB.y - lineA.y, 2) + Math.pow(lineB.x - lineA.x, 2));
                return denominator > 0 ? numerator / denominator : 0;
            }
            // --- Movement calculations (baseline to smile) ---
            // Horizontal movement: x difference (baseline to smile)
            const leftHorizontalMovementNorm = Math.abs(smileLeftCorner.x - baselineLeftCorner.x);
            const rightHorizontalMovementNorm = Math.abs(smileRightCorner.x - baselineRightCorner.x);
            // Vertical movement: y difference (baseline to smile)
            const leftVerticalMovementNorm = Math.abs(smileLeftCorner.y - baselineLeftCorner.y);
            const rightVerticalMovementNorm = Math.abs(smileRightCorner.y - baselineRightCorner.y);
            // Euclidean movement (as before)
            const leftMovementNormalized = Math.sqrt(Math.pow(smileLeftCorner.x - baselineLeftCorner.x, 2) +
                Math.pow(smileLeftCorner.y - baselineLeftCorner.y, 2));
            const rightMovementNormalized = Math.sqrt(Math.pow(smileRightCorner.x - baselineRightCorner.x, 2) +
                Math.pow(smileRightCorner.y - baselineRightCorner.y, 2));
            // Normalize to mm
            const leftHorizontalMm = (leftHorizontalMovementNorm / ipdNormalized) * estimatedIPDMm;
            const rightHorizontalMm = (rightHorizontalMovementNorm / ipdNormalized) * estimatedIPDMm;
            const leftVerticalMm = (leftVerticalMovementNorm / ipdNormalized) * estimatedIPDMm;
            const rightVerticalMm = (rightVerticalMovementNorm / ipdNormalized) * estimatedIPDMm;
            const leftMovementMm = (leftMovementNormalized / ipdNormalized) * estimatedIPDMm;
            const rightMovementMm = (rightMovementNormalized / ipdNormalized) * estimatedIPDMm;
            // Debug logging for movement calculations
            console.log('🔍 MOUTH MOVEMENT CALCULATION DEBUG:');
            console.log(`  Baseline Left Corner: (${baselineLeftCorner.x.toFixed(4)}, ${baselineLeftCorner.y.toFixed(4)})`);
            console.log(`  Smile Left Corner: (${smileLeftCorner.x.toFixed(4)}, ${smileLeftCorner.y.toFixed(4)})`);
            console.log(`  Baseline Right Corner: (${baselineRightCorner.x.toFixed(4)}, ${baselineRightCorner.y.toFixed(4)})`);
            console.log(`  Smile Right Corner: (${smileRightCorner.x.toFixed(4)}, ${smileRightCorner.y.toFixed(4)})`);
            console.log(`  Left Movement (normalized): ${leftMovementNormalized.toFixed(6)}`);
            console.log(`  Right Movement (normalized): ${rightMovementNormalized.toFixed(6)}`);
            console.log(`  IPD Normalized: ${ipdNormalized.toFixed(6)}`);
            console.log(`  Left Movement (mm): ${leftMovementMm.toFixed(2)}`);
            console.log(`  Right Movement (mm): ${rightMovementMm.toFixed(2)}`);
            // --- Smile-only distances to reference lines (not movement) ---
            // Horizontal: perpendicular distance from mouth corners to the vertical reference line (drawVerticalReferenceLineFromChinTip logic)
            // Get inner eye corners and chin tip from smile landmarks
            const leftEyeInner = smile[133];
            const rightEyeInner = smile[362];
            const chinTip = smile[152];
            // Calculate midpoint between inner eye corners
            const innerEyeMidpoint = {
                x: (leftEyeInner.x + rightEyeInner.x) / 2,
                y: (leftEyeInner.y + rightEyeInner.y) / 2
            };
            // The vertical reference line is from innerEyeMidpoint to chinTip (matches drawVerticalReferenceLineFromChinTip)
            // For a true vertical, swap x/y if needed, but here we use the actual anatomical line
            // Calculate perpendicular distance from mouth corners to this line
            const horizontalLeftToLine = pointToLineDistance(smileLeftCorner, innerEyeMidpoint, chinTip);
            const horizontalRightToLine = pointToLineDistance(smileRightCorner, innerEyeMidpoint, chinTip);
            const horizontalLeftToLineMm = (horizontalLeftToLine / ipdNormalized) * estimatedIPDMm;
            const horizontalRightToLineMm = (horizontalRightToLine / ipdNormalized) * estimatedIPDMm;
            // Vertical: distance from smile corners to the horizontal reference line at chin tip (tilted by inner eye angle)
            // Only use the horizontal reference line at chin tip (tilted by inner eye angle); do not fallback
            const deltaY = rightEyeInner.y - leftEyeInner.y;
            const deltaX = rightEyeInner.x - leftEyeInner.x;
            const eyeAngle = Math.atan2(deltaY, deltaX);
            const halfLength = 1; // arbitrary, just to get direction
            const lineA = { x: chinTip.x - halfLength * Math.cos(eyeAngle), y: chinTip.y - halfLength * Math.sin(eyeAngle) };
            const lineB = { x: chinTip.x + halfLength * Math.cos(eyeAngle), y: chinTip.y + halfLength * Math.sin(eyeAngle) };
            const vLeft = pointToLineDistance(smileLeftCorner, lineA, lineB);
            const vRight = pointToLineDistance(smileRightCorner, lineA, lineB);
            const smileVerticalLeftMm = (vLeft / ipdNormalized) * estimatedIPDMm;
            const smileVerticalRightMm = (vRight / ipdNormalized) * estimatedIPDMm;
            return {
                left_mouth_horizontal_displacement: leftHorizontalMm,
                right_mouth_horizontal_displacement: rightHorizontalMm,
                left_mouth_vertical_displacement: leftVerticalMm,
                right_mouth_vertical_displacement: rightVerticalMm,
                left_mouth_movement: leftMovementMm,
                right_mouth_movement: rightMovementMm,
                horizontalDistances: {
                    left: horizontalLeftToLineMm,
                    right: horizontalRightToLineMm
                },
                verticalDistances: {
                    left: smileVerticalLeftMm,
                    right: smileVerticalRightMm
                }
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Unexpected error during smile movement analysis: ${String(error)}`);
        }
    }
    // ============ UTILITY METHODS ============
    /**
     * Validate input data structure
     */
    validateInputData(movementData, baselineData, patientMetadata) {
        const errors = [];
        // Validate baseline data - support both MediaPipe v1 (468) and v2 (478) landmarks
        const expectedLandmarkCounts = [468, 478];
        if (!baselineData || !expectedLandmarkCounts.includes(baselineData.length)) {
            errors.push(`Invalid baseline data: Expected ${expectedLandmarkCounts.join(' or ')} MediaPipe facial landmarks, but received ${baselineData?.length || 0} landmarks. Please ensure MediaPipe face detection is working correctly.`);
        }
        // Validate movement data
        const requiredActions = ['eyebrow_raise', 'eye_close', 'smile'];
        // Validate required actions
        for (const action of requiredActions) {
            if (!movementData[action]) {
                errors.push(`Missing movement data for facial action '${action}'. Please ensure all required facial movements (eyebrow raise, eye close, smile) are captured.`);
            }
            else if (!expectedLandmarkCounts.includes(movementData[action].length)) {
                errors.push(`Invalid movement data for '${action}': Expected ${expectedLandmarkCounts.join(' or ')} MediaPipe facial landmarks, but received ${movementData[action].length} landmarks. Please verify face detection quality during ${action} capture.`);
            }
        }
        // Validate patient metadata
        if (!patientMetadata.patient_id) {
            errors.push('Patient identification is required: Please provide a valid patient_id for this examination.');
        }
        if (!patientMetadata.examination_date) {
            errors.push('Examination date is required: Please provide the date when this facial analysis was performed.');
        }
        if (patientMetadata.age && (patientMetadata.age < 0 || patientMetadata.age > 150)) {
            errors.push(`Invalid patient age: Age must be between 0 and 150 years, but received ${patientMetadata.age}. Please verify the patient's age.`);
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
     * Calculate eyebrow elevations from landmark data in degrees
     */
    calculateEyebrowElevations(baseline, eyebrowRaise) {
        try {
            if (baseline.length < 468 || eyebrowRaise.length < 468) {
                throw new Error(`Insufficient landmark data for eyebrow elevation analysis. Expected at least 468 landmarks, but received baseline: ${baseline.length}, eyebrowRaise: ${eyebrowRaise.length}`);
            }
            // Define eyebrow landmark indices
            const leftEyebrowLandmarks = [70, 63, 105, 66, 107];
            const rightEyebrowLandmarks = [300, 293, 334, 296, 336];
            // Extract landmark points
            const baselineLeftEyebrow = leftEyebrowLandmarks.map(i => baseline[i]);
            const baselineRightEyebrow = rightEyebrowLandmarks.map(i => baseline[i]);
            const raisedLeftEyebrow = leftEyebrowLandmarks.map(i => eyebrowRaise[i]);
            const raisedRightEyebrow = rightEyebrowLandmarks.map(i => eyebrowRaise[i]);
            // Validate all landmarks are available
            const missingData = baselineLeftEyebrow.some(p => !p) || baselineRightEyebrow.some(p => !p) ||
                raisedLeftEyebrow.some(p => !p) || raisedRightEyebrow.some(p => !p);
            if (missingData) {
                throw new Error(`Missing eyebrow landmark data for elevation analysis. Some required landmarks (70,63,105,66,107 for left; 300,293,334,296,336 for right) are not available in the provided data`);
            }
            // Calculate eyebrow elevation angles in degrees using normalized coordinates
            const leftAngles = baselineLeftEyebrow.map((baselinePoint, i) => {
                const raisedPoint = raisedLeftEyebrow[i];
                // Calculate vertical displacement in normalized coordinates
                const verticalDisplacement = Math.abs(baselinePoint.y - raisedPoint.y);
                // Calculate horizontal reference distance (to eye center for angle calculation)
                const eyeCenterLeft = baseline[133]; // Left eye center
                const horizontalDistance = Math.abs(baselinePoint.x - eyeCenterLeft.x);
                // Calculate elevation angle using arctangent (normalized coordinates work fine for angles)
                const angleRadians = Math.atan(verticalDisplacement / Math.max(horizontalDistance, 0.01));
                const angleDegrees = angleRadians * (180 / Math.PI);
                return angleDegrees;
            });
            const rightAngles = baselineRightEyebrow.map((baselinePoint, i) => {
                const raisedPoint = raisedRightEyebrow[i];
                // Calculate vertical displacement in normalized coordinates
                const verticalDisplacement = Math.abs(baselinePoint.y - raisedPoint.y);
                // Calculate horizontal reference distance (to eye center for angle calculation)
                const eyeCenterRight = baseline[362]; // Right eye center
                const horizontalDistance = Math.abs(baselinePoint.x - eyeCenterRight.x);
                // Calculate elevation angle using arctangent (normalized coordinates work fine for angles)
                const angleRadians = Math.atan(verticalDisplacement / Math.max(horizontalDistance, 0.01));
                const angleDegrees = angleRadians * (180 / Math.PI);
                return angleDegrees;
            });
            const leftMeanElevation = leftAngles.reduce((a, b) => a + b, 0) / leftAngles.length;
            const rightMeanElevation = rightAngles.reduce((a, b) => a + b, 0) / rightAngles.length;
            // Calculate asymmetry percentage
            const asymmetryPercentage = Math.abs(leftMeanElevation - rightMeanElevation) /
                Math.max(leftMeanElevation, rightMeanElevation) * 100;
            return {
                left_eyebrow_displacement: leftMeanElevation,
                right_eyebrow_displacement: rightMeanElevation,
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Unexpected error during eyebrow elevation analysis: ${String(error)}`);
        }
    }
    /**
     * Calculate eye closures from landmark data
     */
    calculateEyeClosures(baseline, eyeClose) {
        try {
            if (baseline.length < 468 || eyeClose.length < 468) {
                throw new Error(`Insufficient landmark data for eye closure analysis. Expected at least 468 landmarks, but received baseline: ${baseline.length}, eyeClose: ${eyeClose.length}`);
            }
            // Define eye landmark pairs for vertical measurements
            const leftEyePairs = [[159, 145]
                // ,[158, 153], [160, 144]
            ]; // Top-bottom pairs for left eye
            const rightEyePairs = [
                [386, 374],
                // [385, 380], [387, 373]
            ]; // Top-bottom pairs for right eye
            // Calculate baseline eye opening distances
            const baselineLeftDistances = leftEyePairs.map(([top, bottom]) => {
                if (baseline[top] && baseline[bottom]) {
                    return Math.abs(baseline[top].y - baseline[bottom].y);
                }
                return 0;
            });
            const baselineRightDistances = rightEyePairs.map(([top, bottom]) => {
                if (baseline[top] && baseline[bottom]) {
                    return Math.abs(baseline[top].y - baseline[bottom].y);
                }
                return 0;
            });
            // Calculate closure eye distances
            const closureLeftDistances = leftEyePairs.map(([top, bottom]) => {
                if (eyeClose[top] && eyeClose[bottom]) {
                    return Math.abs(eyeClose[top].y - eyeClose[bottom].y);
                }
                return 0;
            });
            const closureRightDistances = rightEyePairs.map(([top, bottom]) => {
                if (eyeClose[top] && eyeClose[bottom]) {
                    return Math.abs(eyeClose[top].y - eyeClose[bottom].y);
                }
                return 0;
            });
            // Calculate average distances
            const avgBaselineLeft = baselineLeftDistances.reduce((a, b) => a + b, 0) / baselineLeftDistances.length;
            const avgBaselineRight = baselineRightDistances.reduce((a, b) => a + b, 0) / baselineRightDistances.length;
            const avgClosureLeft = closureLeftDistances.reduce((a, b) => a + b, 0) / closureLeftDistances.length;
            const avgClosureRight = closureRightDistances.reduce((a, b) => a + b, 0) / closureRightDistances.length;
            // Calculate closure percentages
            const leftClosurePercentage = ((avgBaselineLeft - avgClosureLeft) / avgBaselineLeft) * 100;
            const rightClosurePercentage = ((avgBaselineRight - avgClosureRight) / avgBaselineRight) * 100;
            return {
                left_eye_closure: leftClosurePercentage,
                right_eye_closure: rightClosurePercentage,
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Unexpected error during eye closure analysis: ${String(error)}`);
        }
    }
    /**
     * Calculate symmetry metrics for the facial analysis results
     */
    calculateSymmetryMetrics(eyebrowResults, eyeResults, smileResults) {
        // Per-action overall calculations
        const eyebrowRaiseOverallScore = 100 - Math.abs(eyebrowResults.left_eyebrow_displacement - eyebrowResults.right_eyebrow_displacement);
        const eyeClosureOverallScore = 100 - Math.abs(eyeResults.left_eye_closure - eyeResults.right_eye_closure);
        const smileOverallScore = 100 - Math.abs(smileResults.left_mouth_horizontal_displacement - smileResults.right_mouth_horizontal_displacement);
        return {
            // Eyebrow metrics
            eyebrowRaiseAsymmetry: Math.abs(eyebrowResults.left_eyebrow_displacement -
                eyebrowResults.right_eyebrow_displacement),
            eyebrowRaiseSymmetry: eyebrowRaiseOverallScore,
            eyebrowRaiseOverallScore,
            // Eye metrics
            eyeClosureAsymmetry: Math.abs(eyeResults.left_eye_closure -
                eyeResults.right_eye_closure),
            eyeClosureSymmetry: eyeClosureOverallScore,
            eyeClosureOverallScore,
            // Mouth metrics
            smileAsymmetry: Math.abs(smileResults.left_mouth_horizontal_displacement -
                smileResults.right_mouth_horizontal_displacement),
            smileSymmetry: smileOverallScore,
            smileOverallScore,
            // Distance measurements
            horizontalDistanceAsymmetry: Math.abs(smileResults.horizontalDistances.left -
                smileResults.horizontalDistances.right),
            verticalDistanceAsymmetry: Math.abs(smileResults.verticalDistances.left -
                smileResults.verticalDistances.right),
            // Overall score (average of all symmetry scores)
            overallScore: Math.round((eyebrowRaiseOverallScore + eyeClosureOverallScore + smileOverallScore) / 3)
        };
    }
}
