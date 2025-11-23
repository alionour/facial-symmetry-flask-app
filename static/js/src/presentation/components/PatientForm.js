export class PatientForm {
    constructor(formElementId) {
        this.selectedMode = null;
        this.formElement = document.getElementById(formElementId);
        this.modeSelectionElement = document.getElementById('modeSelection');
        if (!this.formElement) {
            throw new Error(`Form element with id '${formElementId}' not found`);
        }
        if (!this.modeSelectionElement) {
            throw new Error(`Mode selection element not found`);
        }
        this.setupEventListeners();
        this.setupModeSelection();
    }
    setupEventListeners() {
        this.formElement.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    }
    setupModeSelection() {
        // Make mode selection functions globally available with proper binding
        window.selectAssessmentMode = (mode) => {
            try {
                this.selectAssessmentMode(mode);
            }
            catch (error) {
                console.error('Error in selectAssessmentMode:', error);
            }
        };
        window.goBackToModeSelection = () => {
            try {
                this.goBackToModeSelection();
            }
            catch (error) {
                console.error('Error in goBackToModeSelection:', error);
            }
        };
    }
    selectAssessmentMode(mode) {
        this.selectedMode = mode;
        // Update UI to show selected mode
        const modeCards = document.querySelectorAll('.mode-card');
        modeCards.forEach(card => {
            card.classList.remove('selected');
            if (card.getAttribute('data-mode') === mode) {
                card.classList.add('selected');
            }
        });
        // Hide mode selection and show patient form
        this.modeSelectionElement.style.display = 'none';
        this.formElement.style.display = 'flex';

        // Dispatch event to notify that the form is visible
        window.dispatchEvent(new Event('patientFormVisible'));

        // Update checklist and button text based on mode
        this.updateFormForMode(mode);
    }
    setTranslations(translations) {
        this.translations = translations;
    }
    updateFormForMode(mode) {
        const liveChecklist = document.getElementById('liveAssessmentChecklist');
        const imageChecklist = document.getElementById('imageAssessmentChecklist');
        const startBtnText = document.getElementById('startBtnText');
        if (mode === 'live') {
            if (liveChecklist)
                liveChecklist.style.display = 'block';
            if (imageChecklist)
                imageChecklist.style.display = 'none';
            if (startBtnText)
                startBtnText.textContent = (this.translations && this.translations['Begin Live Video Analysis']) || 'Begin Live Video Analysis';
        }
        else {
            if (liveChecklist)
                liveChecklist.style.display = 'none';
            if (imageChecklist)
                imageChecklist.style.display = 'block';
            if (startBtnText)
                startBtnText.textContent = 'Begin Image Assessment';
        }
    }
    goBackToModeSelection() {
        this.selectedMode = null;
        // Clear mode selection
        const modeCards = document.querySelectorAll('.mode-card');
        modeCards.forEach(card => card.classList.remove('selected'));
        // Show mode selection and hide patient form
        this.modeSelectionElement.style.display = 'flex';
        this.formElement.style.display = 'none';
    }
    handleSubmit() {
        const formData = this.extractFormData();
        if (this.validateFormData(formData)) {
            if (this.onSubmitCallback) {
                this.onSubmitCallback(formData);
            }
            else {
                console.error('[DEBUG] No onSubmitCallback set!');
            }
        }
    }
    extractFormData() {
        const idInput = document.getElementById('pid');
        const nameInput = document.getElementById('pname');
        const ageInput = document.getElementById('page');
        // Try to determine the selected mode from UI if selectedMode is null
        let assessmentMode = this.selectedMode;
        if (!assessmentMode) {
            const selectedCard = document.querySelector('.mode-card.selected');
            if (selectedCard) {
                assessmentMode = selectedCard.getAttribute('data-mode');
            }
        }
        const formData = {
            id: idInput?.value || '',
            name: nameInput?.value || '',
            age: ageInput?.value || '',
            assessmentMode: assessmentMode || 'live' // Default to live if not selected
        };
        return formData;
    }
    validateFormData(data) {
        // Check if mode is selected either in instance or in data
        if (!this.selectedMode && !data.assessmentMode) {
            alert('Please select an assessment mode first');
            this.goBackToModeSelection();
            return false;
        }
        // If selectedMode is null but data has assessmentMode, sync them
        if (!this.selectedMode && data.assessmentMode) {
            this.selectedMode = data.assessmentMode;
        }
        if (!data.id.trim()) {
            alert('Patient ID is required');
            return false;
        }
        if (!data.name.trim()) {
            alert('Patient name is required');
            return false;
        }
        if (!data.age.trim()) {
            alert('Patient age is required');
            return false;
        }
        return true;
    }
    onSubmit(callback) {
        this.onSubmitCallback = callback;
    }
    show() {
        // Check if elements still exist in DOM
        if (!this.modeSelectionElement || !this.formElement) {
            throw new Error('DOM elements no longer exist, PatientForm needs reinitialization');
        }
        // If no mode is selected, show mode selection
        if (!this.selectedMode) {
            this.modeSelectionElement.style.display = 'flex';
            this.formElement.style.display = 'none';
            // Clear any previous selections
            const modeCards = document.querySelectorAll('.mode-card');
            modeCards.forEach(card => card.classList.remove('selected'));
        }
        else {
            // If mode is already selected, show the form directly
            this.modeSelectionElement.style.display = 'none';
            this.formElement.style.display = 'flex';
            // Restore the selected mode card
            const modeCards = document.querySelectorAll('.mode-card');
            modeCards.forEach(card => {
                card.classList.remove('selected');
                if (card.getAttribute('data-mode') === this.selectedMode) {
                    card.classList.add('selected');
                }
            });
            // Update form for the selected mode
            this.updateFormForMode(this.selectedMode);
        }
    }
    hide() {
        // Check if elements still exist in DOM
        if (!this.modeSelectionElement || !this.formElement) {
            return;
        }
        this.modeSelectionElement.style.display = 'none';
        this.formElement.style.display = 'none';
    }
    reset() {
        this.formElement.reset();
        this.selectedMode = null;
        // Clear mode selections
        const modeCards = document.querySelectorAll('.mode-card');
        modeCards.forEach(card => card.classList.remove('selected'));
        // Show mode selection, hide form
        this.modeSelectionElement.style.display = 'flex';
        this.formElement.style.display = 'none';
    }
}
