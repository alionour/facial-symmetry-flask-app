import { ApiClient } from '../api/ApiClient.js';
export class CameraRepository {
    constructor() {
        this.currentFacingMode = 'user';
        this.availableCameras = [];
        this.isProcessing = false;
    }
    async startCamera(videoElement) {
        try {
            console.log('=== CameraRepository: Starting camera (refactored) ===');
            this.currentVideoElement = videoElement;
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('getUserMedia is not supported in this browser');
            }
            await this.enumerateCameras();
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 480 },
                    height: { ideal: 360 },
                    facingMode: this.currentFacingMode
                }
            });
            videoElement.srcObject = stream;
            await new Promise((resolve) => {
                videoElement.onloadedmetadata = () => {
                    videoElement.play().then(() => {
                        console.log('Video playing');
                        this.startProcessingLoop();
                        resolve(true);
                    }).catch(err => {
                        console.error('Error playing video:', err);
                        resolve(true);
                    });
                };
            });
        }
        catch (error) {
            console.error('Camera start error:', error);
            throw new Error(`Failed to start camera: ${error}`);
        }
    }
    startProcessingLoop() {
        if (!this.currentVideoElement)
            return;
        // Create a canvas if it doesn't exist
        if (!this.canvasElement) {
            this.canvasElement = document.createElement('canvas');
            this.canvasElement.width = this.currentVideoElement.videoWidth;
            this.canvasElement.height = this.currentVideoElement.videoHeight;
        }
        const processVideo = async () => {
            if (this.isProcessing || !this.currentVideoElement || this.currentVideoElement.paused || this.currentVideoElement.ended) {
                this.animationFrameId = requestAnimationFrame(processVideo);
                return;
            }
            this.isProcessing = true;
            // Draw video frame to canvas
            const context = this.canvasElement.getContext('2d');
            if (context) {
                context.drawImage(this.currentVideoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);
                const imageDataUrl = this.canvasElement.toDataURL('image/jpeg');
                // Send to backend for analysis
                const results = await ApiClient.analyze(imageDataUrl);
                if (results && this.resultsCallback) {
                    this.resultsCallback(results);
                }
            }
            this.isProcessing = false;
            this.animationFrameId = requestAnimationFrame(processVideo);
        };
        this.animationFrameId = requestAnimationFrame(processVideo);
    }
    stopCamera() {
        console.log('Stopping camera...');
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = undefined;
        }
        const videoElements = document.querySelectorAll('video');
        videoElements.forEach(video => {
            if (video.srcObject) {
                const stream = video.srcObject;
                stream.getTracks().forEach(track => {
                    track.stop();
                });
                video.srcObject = null;
            }
        });
        console.log('Camera stopped completely');
    }
    onResults(callback) {
        this.resultsCallback = callback;
    }
    async enumerateCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.availableCameras = devices.filter(device => device.kind === 'videoinput');
            return this.availableCameras;
        }
        catch (error) {
            console.error('Error enumerating cameras:', error);
            return [];
        }
    }
    getAvailableCameras() {
        return this.availableCameras;
    }
    hasMultipleCameras() {
        return this.availableCameras.length > 1;
    }
    getCurrentFacingMode() {
        return this.currentFacingMode;
    }
    async switchCamera() {
        if (!this.hasMultipleCameras() || !this.currentVideoElement) {
            return;
        }
        this.currentFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
        this.stopCamera();
        await new Promise(resolve => setTimeout(resolve, 100)); // Short delay
        await this.startCamera(this.currentVideoElement);
    }
}
