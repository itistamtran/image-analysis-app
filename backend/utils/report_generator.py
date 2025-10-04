from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from datetime import datetime


def generate_report(
    file_path,
    user_name,
    user_email,
    scan_id,
    prediction,
    confidence,
    summary_text,
    recommendations,
    mri_image=None
):
    c = canvas.Canvas(file_path, pagesize=letter)
    width, height = letter

    y = height - 50
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, y, f"Report for Scan ID: {scan_id}")

    y -= 25
    c.setFont("Helvetica", 12)
    c.drawString(50, y, f"User: {user_name}  |  Email: {user_email}")

    y -= 25
    c.drawString(
        50, y, f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    y -= 25
    c.drawString(50, y, f"Final Prediction: {prediction}")

    y -= 25
    c.drawString(50, y, f"Confidence Score: {confidence:.2f}%")

    y -= 40
    c.setFont("Helvetica-Bold", 13)
    c.drawString(50, y, "Summary Report")

    y -= 25
    c.setFont("Helvetica", 12)
    text = c.beginText(50, y)
    text.textLines(summary_text)
    c.drawText(text)

    y -= 60
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "Recommendations:")

    y -= 20
    c.setFont("Helvetica", 12)
    for rec in recommendations:
        c.drawString(70, y, f"• {rec}")
        y -= 20

    if mri_image:
        c.drawImage(mri_image, 300, 200, width=200, preserveAspectRatio=True)

    c.save()
