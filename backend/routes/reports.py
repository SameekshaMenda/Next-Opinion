from flask import Blueprint, jsonify, request
from core.models import Report, Appointment
from core.database import db

reports_bp = Blueprint("reports", __name__)

# ✅ Create a new finalized report (saved in PostgreSQL)
@reports_bp.route("/report/final", methods=["POST"])
def final_report():
    data = request.get_json()
    report = Report(
        appointment_id=data["appointment_id"],
        doctor_notes=data["doctor_notes"],
        final_diagnosis=data["final_diagnosis"],
        prescription=data["prescription"]
    )
    db.session.add(report)
    db.session.commit()
    return jsonify({"status": "success"}), 201


# ✅ Fetch a report by ID (from database)
@reports_bp.route("/report/<int:report_id>", methods=["GET"])
def get_report(report_id):
    report = Report.query.get(report_id)
    if not report:
        return jsonify({"status": "error", "message": "Report not found"}), 404
    return jsonify({
        "status": "success",
        "report": {
            "id": report.id,
            "appointment_id": report.appointment_id,
            "doctor_notes": report.doctor_notes,
            "final_diagnosis": report.final_diagnosis,
            "prescription": report.prescription
        }
    })
