export class ExamSession {
    constructor(patient, actions) {
        this.patient = patient;
        this.actions = actions;
        this._currentActionIndex = 0;
        this._isStarted = false;
        this._results = [];
    }
    start() {
        this._isStarted = true;
        this._currentActionIndex = 0;
    }
    getCurrentAction() {
        if (this._currentActionIndex >= this.actions.length) {
            return undefined;
        }
        return this.actions[this._currentActionIndex];
    }
    nextAction() {
        if (this._currentActionIndex < this.actions.length - 1) {
            this._currentActionIndex++;
            return true;
        }
        return false;
    }
    addResult(result) {
        this._results.push(result);
    }
    getResults() {
        return [...this._results];
    }
    isCompleted() {
        return this._currentActionIndex >= this.actions.length;
    }
    get isStarted() {
        return this._isStarted;
    }
    get currentActionIndex() {
        return this._currentActionIndex;
    }
}
