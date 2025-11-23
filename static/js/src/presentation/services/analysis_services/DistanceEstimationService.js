/**
 * DistanceEstimationService
 *
 * Implements a method to estimate camera distance from the face using facial landmarks.
 * This method uses the known average interpupillary distance (IPD) and the pixel distance between eyes
 * to estimate the distance from the camera to the face.
 *
 * Reference:
 * - https://stackoverflow.com/questions/18914676/how-to-calculate-distance-from-camera-to-face
 * - https://medium.com/@jamesqquick/how-to-estimate-distance-from-camera-using-opencv-8a3f3f3a7a0a
 */
export class DistanceEstimationService {
    constructor(focalLengthPx = 600) {
        this.focalLengthPx = focalLengthPx;
    }
    /**
     * Estimate distance from camera to face in millimeters
     * @param landmarks Array of facial landmarks with normalized coordinates
     * @param imageWidth Width of the image or video frame in pixels
     * @returns Estimated distance in millimeters, or null if cannot compute
     */
    estimateDistance(landmarks, imageWidth) {
        if (!landmarks || landmarks.length === 0) {
            return null;
        }
        // Get left and right eye center landmarks (using MediaPipe indices)
        const leftEye = landmarks[33]; // Left eye outer corner
        const rightEye = landmarks[263]; // Right eye outer corner
        if (!leftEye || !rightEye) {
            return null;
        }
        // Calculate pixel distance between eyes
        const leftEyePx = leftEye.x * imageWidth;
        const rightEyePx = rightEye.x * imageWidth;
        const eyeDistancePx = Math.abs(rightEyePx - leftEyePx);
        if (eyeDistancePx === 0) {
            return null;
        }
        // Distance estimation formula:
        // distance = (focalLength * realWidth) / perceivedWidth
        // where realWidth is average IPD in mm, perceivedWidth is eyeDistancePx
        const distanceMm = (this.focalLengthPx * DistanceEstimationService.AVERAGE_IPD_MM) / eyeDistancePx;
        return distanceMm;
    }
}
// Average interpupillary distance (distance between eyes) in millimeters
DistanceEstimationService.AVERAGE_IPD_MM = 63; // average adult IPD
