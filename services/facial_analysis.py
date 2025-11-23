import cv2
import mediapipe as mp
import numpy as np
import base64

# Initialize MediaPipe FaceMesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=True,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5
)

def analyze_face(image_data_url):
    """
    Analyzes a single image for facial landmarks.

    Args:
        image_data_url: A base64 encoded data URL of the image.

    Returns:
        A list of facial landmarks or None if no face is detected.
    """
    try:
        # Split the data URL to get the base64 part
        header, encoded = image_data_url.split(",", 1)

        # Decode the base64 string
        decoded_image = base64.b64decode(encoded)

        # Convert the binary data to a NumPy array
        image_array = np.frombuffer(decoded_image, dtype=np.uint8)

        # Decode the NumPy array into an OpenCV image
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

        if image is None:
            raise ValueError("Failed to decode image")

        # Convert the BGR image to RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Process the image with MediaPipe FaceMesh
        results = face_mesh.process(rgb_image)

        # Check if any face landmarks were detected
        if results.multi_face_landmarks:
            # For now, we'll just return the first face's landmarks
            face_landmarks = results.multi_face_landmarks[0]

            # Convert landmarks to a list of dictionaries
            landmarks_list = []
            for i, landmark in enumerate(face_landmarks.landmark):
                landmarks_list.append({
                    'index': i,
                    'x': landmark.x,
                    'y': landmark.y,
                    'z': landmark.z,
                    'visibility': landmark.visibility if hasattr(landmark, 'visibility') else None,
                    'presence': landmark.presence if hasattr(landmark, 'presence') else None,
                })
            return landmarks_list
        else:
            return None

    except Exception as e:
        print(f"Error in facial analysis: {e}")
        return None
