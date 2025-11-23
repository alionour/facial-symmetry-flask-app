export class ExamRepository {
    constructor() {
        this.sessions = new Map();
        this.results = [];
    }
    async saveSession(session) {
        this.sessions.set(session.patient.id, session);
    }
    async getSession(patientId) {
        return this.sessions.get(patientId);
    }
    async saveResults(results) {
        this.results.push(...results);
    }
    async exportResults(format) {
        if (format === 'csv') {
            return this.exportAsCSV();
        }
        else {
            return this.exportAsMarkdown();
        }
    }
    exportAsCSV() {
        const headers = ['Action', 'Metric', 'Value', 'Score', 'Label', 'Timestamp'];
        const rows = this.results.map(result => [
            result.actionName,
            result.metricName,
            result.value.toFixed(4),
            result.score.toString(),
            result.label,
            result.timestamp.toISOString()
        ]);
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    exportAsMarkdown() {
        let markdown = '# Facial Symmetry Analysis Results\n\n';
        markdown += '| Action | Metric | Value | Score | Label | Timestamp |\n';
        markdown += '|--------|--------|-------|-------|-------|----------|\n';
        for (const result of this.results) {
            markdown += `| ${result.actionName} | ${result.metricName} | ${result.value.toFixed(4)} | ${result.score} | ${result.label} | ${result.timestamp.toISOString()} |\n`;
        }
        markdown += '\n**Score Legend:** 0=Normal, 1=Mild, 2=Moderate, 3=Moderately Severe, 4=Severe\n';
        return markdown;
    }
}
