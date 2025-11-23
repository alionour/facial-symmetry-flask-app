// Domain Service: Metric Calculation
import { FacialMetrics } from '../value-objects/FacialMetrics.js';
export class MetricCalculationService {
    calculateMetrics(landmarks) {
        const coords = this.extractCoordinates(landmarks);
        const faceWidth = this.calculateFaceWidth(coords);
        const normalizedFaceWidth = Math.max(faceWidth, 0.1);
        const metrics = {
            forehead: Math.abs(coords.forehead_left.y - coords.forehead_right.y) / normalizedFaceWidth,
            eye_gap: Math.abs((coords.eyebrow_left_outer.y - coords.eye_left_outer.y) -
                (coords.eyebrow_right_outer.y - coords.eye_right_outer.y)) / normalizedFaceWidth,
            smile: Math.abs(coords.mouth_left.y - coords.mouth_right.y) / normalizedFaceWidth,
            lip: Math.abs(coords.lip_upper_left.y - coords.lip_upper_right.y) / normalizedFaceWidth,
            nose: Math.abs(coords.nose_left.y - coords.nose_right.y) / normalizedFaceWidth
        };
        // Apply smoothing to reduce noise
        const smoothedMetrics = {
            forehead: Math.min(metrics.forehead, 0.3),
            eye_gap: Math.min(metrics.eye_gap, 0.3),
            smile: Math.min(metrics.smile, 0.3),
            lip: Math.min(metrics.lip, 0.3),
            nose: Math.min(metrics.nose, 0.3)
        };
        return FacialMetrics.create(smoothedMetrics);
    }
    convertToScore(value) {
        if (value <= 0.02)
            return { score: 0, label: 'Normal' };
        if (value <= 0.05)
            return { score: 1, label: 'Mild' };
        if (value <= 0.08)
            return { score: 2, label: 'Moderate' };
        if (value <= 0.12)
            return { score: 3, label: 'Moderately Severe' };
        return { score: 4, label: 'Severe' };
    }
    extractCoordinates(landmarks) {
        const idx = {
            forehead_left: 21,
            forehead_right: 251,
            eye_left_inner: 133,
            eye_left_outer: 33,
            eye_right_inner: 362,
            eye_right_outer: 263,
            eyebrow_left_inner: 70,
            eyebrow_left_outer: 46,
            eyebrow_right_inner: 300,
            eyebrow_right_outer: 276,
            mouth_left: 61,
            mouth_right: 291,
            lip_upper_left: 84,
            lip_upper_right: 314,
            nose_left: 131,
            nose_right: 360,
            face_left: 172,
            face_right: 397
        };
        const coords = {};
        for (const [key, index] of Object.entries(idx)) {
            coords[key] = { x: landmarks[index].x, y: landmarks[index].y };
        }
        return coords;
    }
    calculateFaceWidth(coords) {
        return Math.abs(coords.face_left.x - coords.face_right.x);
    }
}
