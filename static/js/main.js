// Main entry point - Clean Architecture implementation
import { FacialSymmetryApp } from './src/presentation/app/FacialSymmetryApp.js';
function initializeApp() {
    // Initialize app if not already initialized
    if (!window._facialSymmetryApp) {
        window._facialSymmetryApp = new FacialSymmetryApp();
        window._facialSymmetryApp.initialize();
        console.log('[DEBUG] FacialSymmetryApp initialized');
    }
}
function initializeAppIfViewPresent() {
    // Initialize if any view exists (home, live video analysis, results, or image assessment)
    const patientForm = document.getElementById('patientForm');
    const liveVideoAnalysisView = document.getElementById('liveVideoAnalysisView');
    const resultsContainer = document.getElementById('resultsContainer');
    const imageAssessmentContainer = document.getElementById('imageAssessmentContainer');
    const modeSelection = document.getElementById('modeSelection');
    if (patientForm || liveVideoAnalysisView || resultsContainer || imageAssessmentContainer || modeSelection) {
        initializeApp();
    }
}
// Listen for custom events after routes are loaded
window.addEventListener('liveVideoAnalysisViewLoaded', () => {
    initializeAppIfViewPresent();
});
window.addEventListener('resultsViewLoaded', () => {
    initializeAppIfViewPresent();
});
window.addEventListener('imageAssessmentViewLoaded', () => {
    initializeAppIfViewPresent();
});
// Listen for DOM content loaded to catch initial home view
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure route content is loaded
    setTimeout(() => {
        initializeAppIfViewPresent();
        // Fallback: If app still not initialized after 500ms, force initialize
        // This ensures the app is available for home page interactions
        setTimeout(() => {
            if (!window._facialSymmetryApp) {
                console.log('[DEBUG] Force initializing app for home page');
                initializeApp();
            }
        }, 500);
    }, 100);
});
// Listen for hash changes to reinitialize when needed
window.addEventListener('hashchange', () => {
    // Small delay to ensure new route content is loaded
    setTimeout(() => {
        initializeAppIfViewPresent();
    }, 100);
});
