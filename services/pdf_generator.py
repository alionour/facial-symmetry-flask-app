from fpdf import FPDF

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

    # This is a placeholder for the actual analysis results.
    # In a real implementation, you would iterate through the analysis data
    # and format it nicely in the PDF.
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

    # Return the PDF as a byte string
    return pdf.output()
