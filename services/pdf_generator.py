from fpdf import FPDF
import csv
from io import StringIO

class PDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 12)
        self.cell(0, 10, 'Facial Symmetry Analysis Report', 0, 1, 'C')

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

def generate_pdf(analysis_data):
    """
    Generates a PDF report from analysis data.

    Args:
        analysis_data: A dictionary containing patient and analysis results.

    Returns:
        The raw PDF data as bytes.
    """
    pdf = PDF()
    pdf.add_page()
    pdf.set_font('Arial', '', 12)

    # Patient Information
    pdf.set_font('Arial', 'B', 14)
    pdf.cell(0, 10, 'Patient Information', 0, 1)
    pdf.set_font('Arial', '', 12)

    patient_info = analysis_data.get('patientData', {})
    pdf.cell(0, 10, f"Patient ID: {patient_info.get('id', 'N/A')}", 0, 1)
    pdf.cell(0, 10, f"Name: {patient_info.get('name', 'N/A')}", 0, 1)
    pdf.cell(0, 10, f"Age: {patient_info.get('age', 'N/A')}", 0, 1)
    pdf.ln(10)

    # Analysis Results
    pdf.set_font('Arial', 'B', 14)
    pdf.cell(0, 10, 'Symmetry Analysis Results', 0, 1)
    pdf.set_font('Arial', '', 12)

    results = analysis_data.get('analysisResult', {})
    
    # Extract Sunnybrook data if present
    sunnybrook = results.pop('sunnybrookScore', None)

    # 1. Standard Symmetry Analysis
    for action, metrics in results.items():
        if action == 'symmetryMetrics': continue # Skip raw symmetry metrics if they are just numbers
        
        pdf.set_font('Arial', 'B', 12)
        pdf.cell(0, 10, action.replace('_', ' ').title(), 0, 1)
        pdf.set_font('Arial', '', 12)
        
        if isinstance(metrics, dict):
            for metric, value in metrics.items():
                if isinstance(value, dict):
                    for sub_metric, sub_value in value.items():
                        if isinstance(sub_value, (int, float)):
                            pdf.cell(0, 10, f"  {sub_metric.replace('_', ' ').title()}: {sub_value:.2f}", 0, 1)
                elif isinstance(value, (int, float)):
                    pdf.cell(0, 10, f"  {metric.replace('_', ' ').title()}: {value:.2f}", 0, 1)
        pdf.ln(5)

    # 2. Sunnybrook Facial Grading System
    if sunnybrook:
        pdf.add_page()
        pdf.set_font('Arial', 'B', 14)
        pdf.cell(0, 10, 'Sunnybrook Facial Grading System', 0, 1)
        pdf.ln(5)

        # Composite Score
        composite = sunnybrook.get('compositeScore', 0)
        affected_side = sunnybrook.get('affectedSide', 'Unknown')
        
        pdf.set_font('Arial', 'B', 12)
        pdf.cell(0, 10, f"Composite Score: {composite:.0f} / 100", 0, 1)
        pdf.set_font('Arial', '', 12)
        pdf.cell(0, 10, f"Affected Side: {affected_side}", 0, 1)
        pdf.ln(5)

        details = sunnybrook.get('details', {})

        # Resting Symmetry
        resting = sunnybrook.get('restingScore', {})
        pdf.set_font('Arial', 'B', 12)
        pdf.cell(0, 10, f"Resting Symmetry (Score: {resting.get('value', 0)}/20)", 0, 1)
        pdf.set_font('Arial', '', 11)
        if 'resting' in details:
            r_det = details['resting']
            pdf.cell(0, 8, f"  Eye (Palpebral Fissure): {r_det.get('eye', 0)}", 0, 1)
            pdf.cell(0, 8, f"  Cheek (Nasolabial Fold): {r_det.get('cheek', 0)}", 0, 1)
            pdf.cell(0, 8, f"  Mouth (Corner): {r_det.get('mouth', 0)}", 0, 1)
        pdf.ln(3)

        # Voluntary Movement
        voluntary = sunnybrook.get('voluntaryScore', {})
        pdf.set_font('Arial', 'B', 12)
        pdf.cell(0, 10, f"Voluntary Movement (Score: {voluntary.get('value', 0)}/100)", 0, 1)
        pdf.set_font('Arial', '', 11)
        if 'voluntary' in details:
            v_det = details['voluntary']
            pdf.cell(0, 8, f"  Eyebrow Raise: {v_det.get('eyebrowRaise', 0)}", 0, 1)
            pdf.cell(0, 8, f"  Eye Closure: {v_det.get('eyeClosure', 0)}", 0, 1)
            pdf.cell(0, 8, f"  Smile: {v_det.get('smile', 0)}", 0, 1)
            pdf.cell(0, 8, f"  Snarl: {v_det.get('snarl', 0)}", 0, 1)
            pdf.cell(0, 8, f"  Lip Pucker: {v_det.get('lipPucker', 0)}", 0, 1)
        pdf.ln(3)

        # Synkinesis
        synkinesis = sunnybrook.get('synkinesisScore', {})
        pdf.set_font('Arial', 'B', 12)
        pdf.cell(0, 10, f"Synkinesis (Score: {synkinesis.get('value', 0)}/15)", 0, 1)
        pdf.set_font('Arial', '', 11)
        if 'synkinesis' in details:
            s_det = details['synkinesis']
            pdf.cell(0, 8, f"  Eyebrow Raise: {s_det.get('eyebrowRaise', 0)}", 0, 1)
            pdf.cell(0, 8, f"  Eye Closure: {s_det.get('eyeClosure', 0)}", 0, 1)
            pdf.cell(0, 8, f"  Smile: {s_det.get('smile', 0)}", 0, 1)
            pdf.cell(0, 8, f"  Snarl: {s_det.get('snarl', 0)}", 0, 1)
            pdf.cell(0, 8, f"  Lip Pucker: {s_det.get('lipPucker', 0)}", 0, 1)

    return pdf.output()

def generate_csv(analysis_data):
    """
    Generates a CSV report from analysis data.
    """
    output = StringIO()
    writer = csv.writer(output)

    results = analysis_data.get('analysisResult', [])
    if not results:
        return ""

    # Headers
    headers = ['actionName', 'metricName', 'value', 'score', 'label']
    writer.writerow(headers)

    # Rows
    for result in results:
        writer.writerow([
            result.get('actionName', ''),
            result.get('metricName', ''),
            result.get('value', ''),
            result.get('score', ''),
            result.get('label', '')
        ])

    return output.getvalue()

def generate_markdown(analysis_data):
    """
    Generates a Markdown report from analysis data.
    """
    results = analysis_data.get('analysisResult', [])
    if not results:
        return ""

    md = "# Facial Symmetry Analysis Results\n\n"
    md += "| Action | Metric | Value | Score | Label |\n"
    md += "|--------|--------|-------|-------|-------|\n"

    for result in results:
        md += f"| {result.get('actionName', '')} | {result.get('metricName', '')} | {result.get('value', ''):.4f} | {result.get('score', '')} | {result.get('label', '')} |\n"

    md += '\n**Score Legend:** 0=Normal, 1=Mild, 2=Moderate, 3=Moderately Severe, 4=Severe\n'
    return md
