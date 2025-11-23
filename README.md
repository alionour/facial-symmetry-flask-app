# Facial Symmetry Analysis Tool

A web-based facial symmetry analysis application using Flask, MediaPipe, and computer vision to assess facial palsy and asymmetry.

## Features

- **Automated Facial Landmark Detection**: Uses MediaPipe FaceMesh (468 landmarks)
- **Real-time Video Analysis**: Live facial movement assessment
- **Image-based Assessment**: Analyze static images
- **Multi-language Support**: English and Arabic
- **Clinical Measurements**:
  - Eyebrow raise analysis
  - Eye closure assessment
  - Smile symmetry evaluation
  - Asymmetry calculations
- **PDF Report Generation**: Export detailed analysis reports
- **Head Alignment Guidance**: Real-time feedback for optimal positioning

## Installation

### Prerequisites

- Python 3.8 or higher
- pip

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd flask_app
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### Running the Application

```bash
python app.py
```

The application will be available at `http://localhost:5000`

### Available Routes

- `/` - Home page
- `/live-video-analysis` - Real-time video analysis
- `/image-assessment` - Static image analysis
- `/results` - View analysis results
- `/api/analyze` - API endpoint for facial analysis
- `/api/export` - Export PDF reports
- `/api/translations` - Get UI translations

## API Endpoints

### Analyze Face

**POST** `/analyze`

Analyzes a facial image and returns landmark coordinates.

**Request:**
```json
{
  "image": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "landmarks": [
    {
      "index": 0,
      "x": 0.5,
      "y": 0.5,
      "z": 0.0,
      "visibility": 1.0,
      "presence": 1.0
    },
    ...
  ]
}
```

### Export PDF

**POST** `/export`

Generates a PDF report from analysis data.

**Request:**
```json
{
  "patientData": {
    "id": "P001",
    "name": "John Doe",
    "age": 45
  },
  "analysisResult": {
    ...
  }
}
```

**Response:** PDF file download

## Project Structure

```
flask_app/
├── app.py                  # Main Flask application
├── requirements.txt        # Python dependencies
├── services/
│   ├── facial_analysis.py  # MediaPipe facial analysis
│   └── pdf_generator.py    # PDF report generation
├── static/
│   ├── css/               # Stylesheets
│   └── js/                # JavaScript files
├── templates/
│   ├── index.html         # Main SPA template
│   └── pages/             # Page partials
└── translations/          # i18n translation files
```

## Technologies Used

- **Backend**: Flask (Python)
- **Facial Analysis**: MediaPipe FaceMesh
- **Computer Vision**: OpenCV
- **PDF Generation**: FPDF2
- **Internationalization**: Flask-Babel

## Development

### Running in Debug Mode

The application runs in debug mode by default when using `python app.py`. For production, set `debug=False` in the `app.run()` call.

### Adding Translations

1. Extract translatable strings:
```bash
pybabel extract -F babel.cfg -o messages.pot .
```

2. Update translation files:
```bash
pybabel update -i messages.pot -d translations
```

3. Compile translations:
```bash
pybabel compile -d translations
```

## Validation Study

This tool is designed to be validated against the Sunnybrook Facial Grading System. See the validation documentation for details on:
- Study protocol
- Data collection procedures
- Statistical analysis methods

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]

## Contact

[Add contact information here]

## Acknowledgments

- MediaPipe by Google
- Flask framework
- OpenCV community
