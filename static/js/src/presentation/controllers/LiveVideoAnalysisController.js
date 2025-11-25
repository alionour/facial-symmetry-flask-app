import { InstructionView } from '/static/js/src/presentation/components/InstructionView.js';
// Visualization services for facial landmark rendering
import { FaceVisualizationService } from '/static/js/src/presentation/services/visualization_services/FaceVisualizationService.js';
// Clinical analysis and integration services
import { ClinicalComparisonIntegrationService } from '../services/clinical_services/ClinicalComparisonIntegrationService.js';
import { ClinicalIntegrationService } from '../services/clinical_services/ClinicalIntegrationService.js';
import { ClinicalAnalysisService } from '../../domain/services/ClinicalAnalysisService.js';
import { DetectionStatusView } from '../components/DetectionStatusView.js';
import { MovementDetectionService } from '../services/analysis_services/MovementDetectionService.js';
// User interface and interaction services
import { ErrorView } from '../components/ErrorView.js';
import { SpeechService } from '../services/SpeechService.js';
import { CameraService } from '../services/camera_services/CameraService.js';
import { LandmarkUtils } from '../utils/LandmarkUtils.js';
import { AnalysisVisualizationService } from '../services/visualization_services/AnalysisVisualizationService.js';
// AnalysisResult now imported from shared types
// DetailedComparisonReport now imported from shared types
import { FacialActions, FacialActionInstructions, FacialActionMetrics } from '../../domain/entities/ExamAction.js';
// /**
//  * ExamController - Main controller for facial symmetry examination
//  *
//  * Orchestrates the entire examination process including:
//  * - Camera initialization and landmark detection
//  * - Real-time movement validation and peak frame tracking
//  * - Clinical analysis integration
//  * - Speech instructions and user interface management
//  * - Results collection and export functionality
//  */
export class LiveVideoAnalysisController {
    /**
     * Initialize the ExamController with all required services and dependencies
     *
     * @param examOrchestrator - Manages examination flow and action sequences
     * @param cameraRepository - Handles camera operations and MediaPipe integration
     */
    constructor(examOrchestrator, cameraRepository) {
        this.examOrchestrator = examOrchestrator;
        this.cameraRepository = cameraRepository;
        /** Prevents concurrent processing of camera frames */
        this.isProcessing = false;
        // === EXAMINATION STATE ===
        /** Tracks whether the examination has been completed */
        this.examCompleted = false;
        /** Track last action to avoid repeated logs and speech */
        this._lastAction = null;
        // === LANDMARK DATA STORAGE ===
        /** Real landmark storage for clinical analysis - stores peak frames and images for each action */
        this.landmarkStorage = new Map();
        // === 🎯 PEAK FRAME TRACKING SYSTEM ===
        /**
         * Advanced peak frame tracking system that automatically captures
         * the frame with maximum facial movement for each action.
         *
         * This ensures consistent, high-quality landmark data for clinical analysis
         * by eliminating user timing dependency and capturing optimal expressions.
         */
        this.peakFrameTracking = {
            /** Whether peak tracking is currently active */
            isTracking: false,
            /** Current facial action being tracked (smile, eyebrow_raise, etc.) */
            currentAction: null,
            /** Baseline landmarks for movement comparison */
            baselineLandmarks: undefined,
            /** Highest movement magnitude detected so far */
            peakMovement: 0,
            /** Landmarks from the frame with peak movement */
            peakFrame: undefined,
            /** Timestamp when peak movement was detected */
            peakTimestamp: 0,
            /** Total number of frames processed during tracking */
            frameCount: 0,
            /** History of recent movement values (last 30 frames) */
            movementHistory: [],
            /** When tracking started (for duration calculation) */
            actionStartTime: 0,
            /** Captured mouth measurements from peak frame (for smile actions) */
            peakMouthMovements: undefined
        };
        this.handleFinishClick = () => {
            this.finishExam();
        };
        // Initialize UI components
        this.instructionView = new InstructionView();
        // Initialize clinical analysis services
        this.clinicalIntegrationService = new ClinicalIntegrationService();
        this.clinicalComparisonService = new ClinicalComparisonIntegrationService();
        this.clinicalAnalysisService = new ClinicalAnalysisService();
        // Initialize user interaction services
        this.speechService = new SpeechService();
        this.movementDetectionService = new MovementDetectionService();
        this.detectionStatusView = new DetectionStatusView();
        // Initialize camera service
        this.cameraService = new CameraService(this.cameraRepository);
        // Initialize actions progress tracker
        this.initializeActionsProgress();
    }

    /**
     * Initialize the actions progress tracker UI
     */
    initializeActionsProgress() {
        const progressList = document.getElementById('actionsProgressList');
        if (!progressList) return;

        // Get all actions from the exam orchestrator
        const actions = this.examOrchestrator?.actions || [
            FacialActions.neutral,
            FacialActions.EyebrowRaise,
            FacialActions.EyeClosure,
            FacialActions.Smile
        ];

        // Action display names with clear descriptions
        const actionNames = {
            [FacialActions.neutral]: 'Neutral',
            [FacialActions.EyebrowRaise]: 'Eyebrow Raise',
            [FacialActions.EyeClosure]: 'Eye Closure',
            [FacialActions.Smile]: 'Smile',
            [FacialActions.Snarl]: 'Nose Wrinkle (Snarl)',
            [FacialActions.LipPucker]: 'Lip Pucker'
        };

        // Clear existing content
        progressList.innerHTML = '';

        // Create progress items for each action
        actions.forEach((action, index) => {
            const item = document.createElement('div');
            item.className = 'action-progress-item pending';
            item.dataset.action = action;

            const icon = document.createElement('div');
            icon.className = 'action-progress-icon';
            icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>';

            const text = document.createElement('span');
            text.textContent = actionNames[action] || action;

            item.appendChild(icon);
            item.appendChild(text);
            progressList.appendChild(item);
        });
    }

    /**
     * Update the actions progress tracker based on current action
     */
    updateActionsProgress() {
        const progressList = document.getElementById('actionsProgressList');
        if (!progressList) return;

        const currentAction = this.examOrchestrator?.getCurrentAction();
        const currentIndex = this.examOrchestrator?.currentActionIndex || 0;

        // Update all action items
        const items = progressList.querySelectorAll('.action-progress-item');
        items.forEach((item, index) => {
            const action = item.dataset.action;

            // Remove all status classes
            item.classList.remove('pending', 'active', 'completed');

            // Set appropriate status
            if (index < currentIndex) {
                // Completed actions
                item.classList.add('completed');
                item.querySelector('.action-progress-icon').innerHTML =
                    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/></svg>';
            } else if (action === currentAction) {
                // Current action
                item.classList.add('active');
                item.querySelector('.action-progress-icon').innerHTML =
                    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5" fill="currentColor"/></svg>';
            } else {
                // Pending actions
                item.classList.add('pending');
                item.querySelector('.action-progress-icon').innerHTML =
                    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>';
            }
        });
    }

    // === 🎯 PEAK FRAME TRACKING METHODS ===
    /**
     * Reset all examination data for a fresh start
     * This ensures no data from previous analyses interferes with the current one
     */
    resetExaminationData() {
        // Clear landmark storage from previous analyses
        this.landmarkStorage.clear();
        console.log('🗂️ Cleared landmark storage for new examination');
        // Reset peak frame tracking system completely
        this.peakFrameTracking = {
            isTracking: false,
            currentAction: null,
            baselineLandmarks: undefined,
            peakMovement: 0,
            peakFrame: undefined,
            peakTimestamp: 0,
            frameCount: 0,
            movementHistory: [],
            actionStartTime: 0,
            peakMouthMovements: undefined
        };
        console.log('🎯 Reset peak frame tracking system for new examination');
        // Reset last action tracking
        this._lastAction = null;
        // Reset processing flag
        this.isProcessing = false;
        // Reset exam completion status
        this.examCompleted = false;
        this.examResults = undefined;
        console.log('✅ All examination data reset for fresh analysis');
    }
    /**
     * Calculate movement magnitude for different facial actions
     *
     * This is the core method that quantifies facial movement for peak tracking.
     * Each action type uses specific landmarks and calculation methods optimized
     * for clinical accuracy and peak detection reliability.
     *
     * @param actionType - Type of facial action (smile, eyebrow_raise, eye_close, etc.)
     * @param currentLandmarks - Current frame landmarks (468+ points)
     * @param baselineLandmarks - Baseline/neutral landmarks for comparison
     * @returns Movement magnitude (scaled for peak comparison)
     */
    PickBestMovementActionFrame(actionType, currentLandmarks, baselineLandmarks) {
        if (!LandmarkUtils.validateLandmarkPair(baselineLandmarks, currentLandmarks)) {
            return 0;
        }
        try {
            switch (actionType) {
                case FacialActions.Smile:
                    return this.pickBestSmileFrame(currentLandmarks, baselineLandmarks);
                case FacialActions.EyebrowRaise:
                    return this.pickBestEyebrowRaiseFrame(currentLandmarks, baselineLandmarks);
                case FacialActions.EyeClosure:
                    return this.pickBestEyeClosureFrame(currentLandmarks, baselineLandmarks);
                case FacialActions.Snarl:
                    // Specific snarl calculation focusing on nose and upper lip
                    return this.pickBestSnarlFrame(currentLandmarks, baselineLandmarks);
                case FacialActions.LipPucker:
                    // Specific lip pucker calculation focusing on lip protrusion
                    return this.pickBestLipPuckerFrame(currentLandmarks, baselineLandmarks);
                case FacialActions.neutral:
                default:
                    return 0;
            }
        }
        catch (error) {
            return 0;
        }
    }

    /**
     * Calculate snarl movement using specific nose and upper lip landmarks
     * 
     * SNARL ANATOMY:
     * - Primary muscle: Levator labii superioris alaeque nasi
     * - Action: Wrinkles nose upward, raises upper lip, flares nostrils
     * 
     * MEASUREMENT APPROACH:
     * 1. Nose Wrinkle (50% weight) - Vertical movement of nose bridge
     * 2. Upper Lip Elevation (30% weight) - Upward movement of upper lip
     * 3. Nostril Flare (20% weight) - Horizontal widening of nostrils
     */
    pickBestSnarlFrame(currentLandmarks, baselineLandmarks) {
        try {
            // ===== 1. NOSE WRINKLE CALCULATION =====
            // When snarling, the nose bridge (landmark 6) moves upward
            // We measure the vertical (y-axis) displacement
            const noseBridgeCurrent = currentLandmarks[6];
            const noseBridgeBaseline = baselineLandmarks[6];

            // Calculate vertical movement (negative y = upward in screen coordinates)
            // Smaller y value = higher position = more nose wrinkle
            const noseWrinkle = Math.abs(noseBridgeBaseline.y - noseBridgeCurrent.y);

            // ===== 2. UPPER LIP ELEVATION CALCULATION =====
            // The upper lip center (landmark 0) raises during snarl
            // This is the most visible part of the snarl movement
            const upperLipCurrent = currentLandmarks[0];
            const upperLipBaseline = baselineLandmarks[0];

            // Calculate vertical movement of upper lip
            const lipElevation = Math.abs(upperLipBaseline.y - upperLipCurrent.y);

            // ===== 3. NOSTRIL FLARE CALCULATION =====
            // Nostrils (landmarks 98 and 327) widen horizontally during snarl
            // We measure the increase in distance between left and right nostrils
            const leftNostrilCurrent = currentLandmarks[98];
            const rightNostrilCurrent = currentLandmarks[327];
            const leftNostrilBaseline = baselineLandmarks[98];
            const rightNostrilBaseline = baselineLandmarks[327];

            // Calculate nostril width in current frame
            const nostrilWidthCurrent = LandmarkUtils.distance3D(
                leftNostrilCurrent,
                rightNostrilCurrent
            );

            // Calculate nostril width in baseline (neutral) frame
            const nostrilWidthBaseline = LandmarkUtils.distance3D(
                leftNostrilBaseline,
                rightNostrilBaseline
            );

            // Flare = increase in width (positive value = nostrils wider)
            const nostrilFlare = Math.max(0, nostrilWidthCurrent - nostrilWidthBaseline);

            // ===== 4. WEIGHTED COMBINATION =====
            // Combine the three measurements with clinical weighting:
            // - Nose wrinkle: 50% (most characteristic of snarl)
            // - Lip elevation: 30% (secondary indicator)
            // - Nostril flare: 20% (supporting indicator)
            const snarlScore = (noseWrinkle * 0.5) +
                (lipElevation * 0.3) +
                (nostrilFlare * 0.2);

            console.log(`🔬 Snarl peak score: ${snarlScore.toFixed(4)} (Nose:${noseWrinkle.toFixed(4)}, Lip:${lipElevation.toFixed(4)}, Flare:${nostrilFlare.toFixed(4)})`);

            // ===== 5. SCALE FOR PEAK DETECTION =====
            // Multiply by 1000 to get values in a good range for peak comparison
            // Typical snarl movements are small (0.01-0.05 in normalized coords)
            // Scaling to 10-50 range makes peak detection more reliable
            return snarlScore * 1000;

        } catch (error) {
            console.warn('🔬 Snarl calculation failed, using generic:', error);
            // Fallback to generic movement if specific calculation fails
            return this.calculateGenericMovement(currentLandmarks, baselineLandmarks);
        }
    }

    /**
     * Calculate lip pucker movement using lip landmarks
     * 
     * LIP PUCKER ANATOMY:
     * - Primary muscle: Orbicularis oris
     * - Action: Protrudes lips forward, brings corners together
     * 
     * MEASUREMENT APPROACH:
     * 1. Lip Protrusion (60% weight) - Forward movement (z-axis)
     * 2. Corner Convergence (40% weight) - Horizontal narrowing
     */
    pickBestLipPuckerFrame(currentLandmarks, baselineLandmarks) {
        try {
            // ===== 1. LIP PROTRUSION CALCULATION =====
            // During pucker, lips move forward (positive z-axis)
            // We measure the center of upper and lower lips
            const upperLipCurrent = currentLandmarks[13];  // Upper lip center
            const lowerLipCurrent = currentLandmarks[14];  // Lower lip center
            const upperLipBaseline = baselineLandmarks[13];
            const lowerLipBaseline = baselineLandmarks[14];

            // Calculate forward movement (z-axis) for both lips
            // Larger z value = more forward = more pucker
            const upperProtrusion = Math.abs(upperLipCurrent.z - upperLipBaseline.z);
            const lowerProtrusion = Math.abs(lowerLipCurrent.z - lowerLipBaseline.z);

            // Average protrusion of upper and lower lips
            const lipProtrusion = (upperProtrusion + lowerProtrusion) / 2;

            // ===== 2. LIP CORNER CONVERGENCE CALCULATION =====
            // During pucker, lip corners (61 and 291) move closer together
            // We measure the decrease in distance between corners
            const leftCornerCurrent = currentLandmarks[61];
            const rightCornerCurrent = currentLandmarks[291];
            const leftCornerBaseline = baselineLandmarks[61];
            const rightCornerBaseline = baselineLandmarks[291];

            // Calculate lip width in current frame
            const lipWidthCurrent = LandmarkUtils.distance3D(
                leftCornerCurrent,
                rightCornerCurrent
            );

            // Calculate lip width in baseline frame
            const lipWidthBaseline = LandmarkUtils.distance3D(
                leftCornerBaseline,
                rightCornerBaseline
            );

            // Convergence = decrease in width (positive value = lips narrower)
            const cornerConvergence = Math.max(0, lipWidthBaseline - lipWidthCurrent);

            // ===== 3. WEIGHTED COMBINATION =====
            // Combine measurements with clinical weighting:
            // - Lip protrusion: 60% (primary indicator of pucker)
            // - Corner convergence: 40% (secondary indicator)
            const puckerScore = (lipProtrusion * 0.6) +
                (cornerConvergence * 0.4);

            console.log(`🔬 Lip pucker peak score: ${puckerScore.toFixed(4)} (Protrusion:${lipProtrusion.toFixed(4)}, Convergence:${cornerConvergence.toFixed(4)})`);

            // ===== 4. SCALE FOR PEAK DETECTION =====
            return puckerScore * 1000;

        } catch (error) {
            console.warn('🔬 Lip pucker calculation failed, using generic:', error);
            return this.calculateGenericMovement(currentLandmarks, baselineLandmarks);
        }
    }

    calculateGenericMovement(currentLandmarks, baselineLandmarks) {
        // Simple generic movement calculation: sum of distances from baseline
        let totalMovement = 0;
        for (let i = 0; i < currentLandmarks.length; i++) {
            if (currentLandmarks[i] && baselineLandmarks[i]) {
                totalMovement += LandmarkUtils.distance3D(currentLandmarks[i], baselineLandmarks[i]);
            }
        }
        return totalMovement * 100; // Scale for peak detection sensitivity
    }

    pickBestSmileFrame(currentLandmarks, baselineLandmarks) {
        try {
            // 🔬 Use ClinicalAnalysisService for accurate, medical-grade smile movement calculation
            const smileAnalysis = this.clinicalAnalysisService.analyzeSmileMovementForPeakTracking(currentLandmarks, baselineLandmarks);
            // Extract clinical measurements (in millimeters)
            const leftMovement = smileAnalysis.left_mouth_movement || 0;
            const rightMovement = smileAnalysis.right_mouth_movement || 0;
            const leftHorizontal = smileAnalysis.left_mouth_horizontal_displacement || 0;
            const rightHorizontal = smileAnalysis.right_mouth_horizontal_displacement || 0;
            // Calculate comprehensive movement score using clinical measurements
            // Horizontal displacement is weighted more heavily as it's the primary smile indicator
            const horizontalMovement = leftHorizontal + rightHorizontal;
            const totalMovement = leftMovement + rightMovement;
            // Combine measurements with clinical weighting
            // 70% horizontal (commissure movement) + 30% total movement (comprehensive)
            const clinicalScore = (horizontalMovement * 0.7) + (totalMovement * 0.3);
            console.log(`🔬 Clinical smile peak score: ${clinicalScore.toFixed(3)}mm (H:${horizontalMovement.toFixed(3)}, T:${totalMovement.toFixed(3)})`);
            // Scale for peak comparison (clinical measurements are already in mm)
            return clinicalScore * 10; // Scale by 10 for better peak detection sensitivity
        }
        catch (error) {
            console.warn('🔬 Clinical smile analysis failed, falling back to geometric calculation:', error);
            // Fallback to geometric calculation if clinical analysis fails
            const averageMotion = (landmarksBefore, landmarksAfter, indices) => {
                const motions = indices.map(index => LandmarkUtils.distance3D(landmarksBefore[index], landmarksAfter[index]));
                return motions.reduce((a, b) => a + b, 0) / motions.length;
            };
            // Define landmark indices for left and right mouth regions
            const leftIndices = [48, 61, 78, 80]; // Left mouth region landmarks
            const rightIndices = [291, 308, 328, 310]; // Right mouth region landmarks
            // Calculate 3D movement for each side
            const leftMotion = averageMotion(baselineLandmarks, currentLandmarks, leftIndices);
            const rightMotion = averageMotion(baselineLandmarks, currentLandmarks, rightIndices);
            // Normalize by face width (pose-invariant scaling)
            const faceWidth = LandmarkUtils.distance3D(baselineLandmarks[33], baselineLandmarks[263]); // IPD as face width
            const leftNorm = leftMotion / faceWidth;
            const rightNorm = rightMotion / faceWidth;
            // Extract movement values
            const leftMovement = leftNorm || 0;
            const rightMovement = rightNorm || 0;
            // Calculate total movement for peak tracking (scale appropriately)
            const totalMovement = leftMovement + rightMovement;
            const scaledMovement = totalMovement * 1000; // Scale for peak tracking comparison
            return scaledMovement;
        }
    }
    /**
     * Calculate eyebrow movement using clinical analysis for accurate peak detection
     */
    pickBestEyebrowRaiseFrame(currentLandmarks, baselineLandmarks) {
        try {
            // 🔬 Use ClinicalAnalysisService for accurate eyebrow elevation calculation
            const eyebrowAnalysis = this.clinicalAnalysisService.analyzeEyebrowElevationForPeakTracking(baselineLandmarks, currentLandmarks);
            // Extract clinical measurements (in degrees)
            const leftElevation = eyebrowAnalysis.left_eyebrow_displacement || 0;
            const rightElevation = eyebrowAnalysis.right_eyebrow_displacement || 0;
            // Calculate total elevation score
            const totalElevation = leftElevation + rightElevation;
            console.log(`🔬 Clinical eyebrow peak score: ${totalElevation.toFixed(3)}° (L:${leftElevation.toFixed(3)}°, R:${rightElevation.toFixed(3)}°)`);
            // Scale for peak comparison (clinical measurements are already in degrees)
            return totalElevation * 100; // Scale by 100 for better peak detection sensitivity
        }
        catch (error) {
            console.warn('🔬 Clinical eyebrow analysis failed, falling back to geometric calculation:', error);
            // Fallback to simple geometric calculation
            const leftEyebrowCurrent = currentLandmarks[70];
            const rightEyebrowCurrent = currentLandmarks[300];
            const leftEyebrowBaseline = baselineLandmarks[70];
            const rightEyebrowBaseline = baselineLandmarks[300];
            if (!leftEyebrowCurrent || !rightEyebrowCurrent || !leftEyebrowBaseline || !rightEyebrowBaseline) {
                return 0;
            }
            // Calculate vertical movement (eyebrow elevation)
            const leftMovement = Math.abs(leftEyebrowBaseline.y - leftEyebrowCurrent.y);
            const rightMovement = Math.abs(rightEyebrowBaseline.y - rightEyebrowCurrent.y);
            // Average movement
            const totalMovement = (leftMovement + rightMovement) / 2;
            return totalMovement * 1000; // Scale for better comparison
        }
    }
    /**
     * Calculate eye closure movement using clinical analysis for accurate peak detection
     */
    pickBestEyeClosureFrame(currentLandmarks, baselineLandmarks) {
        try {
            // 🔬 Use ClinicalAnalysisService for accurate eye closure calculation
            const eyeAnalysis = this.clinicalAnalysisService.analyzeEyeClosureForPeakTracking(baselineLandmarks, currentLandmarks);
            // Extract clinical measurements (in percentages)
            const leftClosure = eyeAnalysis.left_eye_closure || 0;
            const rightClosure = eyeAnalysis.right_eye_closure || 0;
            // Calculate total closure score
            const totalClosure = leftClosure + rightClosure;
            console.log(`🔬 Clinical eye closure peak score: ${totalClosure.toFixed(3)}% (L:${leftClosure.toFixed(3)}%, R:${rightClosure.toFixed(3)}%)`);
            // Scale for peak comparison (clinical measurements are already in percentages)
            return totalClosure * 10; // Scale by 10 for better peak detection sensitivity
        }
        catch (error) {
            console.warn('🔬 Clinical eye closure analysis failed, falling back to geometric calculation:', error);
            // Fallback to simple geometric calculation
            const leftEyeCurrent = {
                top: currentLandmarks[159],
                bottom: currentLandmarks[145]
            };
            const rightEyeCurrent = {
                top: currentLandmarks[386],
                bottom: currentLandmarks[374]
            };
            const leftEyeBaseline = {
                top: baselineLandmarks[159],
                bottom: baselineLandmarks[145]
            };
            const rightEyeBaseline = {
                top: baselineLandmarks[386],
                bottom: baselineLandmarks[374]
            };
            if (!leftEyeCurrent.top || !leftEyeCurrent.bottom || !rightEyeCurrent.top || !rightEyeCurrent.bottom ||
                !leftEyeBaseline.top || !leftEyeBaseline.bottom || !rightEyeBaseline.top || !rightEyeBaseline.bottom) {
                return 0;
            }
            // Calculate eye opening (distance between top and bottom)
            const leftCurrentOpening = Math.abs(leftEyeCurrent.top.y - leftEyeCurrent.bottom.y);
            const rightCurrentOpening = Math.abs(rightEyeCurrent.top.y - rightEyeCurrent.bottom.y);
            const leftBaselineOpening = Math.abs(leftEyeBaseline.top.y - leftEyeBaseline.bottom.y);
            const rightBaselineOpening = Math.abs(rightEyeBaseline.top.y - rightEyeBaseline.bottom.y);
            // Calculate closure as reduction in opening
            const leftClosure = Math.max(0, leftBaselineOpening - leftCurrentOpening);
            const rightClosure = Math.max(0, rightBaselineOpening - rightCurrentOpening);
            const totalClosure = (leftClosure + rightClosure) / 2;
            return totalClosure * 1000; // Scale for better comparison
        }
    }
    /**
     * Start peak frame tracking for an action
     */
    startPeakTracking(actionType, baselineLandmarks) {
        this.peakFrameTracking = {
            isTracking: true,
            currentAction: actionType,
            baselineLandmarks: baselineLandmarks ? [...baselineLandmarks] : undefined,
            peakMovement: 0,
            peakFrame: undefined,
            peakTimestamp: 0,
            frameCount: 0,
            movementHistory: [],
            actionStartTime: Date.now(),
            peakMouthMovements: undefined
        };
    }
    /**
     * Update peak tracking with current frame - ENHANCED DEBUGGING
     */
    updatePeakTracking(currentLandmarks) {
        if (!this.peakFrameTracking.isTracking || !this.peakFrameTracking.baselineLandmarks || !currentLandmarks) {
            return;
        }
        // === HEAD ALIGNMENT & DISTANCE FILTERING ===
        // Only track frames with good head alignment and camera distance (as in AnalysisVisualizationService)
        // Uses estimatedDistance returned from getHeadAlignment() for robust filtering
        let isAligned = true;
        let isDistanceOk = true;
        if (this.analysisVisualizationService) {
            const alignment = this.analysisVisualizationService.getHeadAlignmentAndAlignment?.();
            // Accept only if status is "ALIGNED" or contains "ALIGNED" and color is not red
            if (!alignment || !alignment.status || alignment.status.indexOf('ALIGNED') === -1 || (alignment.color && alignment.color.toLowerCase() === '#ff0000')) {
                isAligned = false;
            }
            // Accept only if estimatedDistance (camera distance in mm) is within 350-400mm
            // This value must be returned from getHeadAlignment() in AnalysisVisualizationService
            if (alignment && typeof alignment.estimatedDistance === 'number') {
                if (alignment.estimatedDistance < 350 || alignment.estimatedDistance > 400) {
                    isDistanceOk = false;
                }
            }
            else {
                // If estimatedDistance is missing, treat as not OK (conservative)
                isDistanceOk = false;
            }
        }
        if (!isAligned || !isDistanceOk) {
            // Skip this frame for peak tracking
            return;
        }
        this.peakFrameTracking.frameCount++;
        // Calculate movement for current frame with enhanced debugging
        // Only proceed if currentAction is a valid FacialActions enum (not null)
        if (!this.peakFrameTracking.currentAction) {
            return;
        }
        const currentMovement = this.PickBestMovementActionFrame(this.peakFrameTracking.currentAction, currentLandmarks, this.peakFrameTracking.baselineLandmarks);
        // Add to movement history
        this.peakFrameTracking.movementHistory.push(currentMovement);
        // Keep only last 30 frames for performance
        if (this.peakFrameTracking.movementHistory.length > 30) {
            this.peakFrameTracking.movementHistory.shift();
        }
        // Check if this is a new peak
        if (currentMovement > this.peakFrameTracking.peakMovement) {
            this.peakFrameTracking.peakMovement = currentMovement;
            this.peakFrameTracking.peakFrame = [...currentLandmarks]; // Deep copy
            this.peakFrameTracking.peakTimestamp = Date.now();
            // Capture peak frame image
            const capturedImage = this.captureVideoFrame();
            if (capturedImage) {
                this.peakFrameTracking.peakFrameImage = capturedImage;
                console.log(`🖼️ Peak frame image captured for ${this.peakFrameTracking.currentAction}:`, `${Math.round(capturedImage.length / 1024)}KB`);
            }
            else {
                console.warn(`⚠️ Failed to capture peak frame image for ${this.peakFrameTracking.currentAction}`);
            }
            // Capture mouth movement measurements for smile actions
            if (this.peakFrameTracking.currentAction === FacialActions.Smile) {
                if (this.analysisVisualizationService) {
                    const mouthMeasurements = this.analysisVisualizationService.calculateMouthMovementMeasurements(currentLandmarks);
                    if (mouthMeasurements) {
                        this.peakFrameTracking.peakMouthMovements = mouthMeasurements;
                    }
                }
            }
        }
    }
    /**
     * Stop peak tracking and store the best frame
     */
    /**
     * Stop peak tracking and store the best frame and image
     * Returns an object with the peak landmarks and image data URL
     */
    stopPeakTracking() {
        if (!this.peakFrameTracking.isTracking) {
            return undefined;
        }
        const peakFrame = this.peakFrameTracking.peakFrame;
        const peakFrameImage = this.peakFrameTracking.peakFrameImage;
        // Reset tracking but PRESERVE baseline landmarks for next action
        const preservedBaseline = this.peakFrameTracking.baselineLandmarks;
        this.peakFrameTracking = {
            isTracking: false,
            currentAction: null,
            baselineLandmarks: preservedBaseline, // Keep baseline for next action
            peakMovement: 0,
            peakFrame: undefined,
            peakTimestamp: 0,
            frameCount: 0,
            movementHistory: [],
            actionStartTime: 0,
            peakMouthMovements: undefined
        };
        return { peakFrame, peakFrameImage };
    }
    /**
     * Capture current video frame as data URL
     */
    captureVideoFrame() {
        try {
            const videoElement = document.getElementById('video');
            if (!videoElement || !videoElement.videoWidth || !videoElement.videoHeight) {
                return null;
            }
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx)
                return null;
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL('image/jpeg', 0.8);
        }
        catch (error) {
            console.error('Error capturing video frame:', error);
            return null;
        }
    }
    initializeVisualizationServices() {
        try {
            this.visualizationService = new FaceVisualizationService('canvas');
            this.analysisVisualizationService = new AnalysisVisualizationService('analysisCanvas');
            this.analysisVisualizationService.setTranslations(this.translations);
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Start the facial symmetry examination process
     *
     * This is the main entry point that initializes the entire examination workflow:
     * 1. Stores patient data and navigates to exam route
     * 2. Initializes camera and visualization services
     * 3. Sets up movement detection
     * 4. Begins the examination sequence
     *
     * @param patientData - Patient information (ID, name, age)
     */
    async startExam(patientData, translations) {
        try {
            this.translations = translations;
            // Store patient data for use throughout the exam and in results
            this.patientData = patientData;
            // CRITICAL: Navigate to exam route first to ensure proper UI state
            window.history.pushState({}, '', '/live-video-analysis');
            // Wait for route change to take effect and DOM to update
            await new Promise(resolve => setTimeout(resolve, 100));
            // Initialize visualization services now that we're in the exam view
            this.initializeVisualizationServices();
            // Immediately show the analysis view with loading state
            this.analysisVisualizationService?.forceRender();
            // Set up exam button listeners now that the exam view is loaded
            this.setupExamButtonListeners();
            // Ensure camera processing is stopped before starting
            if (this.isProcessing) {
                this.isProcessing = false;
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            const videoElement = document.getElementById('video');
            if (!videoElement) {
                throw new Error('Video element not found');
            }
            // Ensure video element is visible and properly configured
            videoElement.style.display = 'block';
            videoElement.style.visibility = 'visible';
            videoElement.style.opacity = '1';
            // Debug: Log srcObject and video state
            setTimeout(() => {
            }, 1000);
            // Clear any existing video source
            if (videoElement.srcObject) {
                const stream = videoElement.srcObject;
                stream.getTracks().forEach(track => track.stop());
                videoElement.srcObject = null;
            }
            // Clear all canvases before starting (with null checks)
            this.visualizationService?.clearCanvas();
            this.analysisVisualizationService?.clearCanvas();
            // Reset movement detection service for new exam
            this.movementDetectionService.reset();
            this.detectionStatusView.reset();
            // 🔧 CRITICAL FIX: Reset all examination data to prevent interference from previous analyses
            this.resetExaminationData();
            // Set up camera results handler BEFORE starting the exam
            this.cameraRepository.onResults((results) => {
                this.handleCameraResults(results);
            });
            // Reinitialize visualization services with fresh video element
            this.analysisVisualizationService?.setVideoElement(videoElement);
            await this.examOrchestrator.startExam({
                patientData,
                videoElement
            });
            // Wait a moment for camera and MediaPipe to fully initialize
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Show exam interface and update UI
            this.showExamInterface();
            this.updateUI();
            // Initialize camera switching functionality
            await this.cameraService.initializeCameraSwitching();
            // Ensure instruction element is visible and has content
            const instructionElement = document.getElementById('instruction');
            if (instructionElement) {
                instructionElement.style.display = 'block';
                const welcomeMessage = 'Examination started. Follow the instructions for each facial action.';
                instructionElement.textContent = welcomeMessage;
            }
            // Reset speech state for new exam (do not speak here)
            this.speechService.resetSpeechState();
            // Set last spoken text to the first instruction to prevent double speaking
            const firstAction = this.examOrchestrator.getCurrentAction();
            if (firstAction) {
                const instruction = FacialActionInstructions[firstAction];
                this.speechService.setLastSpokenText(instruction);
            }
        }
        catch (error) {
            console.error('Failed to start exam:', error);
            this.showErrorMessage('Failed to start examination. Please check camera permissions and try again.');
        }
    }
    /**
     * Handle camera results from MediaPipe FaceMesh detection
     *
     * This is the core real-time processing method that:
     * 1. Validates and processes facial landmarks (468+ points)
     * 2. Performs movement detection and peak tracking
     * 3. Runs clinical validation
     * 4. Updates visualization and UI components
     * 5. Manages examination flow and action progression
     *
     * Called for every camera frame with detected faces.
     *
     * @param results - MediaPipe detection results containing facial landmarks
     */
    async handleCameraResults(results) {
        // Prevent concurrent processing of multiple frames (performance optimization)
        if (this.isProcessing)
            return;
        try {
            this.isProcessing = true;
            // === FACE DETECTION AND LANDMARK PROCESSING ===
            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                const landmarks = results.multiFaceLandmarks[0];
                // === LANDMARK VALIDATION ===
                // Validate MediaPipe landmark data structure
                if (!landmarks || !Array.isArray(landmarks)) {
                    console.error('Invalid landmark data received from MediaPipe:', landmarks);
                    return;
                }
                // Check landmark count (MediaPipe FaceMesh: 468 standard, 478 with iris)
                if (landmarks.length !== 468) {
                    console.warn(`MediaPipe returned ${landmarks.length} landmarks instead of expected 468`);
                    // Continue processing but log the issue for debugging
                }
                // Validate landmark structure
                const validLandmarks = landmarks.filter(landmark => landmark &&
                    typeof landmark.x === 'number' &&
                    typeof landmark.y === 'number');
                if (validLandmarks.length !== landmarks.length) {
                    console.error(`Found ${landmarks.length - validLandmarks.length} invalid landmarks in MediaPipe data`);
                    // Don't process invalid data
                    return;
                }
                // Perform movement detection for current action
                const currentAction = this.examOrchestrator.getCurrentAction();
                if (currentAction) {
                    const detectionResult = this.movementDetectionService.detectMovement(currentAction, validLandmarks);
                    // Update detection status UI
                    this.detectionStatusView.updateDetectionStatus(currentAction, detectionResult);
                    const instruction = FacialActionInstructions[currentAction];
                    this.detectionStatusView.updateCurrentAction(currentAction, instruction);
                    // 🎯 PEAK FRAME TRACKING INTEGRATION - ENHANCED BASELINE VALIDATION
                    // Set baseline if this is the first action
                    if (currentAction === FacialActions.neutral && detectionResult.isDetected) {
                        this.movementDetectionService.setBaseline(validLandmarks);
                        // Store baseline for peak tracking with validation
                        this.peakFrameTracking.baselineLandmarks = [...validLandmarks];
                        // Capture baseline image
                        const baselineImage = this.captureVideoFrame();
                        if (baselineImage) {
                            this.storePeakFrameLandmarks({
                                peakFrame: validLandmarks,
                                peakFrameImage: baselineImage
                            }, FacialActions.neutral);
                        }
                    }
                    // Start peak tracking for non-baseline actions when movement is first detected
                    if (currentAction !== FacialActions.neutral && detectionResult.isDetected && !this.peakFrameTracking.isTracking) {
                        if (this.peakFrameTracking.baselineLandmarks) {
                            console.log(`🎯 Starting peak tracking for ${currentAction}...`);
                            this.startPeakTracking(currentAction, this.peakFrameTracking.baselineLandmarks);
                        }
                        else {
                            console.warn(`🎯 ❌ Cannot start peak tracking for ${currentAction} - no baseline landmarks available`);
                        }
                    }
                    // Update peak tracking for ongoing actions
                    if (this.peakFrameTracking.isTracking && this.peakFrameTracking.currentAction === currentAction) {
                        this.updatePeakTracking(validLandmarks);
                    }
                    // Update button states based on detection
                    this.updateButtonStatesWithDetection();
                }
                // Store landmarks for clinical analysis
                this.storeLandmarksForAnalysis(landmarks);
                // Draw enhanced landmarks with face circle
                this.visualizationService?.drawFaceLandmarks(landmarks);
                // Update analysis visualization
                this.analysisVisualizationService?.updateLandmarks(landmarks);
                // Highlight relevant landmarks for current metric
                this.highlightRelevantLandmarks();
                // Process facial data
                await this.examOrchestrator.processFacialData(landmarks);
                this.updateUI();
            }
        }
        catch (error) {
            console.error('Error processing facial data:', error);
        }
        finally {
            this.isProcessing = false;
        }
    }
    async nextAction() {
        // Check if current movement is detected before allowing progression
        const currentAction = this.examOrchestrator.getCurrentAction();
        if (currentAction) {
            const actionType = currentAction;
            const detectionStatus = this.movementDetectionService.getDetectionStatus();
            if (!detectionStatus.get(actionType)) {
                this.detectionStatusView.showError('Please complete the current movement before proceeding.');
                return;
            }
            // 🎯 STOP PEAK TRACKING AND STORE BEST FRAME - ENHANCED DEBUGGING
            if (this.peakFrameTracking.isTracking && this.peakFrameTracking.currentAction === actionType) {
                console.log(`🎯 Stopping peak tracking for ${actionType}...`);
                const bestFrame = this.stopPeakTracking();
                if (bestFrame && bestFrame.peakFrame) {
                    console.log(`🎯 ✅ Peak frame found for ${actionType}, storing...`);
                    this.storePeakFrameLandmarks({
                        peakFrame: bestFrame.peakFrame,
                        peakFrameImage: bestFrame.peakFrameImage
                    }, actionType);
                }
                else {
                    console.warn(`🎯 ❌ No peak frame found for ${actionType} - this indicates a problem with peak tracking`);
                    console.warn(`   Possible issues: No movement detected, tracking not started, or calculation errors`);
                }
            }
            else {
                console.log(`🎯 Peak tracking status for ${actionType}:`, {
                    isTracking: this.peakFrameTracking.isTracking,
                    currentAction: this.peakFrameTracking.currentAction,
                    actionMatches: this.peakFrameTracking.currentAction === actionType
                });
            }
        }
        const hasNext = await this.examOrchestrator.nextAction();
        if (!hasNext || this.examOrchestrator.isExamCompleted()) {
            this.showResults();
        }
        else {
            this.updateUI();
            // Reset detection status view for new action
            const newAction = this.examOrchestrator.getCurrentAction();
            if (newAction) {
                const newActionType = newAction;
                this.detectionStatusView.updateCurrentAction(newActionType, FacialActionInstructions[newActionType]);
            }
        }
    }
    /**
     * Toggle speech synthesis on/off
     */
    toggleSpeech() {
        // Implement speech toggle using SpeechService if needed
        // Example: this.speechService.toggleSpeech();
    }
    setupExamButtonListeners() {
        // Next action button
        const nextButton = document.getElementById('nextBtn');
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                this.nextAction();
            });
        }
        // Analysis mode cycle button removed - analysis view now locked to flat view
        // Setup other exam buttons
        this.attachFinishButtonListener();
        this.attachSpeechToggleListener();
        this.attachTestSpeechListener();
        this.cameraService.attachCameraSwitchListener();
    }
    attachSpeechToggleListener() {
        const speechToggleBtn = document.getElementById('speechToggleBtn');
        if (speechToggleBtn) {
            speechToggleBtn.addEventListener('click', () => {
                this.toggleSpeech();
                this.updateSpeechToggleButton();
            });
        }
    }
    attachTestSpeechListener() {
        const testSpeechBtn = document.getElementById('testSpeechBtn');
        if (testSpeechBtn) {
            testSpeechBtn.addEventListener('click', () => {
            });
        }
    }
    updateSpeechToggleButton() {
        const speechToggleBtn = document.getElementById('speechToggleBtn');
        if (speechToggleBtn) {
            if (this.speechService && this.speechService.speechEnabled) {
                speechToggleBtn.textContent = '🔊 Speech ON';
                speechToggleBtn.style.background = '#e67e22'; // Orange when on
                speechToggleBtn.title = 'Click to disable speech instructions';
            }
            else {
                speechToggleBtn.textContent = '🔇 Speech OFF';
                speechToggleBtn.style.background = '#7f8c8d'; // Gray when off
                speechToggleBtn.title = 'Click to enable speech instructions';
            }
        }
    }
    attachFinishButtonListener() {
        const finishBtn = document.getElementById('finishBtn');
        if (finishBtn) {
            // Remove any existing listeners to prevent duplicates
            finishBtn.removeEventListener('click', this.handleFinishClick);
            // Add the listener
            finishBtn.addEventListener('click', this.handleFinishClick);
        }
    }
    updateButtonStates() {
        const currentAction = this.getCurrentActionType();
        const nextBtn = document.getElementById('nextBtn');
        const finishBtn = document.getElementById('finishBtn');

        // Check if this is the last action
        const currentSession = this.examOrchestrator.getCurrentSession();
        const isLastAction = currentSession &&
            currentSession.currentActionIndex === (currentSession.actions.length - 1);

        // Show finish button if exam is completed OR if we're on the last action
        if (this.examOrchestrator.isExamCompleted() || isLastAction) {
            if (nextBtn) {
                nextBtn.style.display = 'none';
            }
            if (finishBtn) {
                finishBtn.style.display = 'inline-block';
                finishBtn.textContent = 'Finish Examination';
                finishBtn.className = 'btn btn-success btn-lg';
                finishBtn.style.backgroundColor = '#28a745';
                finishBtn.style.borderColor = '#28a745';
                finishBtn.style.color = 'white';
                finishBtn.style.fontWeight = 'bold';
            }
        } else {
            if (nextBtn) {
                nextBtn.style.display = 'inline-block';
                nextBtn.textContent = this.translations['Next Action'] || 'Next Action';
                nextBtn.className = 'btn btn-primary btn-lg';
            }
            if (finishBtn) {
                finishBtn.style.display = 'none';
            }
        }
    }
    async finishExam() {
        try {
            // Check if all movements are detected before finishing
            const allDetected = this.movementDetectionService.areAllMovementsDetected();
            if (!allDetected) {
                this.detectionStatusView.showError('Please complete all facial movements before finishing the examination.');
                return;
            }
            // 🎯 STOP PEAK TRACKING FOR FINAL ACTION
            if (this.peakFrameTracking.isTracking) {
                const currentAction = this.examOrchestrator.getCurrentAction();
                if (currentAction) {
                    const actionType = currentAction;
                    const bestFrame = this.stopPeakTracking();
                    if (bestFrame && bestFrame.peakFrame) {
                        this.storePeakFrameLandmarks({
                            peakFrame: bestFrame.peakFrame,
                            peakFrameImage: bestFrame.peakFrameImage
                        }, actionType);
                    }
                }
            }
            // Stop camera processing
            this.isProcessing = false;
            // CRITICAL: Stop all speech and reset state before completion
            this.speechService.stopCurrentSpeech();
            this.speechService.resetSpeechState();
            // Wait a moment to ensure all speech is fully stopped
            await new Promise(resolve => setTimeout(resolve, 500));
            // Collect final results
            try {
                this.examResults = await this.collectExamResults();
                this.examCompleted = true;
            }
            catch (error) {
                console.error('❌ CRITICAL: Failed to collect exam results:', error);
                // Create minimal fallback results
                this.examResults = {
                    patientData: { id: '', name: '', age: '' },
                    timestamp: new Date().toISOString(),
                    analysisResult: {
                        eyebrow_raise: {
                            left_eyebrow_displacement: 0,
                            right_eyebrow_displacement: 0
                        },
                        eye_close: {
                            right_eye_closure: 0,
                            left_eye_closure: 0
                        },
                        smile: {
                            left_mouth_horizontal_displacement: 0,
                            left_mouth_vertical_displacement: 0,
                            right_mouth_horizontal_displacement: 0,
                            right_mouth_vertical_displacement: 0,
                            left_mouth_movement: 0,
                            right_mouth_movement: 0,
                            horizontalDistances: {
                                left: 0,
                                right: 0
                            },
                            verticalDistances: {
                                left: 0,
                                right: 0
                            }
                        },
                        symmetryMetrics: {
                            eyebrowRaiseAsymmetry: 0,
                            eyebrowRaiseSymmetry: 0,
                            eyebrowRaiseOverallScore: 0,
                            eyeClosureAsymmetry: 0,
                            eyeClosureSymmetry: 0,
                            eyeClosureOverallScore: 0,
                            smileAsymmetry: 0,
                            smileSymmetry: 0,
                            horizontalDistanceAsymmetry: 0,
                            verticalDistanceAsymmetry: 0,
                            smileOverallScore: 0,
                            overallScore: 0,
                        }
                    }
                };
            }
            // Store results for the dedicated results route
            this.storeResultsForRoute();
            // Navigate to the dedicated results route
            this.navigateToResults();
            // Wait another moment before speaking completion message to ensure clean state
            setTimeout(() => {
                this.speechService.speakInstruction('Facial symmetry examination is now complete. Your results are ready for review.');
            }, 1000); // 1 second delay to ensure everything is settled
        }
        catch (error) {
            console.error('Error finishing exam:', error);
            alert('Error completing examination. Please try again.');
        }
    }
    async collectExamResults() {
        // Collect comprehensive examination results
        const currentSession = this.examOrchestrator.getCurrentSession();
        // Use stored patient data instead of trying to get it from DOM elements
        let patientId = this.patientData?.id || '';
        let patientName = this.patientData?.name || '';
        let patientAge = this.patientData?.age || '';
        // Fallback: Try to get patient data from the current session if stored data is missing
        if (!patientId && !patientName && !patientAge && currentSession) {
            const sessionPatient = currentSession.patient;
            if (sessionPatient) {
                patientId = sessionPatient.id || '';
                patientName = sessionPatient.name || '';
                patientAge = sessionPatient.age?.toString() || '';
            }
        }
        // Log detailed landmark counts
        const landmarkCounts = {};
        for (const [key, data] of this.landmarkStorage.entries()) {
            landmarkCounts[key] = data && data.peakFrame ? data.peakFrame.length : 0;
        }
        // Perform clinical analysis using real landmark data if available
        try {
            if (this.landmarkStorage.size > 0) {
                const clinicalData = await this.prepareRealClinicalExaminationData(patientId, patientName, patientAge);
                if (clinicalData) {
                    this.clinicalResults = await this.clinicalIntegrationService.performClinicalAnalysis(clinicalData);
                }
                else {
                    console.error('❌ ERROR: Clinical data preparation failed - no real landmark data available');
                }
            }
            else {
                console.error('❌ ERROR: No landmark data available for clinical analysis');
            }
        }
        catch (error) {
            console.error('❌ Clinical analysis failed:', error);
            // Continue with basic analysis if clinical analysis fails
        }
        // Include raw landmark data for individual calculations in results view
        // Extract both landmarks and images for results using consistent FacialActions enum keys
        const rawLandmarkData = {
            baseline: this.landmarkStorage.get(FacialActions.neutral)?.peakFrame || [],
            eyebrowRaise: this.landmarkStorage.get(FacialActions.EyebrowRaise)?.peakFrame || [],
            eyeClose: this.landmarkStorage.get(FacialActions.EyeClosure)?.peakFrame || [],
            smile: this.landmarkStorage.get(FacialActions.Smile)?.peakFrame || [],
            snarl: this.landmarkStorage.get(FacialActions.Snarl)?.peakFrame || [],
            lipPucker: this.landmarkStorage.get(FacialActions.LipPucker)?.peakFrame || [],
        };
        const peakFrameImages = {
            baseline: this.landmarkStorage.get(FacialActions.neutral)?.peakFrameImage,
            eyebrowRaise: this.landmarkStorage.get(FacialActions.EyebrowRaise)?.peakFrameImage,
            eyeClose: this.landmarkStorage.get(FacialActions.EyeClosure)?.peakFrameImage,
            smile: this.landmarkStorage.get(FacialActions.Smile)?.peakFrameImage,
            snarl: this.landmarkStorage.get(FacialActions.Snarl)?.peakFrameImage,
            lipPucker: this.landmarkStorage.get(FacialActions.LipPucker)?.peakFrameImage,
        };
        // Debug: Log what images we have
        console.log('🖼️ Peak Frame Images Debug:');
        console.log('  Baseline image:', peakFrameImages.baseline ? 'EXISTS' : 'MISSING');
        console.log('  Eyebrow raise image:', peakFrameImages.eyebrowRaise ? 'EXISTS' : 'MISSING');
        console.log('  Eye close image:', peakFrameImages.eyeClose ? 'EXISTS' : 'MISSING');
        console.log('  Smile image:', peakFrameImages.smile ? 'EXISTS' : 'MISSING');
        // Debug: Log landmark storage contents
        console.log('🗂️ Landmark Storage Debug:');
        console.log('🔑 Storage Keys vs Enum Values:');
        console.log('  FacialActions.neutral =', FacialActions.neutral);
        console.log('  FacialActions.EyebrowRaise =', FacialActions.EyebrowRaise);
        console.log('  FacialActions.EyeClosure =', FacialActions.EyeClosure);
        console.log('  FacialActions.Smile =', FacialActions.Smile);
        for (const [key, value] of this.landmarkStorage.entries()) {
            console.log(`  Storage key "${key}":`, {
                hasLandmarks: value?.peakFrame ? 'YES' : 'NO',
                landmarkCount: value?.peakFrame?.length || 0,
                hasImage: value?.peakFrameImage ? 'YES' : 'NO',
                imageSize: value?.peakFrameImage ? `${Math.round(value.peakFrameImage.length / 1024)}KB` : 'N/A'
            });
        }
        // Debug: Test direct retrieval with enum values
        console.log('🔍 Direct Retrieval Test:');
        console.log('  neutral data:', this.landmarkStorage.get(FacialActions.neutral) ? 'EXISTS' : 'MISSING');
        console.log('  eyebrow_raise data:', this.landmarkStorage.get(FacialActions.EyebrowRaise) ? 'EXISTS' : 'MISSING');
        console.log('  eye_close data:', this.landmarkStorage.get(FacialActions.EyeClosure) ? 'EXISTS' : 'MISSING');
        console.log('  smile data:', this.landmarkStorage.get(FacialActions.Smile) ? 'EXISTS' : 'MISSING');
        const finalResults = {
            patientData: {
                id: patientId,
                name: patientName,
                age: patientAge,
            },
            timestamp: new Date().toISOString(),
            analysisResult: this.clinicalResults,
            peakFrameImages: peakFrameImages,
            rawLandmarkData: rawLandmarkData
        };
        return finalResults;
    }
    /**
     * Prepare clinical examination data using real landmark data
     */
    async prepareRealClinicalExaminationData(patientId, patientName, patientAge) {
        if (this.landmarkStorage.size === 0) {
            return null;
        }
        // Convert stored landmarks to the format expected by clinical analysis
        const realLandmarkData = {
            baseline: this.landmarkStorage.get(FacialActions.neutral)?.peakFrame || [],
            eyebrowRaise: this.landmarkStorage.get(FacialActions.EyebrowRaise)?.peakFrame || [],
            eyeClose: this.landmarkStorage.get(FacialActions.EyeClosure)?.peakFrame || [],
            smile: this.landmarkStorage.get(FacialActions.Smile)?.peakFrame || [],
            snarl: this.landmarkStorage.get(FacialActions.Snarl)?.peakFrame || [],
            lipPucker: this.landmarkStorage.get(FacialActions.LipPucker)?.peakFrame || []
        };
        // Validate all landmark data before proceeding
        const validationErrors = [];
        const requiredActions = ['baseline', 'eyebrowRaise', 'eyeClose', 'smile', 'snarl', 'lipPucker'];
        const expectedLandmarkCounts = [468, 478]; // Support both MediaPipe v1 and v2
        for (const action of requiredActions) {
            const landmarks = realLandmarkData[action];
            if (!landmarks || !Array.isArray(landmarks)) {
                validationErrors.push(`Missing landmark data for ${action}`);
            }
            else if (!expectedLandmarkCounts.includes(landmarks.length)) {
                validationErrors.push(`Invalid landmark count for ${action}: ${landmarks.length}/${expectedLandmarkCounts.join(' or ')}`);
            }
            else {
                // Validate landmark structure
                const invalidLandmarks = landmarks.filter((landmark) => {
                    return !landmark ||
                        typeof landmark.x !== 'number' ||
                        typeof landmark.y !== 'number';
                });
                if (invalidLandmarks.length > 0) {
                    validationErrors.push(`Invalid landmark structure for ${action}: ${invalidLandmarks.length} invalid points`);
                }
            }
        }
        if (validationErrors.length > 0) {
            console.error('Clinical data validation failed:', validationErrors);
            console.error('Cannot proceed with clinical analysis due to invalid landmark data');
            return null;
        }
        const clinicalData = {
            patientData: {
                id: patientId,
                name: patientName,
                age: patientAge,
            },
            landmarkData: realLandmarkData,
            timestamp: new Date().toISOString()
        };
        return clinicalData;
    }
    /**
     * Store peak frame landmarks for a specific action type
     * Used by the peak tracking system to store the best frame
     */
    storePeakFrameLandmarks(data, actionType) {
        const { peakFrame, peakFrameImage } = data;
        // Validate landmark data before storage
        if (!peakFrame || !Array.isArray(peakFrame)) {
            return;
        }
        if (peakFrame.length < 400) {
            return;
        }
        // Validate landmark structure
        const invalidLandmarks = peakFrame.filter((landmark) => {
            if (!landmark || typeof landmark !== 'object') {
                return true;
            }
            if (typeof landmark.x !== 'number' || typeof landmark.y !== 'number') {
                return true;
            }
            return false;
        });
        if (invalidLandmarks.length > 0) {
            return;
        }
        // Store landmarks and image
        this.landmarkStorage.set(actionType, { peakFrame, peakFrameImage });
        // Debug: Log what was stored
        console.log(`🗂️ Stored peak frame data for ${actionType}:`, {
            landmarkCount: peakFrame.length,
            hasImage: peakFrameImage ? 'YES' : 'NO',
            imageSize: peakFrameImage ? `${Math.round(peakFrameImage.length / 1024)}KB` : 'N/A'
        });
    }
    /**
     * Store landmarks for clinical analysis based on current action
     */
    storeLandmarksForAnalysis(landmarks) {
        const currentAction = this.examOrchestrator.getCurrentAction();
        if (!currentAction) {
            return;
        }
        // Validate landmark data before storage
        if (!landmarks || !Array.isArray(landmarks)) {
            return;
        }
        // MediaPipe Face Mesh can return 468 (v1) or 478 (v2 with iris) landmarks
        const expectedLandmarkCounts = [468, 478];
        if (!expectedLandmarkCounts.includes(landmarks.length)) {
            // Don't return here - log the issue but still store what we have for debugging
        }
        // Validate landmark structure - each landmark should have x, y, z coordinates
        const invalidLandmarks = landmarks.filter((landmark) => {
            if (!landmark || typeof landmark !== 'object') {
                return true;
            }
            if (typeof landmark.x !== 'number' || typeof landmark.y !== 'number') {
                return true;
            }
            return false;
        });
        if (invalidLandmarks.length > 0) {
            // Don't store invalid data
            return;
        }
        // Use the current action enum directly as storage key (type-safe approach)
        const storageKey = currentAction;
        // Create a deep copy of landmarks to ensure data integrity
        const landmarksCopy = LandmarkUtils.copyLandmarks(landmarks);
        // Preserve existing image if it exists (don't overwrite peak frame images)
        const existingData = this.landmarkStorage.get(storageKey);
        const existingImage = existingData?.peakFrameImage;
        this.landmarkStorage.set(storageKey, {
            peakFrame: landmarksCopy,
            peakFrameImage: existingImage // Preserve existing image
        });
    }
    getCurrentActionType() {
        // Get current action from exam orchestrator (now returns FacialActions enum directly)
        const currentAction = this.examOrchestrator.getCurrentAction();
        return currentAction || FacialActions.neutral;
    }
    updateUI() {
        const currentAction = this.examOrchestrator.getCurrentAction();
        if (currentAction) {
            const actionName = String(currentAction).replace(/_/g, ' ').toUpperCase();
            const translatedActionName = this.translations[actionName] || actionName;
            const instruction = this.translations[currentAction + '_instruction'] || FacialActionInstructions[currentAction];
            this.displayInstruction(instruction, translatedActionName);
        }
        // Update button states based on current action
        this.updateButtonStates();
        // Update actions progress tracker
        this.updateActionsProgress();
    }
    displayInstruction(instruction, actionName) {
        // Prevent further instructions after exam is completed
        if (this.examCompleted)
            return;
        // Get current action for enhanced instruction display
        const currentAction = this.examOrchestrator.getCurrentAction();
        let displayText;
        let speechText;
        if (currentAction) {
            // Only log when action changes
            if (this._lastAction !== currentAction) {
                this._lastAction = currentAction;
            }
            // Enhanced instruction with action name and details
            displayText = `${actionName}: ${instruction}`;
            // For speech, use shorter, more direct format
            speechText = this.speechService.getShortSpeechInstruction(currentAction, instruction);
        }
        else {
            // Fallback to basic instruction
            displayText = instruction;
            speechText = instruction;
        }
        // Update the action title element
        const actionTitleElement = document.getElementById('actionTitle');
        if (actionTitleElement) {
            actionTitleElement.textContent = displayText;
        }
        // Update visual display using InstructionView
        this.instructionView.setInstruction(displayText);
        // Only speak if the instruction is different from the last spoken
        if (this.speechService.getLastSpokenText() !== speechText) {
            this.speechService.speakInstruction(speechText);
        }
    }
    /**
     * Show examination interface and hide patient form
     */
    showExamInterface() {
        // Hide patient form
        const patientForm = document.getElementById('patientForm');
        if (patientForm) {
            patientForm.style.display = 'none';
        }
        // Show examination output (camera views)
        const outputDiv = document.getElementById('output');
        if (outputDiv) {
            outputDiv.style.display = 'block';
        }
        // Show instructions
        const instructions = document.querySelector('.instructions');
        if (instructions) {
            instructions.style.display = 'block';
        }
        // Show instruction area below camera views
        const instructionArea = document.getElementById('instructionArea');
        if (instructionArea) {
            instructionArea.style.display = 'block';
        }
        // Show instruction element
        const instructionElement = document.getElementById('instruction');
        if (instructionElement) {
            instructionElement.style.display = 'block';
        }
        // Show next button
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) {
            nextBtn.style.display = 'inline-block';
        }
        // Show speech toggle button
        const speechToggleBtn = document.getElementById('speechToggleBtn');
        if (speechToggleBtn) {
            speechToggleBtn.style.display = 'inline-block';
            this.updateSpeechToggleButton(); // Ensure correct initial state
        }
        // Show test speech button
        const testSpeechBtn = document.getElementById('testSpeechBtn');
        if (testSpeechBtn) {
            testSpeechBtn.style.display = 'inline-block';
        }
    }
    /**
     * Show error message to user
     */
    showErrorMessage(message) {
        ErrorView.showErrorMessage(message);
    }
    /**
     * Update button states based on movement detection
     */
    updateButtonStatesWithDetection() {
        const currentAction = this.examOrchestrator.getCurrentAction();
        if (!currentAction)
            return;
        const actionType = currentAction;
        const detectionStatus = this.movementDetectionService.getDetectionStatus();
        const isCurrentDetected = detectionStatus.get(actionType) || false;
        const nextBtn = document.getElementById('nextBtn');
        const finishBtn = document.getElementById('finishBtn');
        // Update next button state
        if (nextBtn) {
            if (isCurrentDetected) {
                nextBtn.disabled = false;
                nextBtn.style.opacity = '1';
                nextBtn.style.cursor = 'pointer';
                nextBtn.title = 'Movement detected - click to proceed';
            }
            else {
                nextBtn.disabled = true;
                nextBtn.style.opacity = '0.5';
                nextBtn.style.cursor = 'not-allowed';
                nextBtn.title = 'Complete the current movement to proceed';
            }
        }
        // Update finish button state (only for final action)
        // Check if this is the last action in the sequence
        const currentSession = this.examOrchestrator.getCurrentSession();
        const isLastAction = currentSession &&
            currentSession.currentActionIndex === (currentSession.actions.length - 1);

        if (finishBtn && (isLastAction || this.examOrchestrator.isExamCompleted())) {
            const allDetected = this.movementDetectionService.areAllMovementsDetected();
            if (allDetected) {
                finishBtn.disabled = false;
                finishBtn.style.opacity = '1';
                finishBtn.style.cursor = 'pointer';
                finishBtn.title = 'All movements detected - click to finish examination';
                this.detectionStatusView.showCompletionStatus(true);
            }
            else {
                finishBtn.disabled = true;
                finishBtn.style.opacity = '0.5';
                finishBtn.style.cursor = 'not-allowed';
                finishBtn.title = 'Complete all movements to finish examination';
                this.detectionStatusView.showCompletionStatus(false);
            }
        }
        // Update regular button states as well
        this.updateButtonStates();
    }
    highlightRelevantLandmarks() {
        const currentAction = this.examOrchestrator.getCurrentAction();
        if (!currentAction)
            return;
        // Get landmarks for the current metric being measured
        const relevantLandmarks = FacialActionMetrics[currentAction];
        // Highlight the relevant landmarks in red
        this.visualizationService?.highlightLandmarks(relevantLandmarks, '#ffff00');
    }
    showResults() {
        // Hide exam interface and show results
        const examInterface = document.getElementById('examInterface');
        const resultsInterface = document.getElementById('resultsInterface');
        if (examInterface)
            examInterface.style.display = 'none';
        if (resultsInterface)
            resultsInterface.style.display = 'block';
    }
    /**
     * Store results for the dedicated results route
     */
    storeResultsForRoute() {
        if (!this.examResults) {
            console.error('❌ CRITICAL: No exam results to store - this.examResults is null/undefined');
            return null;
        }
        try {
            const storageData = {
                complete_analysis_results: this.examResults,
                timestamp: new Date().toISOString(),
                expiryTime: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString() // 24 hours
            };
            localStorage.setItem('facialSymmetryResults', JSON.stringify(storageData));
            return storageData;
        }
        catch (error) {
            console.error('❌ CRITICAL: Failed to store results for results route:', error);

            // Fallback: Try to store without images if quota exceeded
            if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
                console.warn('⚠️ Storage quota exceeded. Attempting to store results without images.');
                try {
                    // Create a copy of results without images
                    const resultsWithoutImages = JSON.parse(JSON.stringify(this.examResults));
                    if (resultsWithoutImages.peakFrameImages) {
                        resultsWithoutImages.peakFrameImages = {};
                    }
                    // Also clear raw landmark data images if any (though they shouldn't be there)

                    const fallbackData = {
                        complete_analysis_results: resultsWithoutImages,
                        timestamp: new Date().toISOString(),
                        expiryTime: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString(),
                        warning: 'Images excluded due to storage limits'
                    };
                    localStorage.setItem('facialSymmetryResults', JSON.stringify(fallbackData));
                    return fallbackData;
                } catch (fallbackError) {
                    console.error('❌ CRITICAL: Failed to store fallback results:', fallbackError);
                }
            }
            return null;
        }
    }
    /**
     * Navigate to the dedicated results route
     */
    navigateToResults() {
        window.history.pushState({}, '', '/results');
        window.dispatchEvent(new Event('popstate'));
    }
}
