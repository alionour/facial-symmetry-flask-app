from flask import Flask, render_template, request, jsonify, send_file, session, redirect, url_for
from flask_babel import Babel, _
from services.facial_analysis import analyze_face
from services.clinical_calculations import ClinicalAnalysisService, MetricCalculationService
from services.clinical_comparison import ClinicalComparisonService, DistanceEstimationService
from services.pdf_generator import generate_pdf, generate_csv, generate_markdown
from services.domain_models import Patient, ExamSession
from io import BytesIO

class ExamActionsConfig:
    @staticmethod
    def get_default_actions():
        return ["neutral", "eyebrow_raise", "eye_close", "smile"]

app = Flask(__name__)
app.config['SECRET_KEY'] = 'a_secret_key'
app.config['BABEL_TRANSLATION_DIRECTORIES'] = 'translations'
app.config['LANGUAGES'] = {
    'en': 'English',
    'ar': 'Arabic'
}
babel = Babel()

def get_locale():
    return session.get('language', request.accept_languages.best_match(app.config['LANGUAGES'].keys()))

babel.init_app(app, locale_selector=get_locale)

@app.context_processor
def inject_locale():
    return {'get_locale': get_locale}


# These routes will serve the main SPA page
@app.route('/')
@app.route('/live-video-analysis')
@app.route('/results')
@app.route('/image-assessment')
def index():
    test_env = request.args.get('env') == 'test'
    return render_template('index.html', test_env=test_env)

# This route will serve the HTML partials that the client-side router fetches
@app.route('/pages/<path:page_name>')
def serve_page(page_name):
    return render_template(f'pages/{page_name}')

@app.route('/language/<language>')
def set_language(language=None):
    session['language'] = language
    return redirect(request.referrer)

@app.route('/api/translations')
def get_translations():
    translations = {
        'neutral_instruction': _('Please relax your face and maintain a neutral expression'),
        'eyebrow_raise_instruction': _('Please raise your eyebrows as high as possible.'),
        'eye_close_instruction': _('Please close your eyes tightly.'),
        'smile_instruction': _('Please smile broadly showing your teeth.'),
        'NEUTRAL': _('NEUTRAL'),
        'EYEBROW_RAISE': _('EYEBROW RAISE'),
        'EYE_CLOSE': _('EYE CLOSE'),
        'SMILE': _('SMILE'),
        'Head Alignment': _('Head Alignment'),
        'Tilt': _('Tilt'),
        'Rotation': _('Rotation'),
        'Good alignment. Keep your head steady.': _('Good alignment. Keep your head steady.'),
        'Almost aligned. Slight adjustments may help.': _('Almost aligned. Slight adjustments may help.'),
        'Please tilt your head slightly to the right.': _('Please tilt your head slightly to the right.'),
        'Please tilt your head slightly to the left.': _('Please tilt your head slightly to the left.'),
        'Please rotate your head slightly to the right.': _('Please rotate your head slightly to the right.'),
        'Please rotate your head slightly to the left.': _('Please rotate your head slightly to the left.'),
        'Tilt your head slightly to the right and rotate to the right.': _('Tilt your head slightly to the right and rotate to the right.'),
        'Tilt your head slightly to the right and rotate to the left.': _('Tilt your head slightly to the right and rotate to the left.'),
        'Tilt your head slightly to the left and rotate to the right.': _('Tilt your head slightly to the left and rotate to the right.'),
        'Tilt your head slightly to the left and rotate to the left.': _('Tilt your head slightly to the left and rotate to the left.'),
        'Adjust your head position for better alignment.': _('Adjust your head position for better alignment.'),
        'Face Distance': _('Face Distance'),
        'Status': _('Status'),
        'Distance': _('Distance'),
        'Optimal': _('Optimal'),
        'Too Close': _('Too Close'),
        'Too Far': _('Too Far'),
        'Please move farther from camera': _('Please move farther from camera'),
        'Please move closer to camera': _('Please move closer to camera'),
        'Distance is optimal': _('Distance is optimal'),
        'Unable to estimate distance': _('Unable to estimate distance'),
        'Next Action': _('Next Action'),
        'Begin Live Video Analysis': _('Begin Live Video Analysis'),
        'Age': _('Age'),
        'years': _('years'),
        'Patient ID': _('Patient ID'),
        'Patient Name': _('Patient Name'),
        'Exam Date': _('Exam Date'),
        'Exam Time': _('Exam Time'),
        'Overall Score': _('Overall Score'),
        'Neutral Expression': _('Neutral Expression'),
        'Eyebrow Raise': _('Eyebrow Raise'),
        'Eye Closure': _('Eye Closure'),
        'Smile': _('Smile'),
        'No Image Available': _('No Image Available'),
    }
    return jsonify(translations)


@app.route('/analyze', methods=['POST'])
def analyze():
    """
    API endpoint to analyze an image for facial landmarks.
    Expects a JSON payload with an 'image' key containing a data URL.
    """
    data = request.get_json()
    if not data or 'image' not in data:
        return jsonify({'error': 'Missing image data'}), 400

    image_data_url = data['image']
    landmarks = analyze_face(image_data_url)

    if landmarks:
        return jsonify({'landmarks': landmarks})
    else:
        return jsonify({'error': 'No face detected or error in processing'}), 404

@app.route('/export', methods=['POST'])
def export_report():
    """
    API endpoint to generate and export a report in various formats.
    Expects a JSON payload with analysis data and a format specifier.
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing analysis data'}), 400

    analysis_data = data.get('analysisData', {})
    export_format = data.get('format', 'pdf')

    try:
        if export_format == 'pdf':
            pdf_data = generate_pdf(analysis_data)
            return send_file(
                BytesIO(pdf_data),
                mimetype='application/pdf',
                as_attachment=True,
                download_name='facial_symmetry_report.pdf'
            )
        elif export_format == 'csv':
            csv_data = generate_csv(analysis_data)
            return send_file(
                StringIO(csv_data),
                mimetype='text/csv',
                as_attachment=True,
                download_name='facial_symmetry_report.csv'
            )
        elif export_format == 'markdown':
            md_data = generate_markdown(analysis_data)
            return send_file(
                StringIO(md_data),
                mimetype='text/markdown',
                as_attachment=True,
                download_name='facial_symmetry_report.md'
            )
        else:
            return jsonify({'error': 'Unsupported format specified'}), 400

    except Exception as e:
        print(f"Error generating report: {e}")
        return jsonify({'error': 'Failed to generate report'}), 500


# ============================================================================
# NEW PYTHON API ROUTES - For JavaScript to call
# ============================================================================

@app.route('/api/save-patient', methods=['POST'])
def save_patient():
    """
    Save patient information to Flask session.
    Called by JavaScript PatientForm.
    """
    try:
        patient_data = request.get_json()
        if not patient_data:
            return jsonify({'success': False, 'error': 'No patient data provided'}), 400
        
        # Store in Flask session
        session['patient_info'] = patient_data
        session.modified = True
        
        return jsonify({'success': True, 'message': 'Patient data saved to session'})
    except Exception as e:
        print(f"Error saving patient data: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/save-analysis-result', methods=['POST'])
def save_analysis_result():
    """
    Save analysis result for a specific action to Flask session.
    Called by JavaScript after analyzing a frame.
    """
    try:
        data = request.get_json()
        if not data or 'action' not in data or 'result' not in data:
            return jsonify({'success': False, 'error': 'Missing action or result data'}), 400
        
        # Initialize analysis_results if not exists
        if 'analysis_results' not in session:
            session['analysis_results'] = {}
        
        # Store result for this action
        session['analysis_results'][data['action']] = data['result']
        session.modified = True
        
        return jsonify({'success': True, 'message': f'Analysis result for {data["action"]} saved'})
    except Exception as e:
        print(f"Error saving analysis result: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/get-session', methods=['GET'])
def get_session_data():
    """
    Retrieve session data for JavaScript.
    Returns patient info and analysis results.
    """
    try:
        return jsonify({
            'success': True,
            'patient_info': session.get('patient_info', {}),
            'analysis_results': session.get('analysis_results', {})
        })
    except Exception as e:
        print(f"Error retrieving session data: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/clear-session', methods=['POST'])
def clear_session_data():
    """
    Clear session data for new assessment.
    """
    try:
        session.clear()
        return jsonify({'success': True, 'message': 'Session cleared'})
    except Exception as e:
        print(f"Error clearing session: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/validate-patient', methods=['POST'])
def validate_patient():
    """
    Server-side validation for patient data.
    Provides additional security beyond client-side validation.
    """
    try:
        patient_data = request.get_json()
        errors = []
        
        # Validate patient ID
        if not patient_data.get('patientId'):
            errors.append('Patient ID is required')
        elif len(patient_data['patientId']) > 50:
            errors.append('Patient ID must be less than 50 characters')
        
        # Validate patient name
        if not patient_data.get('patientName'):
            errors.append('Patient name is required')
        elif len(patient_data['patientName']) < 2:
            errors.append('Patient name must be at least 2 characters')
        
        # Validate age
        if not patient_data.get('age'):
            errors.append('Age is required')
        else:
            try:
                age = int(patient_data['age'])
                if age < 0 or age > 120:
                    errors.append('Age must be between 0 and 120')
            except (ValueError, TypeError):
                errors.append('Age must be a valid number')
        
        if errors:
            return jsonify({'valid': False, 'errors': errors}), 400
        
        return jsonify({'valid': True, 'message': 'Patient data is valid'})
    except Exception as e:
        print(f"Error validating patient data: {e}")
        return jsonify({'valid': False, 'errors': [str(e)]}), 500


@app.route('/api/calculate-clinical-metrics', methods=['POST'])
def calculate_clinical_metrics():
    """
    Calculate comprehensive clinical metrics using Python.
    JavaScript sends landmarks, Python returns detailed symmetry analysis.
    
    Expected JSON payload:
    {
        "movement_data": {
            "eyebrow_raise": [...landmarks...],
            "eye_close": [...landmarks...],
            "smile": [...landmarks...]
        },
        "baseline_data": [...landmarks...],
        "patient_metadata": {
            "patient_id": "P001",
            "age": 42,
            "examination_date": "2025-11-23"
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        movement_data = data.get('movement_data')
        baseline_data = data.get('baseline_data')
        patient_metadata = data.get('patient_metadata', {})
        
        if not movement_data or not baseline_data:
            return jsonify({
                'success': False, 
                'error': 'Missing movement_data or baseline_data'
            }), 400
        
        # Initialize clinical analysis service
        clinical_service = ClinicalAnalysisService()
        
        # Perform comprehensive analysis
        results = clinical_service.perform_facial_region_analysis(
            movement_data,
            baseline_data,
            patient_metadata
        )
        
        return jsonify({
            'success': True,
            'results': results
        })
        
    except Exception as e:
        print(f"Error calculating clinical metrics: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False, 
            'error': str(e)
        }), 500


@app.route('/api/calculate-simple-metrics', methods=['POST'])
def calculate_simple_metrics():
    """
    Calculate simple facial metrics from landmarks.
    Lighter-weight alternative to full clinical analysis.
    
    Expected JSON payload:
    {
        "landmarks": [...landmark objects...]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'landmarks' not in data:
            return jsonify({'success': False, 'error': 'No landmarks provided'}), 400
        
        landmarks = data['landmarks']
        
        # Initialize metric calculation service
        metric_service = MetricCalculationService()
        
        # Calculate metrics
        metrics = metric_service.calculate_metrics(landmarks)
        
        # Convert to scores
        scores = {}
        for key, value in metrics.items():
            scores[key] = metric_service.convert_to_score(value)
        
        return jsonify({
            'success': True,
            'metrics': metrics,
            'scores': scores
        })
        
    except Exception as e:
        print(f"Error calculating simple metrics: {e}")
        return jsonify({
            'success': False, 
            'error': str(e)
        }), 500


@app.route('/api/compare-sides', methods=['POST'])
def compare_sides():
    """
    Compare left vs right facial movement for specific action.
    
    Expected JSON payload:
    {
        "action_name": "eyebrow_raise",
        "current_landmarks": [...landmarks...],
        "baseline_landmarks": [...landmarks...]
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        action_name = data.get('action_name')
        current_landmarks = data.get('current_landmarks')
        baseline_landmarks = data.get('baseline_landmarks')
        
        if not all([action_name, current_landmarks, baseline_landmarks]):
            return jsonify({
                'success': False,
                'error': 'Missing required fields: action_name, current_landmarks, baseline_landmarks'
            }), 400
        
        # Initialize comparison service
        comparison_service = ClinicalComparisonService()
        
        # Perform comparison
        result = comparison_service.compare_sides_clinical_report(
            action_name,
            current_landmarks,
            baseline_landmarks
        )
        
        return jsonify({
            'success': True,
            'result': result
        })
        
    except Exception as e:
        print(f"Error comparing sides: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/generate-comparison-report', methods=['POST'])
def generate_comparison_report():
    """
    Generate comprehensive comparison report for all facial actions.
    
    Expected JSON payload:
    {
        "patient_id": "P001",
        "landmark_data": {
            "baseline": [...],
            "eyebrow_raise": [...],
            "eye_close": [...],
            "smile": [...]
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        patient_id = data.get('patient_id')
        landmark_data = data.get('landmark_data')
        
        if not patient_id or not landmark_data:
            return jsonify({
                'success': False,
                'error': 'Missing required fields: patient_id, landmark_data'
            }), 400
        
        # Initialize comparison service
        comparison_service = ClinicalComparisonService()
        
        # Generate report
        report = comparison_service.generate_detailed_comparison_report(
            patient_id,
            landmark_data
        )
        
        return jsonify({
            'success': True,
            'report': report
        })
        
    except Exception as e:
        print(f"Error generating comparison report: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/calculate-metrics', methods=['POST'])
def calculate_metrics_endpoint():
    """
    Calculate facial metrics from landmarks using the Python service.
    """
    try:
        data = request.get_json()
        if not data or 'landmarks' not in data:
            return jsonify({'success': False, 'error': 'No landmarks provided'}), 400

        landmarks = data['landmarks']
        metric_service = MetricCalculationService()
        
        metrics = metric_service.calculate_metrics(landmarks)
        
        scores = {}
        for key, value in metrics.items():
            scores[key] = metric_service.convert_to_score(value)

        return jsonify({
            'success': True,
            'metrics': metrics,
            'scores': scores
        })

    except Exception as e:
        print(f"Error in /api/calculate-metrics: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/process-facial-data', methods=['POST'])
def process_facial_data():
    """
    Processes facial data, calculates metrics, and returns results.
    Replaces the JavaScript ProcessFacialDataUseCase.
    """
    try:
        data = request.get_json()
        if not data or 'landmarks' not in data or 'currentAction' not in data:
            return jsonify({'success': False, 'error': 'Missing landmarks or currentAction'}), 400

        landmarks = data['landmarks']
        current_action = data['currentAction']

        metric_service = MetricCalculationService()
        metrics = metric_service.calculate_metrics(landmarks)
        scores = {key: metric_service.convert_to_score(value) for key, value in metrics.items()}

        # Replicating the logic from the frontend FacialActionMetrics
        facial_action_metrics = {
            'neutral': ['forehead', 'eye_gap', 'smile', 'lip', 'nose'],
            'eyebrow_raise': ['forehead'],
            'eye_close': ['eye_gap'],
            'smile': ['smile', 'lip'],
        }

        results = []
        metric_names_for_action = facial_action_metrics.get(current_action, [])

        if current_action != 'neutral' and metric_names_for_action:
            for metric_name in metric_names_for_action:
                if metric_name in metrics:
                    value = metrics[metric_name]
                    score_data = scores[metric_name]
                    results.append({
                        'actionName': current_action,
                        'metricName': metric_name,
                        'value': value,
                        'score': score_data['score'],
                        'label': score_data['label'],
                    })
        else: # For neutral or if no specific metrics are defined, process all
            for metric_name, value in metrics.items():
                score_data = scores[metric_name]
                results.append({
                    'actionName': current_action,
                    'metricName': metric_name,
                    'value': value,
                    'score': score_data['score'],
                    'label': score_data['label'],
                })

        return jsonify(results)

    except Exception as e:
        print(f"Error in /api/process-facial-data: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/start-exam', methods=['POST'])
def start_exam():
    """
    Starts a new exam session.
    Replaces the JavaScript StartExamUseCase.
    """
    try:
        patient_data = request.get_json()
        if not patient_data:
            return jsonify({'success': False, 'error': 'No patient data provided'}), 400

        patient = Patient(
            id=patient_data.get('id'),
            name=patient_data.get('name'),
            age=patient_data.get('age')
        )

        if not patient.is_valid():
            return jsonify({'success': False, 'error': 'Invalid patient data'}), 400

        actions = ExamActionsConfig.get_default_actions()
        exam_session = ExamSession(patient, actions)
        exam_session.start()

        # Storing the session object directly in the Flask session is not recommended
        # as it can lead to issues with serialization. Instead, we store a dictionary
        # representation of the session.
        session['exam_session'] = exam_session.to_dict()
        session.modified = True

        return jsonify({'success': True, 'session': exam_session.to_dict()})

    except Exception as e:
        print(f"Error in /api/start-exam: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/estimate-distance', methods=['POST'])
def estimate_distance():
    """
    Estimate camera-to-face distance using facial landmarks.
    
    Expected JSON payload:
    {
        "landmarks": [...landmark objects...],
        "image_width": 1280,
        "focal_length_px": 600  // optional, defaults to 600
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        landmarks = data.get('landmarks')
        image_width = data.get('image_width')
        focal_length_px = data.get('focal_length_px', 600)
        
        if not landmarks or not image_width:
            return jsonify({
                'success': False,
                'error': 'Missing required fields: landmarks, image_width'
            }), 400
        
        # Initialize distance estimation service
        distance_service = DistanceEstimationService(focal_length_px)
        
        # Estimate distance
        distance_mm = distance_service.estimate_distance(landmarks, image_width)
        distance_cm = distance_service.estimate_distance_cm(landmarks, image_width)
        
        if distance_mm is None:
            return jsonify({
                'success': False,
                'error': 'Could not estimate distance (missing eye landmarks)'
            }), 400
        
        return jsonify({
            'success': True,
            'distance_mm': round(distance_mm, 2),
            'distance_cm': round(distance_cm, 2) if distance_cm else None,
            'distance_inches': round(distance_mm / 25.4, 2) if distance_mm else None
        })
        
    except Exception as e:
        print(f"Error estimating distance: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    # Temporary strings for extraction
    _('Head Alignment')
    _('Tilt')
    _('Rotation')
    _('Good alignment. Keep your head steady.')
    _('Almost aligned. Slight adjustments may help.')
    _('Please tilt your head slightly to the right.')
    _('Please tilt your head slightly to the left.')
    _('Please rotate your head slightly to the right.')
    _('Please rotate your head slightly to the left.')
    _('Tilt your head slightly to the right and rotate to the right.')
    _('Tilt your head slightly to the right and rotate to the left.')
    _('Tilt your head slightly to the left and rotate to the right.')
    _('Tilt your head slightly to the left and rotate to the left.')
    _('Adjust your head position for better alignment.')
    _('Face Distance')
    _('Status')
    _('Distance')
    _('Optimal')
    _('Too Close')
    _('Too Far')
    _('Please move farther from camera')
    _('Please move closer to camera')
    _('Distance is optimal')
    _('Unable to estimate distance')
    _('Next Action')
    _('Begin Live Video Analysis')
    _('Age')
    _('years')
    _('Patient ID')
    _('Patient Name')
    _('Exam Date')
    _('Exam Time')
    _('Overall Score')
    _('Neutral Expression')
    _('Eyebrow Raise')
    _('Eye Closure')
    _('Smile')
    _('No Image Available')
    app.run(debug=True, port=5000)

