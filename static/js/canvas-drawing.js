// Minimal JavaScript for canvas drawing
// This handles drawing facial landmarks on canvas - requires client-side rendering

class CanvasDrawer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    }

    clear() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawLandmarks(landmarks, imageWidth, imageHeight) {
        if (!this.ctx || !landmarks) return;

        // Set canvas size to match image
        this.canvas.width = imageWidth;
        this.canvas.height = imageHeight;

        // Clear canvas
        this.clear();

        // Draw landmarks
        this.ctx.fillStyle = '#00ff00';
        landmarks.forEach(landmark => {
            const x = landmark.x * imageWidth;
            const y = landmark.y * imageHeight;

            this.ctx.beginPath();
            this.ctx.arc(x, y, 2, 0, 2 * Math.PI);
            this.ctx.fill();
        });
    }

    drawSymmetryLine(imageWidth, imageHeight, centerX = 0.5) {
        if (!this.ctx) return;

        const x = centerX * imageWidth;

        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);

        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, imageHeight);
        this.ctx.stroke();

        this.ctx.setLineDash([]);
    }

    drawImage(imageDataUrl) {
        if (!this.ctx) return;

        const img = new Image();
        img.onload = () => {
            this.canvas.width = img.width;
            this.canvas.height = img.height;
            this.ctx.drawImage(img, 0, 0);
        };
        img.src = imageDataUrl;
    }
}

// Export for use in other scripts
window.CanvasDrawer = CanvasDrawer;
