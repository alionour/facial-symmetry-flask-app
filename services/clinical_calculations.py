"""
Clinical Analysis Service - Python Implementation
Converted from JavaScript ClinicalAnalysisService.js and MetricCalculationService.js

This module provides comprehensive facial analysis calculations including:
- Eyebrow elevation analysis
- Eye closure measurements
- Smile/mouth movement analysis
- Symmetry metrics calculation
"""

import math
from typing import Dict, List, Tuple, Optional, Any


class ClinicalAnalysisService:
    """
    Clinical analysis service for Bell's palsy assessment.
    Performs detailed facial asymmetry analysis using MediaPipe landmarks.
    """
    
    def __init__(self):
        # MediaPipe landmark indices for clinical analysis
        self.LANDMARK_INDICES = {
            # Eyebrow landmarks
            'LEFT_EYEBROW': [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
            'RIGHT_EYEBROW': [300, 293, 334, 296, 336, 285, 295, 282, 283, 276],
            # Eye landmarks for closure analysis
            'LEFT_EYE_VERTICAL': [159, 145, 153, 154],
            'RIGHT_EYE_VERTICAL': [386, 374, 380, 381],
            'LEFT_EYE_HORIZONTAL': [33, 133],
            'RIGHT_EYE_HORIZONTAL': [362, 263],
            # Mouth landmarks for smile analysis
            'LEFT_MOUTH_CORNER': 61,
            'RIGHT_MOUTH_CORNER': 291,
            'MOUTH_CENTER': 13,
            'UPPER_LIP_CENTER': 12,
            'LOWER_LIP_CENTER': 15,
        }
    
    def perform_facial_region_analysis(
        self, 
        movement_data: Dict[str, List[Dict]], 
        baseline_data: List[Dict],
        patient_metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Main analysis function for Bell's palsy assessment.
        """
        print(f'Starting clinical facial asymmetry analysis for patient: {patient_metadata.get("patient_id")}')
        
        eyebrow_results = self.calculate_eyebrow_elevations(
            baseline_data, 
            movement_data['eyebrow_raise']
        )
        eye_results = self.calculate_eye_closures(
            baseline_data, 
            movement_data['eye_close']
        )
        smile_results = self.analyze_smile_movement(
            movement_data['smile'], 
            baseline_data
        )
        snarl_results = self.analyze_snarl(
            movement_data['snarl'],
            baseline_data
        )
        lip_pucker_results = self.analyze_lip_pucker(
            movement_data['lip_pucker'],
            baseline_data
        )

        symmetry_metrics = self.calculate_symmetry_metrics(
            eyebrow_results, 
            eye_results, 
            smile_results,
            snarl_results,
            lip_pucker_results
        )
        
        return {
            'eyebrow_raise': eyebrow_results,
            'eye_close': eye_results,
            'smile': smile_results,
            'snarl': snarl_results,
            'lip_pucker': lip_pucker_results,
            'symmetryMetrics': symmetry_metrics
        }

    def analyze_snarl(self, snarl: List[Dict], baseline: List[Dict]) -> Dict[str, Any]:
        """Analyzes snarl movement."""
        if len(baseline) < 468 or len(snarl) < 468:
            return {}
        
        left_upper_lip_baseline = baseline[12]
        right_upper_lip_baseline = baseline[12]
        left_upper_lip_snarl = snarl[12]
        right_upper_lip_snarl = snarl[12]

        left_movement = abs(left_upper_lip_snarl['y'] - left_upper_lip_baseline['y'])
        right_movement = abs(right_upper_lip_snarl['y'] - right_upper_lip_baseline['y'])

        return {
            'left_snarl_movement': left_movement,
            'right_snarl_movement': right_movement,
        }

    def analyze_lip_pucker(self, pucker: List[Dict], baseline: List[Dict]) -> Dict[str, Any]:
        """Analyzes lip pucker movement."""
        if len(baseline) < 468 or len(pucker) < 468:
            return {}

        left_mouth_corner_baseline = baseline[61]
        right_mouth_corner_baseline = baseline[291]
        left_mouth_corner_pucker = pucker[61]
        right_mouth_corner_pucker = pucker[291]

        baseline_width = abs(left_mouth_corner_baseline['x'] - right_mouth_corner_baseline['x'])
        pucker_width = abs(left_mouth_corner_pucker['x'] - right_mouth_corner_pucker['x'])
        
        reduction = baseline_width - pucker_width
        
        return {
            'lip_pucker_reduction': reduction,
        }
    
    def analyze_smile_movement(
        self, 
        smile: List[Dict], 
        baseline: List[Dict]
    ) -> Dict[str, Any]:
        """
        Analyze smile movement for commissure asymmetry with vertical line stability analysis.
        
        Args:
            smile: List of landmarks during smile
            baseline: List of landmarks at neutral expression
        
        Returns:
            Dictionary with mouth movement measurements in millimeters
        """
        try:
            if len(baseline) < 468 or len(smile) < 468:
                raise ValueError(
                    f'Insufficient landmark data for smile analysis. '
                    f'Expected at least 468 landmarks, but received '
                    f'baseline: {len(baseline)}, smile: {len(smile)}'
                )
            
            # Define mouth corner landmarks
            left_corner_index = 61
            right_corner_index = 291
            
            baseline_left_corner = baseline[left_corner_index]
            baseline_right_corner = baseline[right_corner_index]
            smile_left_corner = smile[left_corner_index]
            smile_right_corner = smile[right_corner_index]
            
            if not all([baseline_left_corner, baseline_right_corner, 
                       smile_left_corner, smile_right_corner]):
                raise ValueError('Missing mouth corner landmarks for smile analysis')
            
            # Calculate interpupillary distance (IPD) for normalization
            ipd_normalized = math.sqrt(
                (baseline[454]['x'] - baseline[234]['x']) ** 2 +
                (baseline[454]['y'] - baseline[234]['y']) ** 2
            )
            estimated_ipd_mm = 63  # Average human IPD in mm
            
            # --- Movement calculations (baseline to smile) ---
            # Horizontal movement
            left_horizontal_movement_norm = abs(smile_left_corner['x'] - baseline_left_corner['x'])
            right_horizontal_movement_norm = abs(smile_right_corner['x'] - baseline_right_corner['x'])
            
            # Vertical movement
            left_vertical_movement_norm = abs(smile_left_corner['y'] - baseline_left_corner['y'])
            right_vertical_movement_norm = abs(smile_right_corner['y'] - baseline_right_corner['y'])
            
            # Euclidean movement
            left_movement_normalized = math.sqrt(
                (smile_left_corner['x'] - baseline_left_corner['x']) ** 2 +
                (smile_left_corner['y'] - baseline_left_corner['y']) ** 2
            )
            right_movement_normalized = math.sqrt(
                (smile_right_corner['x'] - baseline_right_corner['x']) ** 2 +
                (smile_right_corner['y'] - baseline_right_corner['y']) ** 2
            )
            
            # Normalize to mm
            left_horizontal_mm = (left_horizontal_movement_norm / ipd_normalized) * estimated_ipd_mm
            right_horizontal_mm = (right_horizontal_movement_norm / ipd_normalized) * estimated_ipd_mm
            left_vertical_mm = (left_vertical_movement_norm / ipd_normalized) * estimated_ipd_mm
            right_vertical_mm = (right_vertical_movement_norm / ipd_normalized) * estimated_ipd_mm
            left_movement_mm = (left_movement_normalized / ipd_normalized) * estimated_ipd_mm
            right_movement_mm = (right_movement_normalized / ipd_normalized) * estimated_ipd_mm
            
            # Debug logging
            print('🔍 MOUTH MOVEMENT CALCULATION DEBUG:')
            print(f'  Baseline Left Corner: ({baseline_left_corner["x"]:.4f}, {baseline_left_corner["y"]:.4f})')
            print(f'  Smile Left Corner: ({smile_left_corner["x"]:.4f}, {smile_left_corner["y"]:.4f})')
            print(f'  Left Movement (mm): {left_movement_mm:.2f}')
            print(f'  Right Movement (mm): {right_movement_mm:.2f}')
            
            # --- Smile-only distances to reference lines ---
            left_eye_inner = smile[133]
            right_eye_inner = smile[362]
            chin_tip = smile[152]
            
            # Calculate midpoint between inner eye corners
            inner_eye_midpoint = {
                'x': (left_eye_inner['x'] + right_eye_inner['x']) / 2,
                'y': (left_eye_inner['y'] + right_eye_inner['y']) / 2
            }
            
            # Perpendicular distance from mouth corners to vertical reference line
            horizontal_left_to_line = self._point_to_line_distance(
                smile_left_corner, inner_eye_midpoint, chin_tip
            )
            horizontal_right_to_line = self._point_to_line_distance(
                smile_right_corner, inner_eye_midpoint, chin_tip
            )
            horizontal_left_to_line_mm = (horizontal_left_to_line / ipd_normalized) * estimated_ipd_mm
            horizontal_right_to_line_mm = (horizontal_right_to_line / ipd_normalized) * estimated_ipd_mm
            
            # Vertical: distance to horizontal reference line at chin tip (tilted by inner eye angle)
            delta_y = right_eye_inner['y'] - left_eye_inner['y']
            delta_x = right_eye_inner['x'] - left_eye_inner['x']
            eye_angle = math.atan2(delta_y, delta_x)
            
            half_length = 1  # arbitrary, just to get direction
            line_a = {
                'x': chin_tip['x'] - half_length * math.cos(eye_angle),
                'y': chin_tip['y'] - half_length * math.sin(eye_angle)
            }
            line_b = {
                'x': chin_tip['x'] + half_length * math.cos(eye_angle),
                'y': chin_tip['y'] + half_length * math.sin(eye_angle)
            }
            
            v_left = self._point_to_line_distance(smile_left_corner, line_a, line_b)
            v_right = self._point_to_line_distance(smile_right_corner, line_a, line_b)
            smile_vertical_left_mm = (v_left / ipd_normalized) * estimated_ipd_mm
            smile_vertical_right_mm = (v_right / ipd_normalized) * estimated_ipd_mm
            
            return {
                'left_mouth_horizontal_displacement': left_horizontal_mm,
                'right_mouth_horizontal_displacement': right_horizontal_mm,
                'left_mouth_vertical_displacement': left_vertical_mm,
                'right_mouth_vertical_displacement': right_vertical_mm,
                'left_mouth_movement': left_movement_mm,
                'right_mouth_movement': right_movement_mm,
                'horizontalDistances': {
                    'left': horizontal_left_to_line_mm,
                    'right': horizontal_right_to_line_mm
                },
                'verticalDistances': {
                    'left': smile_vertical_left_mm,
                    'right': smile_vertical_right_mm
                }
            }
        
        except Exception as error:
            raise Exception(f'Error during smile movement analysis: {str(error)}')
    
    def calculate_eyebrow_elevations(
        self, 
        baseline: List[Dict], 
        eyebrow_raise: List[Dict]
    ) -> Dict[str, float]:
        """
        Calculate eyebrow elevations from landmark data in degrees.
        
        Args:
            baseline: Neutral expression landmarks
            eyebrow_raise: Raised eyebrow landmarks
        
        Returns:
            Dictionary with left and right eyebrow displacement in degrees
        """
        try:
            if len(baseline) < 468 or len(eyebrow_raise) < 468:
                raise ValueError(
                    f'Insufficient landmark data for eyebrow elevation analysis. '
                    f'Expected at least 468 landmarks, but received '
                    f'baseline: {len(baseline)}, eyebrowRaise: {len(eyebrow_raise)}'
                )
            
            # Define eyebrow landmark indices
            left_eyebrow_landmarks = [70, 63, 105, 66, 107]
            right_eyebrow_landmarks = [300, 293, 334, 296, 336]
            
            # Extract landmark points
            baseline_left_eyebrow = [baseline[i] for i in left_eyebrow_landmarks]
            baseline_right_eyebrow = [baseline[i] for i in right_eyebrow_landmarks]
            raised_left_eyebrow = [eyebrow_raise[i] for i in left_eyebrow_landmarks]
            raised_right_eyebrow = [eyebrow_raise[i] for i in right_eyebrow_landmarks]
            
            # Validate all landmarks are available
            if any(not p for p in baseline_left_eyebrow + baseline_right_eyebrow + 
                   raised_left_eyebrow + raised_right_eyebrow):
                raise ValueError('Missing eyebrow landmark data for elevation analysis')
            
            # Calculate eyebrow elevation angles in degrees
            left_angles = []
            eye_center_left = baseline[133]  # Left eye center
            
            for i, baseline_point in enumerate(baseline_left_eyebrow):
                raised_point = raised_left_eyebrow[i]
                vertical_displacement = abs(baseline_point['y'] - raised_point['y'])
                horizontal_distance = abs(baseline_point['x'] - eye_center_left['x'])
                angle_radians = math.atan(vertical_displacement / max(horizontal_distance, 0.01))
                angle_degrees = angle_radians * (180 / math.pi)
                left_angles.append(angle_degrees)
            
            right_angles = []
            eye_center_right = baseline[362]  # Right eye center
            
            for i, baseline_point in enumerate(baseline_right_eyebrow):
                raised_point = raised_right_eyebrow[i]
                vertical_displacement = abs(baseline_point['y'] - raised_point['y'])
                horizontal_distance = abs(baseline_point['x'] - eye_center_right['x'])
                angle_radians = math.atan(vertical_displacement / max(horizontal_distance, 0.01))
                angle_degrees = angle_radians * (180 / math.pi)
                right_angles.append(angle_degrees)
            
            left_mean_elevation = sum(left_angles) / len(left_angles)
            right_mean_elevation = sum(right_angles) / len(right_angles)
            
            return {
                'left_eyebrow_displacement': left_mean_elevation,
                'right_eyebrow_displacement': right_mean_elevation,
            }
        
        except Exception as error:
            raise Exception(f'Error during eyebrow elevation analysis: {str(error)}')
    
    def calculate_eye_closures(
        self, 
        baseline: List[Dict], 
        eye_close: List[Dict]
    ) -> Dict[str, float]:
        """
        Calculate eye closures from landmark data.
        
        Args:
            baseline: Neutral expression landmarks
            eye_close: Closed eyes landmarks
        
        Returns:
            Dictionary with left and right eye closure percentages
        """
        try:
            if len(baseline) < 468 or len(eye_close) < 468:
                raise ValueError(
                    f'Insufficient landmark data for eye closure analysis. '
                    f'Expected at least 468 landmarks, but received '
                    f'baseline: {len(baseline)}, eyeClose: {len(eye_close)}'
                )
            
            # Define eye landmark pairs for vertical measurements
            left_eye_pairs = [[159, 145]]  # Top-bottom pairs for left eye
            right_eye_pairs = [[386, 374]]  # Top-bottom pairs for right eye
            
            # Calculate baseline eye opening distances
            baseline_left_distances = []
            for top, bottom in left_eye_pairs:
                if baseline[top] and baseline[bottom]:
                    baseline_left_distances.append(abs(baseline[top]['y'] - baseline[bottom]['y']))
                else:
                    baseline_left_distances.append(0)
            
            baseline_right_distances = []
            for top, bottom in right_eye_pairs:
                if baseline[top] and baseline[bottom]:
                    baseline_right_distances.append(abs(baseline[top]['y'] - baseline[bottom]['y']))
                else:
                    baseline_right_distances.append(0)
            
            # Calculate closure eye distances
            closure_left_distances = []
            for top, bottom in left_eye_pairs:
                if eye_close[top] and eye_close[bottom]:
                    closure_left_distances.append(abs(eye_close[top]['y'] - eye_close[bottom]['y']))
                else:
                    closure_left_distances.append(0)
            
            closure_right_distances = []
            for top, bottom in right_eye_pairs:
                if eye_close[top] and eye_close[bottom]:
                    closure_right_distances.append(abs(eye_close[top]['y'] - eye_close[bottom]['y']))
                else:
                    closure_right_distances.append(0)
            
            # Calculate average distances
            avg_baseline_left = sum(baseline_left_distances) / len(baseline_left_distances)
            avg_baseline_right = sum(baseline_right_distances) / len(baseline_right_distances)
            avg_closure_left = sum(closure_left_distances) / len(closure_left_distances)
            avg_closure_right = sum(closure_right_distances) / len(closure_right_distances)
            
            # Calculate closure percentages
            left_closure_percentage = ((avg_baseline_left - avg_closure_left) / avg_baseline_left) * 100
            right_closure_percentage = ((avg_baseline_right - avg_closure_right) / avg_baseline_right) * 100
            
            return {
                'left_eye_closure': left_closure_percentage,
                'right_eye_closure': right_closure_percentage,
            }
        
        except Exception as error:
            raise Exception(f'Error during eye closure analysis: {str(error)}')
    
    def calculate_symmetry_metrics(
        self, 
        eyebrow_results: Dict, 
        eye_results: Dict, 
        smile_results: Dict,
        snarl_results: Dict,
        lip_pucker_results: Dict
    ) -> Dict[str, float]:
        """
        Calculate symmetry metrics for the facial analysis results.
        """
        eyebrow_raise_overall_score = 100 - abs(
            eyebrow_results['left_eyebrow_displacement'] - 
            eyebrow_results['right_eyebrow_displacement']
        )
        eye_closure_overall_score = 100 - abs(
            eye_results['left_eye_closure'] - 
            eye_results['right_eye_closure']
        )
        smile_overall_score = 100 - abs(
            smile_results['left_mouth_horizontal_displacement'] - 
            smile_results['right_mouth_horizontal_displacement']
        )
        snarl_overall_score = 100 - abs(
            snarl_results['left_snarl_movement'] - 
            snarl_results['right_snarl_movement']
        )
        # Lip pucker is a measure of reduction, so a higher score is better.
        # This is a simplified scoring for now.
        lip_pucker_overall_score = lip_pucker_results['lip_pucker_reduction'] * 100

        return {
            # ... (existing metrics)
            'snarlAsymmetry': abs(
                snarl_results['left_snarl_movement'] -
                snarl_results['right_snarl_movement']
            ),
            'snarlSymmetry': snarl_overall_score,
            'lipPuckerScore': lip_pucker_overall_score,
            'overallScore': round(
                (eyebrow_raise_overall_score + eye_closure_overall_score + smile_overall_score + snarl_overall_score + lip_pucker_overall_score) / 5
            )
        }
    
    @staticmethod
    def _point_to_line_distance(
        pt: Dict[str, float], 
        line_a: Dict[str, float], 
        line_b: Dict[str, float]
    ) -> float:
        """
        Calculate perpendicular distance from point to line.
        
        Args:
            pt: Point with 'x' and 'y' coordinates
            line_a: First point on line
            line_b: Second point on line
        
        Returns:
            Perpendicular distance from point to line
        """
        numerator = abs(
            (line_b['y'] - line_a['y']) * pt['x'] - 
            (line_b['x'] - line_a['x']) * pt['y'] + 
            line_b['x'] * line_a['y'] - 
            line_b['y'] * line_a['x']
        )
        denominator = math.sqrt(
            (line_b['y'] - line_a['y']) ** 2 + 
            (line_b['x'] - line_a['x']) ** 2
        )
        return numerator / denominator if denominator > 0 else 0


class MetricCalculationService:
    """
    Service for calculating facial metrics and converting to clinical scores.
    """
    
    def calculate_metrics(self, landmarks: List[Dict]) -> Dict[str, float]:
        """
        Calculate facial asymmetry metrics from landmarks.
        
        Args:
            landmarks: List of facial landmark dictionaries
        
        Returns:
            Dictionary of smoothed metrics
        """
        coords = self.extract_coordinates(landmarks)
        face_width = self.calculate_face_width(coords)
        normalized_face_width = max(face_width, 0.1)
        
        metrics = {
            'forehead': abs(coords['forehead_left']['y'] - coords['forehead_right']['y']) / normalized_face_width,
            'eye_gap': abs(
                (coords['eyebrow_left_outer']['y'] - coords['eye_left_outer']['y']) -
                (coords['eyebrow_right_outer']['y'] - coords['eye_right_outer']['y'])
            ) / normalized_face_width,
            'smile': abs(coords['mouth_left']['y'] - coords['mouth_right']['y']) / normalized_face_width,
            'lip': abs(coords['lip_upper_left']['y'] - coords['lip_upper_right']['y']) / normalized_face_width,
            'nose': abs(coords['nose_left']['y'] - coords['nose_right']['y']) / normalized_face_width,
            'snarl': abs(coords['lip_upper_left']['y'] - coords['nose_left']['y']) - abs(coords['lip_upper_right']['y'] - coords['nose_right']['y']),
            'lip_pucker': abs(coords['mouth_left']['x'] - coords['mouth_right']['x']),
        }
        
        # Apply smoothing to reduce noise
        smoothed_metrics = {
            'forehead': min(metrics['forehead'], 0.3),
            'eye_gap': min(metrics['eye_gap'], 0.3),
            'smile': min(metrics['smile'], 0.3),
            'lip': min(metrics['lip'], 0.3),
            'nose': min(metrics['nose'], 0.3),
            'snarl': min(metrics['snarl'], 0.3),
            'lip_pucker': min(metrics['lip_pucker'], 0.3),
        }
        
        return smoothed_metrics
    
    def convert_to_score(self, value: float) -> Dict[str, Any]:
        """
        Convert metric value to clinical score and label.
        
        Args:
            value: Metric value to convert
        
        Returns:
            Dictionary with score (0-4) and label
        """
        if value <= 0.02:
            return {'score': 0, 'label': 'Normal'}
        elif value <= 0.05:
            return {'score': 1, 'label': 'Mild'}
        elif value <= 0.08:
            return {'score': 2, 'label': 'Moderate'}
        elif value <= 0.12:
            return {'score': 3, 'label': 'Moderately Severe'}
        else:
            return {'score': 4, 'label': 'Severe'}
    
    def extract_coordinates(self, landmarks: List[Dict]) -> Dict[str, Dict[str, float]]:
        """
        Extract specific landmark coordinates for metric calculation.
        
        Args:
            landmarks: List of all facial landmarks
        
        Returns:
            Dictionary of named landmark coordinates
        """
        idx = {
            'forehead_left': 21,
            'forehead_right': 251,
            'eye_left_inner': 133,
            'eye_left_outer': 33,
            'eye_right_inner': 362,
            'eye_right_outer': 263,
            'eyebrow_left_inner': 70,
            'eyebrow_left_outer': 46,
            'eyebrow_right_inner': 300,
            'eyebrow_right_outer': 276,
            'mouth_left': 61,
            'mouth_right': 291,
            'lip_upper_left': 84,
            'lip_upper_right': 314,
            'nose_left': 131,
            'nose_right': 360,
            'face_left': 172,
            'face_right': 397
        }
        
        coords = {}
        for key, index in idx.items():
            coords[key] = {'x': landmarks[index]['x'], 'y': landmarks[index]['y']}
        
        return coords
    
    def calculate_face_width(self, coords: Dict[str, Dict[str, float]]) -> float:
        """
        Calculate face width from coordinates.
        
        Args:
            coords: Dictionary of landmark coordinates
        
        Returns:
            Face width value
        """
        return abs(coords['face_left']['x'] - coords['face_right']['x'])
