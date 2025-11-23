// Domain Entity: Patient
export class Patient {
    constructor(id, name, age, date) {
        this.id = id;
        this.name = name;
        this.age = age;
        this.date = date;
    }
    static create(data) {
        return new Patient(data.id, data.name, data.age, data.date || new Date().toISOString());
    }
    isValid() {
        return !!(this.id && this.name && this.age);
    }
}
