// Handles instruction and button UI updates for the exam
export class InstructionView {
    constructor() {
        this.instructionElement = document.getElementById('instruction');
        this.speechToggleBtn = document.getElementById('speechToggleBtn');
        this.testSpeechBtn = document.getElementById('testSpeechBtn');
        this.nextBtn = document.getElementById('nextBtn');
    }
    setInstruction(text) {
        if (this.instructionElement) {
            this.instructionElement.textContent = text;
            this.instructionElement.style.display = 'block';
        }
    }
    setInstructionAreaVisible(visible) {
        if (this.instructionElement) {
            this.instructionElement.style.display = visible ? 'block' : 'none';
        }
    }
    updateSpeechToggleButton(speechEnabled) {
        if (this.speechToggleBtn) {
            if (speechEnabled) {
                this.speechToggleBtn.textContent = '🔊 Speech ON';
                this.speechToggleBtn.style.background = '#e67e22';
                this.speechToggleBtn.title = 'Click to disable speech instructions';
            }
            else {
                this.speechToggleBtn.textContent = '🔇 Speech OFF';
                this.speechToggleBtn.style.background = '#7f8c8d';
                this.speechToggleBtn.title = 'Click to enable speech instructions';
            }
        }
    }
    setNextButtonVisible(visible) {
        if (this.nextBtn) {
            this.nextBtn.style.display = visible ? 'inline-block' : 'none';
        }
    }
    setTestSpeechButtonVisible(visible) {
        if (this.testSpeechBtn) {
            this.testSpeechBtn.style.display = visible ? 'inline-block' : 'none';
        }
    }
}
