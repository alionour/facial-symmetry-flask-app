import math

class RestingSymmetryAnalysisService:
    """
    Service for calculating resting symmetry metrics based on the Sunnybrook scale.
    """

    def analyze_resting_symmetry(self, landmarks):
        """
        Analyzes the resting symmetry of a face using facial landmarks.

        Args:
            landmarks: A list of facial landmark dictionaries.

        Returns:
            A dictionary containing the resting symmetry analysis results.
        """
        if not landmarks or len(landmarks) < 468:
            raise ValueError("Insufficient landmarks for resting symmetry analysis.")

        results = {
            'eye_fissure_width': self._calculate_eye_fissure_width(landmarks),
            'brow_position': self._calculate_brow_position(landmarks),
            'nasolabial_fold': self._calculate_nasolabial_fold(landmarks),
            'oral_commissure': self._calculate_oral_commissure_position(landmarks),
        }

        return results

    def _calculate_eye_fissure_width(self, landmarks):
        """Calculates the vertical distance between the upper and lower eyelids."""
        left_eye_top = landmarks[159]
        left_eye_bottom = landmarks[145]
        right_eye_top = landmarks[386]
        right_eye_bottom = landmarks[374]

        left_fissure = abs(left_eye_top['y'] - left_eye_bottom['y'])
        right_fissure = abs(right_eye_top['y'] - right_eye_bottom['y'])

        return {'left': left_fissure, 'right': right_fissure, 'asymmetry': abs(left_fissure - right_fissure)}

    def _calculate_brow_position(self, landmarks):
        """Calculates the vertical position of the eyebrows relative to the inner eye corners."""
        left_brow = landmarks[55]
        right_brow = landmarks[285]
        left_eye_inner = landmarks[133]
        right_eye_inner = landmarks[362]

        left_brow_pos = abs(left_brow['y'] - left_eye_inner['y'])
        right_brow_pos = abs(right_brow['y'] - right_eye_inner['y'])

        return {'left': left_brow_pos, 'right': right_brow_pos, 'asymmetry': abs(left_brow_pos - right_brow_pos)}

    def _calculate_nasolabial_fold(self, landmarks):
        """Approximates the nasolabial fold by measuring the horizontal distance from the nostril to the cheek anchor."""
        left_nostril = landmarks[131]
        right_nostril = landmarks[360]
        left_cheek = landmarks[205]
        right_cheek = landmarks[425]

        left_fold = abs(left_nostril['x'] - left_cheek['x'])
        right_fold = abs(right_nostril['x'] - right_cheek['x'])

        return {'left': left_fold, 'right': right_fold, 'asymmetry': abs(left_fold - right_fold)}

    def _calculate_oral_commissure_position(self, landmarks):
        """Calculates the vertical and horizontal position of the oral commissures relative to the nose tip."""
        nose_tip = landmarks[1]
        left_mouth_corner = landmarks[61]
        right_mouth_corner = landmarks[291]

        left_pos_y = abs(left_mouth_corner['y'] - nose_tip['y'])
        right_pos_y = abs(right_mouth_corner['y'] - nose_tip['y'])
        asymmetry_y = abs(left_pos_y - right_pos_y)

        left_pos_x = abs(left_mouth_corner['x'] - nose_tip['x'])
        right_pos_x = abs(right_mouth_corner['x'] - nose_tip['x'])
        asymmetry_x = abs(left_pos_x - right_pos_x)

        return {
            'vertical': {'left': left_pos_y, 'right': right_pos_y, 'asymmetry': asymmetry_y},
            'horizontal': {'left': left_pos_x, 'right': right_pos_x, 'asymmetry': asymmetry_x},
        }
