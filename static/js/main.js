// Main entry point - Clean Architecture implementation
import { FacialSymmetryApp } from './src/presentation/app/FacialSymmetryApp.js';

export function initializeFacialSymmetryApp() {
    // Initialize app if not already initialized
    if (!window._facialSymmetryApp) {
        try {
            window._facialSymmetryApp = new FacialSymmetryApp();
            window._facialSymmetryApp.initialize();
            console.log('[DEBUG] FacialSymmetryApp initialized');
        } catch (error) {
            console.error('Failed to initialize FacialSymmetryApp:', error);
        }
    }
}
