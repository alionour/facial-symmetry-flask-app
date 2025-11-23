import datetime

class Patient:
    def __init__(self, id, name, age, date=None):
        self.id = id
        self.name = name
        self.age = age
        self.date = date or datetime.datetime.now().isoformat()

    def is_valid(self):
        return all([self.id, self.name, self.age])

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'age': self.age,
            'date': self.date,
        }

class ExamSession:
    def __init__(self, patient, actions):
        self.patient = patient
        self.actions = actions
        self._current_action_index = 0
        self._is_started = False
        self._results = []

    def start(self):
        self._is_started = True
        self._current_action_index = 0

    def get_current_action(self):
        if self._current_action_index >= len(self.actions):
            return None
        return self.actions[self._current_action_index]

    def next_action(self):
        if self._current_action_index < len(self.actions) - 1:
            self._current_action_index += 1
            return True
        return False

    def add_result(self, result):
        self._results.append(result)

    def get_results(self):
        return list(self._results)

    def is_completed(self):
        return self._current_action_index >= len(self.actions)

    @property
    def is_started(self):
        return self._is_started

    @property
    def current_action_index(self):
        return self._current_action_index

    def to_dict(self):
        return {
            'patient': self.patient.to_dict(),
            'actions': self.actions,
            'currentActionIndex': self._current_action_index,
            'isStarted': self._is_started,
            'results': self._results,
        }