from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed, FileRequired
from wtforms import StringField, IntegerField, RadioField, SubmitField
from wtforms.validators import DataRequired, Length, NumberRange, Optional
from flask_babel import lazy_gettext as _l


class PatientInfoForm(FlaskForm):
    """Form for collecting patient information."""
    
    patient_id = StringField(
        _l('Patient ID'),
        validators=[
            DataRequired(message=_l('Patient ID is required')),
            Length(min=1, max=50, message=_l('Patient ID must be between 1 and 50 characters'))
        ],
        render_kw={'placeholder': _l('e.g., P001')}
    )
    
    patient_name = StringField(
        _l('Full Name'),
        validators=[
            DataRequired(message=_l('Patient name is required')),
            Length(min=2, max=100, message=_l('Name must be between 2 and 100 characters'))
        ],
        render_kw={'placeholder': _l('Enter patient name')}
    )
    
    patient_age = IntegerField(
        _l('Age'),
        validators=[
            DataRequired(message=_l('Age is required')),
            NumberRange(min=0, max=120, message=_l('Age must be between 0 and 120'))
        ],
        render_kw={'placeholder': _l('Age')}
    )
    
    assessment_mode = RadioField(
        _l('Assessment Mode'),
        choices=[
            ('live', _l('Live Video Analysis')),
            ('images', _l('Image-Based Assessment'))
        ],
        default='live',
        validators=[DataRequired(message=_l('Please select an assessment mode'))]
    )
    
    submit = SubmitField(_l('Begin Facial Assessment'))


class ImageUploadForm(FlaskForm):
    """Form for uploading facial expression images."""
    
    neutral_image = FileField(
        _l('Neutral Expression'),
        validators=[
            FileRequired(message=_l('Neutral expression image is required')),
            FileAllowed(['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'], 
                       message=_l('Only image files are allowed'))
        ]
    )
    
    eyebrow_raise_image = FileField(
        _l('Eyebrow Raise'),
        validators=[
            FileRequired(message=_l('Eyebrow raise image is required')),
            FileAllowed(['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'], 
                       message=_l('Only image files are allowed'))
        ]
    )
    
    eye_close_image = FileField(
        _l('Eye Closure'),
        validators=[
            FileRequired(message=_l('Eye closure image is required')),
            FileAllowed(['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'], 
                       message=_l('Only image files are allowed'))
        ]
    )
    
    smile_image = FileField(
        _l('Smile'),
        validators=[
            FileRequired(message=_l('Smile image is required')),
            FileAllowed(['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'], 
                       message=_l('Only image files are allowed'))
        ]
    )
    
    submit = SubmitField(_l('Analyze Images'))


class CaptureFrameForm(FlaskForm):
    """Form for capturing a single frame from live video."""
    
    action = StringField(
        'Action',
        validators=[DataRequired()]
    )
    
    frame_data = StringField(
        'Frame Data',
        validators=[DataRequired()]
    )
    
    submit = SubmitField(_l('Capture Frame'))
