from services.pdf_generator import generate_pdf
import os

dummy_data = {
    "patientData": {
        "id": "TEST001",
        "name": "John Doe",
        "age": 45
    },
    "analysisResult": {
        "eyebrow_raise": {"metric1": 10.5},
        "sunnybrookScore": {
            "compositeScore": 54,
            "affectedSide": "Left",
            "restingScore": {"value": 5},
            "voluntaryScore": {"value": 60},
            "synkinesisScore": {"value": 1},
            "details": {
                "resting": {"eye": 1, "cheek": 0, "mouth": 0},
                "voluntary": {"eyebrowRaise": 3, "eyeClosure": 3, "smile": 3, "snarl": 3, "lipPucker": 3},
                "synkinesis": {"eyebrowRaise": 0, "eyeClosure": 0, "smile": 1, "snarl": 0, "lipPucker": 0}
            }
        }
    }
}

try:
    pdf_bytes = generate_pdf(dummy_data)
    with open("test_report.pdf", "wb") as f:
        f.write(pdf_bytes)
    print("PDF generated successfully: test_report.pdf")
except Exception as e:
    print(f"PDF generation failed: {e}")
