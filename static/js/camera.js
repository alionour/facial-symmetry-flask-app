// Minimal JavaScript for webcam functionality
// This handles camera access and frame capture - cannot be done in Python

class CameraManager {
  constructor() {
    this.video = null;
    this.stream = null;
    this.currentAction = 'NEUTRAL';
    this.capturedFrames = {};
  }

  async initialize(videoElementId) {
    this.video = document.getElementById(videoElementId);
    
    if (!this.video) {
      console.error('Video element not found');
      return false;
    }

    try {
      // Request camera access
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      this.video.srcObject = this.stream;
      console.log('Camera initialized successfully');
      return true;
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please ensure camera permissions are granted.');
      return false;
    }
  }

  captureFrame() {
    if (!this.video) {
      console.error('Video not initialized');
      return null;
    }

    // Create a canvas to capture the frame
    const canvas = document.createElement('canvas');
    canvas.width = this.video.videoWidth;
    canvas.height = this.video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64 data URL
    return canvas.toDataURL('image/jpeg', 0.95);
  }

  async submitFrame(action, frameData, csrfToken) {
    try {
      const formData = new FormData();
      formData.append('action', action);
      formData.append('frame_data', frameData);
      formData.append('csrf_token', csrfToken);

      const response = await fetch('/capture-frame', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error submitting frame:', error);
      return { success: false, error: error.message };
    }
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }
}

// Export for use in other scripts
window.CameraManager = CameraManager;
