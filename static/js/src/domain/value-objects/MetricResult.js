// Domain Value Object: Metric Result
export class MetricResult {
    constructor(actionName, metricName, value, score, label, timestamp = new Date()) {
        this.actionName = actionName;
        this.metricName = metricName;
        this.value = value;
        this.score = score;
        this.label = label;
        this.timestamp = timestamp;
    }
    static create(data) {
        return new MetricResult(data.actionName, data.metricName, data.value, data.score, data.label);
    }
    isNormal() {
        return this.score === 0;
    }
    isSevere() {
        return this.score >= 4;
    }
}
