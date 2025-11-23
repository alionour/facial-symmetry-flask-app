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
    for action, metrics in results.items():
        pdf.set_font('Arial', 'B', 12)
        pdf.cell(0, 10, action.replace('_', ' ').title(), 0, 1)
        pdf.set_font('Arial', '', 12)
        for metric, value in metrics.items():
            if isinstance(value, dict):
                for sub_metric, sub_value in value.items():
                    pdf.cell(0, 10, f"  {sub_metric.replace('_', ' ').title()}: {sub_value:.2f}", 0, 1)
            else:
                pdf.cell(0, 10, f"  {metric.replace('_', ' ').title()}: {value:.2f}", 0, 1)
        pdf.ln(5)

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
