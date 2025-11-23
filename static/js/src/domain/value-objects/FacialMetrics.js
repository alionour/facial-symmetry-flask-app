// Domain Value Object: Facial Metrics
export class FacialMetrics {
    constructor(forehead, eyeGap, smile, lip, nose) {
        this.forehead = forehead;
        this.eyeGap = eyeGap;
        this.smile = smile;
        this.lip = lip;
        this.nose = nose;
    }
    static create(data) {
        return new FacialMetrics(data.forehead, data.eye_gap, data.smile, data.lip, data.nose);
    }
    calculateTFAI() {
        return (this.forehead + this.eyeGap + this.smile + this.lip + this.nose) / 5;
    }
    getMetricByName(name) {
        switch (name) {
            case 'forehead': return this.forehead;
            case 'eye_gap': return this.eyeGap;
            case 'smile': return this.smile;
            case 'lip': return this.lip;
            case 'nose': return this.nose;
            default: throw new Error(`Unknown metric: ${name}`);
        }
    }
    toObject() {
        return {
            forehead: this.forehead,
            eye_gap: this.eyeGap,
            smile: this.smile,
            lip: this.lip,
            nose: this.nose
        };
    }
}
