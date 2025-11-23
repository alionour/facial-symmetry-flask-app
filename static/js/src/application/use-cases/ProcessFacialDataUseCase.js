import { MetricResult } from '../../domain/value-objects/MetricResult.js';
import { FacialActions, FacialActionMetrics } from '../../domain/entities/ExamAction.js';
export class ProcessFacialDataUseCase {
    constructor(metricCalculationService, examRepository) {
        this.metricCalculationService = metricCalculationService;
        this.examRepository = examRepository;
    }
    async execute(request) {
        const { session, landmarks } = request;
        if (!session.isStarted) {
            return [];
        }
        const currentAction = session.getCurrentAction();
        if (!currentAction) {
            return [];
        }
        // Calculate facial metrics
        const metrics = this.metricCalculationService.calculateMetrics(landmarks);
        // Convert to results
        const results = [];
        // Use FacialActionMetrics to get metric indices for the current action
        const metricIndices = FacialActionMetrics[currentAction];
        if (metricIndices && metricIndices.length > 0 && currentAction !== FacialActions.neutral) {
            // Use the first metric index as the metric name (or adapt as needed)
            const metricName = metricIndices.join(',');
            const value = metrics.getMetricByName(metricName);
            const { score, label } = this.metricCalculationService.convertToScore(value);
            const result = MetricResult.create({
                actionName: currentAction,
                metricName,
                value,
                score,
                label
            });
            results.push(result);
            session.addResult(result);
        }
        else {
            // All metrics for neutral face
            const metricsObj = metrics.toObject();
            for (const [metricName, value] of Object.entries(metricsObj)) {
                const { score, label } = this.metricCalculationService.convertToScore(value);
                const result = MetricResult.create({
                    actionName: currentAction,
                    metricName,
                    value,
                    score,
                    label
                });
                results.push(result);
                session.addResult(result);
            }
        }
        // Save results
        await this.examRepository.saveResults(results);
        return results;
    }
}
