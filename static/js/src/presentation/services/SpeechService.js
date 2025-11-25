// Handles all speech synthesis logic for the exam UI
import { FacialActions } from '../../domain/entities/ExamAction.js';
export class SpeechService {
    setLastSpokenText(text) {
        this.lastSpokenText = text;
    }
    getLastSpokenText() {
        return this.lastSpokenText;
    }
    constructor() {
        this.speechSynthesis = null;
        this.speechEnabled = true;
        this.speechInitialized = false;
        this.lastSpokenText = '';
        this.speechInProgress = false;
        this.initializeSpeechSynthesis();
    }
    initializeSpeechSynthesis() {
        if ('speechSynthesis' in window) {
            this.speechSynthesis = window.speechSynthesis;
            if (this.speechSynthesis.getVoices().length === 0) {
                this.speechSynthesis.addEventListener('voiceschanged', () => {
                    this.speechSynthesis.getVoices();
                });
            }
            this.speechInitialized = true;
        }
        else {
            this.speechEnabled = false;
        }
    }
    speakInstruction(text) {
        if (!this.speechEnabled || !this.speechSynthesis)
            return;
        if (text === this.lastSpokenText && this.speechInProgress)
            return;
        if (!this.speechInitialized)
            this.initializeSpeechSynthesis();
        if (this.speechInProgress && this.speechSynthesis.speaking) {
            this.speechSynthesis.cancel();
            this.speechInProgress = false;
        }
        this.lastSpokenText = text;
        setTimeout(() => {
            if (!this.speechSynthesis)
                return;
            this.performSpeech(text);
        }, this.speechInProgress ? 300 : 100);
    }
    performSpeech(text) {
        if (!this.speechSynthesis)
            return;
        this.speechInProgress = true;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.volume = 1.0;
        utterance.pitch = 1.0;
        utterance.lang = 'en-US';
        utterance.onstart = () => { this.speechInProgress = true; };
        utterance.onend = () => { this.speechInProgress = false; };
        utterance.onerror = () => { this.speechInProgress = false; };
        this.speechSynthesis.speak(utterance);
    }
    stopCurrentSpeech() {
        if (this.speechSynthesis && this.speechSynthesis.speaking) {
            this.speechSynthesis.cancel();
            this.speechInProgress = false;
        }
    }
    resetSpeechState() {
        this.lastSpokenText = '';
        this.speechInProgress = false;
    }
    /**
     * Get ultra-short speech commands for instant delivery
     */
    getShortSpeechInstruction(action, instruction) {
        const quickCommands = {
            // Direct action enum matches - Full sentences for better clarity
            [FacialActions.neutral]: 'Please relax your face and maintain a neutral expression',
            [FacialActions.EyebrowRaise]: 'Please raise both eyebrows as high as possible',
            [FacialActions.EyeClosure]: 'Please close your eyes tightly',
            [FacialActions.Smile]: 'Please show your biggest smile',
            [FacialActions.Snarl]: 'Wrinkle your nose upward and show your upper teeth',
            [FacialActions.LipPucker]: 'Pucker your lips tightly as if giving a kiss',
        };
        // Try direct enum match first
        let speechCommand = quickCommands[action];
        if (!speechCommand) {
            // Fallback to instruction text if it's short enough
            if (instruction && instruction.length <= 20) {
                speechCommand = instruction;
            }
            else {
                speechCommand = 'Follow the instruction';
            }
        }
        return speechCommand;
    }
}
