/**
 * Domain Service: Sunnybrook Facial Grading System Scoring
 * Implements the standard Sunnybrook scale for facial palsy assessment.
 * 
 * The Sunnybrook scale consists of three parts:
 * 1. Resting Symmetry (weighted x5)
 * 2. Symmetry of Voluntary Movement (weighted x4)
 * 3. Synkinesis (weighted x1)
 * 
 * Composite Score = Voluntary Movement Score - Resting Symmetry Score - Synkinesis Score
 * Range: 0 (complete paralysis) to 100 (normal function)
 */
export class SunnybrookScoringService {
    constructor() {
        // Standard weights for the Sunnybrook scale
        this.WEIGHTS = {
            RESTING: 5,
            VOLUNTARY: 4,
            SYNKINESIS: 1
        };
    }

    /**
     * Calculate the full Sunnybrook Composite Score
     * @param {Object} movementData - Contains landmarks for all 5 movements
     * @param {Array} baselineData - Resting state landmarks
     * @returns {Object} Detailed scoring results
     */
    calculateScore(movementData, baselineData) {
        // 1. Determine Affected Side (Paretic Side)
        // We need to know which side is "affected" to score it.
        // In a fully automated system, we infer this from the side with LESS movement.
        const affectedSide = this.determineAffectedSide(movementData, baselineData);

        // 2. Calculate Resting Symmetry Score (0-20)
        // Higher score = more asymmetry
        const restingScore = this.calculateRestingSymmetry(baselineData);

        // 3. Calculate Voluntary Movement Score (0-100)
        // Higher score = better movement
        const voluntaryScore = this.calculateVoluntaryMovement(movementData, baselineData, affectedSide);

        // 4. Calculate Synkinesis Score (0-15)
        // Higher score = more synkinesis
        const synkinesisScore = this.calculateSynkinesis(movementData, baselineData, affectedSide);

        // 5. Calculate Composite Score
        // Formula: Voluntary Movement - Resting Symmetry - Synkinesis
        const compositeScore = Math.max(0, Math.min(100, voluntaryScore - restingScore - synkinesisScore));

        return {
            compositeScore,
            restingScore,
            voluntaryScore,
            synkinesisScore,
            affectedSide,
            details: {
                resting: restingScore.details,
                voluntary: voluntaryScore.details,
                synkinesis: synkinesisScore.details
            }
        };
    }

    /**
     * Determine which side is affected (Left or Right)
     * Returns 'Left' or 'Right' based on which side has lower aggregate movement amplitude.
     */
    determineAffectedSide(movementData, baselineData) {
        // Simple heuristic: Sum of excursions for Smile and Eyebrow Raise
        // We can use the existing metrics if available, or recalculate raw displacement

        // For now, let's assume we can access the raw landmarks and calculate a quick metric
        // Or we can rely on the fact that ClinicalAnalysisService might have already calculated some metrics.
        // But this service should be standalone.

        // Let's look at Smile (Zygomaticus) and Eyebrow (Frontalis) as primary indicators
        const smile = movementData.smile;
        const eyebrow = movementData.eyebrow_raise;
        const baseline = baselineData;

        if (!smile || !eyebrow || !baseline) return 'Right'; // Default

        // Calculate Smile Excursion (Corner movement)
        const leftSmile = this.getPointDistance(baseline[61], smile[61]);
        const rightSmile = this.getPointDistance(baseline[291], smile[291]);

        // Calculate Eyebrow Elevation (Midpoint movement)
        const leftBrow = this.getPointDistance(baseline[105], eyebrow[105]);
        const rightBrow = this.getPointDistance(baseline[334], eyebrow[334]);

        const leftTotal = leftSmile + leftBrow;
        const rightTotal = rightSmile + rightBrow;

        return leftTotal < rightTotal ? 'Left' : 'Right';
    }

    /**
     * Calculate Resting Symmetry Score
     * Scored on 3 regions: Eye, Cheek, Mouth
     * Scale: 0 = Normal, 1 = Narrow/Wide/Flattened/Droop (Asymmetry present)
     * Total Resting Score = Sum(Region Scores) * 5
     * Max Score = 3 * 1 * 5 = 15? Wait, Sunnybrook usually has 3 items:
     * 1. Eye (narrow/wide)
     * 2. Cheek (nasolabial fold flat/deep) - Hard to detect with landmarks
     * 3. Mouth (corner droop/up)
     * 
     * Actually, standard Sunnybrook Resting Symmetry items are:
     * - Eye (Palpebral Fissure): Normal (0), Narrow (1), Wide (2) -> Actually usually just 0 or 1 in simplified versions, but standard is 0-2? 
     *   Let's check the standard: "Resting symmetry: Eye, Cheek, Mouth. 0=normal, 1=abnormal. Total x 5."
     *   So max raw is 3. Max weighted is 15.
     *   Wait, some versions say 0-4 scale? 
     *   Standard Sunnybrook:
     *   Resting Symmetry (weighted x5):
     *   - Eye (0=normal, 1=narrow, 2=wide) -> Actually it's often scored as "Asymmetry present = 1" or specific types.
     *   Let's use a robust interpretation: 0 = Symmetric, 1 = Asymmetric.
     *   Items: Eye, Cheek (Nasolabial fold), Mouth.
     */
    calculateRestingSymmetry(baseline) {
        let eyeScore = 0;
        let cheekScore = 0;
        let mouthScore = 0;

        // 1. Eye Symmetry (Palpebral Fissure Height)
        // Compare left vs right eye opening height
        const leftEyeHeight = this.getVerticalDistance(baseline[159], baseline[145]);
        const rightEyeHeight = this.getVerticalDistance(baseline[386], baseline[374]);

        // If difference is > 15% of the larger one, consider it asymmetric
        const eyeDiff = Math.abs(leftEyeHeight - rightEyeHeight);
        const eyeMax = Math.max(leftEyeHeight, rightEyeHeight);
        if (eyeMax > 0 && (eyeDiff / eyeMax) > 0.15) {
            eyeScore = 1;
        }

        // 2. Cheek Symmetry (Nasolabial Fold)
        // Hard to detect fold depth with mesh. We can check cheek prominence or position.
        // Let's use the position of the cheek center (approx landmark 50 vs 280) relative to nose
        // Or just skip/assume 0 if too hard. 
        // Better proxy: Check distance from nose corner to mouth corner (Nasolabial fold length/angle)
        const leftNL = this.getPointDistance(baseline[98], baseline[61]); // Left nose corner to mouth corner
        const rightNL = this.getPointDistance(baseline[327], baseline[291]); // Right nose corner to mouth corner

        const cheekDiff = Math.abs(leftNL - rightNL);
        const cheekMax = Math.max(leftNL, rightNL);
        if (cheekMax > 0 && (cheekDiff / cheekMax) > 0.15) {
            cheekScore = 1;
        }

        // 3. Mouth Symmetry (Corner Height)
        // Check vertical level of mouth corners relative to eye line or just absolute y difference if head is upright
        // Better: Vertical distance from inner eye corner to mouth corner
        const leftMouthHeight = this.getVerticalDistance(baseline[133], baseline[61]);
        const rightMouthHeight = this.getVerticalDistance(baseline[362], baseline[291]);

        const mouthDiff = Math.abs(leftMouthHeight - rightMouthHeight);
        const mouthMax = Math.max(leftMouthHeight, rightMouthHeight);
        if (mouthMax > 0 && (mouthDiff / mouthMax) > 0.10) { // Mouth is more sensitive
            mouthScore = 1;
        }

        const totalRaw = eyeScore + cheekScore + mouthScore;
        const weightedScore = totalRaw * this.WEIGHTS.RESTING;

        return {
            value: weightedScore, // For calculation
            valueOf: () => weightedScore, // Allow direct math
            details: {
                eye: eyeScore,
                cheek: cheekScore,
                mouth: mouthScore,
                totalRaw,
                weightedScore
            }
        };
    }

    // --- Placeholders for next steps ---
    /**
     * Calculate Voluntary Movement Score
     * Scored 1-5 for each of the 5 movements on the AFFECTED side.
     * 1=No movement, 2=Slight, 3=Moderate, 4=Significant, 5=Normal
     * Total Voluntary Score = Sum(Movement Scores) * 4
     * Max Score = 5 * 5 * 4 = 100
     */
    calculateVoluntaryMovement(movementData, baselineData, affectedSide) {
        const scores = {};
        let totalRaw = 0;

        // Helper to map excursion (mm) to 1-5 scale
        // Thresholds are approximate "normal" values in mm
        const scoreMovement = (excursion, normalThreshold) => {
            if (excursion < 0.1 * normalThreshold) return 1; // < 10%
            if (excursion < 0.3 * normalThreshold) return 2; // 10-30%
            if (excursion < 0.6 * normalThreshold) return 3; // 30-60%
            if (excursion < 0.85 * normalThreshold) return 4; // 60-85%
            return 5; // > 85%
        };

        // 1. Eyebrow Raise (Forehead Wrinkle)
        // Measure vertical excursion of eyebrow midpoint
        const browExcursion = this.calculateExcursion(
            baselineData,
            movementData.eyebrow_raise,
            affectedSide === 'Left' ? 105 : 334 // Midpoint indices
        );
        scores.eyebrowRaise = scoreMovement(browExcursion, 10.0); // Normal ~10mm

        // 2. Eye Closure (Gentle)
        // Measure reduction in palpebral fissure height
        // Note: Eye closure is "closing", so excursion is the distance moved by lid
        // Or simply check if it closes completely.
        // Let's measure the movement of the upper lid (159/386) downwards
        const eyeExcursion = this.calculateExcursion(
            baselineData,
            movementData.eye_close,
            affectedSide === 'Left' ? 159 : 386
        );
        scores.eyeClosure = scoreMovement(eyeExcursion, 8.0); // Normal ~8-10mm

        // 3. Open Mouth Smile
        // Measure corner excursion (diagonal)
        const smileExcursion = this.calculateExcursion(
            baselineData,
            movementData.smile,
            affectedSide === 'Left' ? 61 : 291
        );
        scores.smile = scoreMovement(smileExcursion, 12.0); // Normal ~12mm

        // 4. Snarl (Show teeth/Lift lip)
        // Measure vertical excursion of alar base/upper lip (indices 49/279 or 98/327?)
        // Let's use upper lip midway: 37 (Right) / 267 (Left) or similar
        // Using 98 (Left) and 327 (Right) for nose/lip junction
        const snarlExcursion = this.calculateExcursion(
            baselineData,
            movementData.snarl,
            affectedSide === 'Left' ? 98 : 327
        );
        scores.snarl = scoreMovement(snarlExcursion, 5.0); // Normal ~5mm

        // 5. Lip Pucker
        // Measure horizontal excursion (inward movement) of corner
        // Or total movement. Pucker is complex.
        // Let's use the corner movement again, but check direction?
        // Simple excursion is robust enough for magnitude.
        const puckerExcursion = this.calculateExcursion(
            baselineData,
            movementData.lip_pucker,
            affectedSide === 'Left' ? 61 : 291
        );
        scores.lipPucker = scoreMovement(puckerExcursion, 6.0); // Normal ~6-8mm

        // Calculate Total
        totalRaw = scores.eyebrowRaise + scores.eyeClosure + scores.smile + scores.snarl + scores.lipPucker;
        const weightedScore = totalRaw * this.WEIGHTS.VOLUNTARY;

        return {
            value: weightedScore,
            valueOf: () => weightedScore,
            details: {
                ...scores,
                totalRaw,
                weightedScore
            }
        };
    }

    /**
     * Helper to calculate Euclidean excursion of a landmark
     */
    calculateExcursion(baseline, current, index) {
        if (!baseline || !current || !baseline[index] || !current[index]) return 0;

        // Calculate raw normalized distance
        const distNorm = this.getPointDistance(baseline[index], current[index]);

        // Convert to estimated mm using IPD
        // IPD indices: 454 (Left Outer) - 234 (Right Outer)
        const ipdNorm = this.getPointDistance(baseline[454], baseline[234]);
        const ipdMm = 63.0; // Average IPD

        return ipdNorm > 0 ? (distNorm / ipdNorm) * ipdMm : 0;
    }

    /**
     * Calculate Synkinesis Score
     * Scored 0-3 for each movement on the AFFECTED side.
     * 0=None, 1=Mild, 2=Moderate, 3=Severe
     * Total Synkinesis Score = Sum(Movement Scores) * 1
     * Max Score = 5 * 3 * 1 = 15
     */
    calculateSynkinesis(movementData, baselineData, affectedSide) {
        const scores = {};
        let totalRaw = 0;

        // Helper to score involuntary movement
        const scoreInvoluntary = (excursion) => {
            if (excursion < 1.0) return 0; // Noise threshold (~1mm)
            if (excursion < 3.0) return 1; // Mild
            if (excursion < 6.0) return 2; // Moderate
            return 3; // Severe
        };

        // 1. Synkinesis during Eyebrow Raise
        // Check for Mouth Corner movement (Oral synkinesis)
        const browMouthExcursion = this.calculateExcursion(
            baselineData,
            movementData.eyebrow_raise,
            affectedSide === 'Left' ? 61 : 291
        );
        scores.eyebrowRaise = scoreInvoluntary(browMouthExcursion);

        // 2. Synkinesis during Eye Closure
        // Check for Mouth Corner movement (Oral synkinesis)
        const eyeMouthExcursion = this.calculateExcursion(
            baselineData,
            movementData.eye_close,
            affectedSide === 'Left' ? 61 : 291
        );
        scores.eyeClosure = scoreInvoluntary(eyeMouthExcursion);

        // 3. Synkinesis during Smile
        // Check for Eye Closure (Ocular synkinesis)
        // Measure reduction in eye height
        const smileEyeExcursion = this.calculateExcursion(
            baselineData,
            movementData.smile,
            affectedSide === 'Left' ? 159 : 386 // Upper lid movement
        );
        // Note: Smile naturally causes some eye narrowing (Duchenne marker), 
        // but excessive closing on affected side is synkinesis.
        // We might need a higher threshold here or compare to unaffected side?
        // For now, use standard threshold but maybe slightly higher start
        scores.smile = scoreInvoluntary(Math.max(0, smileEyeExcursion - 1.0)); // Subtract 1mm for natural movement

        // 4. Synkinesis during Snarl
        // Check for Eye Closure
        const snarlEyeExcursion = this.calculateExcursion(
            baselineData,
            movementData.snarl,
            affectedSide === 'Left' ? 159 : 386
        );
        scores.snarl = scoreInvoluntary(snarlEyeExcursion);

        // 5. Synkinesis during Lip Pucker
        // Check for Eye Closure
        const puckerEyeExcursion = this.calculateExcursion(
            baselineData,
            movementData.lip_pucker,
            affectedSide === 'Left' ? 159 : 386
        );
        scores.lipPucker = scoreInvoluntary(puckerEyeExcursion);

        // Calculate Total
        totalRaw = scores.eyebrowRaise + scores.eyeClosure + scores.smile + scores.snarl + scores.lipPucker;
        const weightedScore = totalRaw * this.WEIGHTS.SYNKINESIS;

        return {
            value: weightedScore,
            valueOf: () => weightedScore,
            details: {
                ...scores,
                totalRaw,
                weightedScore
            }
        };
    }

    // --- Helpers ---

    getPointDistance(p1, p2) {
        if (!p1 || !p2) return 0;
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    getVerticalDistance(p1, p2) {
        if (!p1 || !p2) return 0;
        return Math.abs(p1.y - p2.y);
    }
}
