import { ErrorView } from '../../components/ErrorView.js';
/**
 * CameraService class to handle camera functionalities
 *
 * This service encapsulates all camera-related operations including:
 * - Camera initialization and switching
 * - Mobile device detection
 * - Camera button UI management
 * - Error handling for camera operations
 */
export class CameraService {
    constructor(cameraRepository) {
        this.cameraRepository = cameraRepository;
    }
    /**
     * Check if the current device is mobile
     */
    isMobileDevice() {
        return /Mobi|Android/i.test(navigator.userAgent);
    }
    /**
     * Initialize camera switching functionality
     * Only shows camera switching on mobile devices with multiple cameras
     */
    async initializeCameraSwitching() {
        try {
            if (!this.isMobileDevice()) {
                return;
            }
            // Use cameraRepository to enumerate cameras
            await this.cameraRepository.enumerateCameras();
            // Show switch camera button if multiple cameras are available
            const switchCameraBtn = document.getElementById('switchCameraBtn');
            if (switchCameraBtn && this.cameraRepository.hasMultipleCameras()) {
                switchCameraBtn.style.display = 'inline-block';
                // Update button text based on current camera
                this.updateCameraSwitchButton();
            }
        }
        catch (error) {
            console.error('Error initializing camera switching:', error);
            throw error;
        }
    }
    /**
     * Switch to the next available camera
     * Handles UI state management during the switch process
     */
    async switchCamera() {
        try {
            // Show loading state
            const switchCameraBtn = document.getElementById('switchCameraBtn');
            if (switchCameraBtn) {
                switchCameraBtn.textContent = '🔄 Switching...';
                switchCameraBtn.disabled = true;
            }
            // Switch camera using repository
            await this.cameraRepository.switchCamera();
            // Update button text
            this.updateCameraSwitchButton();
            // Re-enable button
            if (switchCameraBtn) {
                switchCameraBtn.disabled = false;
            }
        }
        catch (error) {
            console.error('Error switching camera:', error);
            // Reset button state on error
            const switchCameraBtn = document.getElementById('switchCameraBtn');
            if (switchCameraBtn) {
                switchCameraBtn.disabled = false;
                this.updateCameraSwitchButton();
            }
            // Show error message
            this.showErrorMessage('Failed to switch camera. Please try again.');
        }
    }
    /**
     * Update the camera switch button text and title based on current camera
     */
    updateCameraSwitchButton() {
        const switchCameraBtn = document.getElementById('switchCameraBtn');
        if (switchCameraBtn) {
            const currentFacingMode = this.cameraRepository.getCurrentFacingMode();
            const nextCamera = currentFacingMode === 'user' ? 'Back' : 'Front';
            switchCameraBtn.textContent = `📷 ${nextCamera} Camera`;
            switchCameraBtn.title = `Switch to ${nextCamera.toLowerCase()} camera`;
        }
    }
    /**
     * Set up camera switch button event listener
     */
    attachCameraSwitchListener() {
        const switchCameraBtn = document.getElementById('switchCameraBtn');
        if (switchCameraBtn) {
            switchCameraBtn.addEventListener('click', async () => {
                await this.switchCamera();
            });
        }
    }
    /**
     * Get information about available cameras
     */
    hasMultipleCameras() {
        return this.cameraRepository.hasMultipleCameras();
    }
    getCurrentFacingMode() {
        return this.cameraRepository.getCurrentFacingMode();
    }
    getAvailableCameras() {
        return this.cameraRepository.getAvailableCameras();
    }
    /**
     * Show error message to user
     */
    showErrorMessage(message) {
        ErrorView.showErrorMessage(message);
    }
}
