// Presentation: Main Application
import { DependencyContainer } from '../../infrastructure/di/DependencyContainer.js';
import { LiveVideoAnalysisController } from '../controllers/LiveVideoAnalysisController.js';
import { ResultsController } from '../controllers/ResultsController.js';
import { PatientForm } from '../components/PatientForm.js';
export class FacialSymmetryApp {
    constructor() {
        this.pendingExamPatientData = null;
        this.translations = {};
        const container = DependencyContainer.getInstance();
        this.examController = new LiveVideoAnalysisController(container.examOrchestrator, container.cameraRepository);
        this.resultsController = new ResultsController();
        this.patientForm = new PatientForm('patientForm');
        this.patientForm.setTranslations(this.translations);
        this.setupEventHandlers();
        this.loadTranslations();
        // Listen for live video analysis view loaded event to start exam if needed
        window.addEventListener('liveVideoAnalysisViewLoaded', () => {
            if (this.pendingExamPatientData && this.pendingExamPatientData.assessmentMode !== 'images') {
                this.startExam(this.pendingExamPatientData);
                this.pendingExamPatientData = null;
            }
        });
        // Listen for image assessment view loaded event
        window.addEventListener('imageAssessmentViewLoaded', () => {
            if (this.pendingExamPatientData && this.pendingExamPatientData.assessmentMode === 'images') {
                console.log('[DEBUG] Image assessment view loaded, storing patient data');
                // Store patient data for the image assessment module
                localStorage.setItem('currentPatientData', JSON.stringify(this.pendingExamPatientData));
                this.pendingExamPatientData = null;
            }
        });
    }

    async loadTranslations() {
        try {
            const response = await fetch('/api/translations');
            if (!response.ok) {
                throw new Error('Failed to fetch translations');
            }
            this.translations = await response.json();
        } catch (error) {
            console.error('Error loading translations:', error);
        }
    }

    setupEventHandlers() {
        console.log('[DEBUG] Setting up event handlers in FacialSymmetryApp');
        // Patient form submission
        this.patientForm.onSubmit((patientData) => {
            console.log('[DEBUG] Patient form submitted with data:', patientData);
            // Store patient data and navigate based on assessment mode
            this.pendingExamPatientData = patientData;
            if (patientData.assessmentMode === 'images') {
                // Navigate directly to image assessment
                console.log('[DEBUG] Navigating directly to image assessment');
                window.history.pushState({}, '', '/image-assessment');
                window.dispatchEvent(new Event('popstate'));
            }
            else {
                // Navigate to live video analysis
                console.log('[DEBUG] Navigating to live video analysis');
                window.history.pushState({}, '', '/live-video-analysis');
                window.dispatchEvent(new Event('popstate'));
                // The analysis will start after the live video analysis view is loaded (handled in constructor)
            }
        });
        // Next action button
        const nextButton = document.getElementById('nextBtn');
        nextButton?.addEventListener('click', () => {
            this.examController.nextAction();
        });
        // Analysis mode cycle button removed - analysis view now locked to flat view
        // PDF export button
        const pdfButton = document.getElementById('exportPdf');
        pdfButton?.addEventListener('click', () => {
            this.resultsController.exportResults();
        });
    }
    async startExam(patientData) {
        try {
            console.log('[DEBUG] startExam called with patient data:', patientData);
            this.patientForm.hide();
            // Start live camera assessment (image assessment is handled separately)
            console.log('[DEBUG] Starting live camera assessment');
            await this.examController.startExam(patientData, this.translations);
        }
        catch (error) {
            console.error('Failed to start exam:', error);
            this.patientForm.show();
        }
    }
    initialize() {
        console.log('Facial Symmetry App initialized with Clean Architecture');
        // Handle initial route
        this.handleRoute();
        // Listen for browser navigation (back/forward)
        window.addEventListener('popstate', () => {
            this.handleRoute();
        });
    }
    /**
     * Handle route changes and initialize appropriate controllers
     */
    handleRoute() {
        const path = window.location.pathname;
        console.log('Handling route:', path);
        if (path === '/results') {
            // Load results content and then initialize
            this.loadResultsContentAndInitialize();
        }
        else if (path === '/live-video-analysis') {
            // Exam route handling (if needed)
            // You may want to initialize exam view here if needed
            // For now, fallback to home
            this.initializeHomeRoute();
        }
        else if (path === '/image-assessment') {
            // Image assessment route
            this.initializeImageAssessmentRoute();
        }
        else {
            // Default to home route - root route serves home content directly
            this.initializeHomeRoute();
        }
    }
    /**
     * Load results content and then initialize
     */
    async loadResultsContentAndInitialize() {
        try {
            console.log('Loading results content...');
            // Fetch the results HTML
            const response = await fetch('pages/results.html');
            if (!response.ok) {
                throw new Error(`Failed to load results page: ${response.status}`);
            }
            const html = await response.text();
            // Get the route container and load the content
            const routeContainer = document.getElementById('routeContainer');
            if (routeContainer) {
                routeContainer.innerHTML = html;
                console.log('Results content loaded successfully');
                // Dispatch event to notify that results view is loaded
                window.dispatchEvent(new Event('resultsViewLoaded'));
                // Initialize the results route
                await this.initializeResultsRoute();
            }
            else {
                throw new Error('Route container not found');
            }
        }
        catch (error) {
            console.error('Failed to load results content:', error);
            this.showResultsLoadError();
        }
    }
    /**
     * Initialize the results route
     */
    async initializeResultsRoute() {
        console.log('Initializing results route');
        // Hide patient form if visible
        this.patientForm.hide();
        // Initialize the results controller
        await this.resultsController.initializeResultsRoute();
    }
    /**
     * Initialize the home route
     */
    initializeHomeRoute() {
        console.log('Initializing home route');
        // Check if DOM elements exist, if not reinitialize PatientForm
        const patientFormElement = document.getElementById('patientForm');
        const modeSelectionElement = document.getElementById('modeSelection');
        if (!patientFormElement || !modeSelectionElement) {
            console.log('DOM elements not found, waiting for content to load...');
            // Wait a bit for the content to load and try again
            setTimeout(() => {
                this.initializeHomeRoute();
            }, 100);
            return;
        }
        // Always reinitialize PatientForm to ensure proper global function binding
        console.log('Reinitializing PatientForm for proper global function binding');
        this.patientForm = new PatientForm('patientForm');
        // Set up the patient form submission handler
        this.patientForm.onSubmit((patientData) => {
            console.log('[DEBUG] Patient form submitted with data:', patientData);
            // Store patient data and navigate based on assessment mode
            this.pendingExamPatientData = patientData;
            console.log('[DEBUG] Stored pendingExamPatientData:', this.pendingExamPatientData);
            if (patientData.assessmentMode === 'images') {
                // Navigate directly to image assessment
                console.log('[DEBUG] Navigating directly to image assessment');
                window.history.pushState({}, '', '/image-assessment');
                window.dispatchEvent(new Event('popstate'));
            }
            else {
                // Navigate to live camera exam
                console.log('[DEBUG] Navigating to live camera exam');
                window.history.pushState({}, '', '/live-video-analysis');
                window.dispatchEvent(new Event('popstate'));
                // The exam will start after the exam view is loaded (handled in constructor)
            }
        });
        // Show the patient form
        this.patientForm.show();
    }
    /**
     * Initialize the image assessment route
     */
    initializeImageAssessmentRoute() {
        console.log('Initializing image assessment route');
        console.log('[DEBUG] pendingExamPatientData:', this.pendingExamPatientData);
        // Hide patient form
        this.patientForm.hide();
        // Store patient data in localStorage for the image assessment page
        if (this.pendingExamPatientData) {
            console.log('[DEBUG] Storing patient data in localStorage:', this.pendingExamPatientData);
            localStorage.setItem('currentPatientData', JSON.stringify(this.pendingExamPatientData));
            // Verify the data was stored
            const storedData = localStorage.getItem('currentPatientData');
            console.log('[DEBUG] Verified stored data:', storedData);
        }
        else {
            console.warn('[DEBUG] No pendingExamPatientData to store in localStorage');
            // Check if there's existing data in localStorage that we can reuse
            const existingData = localStorage.getItem('currentPatientData');
            console.log('[DEBUG] Existing localStorage data:', existingData);
            if (!existingData) {
                console.warn('[DEBUG] No existing patient data found - user may need to go back and fill form again');
            }
            else {
                console.log('[DEBUG] Will use existing localStorage data for patient information');
            }
        }
        // Load the image assessment page content
        this.loadImageAssessmentContent();
    }
    /**
     * Load the image assessment page content
     */
    async loadImageAssessmentContent() {
        try {
            console.log('Loading image assessment content...');
            // Fetch the image assessment HTML
            const response = await fetch('pages/image-assessment.html');
            if (!response.ok) {
                throw new Error(`Failed to load image assessment page: ${response.status}`);
            }
            const html = await response.text();
            // Get the route container and load the content
            const routeContainer = document.getElementById('routeContainer');
            if (routeContainer) {
                routeContainer.innerHTML = html;
                console.log('Image assessment content loaded successfully');
                // Dispatch event to notify that image assessment view is loaded
                window.dispatchEvent(new Event('imageAssessmentViewLoaded'));
                // Also trigger patient data population after a short delay to ensure DOM is ready
                setTimeout(() => {
                    console.log('[DEBUG] Triggering patient data population after content load');
                    // Check if the populatePatientInformation function exists and call it
                    if (typeof window.populatePatientInformation === 'function') {
                        window.populatePatientInformation();
                    }
                    else {
                        console.log('[DEBUG] populatePatientInformation function not available yet');
                    }
                }, 200);
            }
            else {
                throw new Error('Route container not found');
            }
        }
        catch (error) {
            console.error('Failed to load image assessment content:', error);
            this.showImageAssessmentLoadError();
        }
    }
    /**
     * Show error when image assessment content fails to load
     */
    showImageAssessmentLoadError() {
        console.error('Failed to load image assessment content');
        const routeContainer = document.getElementById('routeContainer');
        if (routeContainer) {
            routeContainer.innerHTML = `
        <div style="
          text-align: center;
          padding: 50px;
          background: #f6f8fa;
          min-height: 100vh;
          font-family: 'Segoe UI', Arial, sans-serif;
        ">
          <div style="
            max-width: 500px;
            margin: 0 auto;
            padding: 30px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(44,62,80,0.12);
            border-left: 4px solid #e74c3c;
          ">
            <h3 style="color: #e74c3c; margin: 0 0 15px 0;">
              Failed to Load Image Assessment
            </h3>
            <p style="color: #7f8c8d; margin: 0 0 20px 0;">
              There was an error loading the image assessment page. Please try going back to home and selecting your assessment mode again.
            </p>
            <button onclick="window.history.pushState({}, '', '/'); window.dispatchEvent(new Event('popstate'));" style="
              background: #3498db;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 6px;
              font-size: 1em;
              cursor: pointer;
            ">
              Go to Home
            </button>
          </div>
        </div>
      `;
        }
    }
    /**
     * Show error when results content fails to load
     */
    showResultsLoadError() {
        console.error('Failed to load results content');
        // Try to show a basic error message in the route container
        const routeContainer = document.getElementById('routeContainer');
        if (routeContainer) {
            routeContainer.innerHTML = `
        <div style="
          text-align: center;
          padding: 50px;
          background: #f6f8fa;
          min-height: 100vh;
          font-family: 'Segoe UI', Arial, sans-serif;
        ">
          <div style="
            max-width: 500px;
            margin: 0 auto;
            padding: 30px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(44,62,80,0.12);
            border-left: 4px solid #e74c3c;
          ">
            <h3 style="color: #e74c3c; margin: 0 0 15px 0;">
              Failed to Load Results
            </h3>
            <p style="color: #7f8c8d; margin: 0 0 20px 0;">
              There was an error loading the results page. Please try refreshing the page or go back to home.
            </p>
            <button onclick="window.location.hash = ''" style="
              background: #3498db;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 6px;
              font-size: 1em;
              cursor: pointer;
            ">
              Go to Home
            </button>
          </div>
        </div>
      `;
        }
    }
}
