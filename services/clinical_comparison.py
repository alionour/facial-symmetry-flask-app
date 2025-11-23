"""
Clinical Comparison Service - Python Implementation
Converted from JavaScript ClinicalComparisonService.js

Provides detailed asymmetry analysis by comparing left and right facial movements.
Used for Bell's palsy and facial paralysis assessment.
"""

from typing import Dict, List, Any, Optional
from services.clinical_calculations import ClinicalAnalysisService


class ClinicalComparisonService:
    """
    Service for comparing left vs right facial movements.
    Provides clinical assessment of facial asymmetry.
    """
    
    def __init__(self):
        self.clinical_service = ClinicalAnalysisService()
    
    def compare_sides_clinical_report(
        self,
        action_name: str,
        current_landmarks: List[Dict],
        baseline_landmarks: List[Dict]
    ) -> Dict[str, Any]:
        """
        Compare left and right facial movements for specific action.
        
        Args:
            action_name: Action type ('eyebrow_raise', 'eye_close', 'smile')
            current_landmarks: Landmarks during the action
            baseline_landmarks: Neutral expression landmarks
        
        Returns:
            Dictionary with action, left_movement, right_movement, asymmetry
        
        Raises:
            ValueError: If landmarks are invalid or action is unsupported
        """
        print(f'Performing clinical comparison for action: {action_name}')
        
        # Validate inputs - support both MediaPipe v1 (468) and v2 (478) landmarks
        expected_landmark_counts = [468, 478]
        
        if (not current_landmarks or not baseline_landmarks or
            len(current_landmarks) not in expected_landmark_counts or
            len(baseline_landmarks) not in expected_landmark_counts):
            raise ValueError(
                f'Invalid landmark data: Expected {expected_landmark_counts} landmarks '
                f'for current and baseline'
            )
        
        # Prepare movement data based on action
        movement_data = self._prepare_movement_data(action_name, current_landmarks)
        
        # Perform analysis
        patient_metadata = {
            'patient_id': 'N/A',
            'examination_date': None
        }
        
        analysis_result = self.clinical_service.perform_facial_region_analysis(
            movement_data,
            baseline_landmarks,
            patient_metadata
        )
        
        # Extract region-specific analysis based on action
        result = self._extract_action_result(action_name, analysis_result)
        
        return result
    
    def _prepare_movement_data(
        self,
        action_name: str,
        current_landmarks: List[Dict]
    ) -> Dict[str, List[Dict]]:
        """
        Prepare movement data dictionary for analysis.
        
        Args:
            action_name: Action type
            current_landmarks: Current landmarks
        
        Returns:
            Dictionary with movement data for all actions
        """
        # Initialize empty movement data
        movement_data = {
            'eyebrow_raise': [],
            'eye_close': [],
            'smile': []
        }
        
        # Set the appropriate action's landmarks
        action_key = action_name.lower().replace(' ', '_')
        if action_key in movement_data:
            movement_data[action_key] = current_landmarks
        
        return movement_data
    
    def _extract_action_result(
        self,
        action_name: str,
        analysis_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Extract comparison result for specific action.
        
        Args:
            action_name: Action type
            analysis_result: Full analysis results
        
        Returns:
            Dictionary with left_movement, right_movement, asymmetry
        
        Raises:
            ValueError: If action is unsupported or results are missing
        """
        action_lower = action_name.lower().replace(' ', '_')
        
        if action_lower == 'eyebrow_raise':
            eyebrow_analysis = analysis_result.get('eyebrow_raise')
            if not eyebrow_analysis:
                raise ValueError(f'No eyebrow analysis result found for action: {action_name}')
            
            left = eyebrow_analysis['left_eyebrow_displacement']
            right = eyebrow_analysis['right_eyebrow_displacement']
            
            return {
                'action': action_name,
                'left_movement': left,
                'right_movement': right,
                'asymmetry': abs(left - right),
                'asymmetry_percentage': (abs(left - right) / max(left, right, 0.01)) * 100
            }
        
        elif action_lower == 'eye_close' or action_lower == 'eye_closure':
            eye_analysis = analysis_result.get('eye_close')
            if not eye_analysis:
                raise ValueError(f'No eye analysis result found for action: {action_name}')
            
            left = eye_analysis['left_eye_closure']
            right = eye_analysis['right_eye_closure']
            
            return {
                'action': action_name,
                'left_movement': left,
                'right_movement': right,
                'asymmetry': abs(left - right),
                'asymmetry_percentage': (abs(left - right) / max(left, right, 0.01)) * 100
            }
        
        elif action_lower == 'smile':
            smile_analysis = analysis_result.get('smile')
            if not smile_analysis:
                raise ValueError(f'No smile analysis result found for action: {action_name}')
            
            # Combine horizontal and vertical displacement for total movement
            left = (smile_analysis['left_mouth_horizontal_displacement'] +
                   smile_analysis['left_mouth_vertical_displacement'])
            right = (smile_analysis['right_mouth_horizontal_displacement'] +
                    smile_analysis['right_mouth_vertical_displacement'])
            
            return {
                'action': action_name,
                'left_movement': left,
                'right_movement': right,
                'asymmetry': abs(left - right),
                'asymmetry_percentage': (abs(left - right) / max(left, right, 0.01)) * 100,
                'horizontal_asymmetry': abs(
                    smile_analysis['left_mouth_horizontal_displacement'] -
                    smile_analysis['right_mouth_horizontal_displacement']
                ),
                'vertical_asymmetry': abs(
                    smile_analysis['left_mouth_vertical_displacement'] -
                    smile_analysis['right_mouth_vertical_displacement']
                )
            }
        
        else:
            raise ValueError(f'Unsupported action: {action_name}')
    
    def generate_detailed_comparison_report(
        self,
        patient_id: str,
        landmark_data: Dict[str, List[Dict]]
    ) -> Dict[str, Any]:
        """
        Generate comprehensive clinical comparison report for all facial actions.
        
        Args:
            patient_id: Patient identifier
            landmark_data: Dictionary with 'baseline', 'eyebrow_raise', 'eye_close', 'smile'
        
        Returns:
            Comprehensive report with comparisons for all actions
        """
        print(f'Generating detailed comparison report for patient: {patient_id}')
        
        # Validate landmark data
        required_keys = ['baseline', 'eyebrow_raise', 'eye_close', 'smile']
        for key in required_keys:
            if key not in landmark_data:
                raise ValueError(f'Missing required landmark data: {key}')
        
        # Perform comparison for each action
        try:
            eyebrow_result = self.compare_sides_clinical_report(
                'eyebrow_raise',
                landmark_data['eyebrow_raise'],
                landmark_data['baseline']
            )
            
            eye_result = self.compare_sides_clinical_report(
                'eye_close',
                landmark_data['eye_close'],
                landmark_data['baseline']
            )
            
            smile_result = self.compare_sides_clinical_report(
                'smile',
                landmark_data['smile'],
                landmark_data['baseline']
            )
            
            # Calculate overall asymmetry score
            overall_asymmetry = (
                eyebrow_result['asymmetry_percentage'] +
                eye_result['asymmetry_percentage'] +
                smile_result['asymmetry_percentage']
            ) / 3
            
            report = {
                'patient_id': patient_id,
                'examination_date': None,  # Will be set by caller
                'actions': {
                    'eyebrow_raise': eyebrow_result,
                    'eye_close': eye_result,
                    'smile': smile_result,
                },
                'overall_asymmetry_percentage': overall_asymmetry,
                'clinical_interpretation': self._get_clinical_interpretation(overall_asymmetry)
            }
            
            print('Detailed comparison report generated:', report)
            return report
            
        except Exception as e:
            raise Exception(f'Error generating comparison report: {str(e)}')
    
    def _get_clinical_interpretation(self, asymmetry_percentage: float) -> str:
        """
        Get clinical interpretation based on asymmetry percentage.
        
        Args:
            asymmetry_percentage: Overall asymmetry percentage
        
        Returns:
            Clinical interpretation string
        """
        if asymmetry_percentage < 5:
            return 'Normal - Minimal asymmetry detected'
        elif asymmetry_percentage < 10:
            return 'Mild asymmetry - May warrant monitoring'
        elif asymmetry_percentage < 20:
            return 'Moderate asymmetry - Clinical evaluation recommended'
        elif asymmetry_percentage < 30:
            return 'Moderately severe asymmetry - Medical attention advised'
        else:
            return 'Severe asymmetry - Immediate medical evaluation recommended'


class DistanceEstimationService:
    """
    Service for estimating camera-to-face distance using facial landmarks.
    Uses interpupillary distance (IPD) for calibration.
    """
    
    # Average interpupillary distance in millimeters
    AVERAGE_IPD_MM = 63
    
    def __init__(self, focal_length_px: float = 600):
        """
        Initialize distance estimation service.
        
        Args:
            focal_length_px: Camera focal length in pixels (default: 600)
        """
        self.focal_length_px = focal_length_px
    
    def estimate_distance(
        self,
        landmarks: List[Dict],
        image_width: int
    ) -> Optional[float]:
        """
        Estimate distance from camera to face in millimeters.
        
        Args:
            landmarks: Array of facial landmarks with normalized coordinates
            image_width: Width of the image or video frame in pixels
        
        Returns:
            Estimated distance in millimeters, or None if cannot compute
        """
        if not landmarks or len(landmarks) == 0:
            return None
        
        # Get left and right eye center landmarks (using MediaPipe indices)
        left_eye = landmarks[33] if len(landmarks) > 33 else None  # Left eye outer corner
        right_eye = landmarks[263] if len(landmarks) > 263 else None  # Right eye outer corner
        
        if not left_eye or not right_eye:
            return None
        
        # Calculate pixel distance between eyes
        left_eye_px = left_eye['x'] * image_width
        right_eye_px = right_eye['x'] * image_width
        eye_distance_px = abs(right_eye_px - left_eye_px)
        
        if eye_distance_px == 0:
            return None
        
        # Distance estimation formula:
        # distance = (focalLength * realWidth) / perceivedWidth
        # where realWidth is average IPD in mm, perceivedWidth is eyeDistancePx
        distance_mm = (self.focal_length_px * self.AVERAGE_IPD_MM) / eye_distance_px
        
        return distance_mm
    
    def estimate_distance_cm(
        self,
        landmarks: List[Dict],
        image_width: int
    ) -> Optional[float]:
        """
        Estimate distance in centimeters (convenience method).
        
        Args:
            landmarks: Array of facial landmarks
            image_width: Image width in pixels
        
        Returns:
            Estimated distance in centimeters, or None if cannot compute
        """
        distance_mm = self.estimate_distance(landmarks, image_width)
        return distance_mm / 10 if distance_mm is not None else None
