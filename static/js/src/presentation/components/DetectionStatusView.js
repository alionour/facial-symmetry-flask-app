// Presentation Component: Detection Status View
// Displays real-time movement detection status and feedback
import { FacialActions } from '/static/js/src/domain/entities/ExamAction.js';
export class DetectionStatusView {
    constructor() {
        this.container = null;
        this.statusIndicators = new Map();
        this.currentActionIndicator = null;
        this.createStatusUI();
    }
    /**
     * Create the detection status UI
     */
    createStatusUI() {
        // Find or create container
        this.container = document.getElementById('detectionStatus');
        if (!this.container) {
            this.container = this.createStatusContainer();
            this.insertStatusContainer();
        }
        this.createStatusIndicators();
        this.createCurrentActionIndicator();
    }
    /**
     * Create the main status container
     */
    createStatusContainer() {
        const container = document.createElement('div');
        container.id = 'detectionStatus';
        container.className = 'detection-status-container';
        container.innerHTML = `
      <style>
        .detection-status-container {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(226, 232, 240, 0.8);
        }

        .detection-status-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 1rem;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .detection-indicators {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .detection-indicator {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          transition: all 0.3s ease;
        }

        .detection-indicator.detected {
          background: linear-gradient(135deg, #ecfdf5, #d1fae5);
          border-color: #10b981;
          color: #065f46;
        }

        .detection-indicator.detecting {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border-color: #f59e0b;
          color: #92400e;
          animation: pulse-detecting 2s infinite;
        }

        .detection-indicator.pending {
          background: #f8fafc;
          border-color: #e2e8f0;
          color: #64748b;
        }

        @keyframes pulse-detecting {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .detection-icon {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          flex-shrink: 0;
        }

        .detection-icon.detected {
          background: #10b981;
          color: white;
        }

        .detection-icon.detecting {
          background: #f59e0b;
          color: white;
        }

        .detection-icon.pending {
          background: #e2e8f0;
          color: #64748b;
        }

        .detection-label {
          font-weight: 600;
          font-size: 0.875rem;
        }

        .current-action-indicator {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          text-align: center;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .current-action-title {
          font-size: 0.875rem;
          opacity: 0.9;
          margin-bottom: 0.25rem;
        }

        .current-action-name {
          font-size: 1.125rem;
          font-weight: 700;
        }

        .detection-feedback {
          margin-top: 1rem;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          text-align: center;
        }

        .detection-feedback.success {
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #10b981;
        }

        .detection-feedback.warning {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #f59e0b;
        }

        .detection-feedback.error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #ef4444;
        }

        @media (max-width: 768px) {
          .detection-indicators {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .detection-indicator {
            padding: 0.5rem 0.75rem;
          }

          .detection-status-container {
            padding: 1rem;
          }
        }
      </style>

      <div class="detection-status-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Movement Detection Status
      </div>

      <div class="detection-indicators" id="detectionIndicators"></div>

      <div class="current-action-indicator" id="currentActionIndicator">
        <div class="current-action-title">Current Action</div>
        <div class="current-action-name">Preparing...</div>
      </div>

      <div class="detection-feedback" id="detectionFeedback" style="display: none;"></div>
    `;
        return container;
    }
    /**
     * Insert status container into the page
     */
    insertStatusContainer() {
        const examView = document.getElementById('examView');
        const cameraSection = document.querySelector('.camera-section');
        if (examView && cameraSection) {
            examView.insertBefore(this.container, cameraSection.nextSibling);
        }
    }
    /**
     * Create status indicators for each action
     */
    createStatusIndicators() {
        const indicatorsContainer = document.getElementById('detectionIndicators');
        if (!indicatorsContainer)
            return;
        const actions = [
            { type: FacialActions.neutral, label: 'Neutral Face' },
            { type: FacialActions.EyebrowRaise, label: 'Eyebrow Raise' },
            { type: FacialActions.EyeClosure, label: 'Eye Closure' },
            { type: FacialActions.Smile, label: 'Smile' }
        ];
        actions.forEach(action => {
            const indicator = document.createElement('div');
            indicator.className = 'detection-indicator pending';
            indicator.innerHTML = `
        <div class="detection-icon pending">?</div>
        <div class="detection-label">${action.label}</div>
      `;
            this.statusIndicators.set(action.type, indicator);
            indicatorsContainer.appendChild(indicator);
        });
    }
    /**
     * Create current action indicator
     */
    createCurrentActionIndicator() {
        this.currentActionIndicator = document.getElementById('currentActionIndicator');
    }
    /**
     * Update detection status for specific action
     */
    updateDetectionStatus(actionType, result) {
        const indicator = this.statusIndicators.get(actionType);
        if (!indicator)
            return;
        const icon = indicator.querySelector('.detection-icon');
        if (result.isDetected) {
            // Movement successfully detected
            indicator.className = 'detection-indicator detected';
            icon.className = 'detection-icon detected';
            icon.textContent = '✓';
            this.showFeedback('success', `${this.getActionLabel(actionType)} detected successfully!`);
        }
        else if (result.confidence > 0.3) {
            // Movement being detected but not validated yet
            indicator.className = 'detection-indicator detecting';
            icon.className = 'detection-icon detecting';
            icon.textContent = '⋯';
            this.showFeedback('warning', `Detecting ${this.getActionLabel(actionType).toLowerCase()}... ${result.validationErrors[0] || 'Please hold the position'}`);
        }
        else {
            // No movement detected
            indicator.className = 'detection-indicator pending';
            icon.className = 'detection-icon pending';
            icon.textContent = '?';
        }
    }
    /**
     * Update current action display
     */
    updateCurrentAction(actionType, instruction) {
        if (!this.currentActionIndicator)
            return;
        const titleElement = this.currentActionIndicator.querySelector('.current-action-title');
        const nameElement = this.currentActionIndicator.querySelector('.current-action-name');
        if (titleElement && nameElement) {
            titleElement.textContent = 'Current Action';
            nameElement.textContent = this.getActionLabel(actionType);
        }
        // Clear previous feedback when action changes
        this.hideFeedback();
    }
    /**
     * Show feedback message
     */
    showFeedback(type, message) {
        const feedback = document.getElementById('detectionFeedback');
        if (!feedback)
            return;
        feedback.className = `detection-feedback ${type}`;
        feedback.textContent = message;
        feedback.style.display = 'block';
        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => this.hideFeedback(), 3000);
        }
    }
    /**
     * Hide feedback message
     */
    hideFeedback() {
        const feedback = document.getElementById('detectionFeedback');
        if (feedback) {
            feedback.style.display = 'none';
        }
    }
    /**
     * Get user-friendly action label
     */
    getActionLabel(actionType) {
        const labels = {
            [FacialActions.neutral]: 'Neutral Face',
            [FacialActions.EyebrowRaise]: 'Eyebrow Raise',
            [FacialActions.EyeClosure]: 'Eye Closure',
            [FacialActions.Smile]: 'Smile'
        };
        return labels[actionType] || String(actionType);
    }
    /**
     * Show completion status
     */
    showCompletionStatus(allDetected) {
        if (allDetected) {
            this.showFeedback('success', '✅ All movements detected! Ready to proceed with analysis.');
        }
        else {
            this.showFeedback('warning', '⚠️ Some movements still need to be detected.');
        }
    }
    /**
     * Reset all indicators
     */
    reset() {
        this.statusIndicators.forEach(indicator => {
            indicator.className = 'detection-indicator pending';
            const icon = indicator.querySelector('.detection-icon');
            icon.className = 'detection-icon pending';
            icon.textContent = '?';
        });
        this.hideFeedback();
        if (this.currentActionIndicator) {
            const nameElement = this.currentActionIndicator.querySelector('.current-action-name');
            if (nameElement) {
                nameElement.textContent = 'Preparing...';
            }
        }
    }
    /**
     * Show error message
     */
    showError(message) {
        this.showFeedback('error', message);
    }
}
