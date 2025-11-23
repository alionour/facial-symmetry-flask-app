export class FaceVisualizationService {
    constructor(canvasId) {
        this.currentLandmarks = [];
        this.resizeTimeout = null;
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        if (!this.canvas || !this.ctx) {
            throw new Error(`Canvas element with id '${canvasId}' not found`);
        }
        // Initialize proper canvas resolution
        this.setupCanvasResolution();
        // Add resize handler to maintain proper scaling
        window.addEventListener('resize', () => this.handleResize());
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
        // Systematic approach: Ensure canvas and video element alignment
        const videoElement = document.getElementById('video');
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        // A. Ensure Canvas and Video Element Alignment
        if (videoElement) {
            const videoRect = videoElement.getBoundingClientRect();
            // Ensure canvas matches video's displayed size exactly
            this.canvas.style.width = videoRect.width + 'px';
            this.canvas.style.height = videoRect.height + 'px';
            this.canvas.style.position = 'absolute';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            // D. Device Pixel Ratio - multiply canvas size by DPR for sharp rendering
            this.canvas.width = videoRect.width * dpr;
            this.canvas.height = videoRect.height * dpr;
            // Scale context to handle device pixel ratio
            this.ctx.scale(dpr, dpr);
            if (videoElement.videoWidth && videoElement.videoHeight) {
                const videoAspectRatio = videoElement.videoWidth / videoElement.videoHeight;
                const displayAspectRatio = videoRect.width / videoRect.height;
            }
        }
        else {
            // Fallback if video element not found
            this.canvas.width = rect.width * dpr;
            this.canvas.height = rect.height * dpr;
            this.ctx.scale(dpr, dpr);
            this.canvas.style.width = rect.width + 'px';
            this.canvas.style.height = rect.height + 'px';
        }
    }
    drawFaceLandmarks(landmarks) {
        this.clearCanvasInternal();
        this.currentLandmarks = landmarks;
        if (!landmarks || landmarks.length === 0)
            return;
        // Mobile landmarks now enabled with proper coordinate transformation for object-fit: cover
        // Draw detailed facial features like in Analysis view - works on both desktop and mobile
        this.drawDetailedEyebrows();
        this.drawDetailedEyelashes(); // Only eyelashes for eyes
        this.drawDetailedNose();
        this.drawDetailedMouth();
        // Draw center lines for alignment reference - works on both desktop and mobile
        this.drawCenterLines();
        // Draw landmarks excluding eye area landmarks - works on both desktop and mobile
        this.drawFilteredLandmarks(landmarks);
    }
    clearCanvasInternal() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    // Public method to clear canvas (for external use)
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.currentLandmarks = [];
    }
    // Public method to update canvas resolution (useful when video dimensions change)
    updateCanvasResolution() {
        this.setupCanvasResolution();
    }
    // Public method to ensure canvas alignment with video (call when video loads)
    alignCanvasWithVideo() {
        const videoElement = document.getElementById('video');
        if (videoElement && videoElement.videoWidth && videoElement.videoHeight) {
            this.setupCanvasResolution();
        }
    }
    drawFaceCircle(landmarks) {
        // Calculate face center and radius based on key landmarks
        const faceOutline = this.getFaceOutlinePoints(landmarks);
        const center = this.calculateFaceCenter(faceOutline);
        const radius = this.calculateFaceRadius(faceOutline, center);
        // Draw face circle
        this.ctx.beginPath();
        this.ctx.arc(center.x * this.canvas.width, center.y * this.canvas.height, radius * Math.min(this.canvas.width, this.canvas.height), 0, 2 * Math.PI);
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }
    drawKeyLandmarks(landmarks) {
        const keyPoints = this.getKeyLandmarkIndices();
        for (const [feature, indices] of Object.entries(keyPoints)) {
            this.setStyleForFeature(feature);
            for (const index of indices) {
                if (landmarks[index]) {
                    this.drawLandmarkPoint(landmarks[index], 2);
                }
            }
        }
    }
    drawFilteredLandmarks(landmarks) {
        // Define eye landmark indices to exclude
        const eyeLandmarkIndices = new Set([
            // Left eye landmarks
            33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
            // Right eye landmarks
            362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382
        ]);
        this.ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        landmarks.forEach((point, index) => {
            // Only draw landmarks that are not in the eye area
            if (!eyeLandmarkIndices.has(index)) {
                this.drawLandmarkPoint(point, 0.8);
            }
        });
    }
    drawDetailedEyebrows() {
        // Left eyebrow (MediaPipe standard indices)
        const leftEyebrowIndices = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];
        const leftEyebrowPoints = leftEyebrowIndices.map(idx => this.currentLandmarks[idx]).filter(Boolean);
        if (leftEyebrowPoints.length > 0) {
            this.ctx.strokeStyle = '#8B4513'; // Brown color for eyebrows
            this.ctx.lineWidth = 2;
            this.ctx.lineCap = 'round';
            this.drawConnectedPoints(leftEyebrowPoints, false);
        }
        // Right eyebrow (MediaPipe standard indices)
        const rightEyebrowIndices = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276];
        const rightEyebrowPoints = rightEyebrowIndices.map(idx => this.currentLandmarks[idx]).filter(Boolean);
        if (rightEyebrowPoints.length > 0) {
            this.ctx.strokeStyle = '#8B4513'; // Brown color for eyebrows
            this.ctx.lineWidth = 2;
            this.ctx.lineCap = 'round';
            this.drawConnectedPoints(rightEyebrowPoints, false);
        }
    }
    // drawDetailedEyes method removed - only keeping eyelashes for cleaner Live Camera view
    drawFacialConnections(landmarks) {
        const connections = this.getFacialConnections();
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
        this.ctx.lineWidth = 0.5;
        for (const connection of connections) {
            const [startIdx, endIdx] = connection;
            if (landmarks[startIdx] && landmarks[endIdx]) {
                this.drawConnection(landmarks[startIdx], landmarks[endIdx]);
            }
        }
    }
    drawLandmarkPoint(point, size) {
        const coords = this.transformCoordinates(point);
        this.ctx.beginPath();
        this.ctx.arc(coords.x, coords.y, size, 0, 2 * Math.PI);
        this.ctx.fill();
    }
    transformCoordinates(point) {
        // B. Adjust Landmark Drawing for Scaling and Offsets
        // Transform MediaPipe's normalized coordinates to canvas coordinate system
        const canvasRect = this.canvas.getBoundingClientRect();
        // C. Account for object-fit: cover Cropping
        const videoElement = document.getElementById('video');
        if (!videoElement || !videoElement.videoWidth || !videoElement.videoHeight) {
            // Fallback: direct mapping to canvas
            return {
                x: point.x * canvasRect.width,
                y: point.y * canvasRect.height
            };
        }
        return this.transformWithObjectFitCover(point, videoElement, canvasRect);
    }
    transformWithObjectFitCover(point, videoElement, canvasRect) {
        // Systematic approach to handle object-fit: cover cropping
        const videoRect = videoElement.getBoundingClientRect();
        // Calculate aspect ratios
        const videoAspectRatio = videoElement.videoWidth / videoElement.videoHeight;
        const displayAspectRatio = videoRect.width / videoRect.height;
        // Determine how object-fit: cover scales and crops the video
        let scale;
        let offsetX = 0;
        let offsetY = 0;
        if (videoAspectRatio > displayAspectRatio) {
            // Video is wider than display - height fills, width is cropped
            scale = videoRect.height / videoElement.videoHeight;
            const scaledVideoWidth = videoElement.videoWidth * scale;
            offsetX = (scaledVideoWidth - videoRect.width) / 2;
        }
        else {
            // Video is taller than display - width fills, height is cropped
            scale = videoRect.width / videoElement.videoWidth;
            const scaledVideoHeight = videoElement.videoHeight * scale;
            offsetY = (scaledVideoHeight - videoRect.height) / 2;
        }
        // Transform MediaPipe normalized coordinates (0-1) to video pixel coordinates
        const videoPixelX = point.x * videoElement.videoWidth;
        const videoPixelY = point.y * videoElement.videoHeight;
        // Scale to display size and apply offset
        const displayX = (videoPixelX * scale) - offsetX;
        const displayY = (videoPixelY * scale) - offsetY;
        // Clamp to canvas bounds
        const finalX = Math.max(0, Math.min(displayX, canvasRect.width));
        const finalY = Math.max(0, Math.min(displayY, canvasRect.height));
        return {
            x: finalX,
            y: finalY
        };
    }
    drawConnection(point1, point2) {
        const coords1 = this.transformCoordinates(point1);
        const coords2 = this.transformCoordinates(point2);
        this.ctx.beginPath();
        this.ctx.moveTo(coords1.x, coords1.y);
        this.ctx.lineTo(coords2.x, coords2.y);
        this.ctx.stroke();
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
    isEyeOpen(eye) {
        // Simple heuristic to determine if eye is open
        // Based on vertical distance between upper and lower eyelid landmarks
        let upperLid, lowerLid;
        if (eye === 'left') {
            upperLid = 159; // Left eye upper lid
            lowerLid = 145; // Left eye lower lid
        }
        else {
            upperLid = 386; // Right eye upper lid
            lowerLid = 374; // Right eye lower lid
        }
        if (this.currentLandmarks[upperLid] && this.currentLandmarks[lowerLid]) {
            const distance = Math.abs(this.currentLandmarks[upperLid].y - this.currentLandmarks[lowerLid].y);
            return distance > 0.01; // Threshold for "open" eye
        }
        return true; // Default to open if landmarks not available
    }
    calculateEyeCenter(eye) {
        let eyeIndices;
        if (eye === 'left') {
            eyeIndices = [33, 133, 157, 158, 159, 160, 161, 246]; // Left eye landmarks
        }
        else {
            eyeIndices = [362, 263, 249, 390, 373, 374, 380, 381]; // Right eye landmarks
        }
        const eyePoints = eyeIndices.map(idx => this.currentLandmarks[idx]).filter(Boolean);
        if (eyePoints.length === 0)
            return null;
        // Calculate center as average of eye landmarks
        const centerX = eyePoints.reduce((sum, point) => sum + point.x, 0) / eyePoints.length;
        const centerY = eyePoints.reduce((sum, point) => sum + point.y, 0) / eyePoints.length;
        return { x: centerX, y: centerY };
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
        this.ctx.lineWidth = 0.8;
        this.ctx.lineCap = 'round';
        for (const index of indices) {
            if (this.currentLandmarks[index]) {
                const point = this.currentLandmarks[index];
                const coords = this.transformCoordinates(point);
                // Draw individual eyelashes as small lines
                this.ctx.beginPath();
                this.ctx.moveTo(coords.x, coords.y);
                if (type === 'upper') {
                    this.ctx.lineTo(coords.x + (Math.random() - 0.5) * 3, coords.y - 4 - Math.random() * 3);
                }
                else {
                    this.ctx.lineTo(coords.x + (Math.random() - 0.5) * 3, coords.y + 3 + Math.random() * 2);
                }
                this.ctx.stroke();
            }
        }
    }
    drawDetailedNose() {
        // Nose tip
        if (this.currentLandmarks[2]) {
            const coords = this.transformCoordinates(this.currentLandmarks[2]);
            this.ctx.fillStyle = '#DEB887'; // Burlywood for nose tip
            this.ctx.beginPath();
            this.ctx.arc(coords.x, coords.y, 3, 0, 2 * Math.PI);
            this.ctx.fill();
        }
        // Nose bridge
        if (this.currentLandmarks[6] && this.currentLandmarks[2]) {
            const coords6 = this.transformCoordinates(this.currentLandmarks[6]);
            const coords2 = this.transformCoordinates(this.currentLandmarks[2]);
            this.ctx.strokeStyle = '#D2B48C'; // Light brown for nose
            this.ctx.lineWidth = 1.5;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(coords6.x, coords6.y);
            this.ctx.lineTo(coords2.x, coords2.y);
            this.ctx.stroke();
        }
        // Nostrils
        if (this.currentLandmarks[5]) {
            const coords = this.transformCoordinates(this.currentLandmarks[5]);
            this.ctx.fillStyle = '#8B7355'; // Darker brown for nostrils
            this.ctx.beginPath();
            this.ctx.arc(coords.x, coords.y, 1.2, 0, 2 * Math.PI);
            this.ctx.fill();
        }
        if (this.currentLandmarks[4]) {
            const coords = this.transformCoordinates(this.currentLandmarks[4]);
            this.ctx.fillStyle = '#8B7355'; // Darker brown for nostrils
            this.ctx.beginPath();
            this.ctx.arc(coords.x, coords.y, 1.2, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }
    /**
     * Draws a detailed visualization of the mouth on the current canvas context using facial landmarks.
     *
     * This method performs the following steps:
     * - Draws and fills the outer lip shape with a specified color and outlines it.
     * - If the mouth is open (based on a simple height heuristic), fills the inner mouth area with a dark color.
     * - Draws an upper lip definition line for enhanced detail.
     *
     * The method uses predefined landmark indices to extract mouth-related points from `this.currentLandmarks`.
     * It relies on helper methods (`drawFilledShape`, `drawConnectedPoints`, and `calculateMouthHeight`) and
     * assumes a valid 2D rendering context (`this.ctx`).
     *
     * Note: Teeth rendering is intentionally omitted for a cleaner live camera view.
     *
     * @private
     */
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
            this.ctx.lineWidth = 1.5;
            this.drawConnectedPoints(outerLipPoints, true);
        }
        // Inner mouth (when mouth is open) - without teeth
        const innerMouthIndices = [13, 82, 81, 80, 78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 321, 375, 307, 320, 405, 314, 17, 84, 61];
        const innerMouthPoints = innerMouthIndices.map(idx => this.currentLandmarks[idx]).filter(Boolean);
        if (innerMouthPoints.length > 0) {
            // Check if mouth is open (simple heuristic)
            const mouthHeight = this.calculateMouthHeight();
            if (mouthHeight > 0.01) { // Mouth is open
                this.ctx.fillStyle = '#2F2F2F'; // Dark color for open mouth
                this.drawFilledShape(innerMouthPoints);
                // Note: Teeth rendering removed for cleaner Live Camera view
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
    // drawTeeth method removed - teeth rendering not needed for cleaner Live Camera view
    drawCenterLines() {
        // Get display dimensions for center lines
        const rect = this.canvas.getBoundingClientRect();
        // Set up line style for center lines
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([4, 4]);
        this.ctx.globalAlpha = 0.6;
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
    getFaceOutlinePoints(landmarks) {
        // MediaPipe face mesh outline indices
        const outlineIndices = [
            10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
            397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
            172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
        ];
        return outlineIndices.map(idx => landmarks[idx]).filter(Boolean);
    }
    calculateFaceCenter(outlinePoints) {
        const sum = outlinePoints.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 });
        return {
            x: sum.x / outlinePoints.length,
            y: sum.y / outlinePoints.length
        };
    }
    calculateFaceRadius(outlinePoints, center) {
        const distances = outlinePoints.map(point => Math.sqrt(Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2)));
        return Math.max(...distances);
    }
    getKeyLandmarkIndices() {
        return {
            eyes: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
                362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382],
            eyebrows: [46, 53, 52, 51, 48, 115, 131, 134, 102, 49, 220, 305, 292, 334, 293, 300, 276, 283, 282, 295, 285],
            nose: [1, 2, 5, 4, 6, 19, 20, 94, 125, 141, 235, 236, 3, 51, 48, 115, 131, 134, 102, 49, 220, 305, 292],
            mouth: [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 191, 80, 81, 82],
            chin: [18, 175, 199, 200, 9, 10, 151, 175, 18],
            forehead: [10, 151, 9, 10, 151, 9, 10, 151]
        };
    }
    setStyleForFeature(feature) {
        switch (feature) {
            case 'eyes':
                this.ctx.fillStyle = '#ff0000'; // Red for eyes
                break;
            case 'eyebrows':
                this.ctx.fillStyle = '#ff8800'; // Orange for eyebrows
                break;
            case 'nose':
                this.ctx.fillStyle = '#0088ff'; // Blue for nose
                break;
            case 'mouth':
                this.ctx.fillStyle = '#ff0088'; // Pink for mouth
                break;
            case 'chin':
                this.ctx.fillStyle = '#88ff00'; // Green for chin
                break;
            case 'forehead':
                this.ctx.fillStyle = '#8800ff'; // Purple for forehead
                break;
            default:
                this.ctx.fillStyle = '#ffffff'; // White for others
        }
    }
    getFacialConnections() {
        return [
            // Eye connections
            [33, 7], [7, 163], [163, 144], [144, 145], [145, 153], [153, 154], [154, 155], [155, 133],
            [362, 398], [398, 384], [384, 385], [385, 386], [386, 387], [387, 388], [388, 466],
            // Eyebrow connections
            [46, 53], [53, 52], [52, 51], [51, 48],
            [276, 283], [283, 282], [282, 295], [295, 285],
            // Nose connections
            [1, 2], [2, 5], [5, 4], [4, 6],
            // Mouth connections
            [61, 84], [84, 17], [17, 314], [314, 405], [405, 320], [320, 307], [307, 375], [375, 321],
            [321, 308], [308, 324], [324, 318], [318, 402], [402, 317], [317, 14], [14, 87], [87, 178],
            [178, 88], [88, 95], [95, 78], [78, 191], [191, 80], [80, 81], [81, 82], [82, 61]
        ];
    }
    // Public method to add custom overlays
    addOverlay(text, position, color = '#ffffff') {
        this.ctx.fillStyle = color;
        this.ctx.font = '16px Arial';
        this.ctx.fillText(text, position.x, position.y);
    }
    // Method to highlight specific landmarks
    highlightLandmarks(indices, color = '#ffff00') {
        if (!this.currentLandmarks.length)
            return;
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        for (const index of indices) {
            if (this.currentLandmarks[index]) {
                const coords = this.transformCoordinates(this.currentLandmarks[index]);
                // Draw larger highlighted point
                this.ctx.beginPath();
                this.ctx.arc(coords.x, coords.y, 1.5, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.stroke();
            }
        }
    }
    // Method to draw metric-specific overlays
    drawMetricOverlay(metricName, value, score, label) {
        const overlayY = this.canvas.height - 80;
        // Background for overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, overlayY - 5, 300, 70);
        // Metric information
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText(`${metricName}: ${value.toFixed(4)}`, 15, overlayY + 15);
        this.ctx.fillStyle = this.getScoreColor(score);
        this.ctx.fillText(`Score: ${score} (${label})`, 15, overlayY + 35);
        // Draw score bar
        this.drawScoreBar(15, overlayY + 45, 280, 10, score);
    }
    getScoreColor(score) {
        switch (score) {
            case 0: return '#00ff00'; // Green - Normal
            case 1: return '#80ff00'; // Light green - Mild
            case 2: return '#ffff00'; // Yellow - Moderate
            case 3: return '#ff8000'; // Orange - Moderately Severe
            case 4: return '#ff0000'; // Red - Severe
            default: return '#ffffff';
        }
    }
    drawScoreBar(x, y, width, height, score) {
        // Background bar
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(x, y, width, height);
        // Score bar
        const scoreWidth = (score / 4) * width;
        this.ctx.fillStyle = this.getScoreColor(score);
        this.ctx.fillRect(x, y, scoreWidth, height);
        // Border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);
    }
}
