from flask import Flask, render_template, request, jsonify, send_file, session, redirect, url_for
from flask_babel import Babel, _
from services.facial_analysis import analyze_face
from services.pdf_generator import generate_pdf
from io import BytesIO

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
def export_pdf():
    """
    API endpoint to generate and export a PDF report.
    Expects a JSON payload with the analysis data.
    """
    analysis_data = request.get_json()
    if not analysis_data:
        return jsonify({'error': 'Missing analysis data'}), 400

    try:
        pdf_data = generate_pdf(analysis_data)
        return send_file(
            BytesIO(pdf_data),
            mimetype='application/pdf',
            as_attachment=True,
            download_name='facial_symmetry_report.pdf'
        )
    except Exception as e:
        print(f"Error generating PDF: {e}")
        return jsonify({'error': 'Failed to generate PDF report'}), 500

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
