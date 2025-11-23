export class ApiClient {
    static async analyze(imageDataUrl) {
        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image: imageDataUrl }),
            });
            if (!response.ok) {
                console.error('API request failed:', response.status, response.statusText);
                return null;
            }
            const data = await response.json();
            // The backend returns a list of landmarks, we need to wrap it in a structure
            // that matches the FaceMeshResults type.
            return {
                multiFaceLandmarks: [data.landmarks]
            };
        }
        catch (error) {
            console.error('Error calling analyze API:', error);
            return null;
        }
    }
}
