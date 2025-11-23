import { ResultsView } from '../components/ResultsView.js';
import { ImageAnalysisController } from './ImageAnalysisController.js';
/**
 * ResultsController - Handles the dedicated results route
 * Manages URL state, data persistence, and results display
 */
export class ResultsController {
    constructor() {
        this.resultsView = new ResultsView();
        this.imageAnalysisController = new ImageAnalysisController();
    }
    /**
     * Initialize the results route
     * Called when navigating to #/results
     */
    async initializeResultsRoute() {
        // Show loading state initially
        this.showLoadingState();
        try {
            // Check if this is an image-based analysis
            const analysisMode = localStorage.getItem('analysisMode');
            if (analysisMode === 'images') {
                await this.processImageAnalysis();
            }
            else {
                // Attempt to load results from storage (live camera analysis)
                const results = this.loadResultsFromStorage();
                if (results) {
                    await this.displayResults(results);
                }
                else {
                    this.showErrorState();
                }
            }
        }
        catch (error) {
            this.showErrorState();
        }
    }
    /**
     * Process image-based analysis using real MediaPipe analysis
     */
    async processImageAnalysis() {
        try {
            // Process uploaded images using real MediaPipe analysis
            const analysisResults = await this.imageAnalysisController.processUploadedImages();
            // Store results for persistence
            this.storeResults(analysisResults);
            // Display the results
            // await this.displayResults(analysisResults);
            // Clean up localStorage
            localStorage.removeItem('uploadedImages');
            localStorage.removeItem('analysisMode');
        }
        catch (error) {
            this.showErrorState();
        }
    }
    /**
     * Store examination results for the results route
     * Called by ExamController when examination completes
     */
    storeResults(results) {
        const storageData = {
            results: results,
            timestamp: new Date().toISOString(),
            expiryTime: new Date(Date.now() + (ResultsController.STORAGE_EXPIRY_HOURS * 60 * 60 * 1000)).toISOString()
        };
        try {
            localStorage.setItem(ResultsController.STORAGE_KEY, JSON.stringify(storageData));
        }
        catch (error) {
        }
    }
    /**
     * Transform examination results to match the format expected by ResultsView
     */
    // private transformResultsForView(results: CompleteAnalysisResult): CompleteAnalysisResult {
    //   // Pass through the results, ensuring all required fields are present
    //   return {
    //     ...results,
    //     patientInfo: results.patientInfo || {
    //       patient_id: results.patient_id,
    //       examination_date: results.examination_date
    //     },
    //     timestamp: results.timestamp || new Date().toISOString(),
    //     actions: results.actions || [],
    //     overallScore: results.overallScore || 0,
    //     symmetryMetrics: results.symmetryMetrics || {
    //       leftEyebrowElevation: 0,
    //       rightEyebrowElevation: 0,
    //       eyebrowAsymmetry: 0,
    //       eyebrowSymmetry: 0,
    //       leftEyeClosure: 0,
    //       rightEyeClosure: 0,
    //       eyeAsymmetry: 0,
    //       eyeSymmetry: 0,
    //       leftMouthMovement: 0,
    //       rightMouthMovement: 0,
    //       mouthAsymmetry: 0,
    //       mouthSymmetry: 0,
    //       leftHorizontalDistance: 0,
    //       rightHorizontalDistance: 0,
    //       leftVerticalDistance: 0,
    //       rightVerticalDistance: 0,
    //       horizontalAsymmetry: 0,
    //       verticalAsymmetry: 0
    //     }
    //   };
    // }
    /**
     * Load results from localStorage with expiry check
     */
    loadResultsFromStorage() {
        try {
            const storedData = localStorage.getItem(ResultsController.STORAGE_KEY);
            if (!storedData) {
                return null;
            }
            const parsedData = JSON.parse(storedData);
            const now = new Date();
            const expiryTime = new Date(parsedData.expiryTime);
            if (now > expiryTime) {
                localStorage.removeItem(ResultsController.STORAGE_KEY);
                return null;
            }
            return parsedData;
        }
        catch (error) {
            localStorage.removeItem(ResultsController.STORAGE_KEY);
            return null;
        }
    }
    /**
     * Display the examination results
     */
    async displayResults(results) {
        try {
            // Hide loading and error states
            this.hideLoadingState();
            this.hideErrorState();
            // Transform the results to match the expected format
            // Set results in the ResultsView
            this.resultsView.setResults(results.complete_analysis_results);
            // Wait for results content container to be available (increased timeout and extra logging)
            const resultsContent = await this.waitForElement('resultsContent', 10000);
            if (!resultsContent) {
                throw new Error('Results content container not found after waiting');
            }
            // Generate and insert the results HTML
            resultsContent.innerHTML = this.resultsView.generateResultsHTML();
            resultsContent.style.display = 'block';
            // Set up event listeners for the results page (with delay to ensure DOM is ready)
            setTimeout(() => {
                this.setupResultsEventListeners();
            }, 100);
        }
        catch (error) {
            this.showErrorState();
        }
    }
    /**
     * Show loading state
     */
    showLoadingState() {
        const loading = document.getElementById('resultsLoading');
        const error = document.getElementById('resultsError');
        const content = document.getElementById('resultsContent');
        if (loading)
            loading.style.display = 'block';
        if (error)
            error.style.display = 'none';
        if (content)
            content.style.display = 'none';
    }
    /**
     * Hide loading state
     */
    hideLoadingState() {
        const loading = document.getElementById('resultsLoading');
        if (loading)
            loading.style.display = 'none';
    }
    /**
     * Show error state when no results are available
     */
    showErrorState() {
        const loading = document.getElementById('resultsLoading');
        const error = document.getElementById('resultsError');
        const content = document.getElementById('resultsContent');
        if (loading)
            loading.style.display = 'none';
        if (error)
            error.style.display = 'block';
        if (content)
            content.style.display = 'none';
        // Set up error state event listeners
        this.setupErrorStateEventListeners();
    }
    /**
     * Hide error state
     */
    hideErrorState() {
        const error = document.getElementById('resultsError');
        if (error)
            error.style.display = 'none';
    }
    /**
     * Set up event listeners for the results page
     */
    setupResultsEventListeners() {
        // Use the correct button IDs that match the HTML
        const pdfBtn = document.getElementById('exportPdfBtn');
        const printBtn = document.getElementById('printResultsBtn');
        const backBtn = document.getElementById('backToHome');
        if (pdfBtn) {
            pdfBtn.addEventListener('click', () => {
                this.resultsView.exportToPDF();
            });
        }
        else {
        }
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                this.resultsView.printResults();
            });
        }
        else {
        }
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.navigateToHome();
            });
        }
    }
    /**
     * Set up event listeners for the error state
     */
    setupErrorStateEventListeners() {
        const startNewExamBtn = document.getElementById('startNewExam');
        const goHomeBtn = document.getElementById('goHome');
        if (startNewExamBtn) {
            startNewExamBtn.addEventListener('click', () => {
                this.navigateToHome();
            });
        }
        if (goHomeBtn) {
            goHomeBtn.addEventListener('click', () => {
                this.navigateToHome();
            });
        }
    }
    /**
     * Navigate to home page (root route)
     */
    navigateToHome() {
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new Event('popstate'));
    }
    /**
     * Clear stored results (useful for cleanup)
     */
    clearStoredResults() {
        localStorage.removeItem(ResultsController.STORAGE_KEY);
    }
    /**
     * Check if results are available
     */
    hasStoredResults() {
        return this.loadResultsFromStorage() !== null;
    }
    /**
     * Get the URL for sharing results
     */
    getResultsURL() {
        return `${window.location.origin}${window.location.pathname}#/results`;
    }
    async exportResults() {
        try {
            // Use ResultsView for PDF export
            this.resultsView.exportToPDF();
        }
        catch (error) {
            console.error('Failed to export PDF results:', error);
            alert('Failed to export PDF results');
        }
    }
    /**
     * Wait for a DOM element to be available
     */
    waitForElement(elementId, timeoutMs = 5000) {
        return new Promise((resolve) => {
            const element = document.getElementById(elementId);
            if (element) {
                resolve(element);
                return;
            }
            let attempts = 0;
            const maxAttempts = timeoutMs / 100; // Check every 100ms
            const checkForElement = () => {
                attempts++;
                const el = document.getElementById(elementId);
                if (el) {
                    resolve(el);
                }
                else if (attempts < maxAttempts) {
                    setTimeout(checkForElement, 100);
                }
                else {
                    resolve(null);
                }
            };
            setTimeout(checkForElement, 100);
        });
    }
}
ResultsController.STORAGE_KEY = 'facialSymmetryResults';
ResultsController.STORAGE_EXPIRY_HOURS = 24; // Results expire after 24 hours
