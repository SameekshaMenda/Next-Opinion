# routes/final_report.py
from flask import Blueprint, request, jsonify, send_from_directory
from core.database import db
from core.models import Appointment, Report, Doctor, User
from fpdf import FPDF
import os
import re

final_report_bp = Blueprint("final_report", __name__)

PDF_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "generated_reports")
os.makedirs(PDF_DIR, exist_ok=True)

# ------------------------------
# Helper → remove unsupported characters
# ------------------------------
def clean_text(text):
    if not text:
        return "-"
    # remove ALL unicode and replace with safe characters
    text = text.replace("–", "-").replace("—", "-").replace("•", "*")
    text = text.encode("ascii", "ignore").decode("ascii")
    return text


@final_report_bp.route("/appointments/<int:appointment_id>/final_report_full", methods=["POST"])
def submit_final_report_full(appointment_id):
    data = request.json

    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404

    # 1️⃣ Save report in DB
    report = Report(
        appointment_id=appointment_id,
        doctor_notes=data.get("consultation_summary", ""),
        final_diagnosis=data.get("diagnosis", ""),
        prescription=data.get("medications", "")
    )
    db.session.add(report)
    db.session.commit()

    # 2️⃣ Generate PDF (safe version)
    pdf_path = generate_pdf_report(appointment, report)

    # 3️⃣ Save PDF path in appointment
    appointment.final_report_path = pdf_path
    appointment.status = "completed"
    db.session.commit()

    return jsonify({
        "message": "Report saved successfully",
        "report_id": report.id,
        "pdf_path": pdf_path
    })


def generate_pdf_report(appointment, report):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)

    # Title
    pdf.set_font("Arial", "B", 16)
    pdf.cell(0, 10, "Medical Consultation Report", ln=True, align="C")
    pdf.ln(5)

    pdf.set_font("Arial", size=12)

    # Patient Info
    pdf.cell(0, 8, f"Patient Name: {clean_text(appointment.patient.name)}", ln=True)
    pdf.cell(0, 8, f"Appointment ID: {appointment.id}", ln=True)
    pdf.ln(4)

    # Doctor Info
    pdf.cell(0, 8, f"Doctor: {clean_text(appointment.doctor.user.name)}", ln=True)
    pdf.cell(0, 8, f"Speciality: {clean_text(appointment.doctor.speciality)}", ln=True)
    pdf.ln(4)

    # Summary
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 8, "Consultation Summary:", ln=True)
    pdf.set_font("Arial", size=12)
    pdf.multi_cell(0, 6, clean_text(report.doctor_notes))
    pdf.ln(2)

    # Diagnosis
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 8, "Final Diagnosis:", ln=True)
    pdf.set_font("Arial", size=12)
    pdf.multi_cell(0, 6, clean_text(report.final_diagnosis))
    pdf.ln(2)

    # Prescription
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 8, "Prescription:", ln=True)
    pdf.set_font("Arial", size=12)
    pdf.multi_cell(0, 6, clean_text(report.prescription))

    # Save file
    filepath = os.path.join(PDF_DIR, f"report_{appointment.id}.pdf")
    pdf.output(filepath)

    return filepath


@final_report_bp.route("/reports/download", methods=["GET"])
def download_report():
    file = request.args.get("path")
    if not file:
        return jsonify({"error": "Path missing"}), 400

    filename = os.path.basename(file)
    full_path = os.path.join(PDF_DIR, filename)

    if not os.path.exists(full_path):
        return jsonify({"error": "PDF not found"}), 404

    return send_from_directory(PDF_DIR, filename, as_attachment=True)
