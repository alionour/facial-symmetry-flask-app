import { DistanceEstimationService } from '/static/js/src/presentation/services/analysis_services/DistanceEstimationService.js';
export class AnalysisVisualizationService {
    constructor(canvasId) {
        this.currentLandmarks = [];
        this.currentMode = 'flat';
        this.videoElement = null;
        this.resizeTimeout = null;
        // New private property to store calculated metrics
        this.calculatedMetrics = null;
        this.translations = {};
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        if (!this.canvas || !this.ctx) {
            throw new Error(`Analysis canvas element with id '${canvasId}' not found`);
        }
        this.distanceEstimator = new DistanceEstimationService();
        this.setupCanvas();
        this.setupCanvasResolution();
        // Add resize handler to maintain proper scaling
        window.addEventListener('resize', () => this.handleResize());
    }

    setTranslations(translations) {
        this.translations = translations;
    }

    handleResize() {
        // Debounce resize events
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout(() => {
            this.setupCanvasResolution();
        }, 100);
    }
    setupCanvasResolution() {
        // Get the actual display size of the canvas
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        // Set the internal canvas size to match the display size with device pixel ratio
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        // Scale the context to match the device pixel ratio
        this.ctx.scale(dpr, dpr);
        // Set the CSS size to maintain the display size
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }
    setupCanvas() {
        // Ensure canvas has proper dimensions first
        this.setupCanvasResolution();
        // Set canvas background
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        // Add initial loading state with better visual feedback
        this.showLoadingState();
    }
    showLoadingState() {
        const rect = this.canvas.getBoundingClientRect();
        // Clear canvas
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        // Add loading animation
        this.ctx.fillStyle = '#0088ff';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Analysis View', rect.width / 2, rect.height / 2 - 20);
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = '#00aaff';
        this.ctx.fillText('Initializing camera...', rect.width / 2, rect.height / 2 + 10);
        // Add a simple loading indicator
        this.ctx.strokeStyle = '#0088ff';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(rect.width / 2, rect.height / 2 + 40, 15, 0, Math.PI * 1.5);
        this.ctx.stroke();
    }
    setVideoElement(video) {
        this.videoElement = video;
    }
    setAnalysisMode(mode) {
        this.currentMode = mode;
        this.updateAnalysisView();
    }
    // Force immediate rendering of the analysis view
    forceRender() {
        // Ensure canvas is properly sized first
        this.setupCanvasResolution();
        this.showLoadingState();
    }
    // New method to update calculated metrics
    updateCalculatedMetrics(metrics) {
        this.calculatedMetrics = metrics;
    }
    // New public method to retrieve calculated metrics
    getCalculatedMetrics() {
        return this.calculatedMetrics;
    }
    updateLandmarks(landmarks) {
        console.log('AnalysisVisualizationService: Received landmarks:', landmarks ? landmarks.length : 'null');
        this.currentLandmarks = landmarks;
        this.updateAnalysisView();
    }
    updateAnalysisView() {
        this.clearCanvasInternal();
        if (!this.currentLandmarks || this.currentLandmarks.length === 0) {
            this.showWaitingMessage();
            return;
        }
        // Always draw flat view - other modes removed for cleaner analysis
        this.drawFlatView();
        this.drawModeLabel();
    }
    clearCanvasInternal() {
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    transformCoordinates(point) {
        // Get the display size of the canvas (not the internal resolution)
        const rect = this.canvas.getBoundingClientRect();
        // Transform MediaPipe normalized coordinates (0-1) to display coordinates
        return {
            x: point.x * rect.width,
            y: point.y * rect.height
        };
    }
    showWaitingMessage() {
        const rect = this.canvas.getBoundingClientRect();
        this.ctx.fillStyle = '#00aaff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Detecting face...', rect.width / 2, rect.height / 2);
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#0088ff';
        this.ctx.fillText('Position your face in the camera view', rect.width / 2, rect.height / 2 + 25);
    }
    drawFlatView() {
        // Draw a simplified, flat representation of the face
        this.ctx.fillStyle = '#444';
        // Draw face outline as filled shape
        const faceOutline = this.getFaceOutlinePoints();
        if (faceOutline.length > 0) {
            const firstCoords = this.transformCoordinates(faceOutline[0]);
            this.ctx.beginPath();
            this.ctx.moveTo(firstCoords.x, firstCoords.y);
            for (let i = 1; i < faceOutline.length; i++) {
                const coords = this.transformCoordinates(faceOutline[i]);
                this.ctx.lineTo(coords.x, coords.y);
            }
            this.ctx.closePath();
            this.ctx.fill();
        }
        // Draw detailed facial features
        this.drawDetailedEyebrows();
        this.drawDetailedEyes();
        this.drawDetailedEyelashes();
        this.drawDetailedNose();
        this.drawDetailedMouth();
        this.drawCenterLines();
        this.drawHeadAlignmentIndicator();
    }
    // Removed unused analysis mode methods (wireframe, heatmap, symmetry, metrics)
    // Analysis view now locked to flat view for cleaner visualization
    getFaceOutlinePoints() {
        const outlineIndices = [
            10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
            397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
            172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
        ];
        return outlineIndices.map(idx => this.currentLandmarks[idx]).filter(Boolean);
    }
    drawDetailedEyebrows() {
        // Left eyebrow (MediaPipe standard indices)
        const leftEyebrowIndices = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];
        const leftEyebrowPoints = leftEyebrowIndices.map(idx => this.currentLandmarks[idx]).filter(Boolean);
        if (leftEyebrowPoints.length > 0) {
            this.ctx.strokeStyle = '#8B4513'; // Brown color for eyebrows
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            this.drawConnectedPoints(leftEyebrowPoints, false);
        }
        // Right eyebrow (MediaPipe standard indices)
        const rightEyebrowIndices = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276];
        const rightEyebrowPoints = rightEyebrowIndices.map(idx => this.currentLandmarks[idx]).filter(Boolean);
        if (rightEyebrowPoints.length > 0) {
            this.ctx.strokeStyle = '#8B4513'; // Brown color for eyebrows
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            this.drawConnectedPoints(rightEyebrowPoints, false);
        }
    }
    drawDetailedEyes() {
        const leftEyeOpen = this.isEyeOpen('left');
        const rightEyeOpen = this.isEyeOpen('right');
        // Left eye
        const leftEyeIndices = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
        const leftEyePoints = leftEyeIndices.map(idx => this.currentLandmarks[idx]).filter(Boolean);
        if (leftEyePoints.length > 0) {
            // Eye white background
            this.ctx.fillStyle = '#FFFFFF';
            this.drawFilledShape(leftEyePoints);
            // Calculate eye center for proper pupil positioning
            const leftEyeCenter = this.calculateEyeCenter('left');
            // Iris and pupil (only if eye is open) - draw before outline
            if (leftEyeOpen && leftEyeCenter) {
                const eyeCoords = this.transformCoordinates(leftEyeCenter);
                // Iris
                this.ctx.fillStyle = '#4169E1'; // Blue iris
                this.ctx.beginPath();
                this.ctx.arc(eyeCoords.x, eyeCoords.y, 6, 0, 2 * Math.PI);
                this.ctx.fill();
                // Pupil
                this.ctx.fillStyle = '#000000';
                this.ctx.beginPath();
                this.ctx.arc(eyeCoords.x, eyeCoords.y, 3, 0, 2 * Math.PI);
                this.ctx.fill();
            }
            // Eye outline (drawn last to ensure it's on top)
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 1.5;
            this.drawConnectedPoints(leftEyePoints, true);
        }
        // Right eye
        const rightEyeIndices = [362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382];
        const rightEyePoints = rightEyeIndices.map(idx => this.currentLandmarks[idx]).filter(Boolean);
        if (rightEyePoints.length > 0) {
            // Eye white background
            this.ctx.fillStyle = '#FFFFFF';
            this.drawFilledShape(rightEyePoints);
            // Calculate eye center for proper pupil positioning
            const rightEyeCenter = this.calculateEyeCenter('right');
            // Iris and pupil (only if eye is open) - draw before outline
            if (rightEyeOpen && rightEyeCenter) {
                const eyeCoords = this.transformCoordinates(rightEyeCenter);
                // Iris
                this.ctx.fillStyle = '#4169E1'; // Blue iris
                this.ctx.beginPath();
                this.ctx.arc(eyeCoords.x, eyeCoords.y, 6, 0, 2 * Math.PI);
                this.ctx.fill();
                // Pupil
                this.ctx.fillStyle = '#000000';
                this.ctx.beginPath();
                this.ctx.arc(eyeCoords.x, eyeCoords.y, 3, 0, 2 * Math.PI);
                this.ctx.fill();
            }
            // Eye outline (drawn last to ensure it's on top)
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 1.5;
            this.drawConnectedPoints(rightEyePoints, true);
        }
    }
    drawDetailedEyelashes() {
        const leftEyeOpen = this.isEyeOpen('left');
        const rightEyeOpen = this.isEyeOpen('right');
        // Left eyelashes (only if eye is open)
        if (leftEyeOpen) {
            const leftUpperLashIndices = [33, 7, 163, 144, 145, 153, 154, 155, 133];
            this.drawEyelashes(leftUpperLashIndices, 'upper');
            const leftLowerLashIndices = [173, 157, 158, 159, 160, 161, 246];
            this.drawEyelashes(leftLowerLashIndices, 'lower');
        }
        // Right eyelashes (only if eye is open)
        if (rightEyeOpen) {
            const rightUpperLashIndices = [362, 398, 384, 385, 386, 387, 388, 466, 263];
            this.drawEyelashes(rightUpperLashIndices, 'upper');
            const rightLowerLashIndices = [249, 390, 373, 374, 380, 381, 382];
            this.drawEyelashes(rightLowerLashIndices, 'lower');
        }
    }
    drawEyelashes(indices, type) {
        this.ctx.strokeStyle = '#2F4F4F'; // Dark gray for eyelashes
        this.ctx.lineWidth = 1;
        this.ctx.lineCap = 'round';
        for (const index of indices) {
            if (this.currentLandmarks[index]) {
                const point = this.currentLandmarks[index];
                const coords = this.transformCoordinates(point);
                // Draw individual eyelashes as small lines
                this.ctx.beginPath();
                this.ctx.moveTo(coords.x, coords.y);
                if (type === 'upper') {
                    this.ctx.lineTo(coords.x + (Math.random() - 0.5) * 4, coords.y - 6 - Math.random() * 4);
                }
                else {
                    this.ctx.lineTo(coords.x + (Math.random() - 0.5) * 4, coords.y + 4 + Math.random() * 2);
                }
                this.ctx.stroke();
            }
        }
    }
    drawDetailedNose() {
        // Only draw the most basic nose elements to avoid any problematic connections
        // Nose tip (safe - just a circle)
        if (this.currentLandmarks[2]) {
            const coords = this.transformCoordinates(this.currentLandmarks[2]);
            this.ctx.fillStyle = '#DEB887'; // Burlywood for nose tip
            this.ctx.beginPath();
            this.ctx.arc(coords.x, coords.y, 4, 0, 2 * Math.PI);
            this.ctx.fill();
        }
        // Nose bridge (safe - only vertical line)
        if (this.currentLandmarks[6] && this.currentLandmarks[2]) {
            const coords6 = this.transformCoordinates(this.currentLandmarks[6]);
            const coords2 = this.transformCoordinates(this.currentLandmarks[2]);
            this.ctx.strokeStyle = '#D2B48C'; // Light brown for nose
            this.ctx.lineWidth = 2;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(coords6.x, coords6.y);
            this.ctx.lineTo(coords2.x, coords2.y);
            this.ctx.stroke();
        }
        // Left nostril (safe - just a small circle)
        if (this.currentLandmarks[5]) {
            const coords = this.transformCoordinates(this.currentLandmarks[5]);
            this.ctx.fillStyle = '#8B7355'; // Darker brown for nostrils
            this.ctx.beginPath();
            this.ctx.arc(coords.x, coords.y, 1.5, 0, 2 * Math.PI);
            this.ctx.fill();
        }
        // Right nostril (safe - just a small circle)
        if (this.currentLandmarks[4]) {
            const coords = this.transformCoordinates(this.currentLandmarks[4]);
            this.ctx.fillStyle = '#8B7355'; // Darker brown for nostrils
            this.ctx.beginPath();
            this.ctx.arc(coords.x, coords.y, 1.5, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }
    drawDetailedMouth() {
        // Outer lip outline
        const outerLipIndices = [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 191, 80, 81, 82];
        const outerLipPoints = outerLipIndices.map(idx => this.currentLandmarks[idx]).filter(Boolean);
        if (outerLipPoints.length > 0) {
            // Lip color fill
            this.ctx.fillStyle = '#CD5C5C'; // Indian red for lips
            this.drawFilledShape(outerLipPoints);
            // Lip outline
            this.ctx.strokeStyle = '#8B0000'; // Dark red for lip outline
            this.ctx.lineWidth = 2;
            this.drawConnectedPoints(outerLipPoints, true);
        }
        // Inner mouth (teeth area when mouth is open)
        const innerMouthIndices = [13, 82, 81, 80, 78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 321, 375, 307, 320, 405, 314, 17, 84, 61];
        const innerMouthPoints = innerMouthIndices.map(idx => this.currentLandmarks[idx]).filter(Boolean);
        if (innerMouthPoints.length > 0) {
            // Check if mouth is open (simple heuristic)
            const mouthHeight = this.calculateMouthHeight();
            if (mouthHeight > 0.01) { // Mouth is open
                this.ctx.fillStyle = '#2F2F2F'; // Dark color for open mouth
                this.drawFilledShape(innerMouthPoints);
                // Draw teeth if mouth is significantly open
                if (mouthHeight > 0.02) {
                    this.drawTeeth();
                }
            }
        }
        // Upper lip line
        const upperLipIndices = [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95];
        const upperLipPoints = upperLipIndices.map(idx => this.currentLandmarks[idx]).filter(Boolean);
        if (upperLipPoints.length > 0) {
            this.ctx.strokeStyle = '#B22222'; // Fire brick for lip definition
            this.ctx.lineWidth = 1;
            this.drawConnectedPoints(upperLipPoints, false);
        }
        // Lower lip line
        const lowerLipIndices = [78, 191, 80, 81, 82, 61];
        const lowerLipPoints = lowerLipIndices.map(idx => this.currentLandmarks[idx]).filter(Boolean);
        if (lowerLipPoints.length > 0) {
            this.ctx.strokeStyle = '#B22222'; // Fire brick for lip definition
            this.ctx.lineWidth = 1;
            this.drawConnectedPoints(lowerLipPoints, false);
        }
        // Lip highlight (philtrum area)
        if (this.currentLandmarks[12] && this.currentLandmarks[15]) {
            const coords12 = this.transformCoordinates(this.currentLandmarks[12]);
            const coords15 = this.transformCoordinates(this.currentLandmarks[15]);
            this.ctx.strokeStyle = '#F0E68C'; // Khaki for lip highlight
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(coords12.x, coords12.y);
            this.ctx.lineTo(coords15.x, coords15.y);
            this.ctx.stroke();
        }
        // Draw vertical reference line from chin tip for smile analysis
        this.drawVerticalReferenceLineFromChinTip();
    }
    calculateMouthHeight() {
        // Calculate mouth opening height as a proportion of face height
        if (this.currentLandmarks[13] && this.currentLandmarks[14] && this.currentLandmarks[10] && this.currentLandmarks[152]) {
            const mouthTop = this.currentLandmarks[13].y;
            const mouthBottom = this.currentLandmarks[14].y;
            const faceTop = this.currentLandmarks[10].y;
            const faceBottom = this.currentLandmarks[152].y;
            const mouthHeight = Math.abs(mouthBottom - mouthTop);
            const faceHeight = Math.abs(faceBottom - faceTop);
            return mouthHeight / faceHeight;
        }
        return 0;
    }
    drawTeeth() {
        // Simple teeth representation
        if (this.currentLandmarks[13] && this.currentLandmarks[14]) {
            const coords61 = this.transformCoordinates(this.currentLandmarks[61]);
            const coords291 = this.transformCoordinates(this.currentLandmarks[291]);
            const coords13 = this.transformCoordinates(this.currentLandmarks[13]);
            const coords14 = this.transformCoordinates(this.currentLandmarks[14]);
            const mouthCenterX = (coords61.x + coords291.x) / 2;
            const upperY = coords13.y;
            const lowerY = coords14.y;
            this.ctx.fillStyle = '#FFFAF0'; // Floral white for teeth
            this.ctx.strokeStyle = '#E0E0E0'; // Light gray for tooth separation
            this.ctx.lineWidth = 0.5;
            // Draw upper teeth
            for (let i = 0; i < 6; i++) {
                const x = mouthCenterX - 30 + i * 10;
                const width = 8;
                const height = 8;
                this.ctx.fillRect(x, upperY, width, height);
                this.ctx.strokeRect(x, upperY, width, height);
            }
            // Draw lower teeth
            for (let i = 0; i < 6; i++) {
                const x = mouthCenterX - 30 + i * 10;
                const width = 8;
                const height = 8;
                this.ctx.fillRect(x, lowerY - height, width, height);
                this.ctx.strokeRect(x, lowerY - height, width, height);
            }
        }
    }
    drawCenterLines() {
        // Get display dimensions for center lines
        const rect = this.canvas.getBoundingClientRect();
        // Set up line style for center lines
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.globalAlpha = 0.7;
        // Draw vertical center line (symmetry line)
        this.ctx.beginPath();
        this.ctx.moveTo(rect.width / 2, 0);
        this.ctx.lineTo(rect.width / 2, rect.height);
        this.ctx.stroke();
        // Draw horizontal center line
        this.ctx.beginPath();
        this.ctx.moveTo(0, rect.height / 2);
        this.ctx.lineTo(rect.width, rect.height / 2);
        this.ctx.stroke();
        // Reset line style
        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 1.0;
    }
    drawFilledShape(points) {
        if (points.length < 3)
            return;
        const firstCoords = this.transformCoordinates(points[0]);
        this.ctx.beginPath();
        this.ctx.moveTo(firstCoords.x, firstCoords.y);
        for (let i = 1; i < points.length; i++) {
            const coords = this.transformCoordinates(points[i]);
            this.ctx.lineTo(coords.x, coords.y);
        }
        this.ctx.closePath();
        this.ctx.fill();
    }
    drawConnectedPoints(points, closed = false) {
        if (points.length < 2)
            return;
        const firstCoords = this.transformCoordinates(points[0]);
        this.ctx.beginPath();
        this.ctx.moveTo(firstCoords.x, firstCoords.y);
        for (let i = 1; i < points.length; i++) {
            const coords = this.transformCoordinates(points[i]);
            this.ctx.lineTo(coords.x, coords.y);
        }
        if (closed) {
            this.ctx.closePath();
        }
        this.ctx.stroke();
    }
    // Removed unused methods for cleaner codebase:
    // - calculateLandmarkDensity (heatmap mode)
    // - drawFeatureWireframes (wireframe mode)
    // - drawSymmetryComparison (symmetry mode)
    // - highlightAsymmetries (symmetry mode)
    // - drawMeasurementLines (metrics mode)
    // - drawMetricValues (metrics mode)
    calculateEyeCenter(eye) {
        // Calculate the center point of the eye for proper pupil positioning
        let eyeCorners;
        if (eye === 'left') {
            // Left eye inner and outer corners
            eyeCorners = [33, 133]; // Inner corner, outer corner
        }
        else {
            // Right eye inner and outer corners
            eyeCorners = [362, 263]; // Inner corner, outer corner
        }
        const innerCorner = this.currentLandmarks[eyeCorners[0]];
        const outerCorner = this.currentLandmarks[eyeCorners[1]];
        if (!innerCorner || !outerCorner)
            return null;
        // Calculate center point between corners
        const centerX = (innerCorner.x + outerCorner.x) / 2;
        const centerY = (innerCorner.y + outerCorner.y) / 2;
        return { x: centerX, y: centerY };
    }
    isEyeOpen(eye) {
        // Calculate eye aspect ratio (EAR) to determine if eye is open
        let upperLid, lowerLid;
        if (eye === 'left') {
            // Left eye landmarks
            upperLid = [159, 158, 157, 173]; // Upper eyelid
            lowerLid = [144, 145, 153, 154]; // Lower eyelid
        }
        else {
            // Right eye landmarks
            upperLid = [386, 385, 384, 398]; // Upper eyelid
            lowerLid = [374, 373, 390, 249]; // Lower eyelid
        }
        // Calculate vertical distances
        let totalVerticalDistance = 0;
        let validPoints = 0;
        for (let i = 0; i < upperLid.length && i < lowerLid.length; i++) {
            const upperPoint = this.currentLandmarks[upperLid[i]];
            const lowerPoint = this.currentLandmarks[lowerLid[i]];
            if (upperPoint && lowerPoint) {
                const distance = Math.abs(upperPoint.y - lowerPoint.y);
                totalVerticalDistance += distance;
                validPoints++;
            }
        }
        if (validPoints === 0)
            return true; // Default to open if no landmarks
        const averageVerticalDistance = totalVerticalDistance / validPoints;
        // Threshold for eye closure (adjust as needed)
        const eyeClosureThreshold = 0.008; // Approximately 0.8% of normalized coordinates
        return averageVerticalDistance > eyeClosureThreshold;
    }
    drawHeadAlignmentIndicator() {
        const alignment = this.calculateHeadAlignmentAndDsitance();
        if (!alignment)
            return;
        // Estimate distance using new DistanceEstimationService
        let estimatedDistance = null;
        if (this.currentLandmarks && this.videoElement) {
            estimatedDistance = this.distanceEstimator.estimateDistance(this.currentLandmarks, this.videoElement.videoWidth);
        }
        // Draw separate boxes for head alignment and face distance
        this.drawHeadAlignmentBox(alignment);
        this.drawFaceDistanceBox(estimatedDistance);
    }
    drawHeadAlignmentBox(alignment) {
        // Position for head alignment box (top-left corner)
        const alignmentX = 10;
        const alignmentY = 10;
        const alignmentWidth = 200;
        const alignmentHeight = 90;
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(alignmentX, alignmentY, alignmentWidth, alignmentHeight);
        // Border
        this.ctx.strokeStyle = alignment.color;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(alignmentX, alignmentY, alignmentWidth, alignmentHeight);
        // Title
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(this.translations['Head Alignment'] || 'Head Alignment', alignmentX + 5, alignmentY + 15);
        // Status
        this.ctx.fillStyle = alignment.color;
        this.ctx.font = 'bold 11px Arial';
        this.ctx.fillText(alignment.status, alignmentX + 5, alignmentY + 32);
        // Horizontal angle (roll)
        this.ctx.fillStyle = '#CCCCCC';
        this.ctx.font = '10px Arial';
        this.ctx.fillText(`${this.translations['Tilt'] || 'Tilt'}: ${alignment.angle.toFixed(1)}°`, alignmentX + 5, alignmentY + 50);
        // Rotation angle (yaw)
        this.ctx.fillText(`${this.translations['Rotation'] || 'Rotation'}: ${alignment.rotation.toFixed(1)}°`, alignmentX + 5, alignmentY + 65);
        // Instructional text for head alignment
        this.ctx.fillStyle = alignment.color;
        this.ctx.font = '9px Arial';
        const alignmentInstruction = this.getAlignmentInstruction(alignment.status);
        this.ctx.fillText(this.translations[alignmentInstruction] || alignmentInstruction, alignmentX + 5, alignmentY + 80);
        // Visual indicator (3D level indicator) - smaller and repositioned
        this.drawAlignmentVisual(alignmentX + 160, alignmentY + 45, alignment);
    }
    drawFaceDistanceBox(estimatedDistance) {
        // Position for face distance box (top-right corner)
        const rect = this.canvas.getBoundingClientRect();
        const distanceWidth = 200;
        const distanceHeight = 70;
        const distanceX = rect.width - distanceWidth - 10; // Right side with 10px margin
        const distanceY = 10; // Top with 10px margin
        // Adjusted thresholds based on estimated distance in mm
        const minGoodDistance = 350; // mm
        const maxGoodDistance = 400; // mm
        // Determine distance status and color
        let distanceColor = '#FFFFFF';
        let distanceStatus = 'Unknown';
        if (estimatedDistance !== null) {
            if (estimatedDistance >= minGoodDistance && estimatedDistance <= maxGoodDistance) {
                distanceColor = '#00FF00'; // Green if in range
                distanceStatus = 'Optimal';
            }
            else if (estimatedDistance < minGoodDistance) {
                distanceColor = '#FF6600'; // Orange if too close
                distanceStatus = 'Too Close';
            }
            else {
                distanceColor = '#FF6600'; // Orange if too far
                distanceStatus = 'Too Far';
            }
        }
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(distanceX, distanceY, distanceWidth, distanceHeight);
        // Border
        this.ctx.strokeStyle = distanceColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(distanceX, distanceY, distanceWidth, distanceHeight);
        // Title
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(this.translations['Face Distance'] || 'Face Distance', distanceX + 5, distanceY + 15);
        // Status
        this.ctx.fillStyle = distanceColor;
        this.ctx.font = 'bold 11px Arial';
        this.ctx.fillText(this.translations[distanceStatus] || distanceStatus, distanceX + 5, distanceY + 32);
        // Distance value
        this.ctx.fillStyle = '#CCCCCC';
        this.ctx.font = '10px Arial';
        if (estimatedDistance !== null) {
            this.ctx.fillText(`${this.translations['Distance'] || 'Distance'}: ${estimatedDistance.toFixed(0)} mm`, distanceX + 5, distanceY + 50);
        }
        else {
            this.ctx.fillText(`${this.translations['Distance'] || 'Distance'}: N/A`, distanceX + 5, distanceY + 50);
        }
        // Instructional text for distance
        this.ctx.fillStyle = distanceColor;
        this.ctx.font = '9px Arial';
        let distanceInstruction = '';
        if (estimatedDistance !== null) {
            if (estimatedDistance < minGoodDistance) {
                distanceInstruction = 'Please move farther from camera';
            }
            else if (estimatedDistance > maxGoodDistance) {
                distanceInstruction = 'Please move closer to camera';
            }
            else {
                distanceInstruction = 'Distance is optimal';
            }
        }
        else {
            distanceInstruction = 'Unable to estimate distance';
        }
        this.ctx.fillText(this.translations[distanceInstruction] || distanceInstruction, distanceX + 5, distanceY + 65);
    }
    getAlignmentInstruction(status) {
        switch (status) {
            case 'PERFECTLY ALIGNED':
                return 'Good alignment. Keep your head steady.';
            case 'ALIGNED':
                return 'Almost aligned. Slight adjustments may help.';
            case 'TILTED LEFT':
                return 'Please tilt your head slightly to the right.';
            case 'TILTED RIGHT':
                return 'Please tilt your head slightly to the left.';
            case 'ROTATED LEFT':
                return 'Please rotate your head slightly to the right.';
            case 'ROTATED RIGHT':
                return 'Please rotate your head slightly to the left.';
            case 'TILTED LEFT & ROTATED LEFT':
                return 'Tilt your head slightly to the right and rotate to the right.';
            case 'TILTED LEFT & ROTATED RIGHT':
                return 'Tilt your head slightly to the right and rotate to the left.';
            case 'TILTED RIGHT & ROTATED LEFT':
                return 'Tilt your head slightly to the left and rotate to the right.';
            case 'TILTED RIGHT & ROTATED RIGHT':
                return 'Tilt your head slightly to the left and rotate to the left.';
            default:
                if (status.includes('TILTED LEFT')) {
                    return 'Please tilt your head slightly to the right.';
                }
                else if (status.includes('TILTED RIGHT')) {
                    return 'Please tilt your head slightly to the left.';
                }
                else if (status.includes('ROTATED LEFT')) {
                    return 'Please rotate your head slightly to the right.';
                }
                else if (status.includes('ROTATED RIGHT')) {
                    return 'Please rotate your head slightly to the left.';
                }
                return 'Adjust your head position for better alignment.';
        }
    }
    // Update: Now returns estimatedDistance (camera distance in mm) as well
    calculateHeadAlignmentAndDsitance() {
        // Use estimateHeadPose to get yaw, pitch, roll
        const headPose = this.estimateHeadPose();
        if (!headPose)
            return null;
        const { yaw, pitch, roll } = headPose;
        // Incorporate head distance from camera to adjust sensitivity
        const avgFaceDepth = this.calculateAverageFaceDepth();
        const distanceFactor = avgFaceDepth > 0 ? Math.min(Math.max(avgFaceDepth, 0.2), 1.0) : 1.0;
        // Define flexible thresholds (degrees)
        const horizontalThreshold = 15 * distanceFactor; // Increased from 8 for roll (tilt left/right)
        const severeHorizontalThreshold = 50 * distanceFactor; // Increased from 30
        const rotationThreshold = 20 * distanceFactor; // Increased from 10 for yaw (head rotation left/right)
        const severeRotationThreshold = 60 * distanceFactor; // Increased from 40
        // Determine horizontal alignment status based on roll
        let horizontalStatus;
        let color;
        if (Math.abs(roll) < horizontalThreshold) {
            horizontalStatus = 'ALIGNED';
            color = '#00FF00'; // Green
        }
        else if (roll > horizontalThreshold) {
            horizontalStatus = 'TILTED RIGHT';
            color = '#FF6600'; // Orange
        }
        else {
            horizontalStatus = 'TILTED LEFT';
            color = '#FF6600'; // Orange
        }
        // Determine rotation alignment status based on yaw
        let rotationStatus;
        if (Math.abs(yaw) < rotationThreshold) {
            rotationStatus = 'ROTATION ALIGNED';
        }
        else if (yaw > rotationThreshold) {
            rotationStatus = 'ROTATED RIGHT';
            if (horizontalStatus === 'ALIGNED') {
                color = '#FF6600'; // Orange if only rotation off
            }
        }
        else {
            rotationStatus = 'ROTATED LEFT';
            if (horizontalStatus === 'ALIGNED') {
                color = '#FF6600'; // Orange if only rotation off
            }
        }
        // Combine status
        let combinedStatus;
        if (horizontalStatus === 'ALIGNED' && rotationStatus === 'ROTATION ALIGNED') {
            combinedStatus = 'PERFECTLY ALIGNED';
        }
        else if (horizontalStatus === 'ALIGNED') {
            combinedStatus = rotationStatus;
        }
        else if (rotationStatus === 'ROTATION ALIGNED') {
            combinedStatus = horizontalStatus;
        }
        else {
            combinedStatus = `${horizontalStatus} & ${rotationStatus}`;
        }
        // If severely tilted or rotated, use red
        if (Math.abs(roll) > severeHorizontalThreshold || Math.abs(yaw) > severeRotationThreshold) {
            color = '#FF0000'; // Red
        }
        // Estimate distance using DistanceEstimationService
        let estimatedDistance = null;
        if (this.currentLandmarks && this.videoElement) {
            estimatedDistance = this.distanceEstimator.estimateDistance(this.currentLandmarks, this.videoElement.videoWidth);
        }
        return {
            status: combinedStatus,
            angle: roll,
            color,
            rotation: yaw,
            estimatedDistance
        };
    }
    drawAlignmentVisual(x, y, alignment) {
        const size = 25;
        // Draw 3D level indicator background
        this.ctx.strokeStyle = '#666666';
        this.ctx.lineWidth = 2;
        // Outer circle (level housing)
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, 2 * Math.PI);
        this.ctx.stroke();
        // Inner reference circle
        this.ctx.strokeStyle = '#444444';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.7, 0, 2 * Math.PI);
        this.ctx.stroke();
        // Calculate bubble position based on horizontal tilt (roll)
        const horizontalOffset = Math.sin(alignment.angle * Math.PI / 180) * size * 0.6;
        // Calculate bubble position based on rotation (yaw) vertically
        const verticalOffset = -Math.sin(alignment.rotation * Math.PI / 180) * size * 0.6; // Inverted for correct visual
        const bubbleX = x + horizontalOffset;
        const bubbleY = y + verticalOffset;
        // Constrain bubble within the level circle
        const distanceFromCenter = Math.sqrt(horizontalOffset * horizontalOffset + verticalOffset * verticalOffset);
        const maxDistance = size * 0.6;
        let finalBubbleX = bubbleX;
        let finalBubbleY = bubbleY;
        if (distanceFromCenter > maxDistance) {
            const ratio = maxDistance / distanceFromCenter;
            finalBubbleX = x + horizontalOffset * ratio;
            finalBubbleY = y + verticalOffset * ratio;
        }
        // Draw the level bubble
        this.ctx.fillStyle = alignment.color;
        this.ctx.strokeStyle = alignment.color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(finalBubbleX, finalBubbleY, 4, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.stroke();
        // Draw crosshairs for reference
        this.ctx.strokeStyle = '#888888';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([2, 2]);
        // Horizontal crosshair
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.8, y);
        this.ctx.lineTo(x + size * 0.8, y);
        this.ctx.stroke();
        // Vertical crosshair
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size * 0.8);
        this.ctx.lineTo(x, y + size * 0.8);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        // Center dot (perfect alignment reference)
        this.ctx.fillStyle = '#888888';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 1, 0, 2 * Math.PI);
        this.ctx.fill();
    }
    /**
     * Draw vertical reference line from chin tip for smile analysis
     * This line is used in clinical analysis for measuring mouth corner distances
     * Based on ClinicalAnalysisService validated methodology using chin tip (landmark 152)
     */
    drawVerticalReferenceLineFromChinTip() {
        // Get key landmarks for vertical reference line
        const leftEyeInner = this.currentLandmarks[133]; // Left eye inner corner
        const rightEyeInner = this.currentLandmarks[362]; // Right eye inner corner
        const chinTip = this.currentLandmarks[152]; // Chin tip (most stable reference point)
        if (!leftEyeInner || !rightEyeInner || !chinTip) {
            return; // Cannot draw reference line without required landmarks
        }
        // Calculate eye midpoint (top of vertical reference line)
        const eyeMidpoint = {
            x: (leftEyeInner.x + rightEyeInner.x) / 2,
            y: (leftEyeInner.y + rightEyeInner.y) / 2
        };
        // Transform coordinates to canvas space
        const eyeMidpointCoords = this.transformCoordinates(eyeMidpoint);
        const chinTipCoords = this.transformCoordinates(this.currentLandmarks[152]);
        // Draw the vertical reference line
        this.ctx.strokeStyle = '#00FF00'; // Bright green for clinical reference line
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([8, 4]); // Dashed line to distinguish from other features
        this.ctx.globalAlpha = 0.8;
        this.ctx.beginPath();
        this.ctx.moveTo(eyeMidpointCoords.x, eyeMidpointCoords.y);
        this.ctx.lineTo(chinTipCoords.x, chinTipCoords.y);
        this.ctx.stroke();
        // Reset line style
        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 1.0;
        // Draw landmark points for reference
        this.ctx.fillStyle = '#00FF00';
        // Eye midpoint marker
        this.ctx.beginPath();
        this.ctx.arc(eyeMidpointCoords.x, eyeMidpointCoords.y, 3, 0, 2 * Math.PI);
        this.ctx.fill();
        // Chin tip marker
        this.ctx.beginPath();
        this.ctx.arc(chinTipCoords.x, chinTipCoords.y, 4, 0, 2 * Math.PI);
        this.ctx.fill();
        // Add text label for the reference line
        this.ctx.fillStyle = '#00FF00';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'left';
        // Position label near the middle of the line
        const labelX = Math.max(eyeMidpointCoords.x, chinTipCoords.x) + 8;
        const labelY = (eyeMidpointCoords.y + chinTipCoords.y) / 2;
        this.ctx.fillText('Vertical Reference', labelX, labelY - 5);
        // Draw mouth corner distance indicators if mouth corners are available
        this.drawMouthCornerDistanceIndicators(eyeMidpointCoords, chinTipCoords);
        // Draw horizontal reference line at chin tip for additional analysis
        this.drawHorizontalReferenceLineAtChinTip();
    }
    /**
     * Draw indicators showing mouth corner distances to the vertical reference line
     */
    drawMouthCornerDistanceIndicators(eyeMidpoint, chinTip) {
        const leftMouthCorner = this.currentLandmarks[61]; // Left mouth corner
        const rightMouthCorner = this.currentLandmarks[291]; // Right mouth corner
        if (!leftMouthCorner || !rightMouthCorner) {
            return;
        }
        const leftCornerCoords = this.transformCoordinates(leftMouthCorner);
        const rightCornerCoords = this.transformCoordinates(rightMouthCorner);
        // Calculate perpendicular distance from each corner to the vertical reference line
        const leftDistance = this.calculatePerpendicularDistance(leftCornerCoords, eyeMidpoint, chinTip);
        const rightDistance = this.calculatePerpendicularDistance(rightCornerCoords, eyeMidpoint, chinTip);
        // Draw distance lines
        this.ctx.strokeStyle = '#FFFF00'; // Yellow for distance indicators
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([3, 3]);
        this.ctx.globalAlpha = 0.7;
        // Left corner distance line
        const leftProjection = this.projectPointOntoLine(leftCornerCoords, eyeMidpoint, chinTip);
        this.ctx.beginPath();
        this.ctx.moveTo(leftCornerCoords.x, leftCornerCoords.y);
        this.ctx.lineTo(leftProjection.x, leftProjection.y);
        this.ctx.stroke();
        // Right corner distance line
        const rightProjection = this.projectPointOntoLine(rightCornerCoords, eyeMidpoint, chinTip);
        this.ctx.beginPath();
        this.ctx.moveTo(rightCornerCoords.x, rightCornerCoords.y);
        this.ctx.lineTo(rightProjection.x, rightProjection.y);
        this.ctx.stroke();
        // Reset line style
        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 1.0;
        // Draw corner markers
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.beginPath();
        this.ctx.arc(leftCornerCoords.x, leftCornerCoords.y, 2, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(rightCornerCoords.x, rightCornerCoords.y, 2, 0, 2 * Math.PI);
        this.ctx.fill();
        // Display normalized distance values (as percentages)
        const maxDistance = Math.max(leftDistance, rightDistance);
        const leftPercentage = maxDistance > 0 ? (leftDistance / maxDistance) * 100 : 100;
        const rightPercentage = maxDistance > 0 ? (rightDistance / maxDistance) * 100 : 100;
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.font = '9px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`L: ${leftPercentage.toFixed(0)}%`, leftCornerCoords.x, leftCornerCoords.y - 8);
        this.ctx.fillText(`R: ${rightPercentage.toFixed(0)}%`, rightCornerCoords.x, rightCornerCoords.y - 8);
    }
    /**
     * Calculate perpendicular distance from a point to a line defined by two points
     * Now includes z-coordinate to account for depth and camera distance
     * With rotation compensation to handle head pose variations
     */
    calculatePerpendicularDistance(point, linePoint1, linePoint2) {
        // Remove rotation compensation, use raw points directly
        const x0 = point.x;
        const y0 = point.y;
        const z0 = point.z || 0;
        const x1 = linePoint1.x;
        const y1 = linePoint1.y;
        const z1 = linePoint1.z || 0;
        const x2 = linePoint2.x;
        const y2 = linePoint2.y;
        const z2 = linePoint2.z || 0;
        // Calculate 3D perpendicular distance from point to line
        // Vector from line point 1 to line point 2
        const lineVectorX = x2 - x1;
        const lineVectorY = y2 - y1;
        const lineVectorZ = z2 - z1;
        // Vector from line point 1 to the point
        const pointVectorX = x0 - x1;
        const pointVectorY = y0 - y1;
        const pointVectorZ = z0 - z1;
        // Cross product of line vector and point vector
        const crossX = lineVectorY * pointVectorZ - lineVectorZ * pointVectorY;
        const crossY = lineVectorZ * pointVectorX - lineVectorX * pointVectorZ;
        const crossZ = lineVectorX * pointVectorY - lineVectorY * pointVectorX;
        // Magnitude of cross product
        const crossMagnitude = Math.sqrt(crossX * crossX + crossY * crossY + crossZ * crossZ);
        // Magnitude of line vector
        const lineMagnitude = Math.sqrt(lineVectorX * lineVectorX + lineVectorY * lineVectorY + lineVectorZ * lineVectorZ);
        return lineMagnitude > 0 ? crossMagnitude / lineMagnitude : 0;
    }
    /**
     * Apply rotation compensation to normalize coordinates to front-facing reference frame
     * Uses head pose estimation and z-coordinate depth normalization
     */
    applyRotationCompensation(point) {
        if (!point)
            return { x: 0, y: 0, z: 0 };
        const z = point.z || 0;
        // Get head pose estimation
        const headPose = this.estimateHeadPose();
        if (!headPose) {
            return {
                x: point.x,
                y: point.y,
                z: z
            };
        }
        // Scale down rotation angles to preserve some natural movement
        // Only compensate for significant rotations (> 5 degrees)
        const scaledHeadPose = {
            yaw: Math.abs(headPose.yaw) > 5 ? headPose.yaw * 0.7 : 0,
            pitch: Math.abs(headPose.pitch) > 5 ? headPose.pitch * 0.7 : 0,
            roll: Math.abs(headPose.roll) > 5 ? headPose.roll * 0.7 : 0
        };
        // Apply partial rotation compensation
        const compensated = this.transformToFrontFacing(point, scaledHeadPose);
        // Scale depth normalization to preserve some perspective
        const depthNormalized = this.normalizeForDepth(compensated, 0.7);
        // Debug visualization of compensation
        this.drawCompensationDebug(point, depthNormalized, headPose);
        return depthNormalized;
    }
    drawCompensationDebug(original, compensated, headPose) {
        // Draw debug info in top-left corner
        const debugX = 10;
        const debugY = 120;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(debugX, debugY, 200, 100);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'left';
        const origCoords = this.transformCoordinates(original);
        const compCoords = this.transformCoordinates(compensated);
        this.ctx.fillText(`Original: (${origCoords.x.toFixed(1)}, ${origCoords.y.toFixed(1)})`, debugX + 5, debugY + 15);
        this.ctx.fillText(`Compensated: (${compCoords.x.toFixed(1)}, ${compCoords.y.toFixed(1)})`, debugX + 5, debugY + 30);
        this.ctx.fillText(`Head Pose:`, debugX + 5, debugY + 50);
        this.ctx.fillText(`  Yaw: ${headPose.yaw.toFixed(1)}°`, debugX + 5, debugY + 65);
        this.ctx.fillText(`  Pitch: ${headPose.pitch.toFixed(1)}°`, debugX + 5, debugY + 80);
        this.ctx.fillText(`  Roll: ${headPose.roll.toFixed(1)}°`, debugX + 5, debugY + 95);
    }
    /**
     * Estimate head pose using key facial landmarks
     */
    estimateHeadPose() {
        // Key landmarks for head pose estimation
        const noseTip = this.currentLandmarks[2]; // Nose tip
        const leftEyeInner = this.currentLandmarks[133]; // Left eye inner corner
        const rightEyeInner = this.currentLandmarks[362]; // Right eye inner corner
        const leftMouthCorner = this.currentLandmarks[61]; // Left mouth corner
        const rightMouthCorner = this.currentLandmarks[291]; // Right mouth corner
        const chinTip = this.currentLandmarks[152]; // Chin tip
        const foreheadCenter = this.currentLandmarks[10]; // Forehead center
        if (!noseTip || !leftEyeInner || !rightEyeInner || !leftMouthCorner || !rightMouthCorner || !chinTip || !foreheadCenter) {
            return null;
        }
        // Calculate yaw (left-right rotation) using eye positions and nose
        const eyeMidpointX = (leftEyeInner.x + rightEyeInner.x) / 2;
        const noseOffsetX = noseTip.x - eyeMidpointX;
        const eyeDistance = Math.abs(rightEyeInner.x - leftEyeInner.x);
        const yaw = Math.atan2(noseOffsetX, eyeDistance) * (180 / Math.PI);
        // Calculate pitch (up-down rotation) using nose-to-forehead vs nose-to-chin distances
        const noseToForeheadDist = Math.abs(foreheadCenter.y - noseTip.y);
        const noseToChinDist = Math.abs(chinTip.y - noseTip.y);
        const totalFaceHeight = noseToForeheadDist + noseToChinDist;
        const expectedRatio = 0.4; // Expected forehead-to-nose ratio when head is level
        const actualRatio = noseToForeheadDist / totalFaceHeight;
        const pitch = (actualRatio - expectedRatio) * 180; // Convert to degrees
        // Calculate roll (tilt rotation) using eye line angle
        const eyeDeltaY = rightEyeInner.y - leftEyeInner.y;
        const eyeDeltaX = rightEyeInner.x - leftEyeInner.x;
        const roll = Math.atan2(eyeDeltaY, eyeDeltaX) * (180 / Math.PI);
        return { yaw, pitch, roll };
    }
    /**
     * Transform coordinates to front-facing reference frame
     */
    transformToFrontFacing(point, headPose) {
        const x = point.x;
        const y = point.y;
        const z = point.z || 0;
        // Convert angles to radians
        const yawRad = headPose.yaw * (Math.PI / 180);
        const pitchRad = headPose.pitch * (Math.PI / 180);
        const rollRad = headPose.roll * (Math.PI / 180);
        // Apply rotation matrices in order: Roll -> Pitch -> Yaw
        // This transforms the point as if the head was rotated back to front-facing
        // Roll rotation (around z-axis)
        let newX = x * Math.cos(-rollRad) - y * Math.sin(-rollRad);
        let newY = x * Math.sin(-rollRad) + y * Math.cos(-rollRad);
        let newZ = z;
        // Pitch rotation (around x-axis)
        const tempY = newY;
        newY = tempY * Math.cos(-pitchRad) - newZ * Math.sin(-pitchRad);
        newZ = tempY * Math.sin(-pitchRad) + newZ * Math.cos(-pitchRad);
        // Yaw rotation (around y-axis)
        const tempX = newX;
        newX = tempX * Math.cos(-yawRad) + newZ * Math.sin(-yawRad);
        newZ = -tempX * Math.sin(-yawRad) + newZ * Math.cos(-yawRad);
        return { x: newX, y: newY, z: newZ };
    }
    /**
     * Normalize coordinates for depth to account for perspective distortion
     */
    normalizeForDepth(point, scale = 1.0) {
        // Calculate average face depth for normalization reference
        const avgFaceDepth = this.calculateAverageFaceDepth();
        if (avgFaceDepth === 0 || point.z === 0) {
            return point; // No depth information available
        }
        // Scale the depth normalization to preserve some perspective
        const depthDiff = (avgFaceDepth - point.z) * scale;
        const depthRatio = avgFaceDepth / (avgFaceDepth - depthDiff);
        // Apply scaled perspective correction
        const normalizedX = point.x * depthRatio;
        const normalizedY = point.y * depthRatio;
        return {
            x: normalizedX,
            y: normalizedY,
            z: point.z
        };
    }
    /**
     * Calculate average face depth for normalization reference
     */
    calculateAverageFaceDepth() {
        const keyLandmarks = [
            this.currentLandmarks[2], // Nose tip
            this.currentLandmarks[133], // Left eye inner
            this.currentLandmarks[362], // Right eye inner
            this.currentLandmarks[61], // Left mouth corner
            this.currentLandmarks[291], // Right mouth corner
            this.currentLandmarks[152] // Chin tip
        ];
        let totalDepth = 0;
        let validPoints = 0;
        for (const landmark of keyLandmarks) {
            if (landmark && landmark.z !== undefined) {
                totalDepth += landmark.z;
                validPoints++;
            }
        }
        return validPoints > 0 ? totalDepth / validPoints : 0;
    }
    /**
     * Project a point onto a line defined by two points
     */
    projectPointOntoLine(point, linePoint1, linePoint2) {
        const x0 = point.x;
        const y0 = point.y;
        const x1 = linePoint1.x;
        const y1 = linePoint1.y;
        const x2 = linePoint2.x;
        const y2 = linePoint2.y;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthSquared = dx * dx + dy * dy;
        if (lengthSquared === 0) {
            return { x: x1, y: y1 }; // Line is a point
        }
        const t = ((x0 - x1) * dx + (y0 - y1) * dy) / lengthSquared;
        return {
            x: x1 + t * dx,
            y: y1 + t * dy
        };
    }
    /**
     * Draw horizontal reference line at chin tip (landmark 152) for mouth corner analysis
     * This line is tilted to match the angle of the inner eye line
     */
    drawHorizontalReferenceLineAtChinTip() {
        const chinTip = this.currentLandmarks[152]; // Chin tip landmark
        const leftEyeInner = this.currentLandmarks[133]; // Left eye inner corner
        const rightEyeInner = this.currentLandmarks[362]; // Right eye inner corner
        const leftFaceEdge = this.currentLandmarks[172]; // Left face edge
        const rightFaceEdge = this.currentLandmarks[397]; // Right face edge
        if (!chinTip || !leftEyeInner || !rightEyeInner) {
            return; // Cannot draw horizontal reference line without required landmarks
        }
        // Calculate the angle of the inner eye line
        const deltaY = rightEyeInner.y - leftEyeInner.y;
        const deltaX = rightEyeInner.x - leftEyeInner.x;
        const eyeAngle = Math.atan2(deltaY, deltaX);
        // Transform chin tip coordinates
        const chinTipCoords = this.transformCoordinates(chinTip);
        // Get canvas display dimensions for horizontal line
        const rect = this.canvas.getBoundingClientRect();
        // Calculate line length (use face width or default width)
        let lineLength = rect.width * 0.6; // Default to 60% of canvas width
        // If face edge landmarks are available, use them to determine line length
        if (leftFaceEdge && rightFaceEdge) {
            const leftEdgeCoords = this.transformCoordinates(leftFaceEdge);
            const rightEdgeCoords = this.transformCoordinates(rightFaceEdge);
            lineLength = Math.abs(rightEdgeCoords.x - leftEdgeCoords.x) + 40; // Add some padding
        }
        // Calculate the tilted line endpoints based on eye angle
        const halfLength = lineLength / 2;
        const leftEndX = chinTipCoords.x - halfLength * Math.cos(eyeAngle);
        const leftEndY = chinTipCoords.y - halfLength * Math.sin(eyeAngle);
        const rightEndX = chinTipCoords.x + halfLength * Math.cos(eyeAngle);
        const rightEndY = chinTipCoords.y + halfLength * Math.sin(eyeAngle);
        // Draw the tilted horizontal reference line
        this.ctx.strokeStyle = '#FF6600'; // Orange for horizontal reference line
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([6, 6]); // Different dash pattern from vertical line
        this.ctx.globalAlpha = 0.8;
        this.ctx.beginPath();
        this.ctx.moveTo(leftEndX, leftEndY);
        this.ctx.lineTo(rightEndX, rightEndY);
        this.ctx.stroke();
        // Reset line style
        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 1.0;
        // Draw chin tip marker
        this.ctx.fillStyle = '#FF6600';
        this.ctx.beginPath();
        this.ctx.arc(chinTipCoords.x, chinTipCoords.y, 4, 0, 2 * Math.PI);
        this.ctx.fill();
        // Add text label for the horizontal reference line
        this.ctx.fillStyle = '#FF6600';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'left';
        // Position label at the right end of the line
        const labelX = rightEndX - 120;
        const labelY = rightEndY - 8;
        this.ctx.fillText('Horizontal Reference', labelX, labelY);
        // Draw mouth corner distance indicators to tilted horizontal line
        this.drawMouthCornerDistanceToTiltedHorizontalLine(leftEndX, leftEndY, rightEndX, rightEndY);
    }
    /**
     * Draw scattered lines from tilted horizontal reference line to mouth corners for evaluation
     */
    drawMouthCornerDistanceToTiltedHorizontalLine(leftEndX, leftEndY, rightEndX, rightEndY) {
        const leftMouthCorner = this.currentLandmarks[61]; // Left mouth corner
        const rightMouthCorner = this.currentLandmarks[291]; // Right mouth corner
        if (!leftMouthCorner || !rightMouthCorner) {
            return;
        }
        const leftCornerCoords = this.transformCoordinates(leftMouthCorner);
        const rightCornerCoords = this.transformCoordinates(rightMouthCorner);
        // Calculate perpendicular distances from mouth corners to tilted horizontal line
        const leftDistance = this.calculatePerpendicularDistance(leftCornerCoords, { x: leftEndX, y: leftEndY }, { x: rightEndX, y: rightEndY });
        const rightDistance = this.calculatePerpendicularDistance(rightCornerCoords, { x: leftEndX, y: leftEndY }, { x: rightEndX, y: rightEndY });
        // Draw scattered/dashed lines from tilted horizontal line to mouth corners
        this.ctx.strokeStyle = '#FF9900'; // Light orange for distance indicators
        this.ctx.lineWidth = 1.5;
        this.ctx.setLineDash([3, 2, 1, 2]); // Scattered dash pattern
        this.ctx.globalAlpha = 0.9;
        // Left corner distance line (perpendicular to tilted line)
        const leftProjection = this.projectPointOntoLine(leftCornerCoords, { x: leftEndX, y: leftEndY }, { x: rightEndX, y: rightEndY });
        this.ctx.beginPath();
        this.ctx.moveTo(leftProjection.x, leftProjection.y);
        this.ctx.lineTo(leftCornerCoords.x, leftCornerCoords.y);
        this.ctx.stroke();
        // Right corner distance line (perpendicular to tilted line)
        const rightProjection = this.projectPointOntoLine(rightCornerCoords, { x: leftEndX, y: leftEndY }, { x: rightEndX, y: rightEndY });
        this.ctx.beginPath();
        this.ctx.moveTo(rightProjection.x, rightProjection.y);
        this.ctx.lineTo(rightCornerCoords.x, rightCornerCoords.y);
        this.ctx.stroke();
        // Reset line style
        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 1.0;
        // Draw corner markers
        this.ctx.fillStyle = '#FF9900';
        this.ctx.beginPath();
        this.ctx.arc(leftCornerCoords.x, leftCornerCoords.y, 3, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(rightCornerCoords.x, rightCornerCoords.y, 3, 0, 2 * Math.PI);
        this.ctx.fill();
        // Calculate and display evaluation metrics - HIDDEN FOR NOW
        // this.displayTiltedHorizontalDistanceEvaluation(leftDistance, rightDistance, leftCornerCoords, rightCornerCoords);
        // Draw projection points on tilted horizontal line
        this.ctx.fillStyle = '#FF6600';
        this.ctx.beginPath();
        this.ctx.arc(leftProjection.x, leftProjection.y, 2, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(rightProjection.x, rightProjection.y, 2, 0, 2 * Math.PI);
        this.ctx.fill();
    }
    /**
     * Display evaluation metrics for tilted horizontal distance analysis
     */
    displayTiltedHorizontalDistanceEvaluation(leftDistance, rightDistance, leftCorner, rightCorner) {
        // Calculate normalized distances and asymmetry
        const maxDistance = Math.max(leftDistance, rightDistance);
        const minDistance = Math.min(leftDistance, rightDistance);
        const asymmetryRatio = maxDistance > 0 ? (maxDistance - minDistance) / maxDistance : 0;
        // Convert to percentages
        const leftPercentage = maxDistance > 0 ? (leftDistance / maxDistance) * 100 : 100;
        const rightPercentage = maxDistance > 0 ? (rightDistance / maxDistance) * 100 : 100;
        const asymmetryPercentage = asymmetryRatio * 100;
        // Get key landmarks for vertical reference line calculations
        const leftEyeInner = this.currentLandmarks[133]; // Left eye inner corner
        const rightEyeInner = this.currentLandmarks[362]; // Right eye inner corner
        const chinTipLandmark = this.currentLandmarks[152]; // Chin tip
        // Calculate vertical distances
        let verticalLeftDistance;
        let verticalRightDistance;
        let maxVerticalDistance;
        let verticalLeftPercentage;
        let verticalRightPercentage;
        let verticalAsymmetryPercentage;
        if (!leftEyeInner || !rightEyeInner || !chinTipLandmark) {
            // If vertical reference landmarks are not available, skip vertical calculations
            verticalLeftDistance = 0;
            verticalRightDistance = 0;
            maxVerticalDistance = 1; // Avoid division by zero
            verticalLeftPercentage = 0;
            verticalRightPercentage = 0;
            verticalAsymmetryPercentage = 0;
        }
        else {
            // Calculate eye midpoint for vertical reference line
            const eyeMidpointForVertical = {
                x: (leftEyeInner.x + rightEyeInner.x) / 2,
                y: (leftEyeInner.y + rightEyeInner.y) / 2
            };
            // Transform coordinates for vertical calculations
            const eyeMidpointCoordsForVertical = this.transformCoordinates(eyeMidpointForVertical);
            const chinTipCoordsForVertical = this.transformCoordinates(chinTipLandmark);
            // Get vertical distances from vertical reference line
            verticalLeftDistance = this.calculatePerpendicularDistance(leftCorner, eyeMidpointCoordsForVertical, chinTipCoordsForVertical);
            verticalRightDistance = this.calculatePerpendicularDistance(rightCorner, eyeMidpointCoordsForVertical, chinTipCoordsForVertical);
            maxVerticalDistance = Math.max(verticalLeftDistance, verticalRightDistance);
            verticalLeftPercentage = maxVerticalDistance > 0 ? (verticalLeftDistance / maxVerticalDistance) * 100 : 100;
            verticalRightPercentage = maxVerticalDistance > 0 ? (verticalRightDistance / maxVerticalDistance) * 100 : 100;
            const verticalAsymmetryRatio = maxVerticalDistance > 0 ? (maxVerticalDistance - Math.min(verticalLeftDistance, verticalRightDistance)) / maxVerticalDistance : 0;
            verticalAsymmetryPercentage = verticalAsymmetryRatio * 100;
        }
        // Display evaluation summary in top-right corner
        const rect = this.canvas.getBoundingClientRect();
        const summaryX = rect.width - 220; // Increased width for more detailed display
        const summaryY = 50;
        // Background for evaluation summary
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(summaryX - 5, summaryY - 15, 215, 160);
        // Border
        this.ctx.strokeStyle = '#FF6600';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(summaryX - 5, summaryY - 15, 215, 160);
        // Title
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Corner Distance Analysis', summaryX, summaryY);
        // Horizontal section
        this.ctx.fillStyle = '#FF9900';
        this.ctx.font = 'bold 11px Arial';
        this.ctx.fillText('Horizontal Distances:', summaryX, summaryY + 25);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '11px Arial';
        this.ctx.fillText(`Left: ${leftDistance.toFixed(1)}px (${leftPercentage.toFixed(1)}%)`, summaryX + 10, summaryY + 45);
        this.ctx.fillText(`Right: ${rightDistance.toFixed(1)}px (${rightPercentage.toFixed(1)}%)`, summaryX + 10, summaryY + 60);
        this.ctx.fillText(`Asymmetry: ${asymmetryPercentage.toFixed(1)}%`, summaryX + 10, summaryY + 75);
        // Vertical section
        this.ctx.fillStyle = '#FF9900';
        this.ctx.font = 'bold 11px Arial';
        this.ctx.fillText('Vertical Distances:', summaryX, summaryY + 95);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '11px Arial';
        this.ctx.fillText(`Left: ${verticalLeftDistance.toFixed(1)}px (${verticalLeftPercentage.toFixed(1)}%)`, summaryX + 10, summaryY + 115);
        this.ctx.fillText(`Right: ${verticalRightDistance.toFixed(1)}px (${verticalRightPercentage.toFixed(1)}%)`, summaryX + 10, summaryY + 130);
        this.ctx.fillText(`Asymmetry: ${verticalAsymmetryPercentage.toFixed(1)}%`, summaryX + 10, summaryY + 145);
        // Combined evaluation status
        const combinedAsymmetry = (asymmetryPercentage + verticalAsymmetryPercentage) / 2;
        let status = 'SYMMETRIC';
        let statusColor = '#00FF00';
        if (combinedAsymmetry > 15) {
            status = 'HIGH ASYMMETRY';
            statusColor = '#FF0000';
        }
        else if (combinedAsymmetry > 8) {
            status = 'MODERATE ASYMMETRY';
            statusColor = '#FF9900';
        }
        // Display status
        this.ctx.fillStyle = statusColor;
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(status, summaryX + 210, summaryY);
    }
    drawModeLabel() {
        // Mode label removed - analysis view now locked to flat mode only
        // No need to display mode since it's always flat view
    }
    // Analysis mode cycling removed - analysis view now locked to flat view for cleaner visualization
    // Public method to get current head alignment data
    getHeadAlignmentAndAlignment() {
        return this.calculateHeadAlignmentAndDsitance();
    }
    /**
     * Calculate mouth movement measurements (horizontal and vertical distances)
     * Extracted from displayTiltedHorizontalDistanceEvaluation for reusability
     * Returns the same calculation logic used in the visualization
     */
    calculateMouthMovementMeasurements(landmarks) {
        console.log('🔬 AnalysisVisualizationService.calculateMouthMovementMeasurements called');
        // Use provided landmarks or fall back to current landmarks
        const landmarksToUse = landmarks || this.currentLandmarks;
        console.log(`🔬 Landmarks to use: ${landmarksToUse?.length || 'null'} (provided: ${landmarks?.length || 'null'}, current: ${this.currentLandmarks?.length || 'null'})`);
        if (!landmarksToUse || landmarksToUse.length < 468) {
            console.warn('🔬 ❌ Insufficient landmarks for mouth movement measurements:', landmarksToUse?.length || 'null');
            return null;
        }
        try {
            // Get mouth corner landmarks
            const leftMouthCorner = landmarksToUse[61]; // Left mouth corner
            const rightMouthCorner = landmarksToUse[291]; // Right mouth corner
            console.log('🔬 Mouth corner landmarks:');
            console.log(`  Left mouth corner (61): ${leftMouthCorner ? `x=${leftMouthCorner.x?.toFixed(6)}, y=${leftMouthCorner.y?.toFixed(6)}` : 'null'}`);
            console.log(`  Right mouth corner (291): ${rightMouthCorner ? `x=${rightMouthCorner.x?.toFixed(6)}, y=${rightMouthCorner.y?.toFixed(6)}` : 'null'}`);
            if (!leftMouthCorner || !rightMouthCorner) {
                console.warn('🔬 ❌ Missing mouth corner landmarks');
                return null;
            }
            // Transform mouth corners to canvas coordinates
            const leftCorner = this.transformCoordinates(leftMouthCorner);
            const rightCorner = this.transformCoordinates(rightMouthCorner);
            // === HORIZONTAL DISTANCE CALCULATION ===
            // Get landmarks for horizontal reference line (tilted based on eye line)
            const leftEyeInner = landmarksToUse[133]; // Left eye inner corner
            const rightEyeInner = landmarksToUse[362]; // Right eye inner corner
            const chinTipLandmark = landmarksToUse[152]; // Chin tip
            let leftHorizontalDistance = 0;
            let rightHorizontalDistance = 0;
            let horizontalAsymmetry = 0;
            if (leftEyeInner && rightEyeInner && chinTipLandmark) {
                // Calculate the angle of the inner eye line
                const deltaY = rightEyeInner.y - leftEyeInner.y;
                const deltaX = rightEyeInner.x - leftEyeInner.x;
                const eyeAngle = Math.atan2(deltaY, deltaX);
                // Transform chin tip coordinates
                const chinTipCoords = this.transformCoordinates(chinTipLandmark);
                // Calculate tilted horizontal line endpoints at chin tip level
                const rect = this.canvas.getBoundingClientRect();
                const lineLength = rect.width * 0.6; // 60% of canvas width
                const halfLength = lineLength / 2;
                const leftEndX = chinTipCoords.x - halfLength * Math.cos(eyeAngle);
                const leftEndY = chinTipCoords.y - halfLength * Math.sin(eyeAngle);
                const rightEndX = chinTipCoords.x + halfLength * Math.cos(eyeAngle);
                const rightEndY = chinTipCoords.y + halfLength * Math.sin(eyeAngle);
                // Calculate horizontal distances from tilted horizontal line
                leftHorizontalDistance = this.calculatePerpendicularDistance(leftCorner, { x: leftEndX, y: leftEndY }, { x: rightEndX, y: rightEndY });
                rightHorizontalDistance = this.calculatePerpendicularDistance(rightCorner, { x: leftEndX, y: leftEndY }, { x: rightEndX, y: rightEndY });
                // Calculate horizontal asymmetry
                const maxHorizontalDistance = Math.max(leftHorizontalDistance, rightHorizontalDistance);
                const minHorizontalDistance = Math.min(leftHorizontalDistance, rightHorizontalDistance);
                horizontalAsymmetry = maxHorizontalDistance > 0 ?
                    ((maxHorizontalDistance - minHorizontalDistance) / maxHorizontalDistance) * 100 : 0;
            }
            // === VERTICAL DISTANCE CALCULATION ===
            let leftVerticalDistance = 0;
            let rightVerticalDistance = 0;
            let verticalAsymmetry = 0;
            if (leftEyeInner && rightEyeInner && chinTipLandmark) {
                // Calculate eye midpoint for vertical reference line
                const eyeMidpointForVertical = {
                    x: (leftEyeInner.x + rightEyeInner.x) / 2,
                    y: (leftEyeInner.y + rightEyeInner.y) / 2
                };
                // Transform coordinates for vertical calculations
                const eyeMidpointCoordsForVertical = this.transformCoordinates(eyeMidpointForVertical);
                const chinTipCoordsForVertical = this.transformCoordinates(chinTipLandmark);
                // Get vertical distances from vertical reference line
                leftVerticalDistance = this.calculatePerpendicularDistance(leftCorner, eyeMidpointCoordsForVertical, chinTipCoordsForVertical);
                rightVerticalDistance = this.calculatePerpendicularDistance(rightCorner, eyeMidpointCoordsForVertical, chinTipCoordsForVertical);
                // Calculate vertical asymmetry
                const maxVerticalDistance = Math.max(leftVerticalDistance, rightVerticalDistance);
                const minVerticalDistance = Math.min(leftVerticalDistance, rightVerticalDistance);
                verticalAsymmetry = maxVerticalDistance > 0 ?
                    ((maxVerticalDistance - minVerticalDistance) / maxVerticalDistance) * 100 : 0;
            }
            const result = {
                leftVerticalDistance,
                rightVerticalDistance,
                leftHorizontalDistance,
                rightHorizontalDistance,
                verticalAsymmetry,
                horizontalAsymmetry
            };
            console.log('🔬 ✅ Final mouth movement measurements result:');
            console.log(`  Left Vertical: ${leftVerticalDistance.toFixed(3)}px`);
            console.log(`  Right Vertical: ${rightVerticalDistance.toFixed(3)}px`);
            console.log(`  Left Horizontal: ${leftHorizontalDistance.toFixed(3)}px`);
            console.log(`  Right Horizontal: ${rightHorizontalDistance.toFixed(3)}px`);
            console.log(`  Vertical Asymmetry: ${verticalAsymmetry.toFixed(1)}%`);
            console.log(`  Horizontal Asymmetry: ${horizontalAsymmetry.toFixed(1)}%`);
            return result;
        }
        catch (error) {
            console.error('🔬 ❌ Error calculating mouth movement measurements:', error);
            return null;
        }
    }
    // Public method to clear canvas
    clearCanvas() {
        if (this.ctx) {
            this.clearCanvasInternal();
            this.showLoadingState();
        }
        this.currentLandmarks = [];
    }
}
