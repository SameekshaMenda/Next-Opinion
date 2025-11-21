from flask import Blueprint, jsonify, request, send_file
from core.database import db
from core.models import Doctor, Slot, Appointment, User
from core.notifications import send_notification
import json
import os

doctor_dashboard_bp = Blueprint("doctor_dashboard", __name__)


# -----------------------------------------------------------
# 1️⃣ FETCH DOCTOR PROFILE ONLY
# -----------------------------------------------------------
@doctor_dashboard_bp.route("/doctor/<int:doctor_id>", methods=["GET"])
def get_doctor_profile(doctor_id):
    doctor = Doctor.query.get(doctor_id)
    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404

    return jsonify({
        "id": doctor.id,
        "name": doctor.user.name if doctor.user else "",
        "email": doctor.email,
        "phone": doctor.phone,
        "speciality": doctor.speciality,
        "experience": doctor.experience,
        "rating": doctor.rating,
        "location": doctor.location,
    }), 200


# -----------------------------------------------------------
# 2️⃣ DOCTOR ADDS AVAILABLE SLOT
# -----------------------------------------------------------
@doctor_dashboard_bp.route("/doctor/<int:doctor_id>/slots", methods=["POST"])
def add_slot(doctor_id):
    data = request.json or {}

    slot = Slot(
        doctor_id=doctor_id,
        start=data.get("start"),
        end=data.get("end")
    )

    db.session.add(slot)
    db.session.commit()

    return jsonify({
        "slot": {
            "id": slot.id,
            "start": slot.start,
            "end": slot.end,
            "is_booked": slot.is_booked
        }
    }), 200


# -----------------------------------------------------------
# 3️⃣ FETCH DOCTOR FREE SLOTS
# -----------------------------------------------------------
@doctor_dashboard_bp.route("/doctor/<int:doctor_id>/slots", methods=["GET"])
def get_doctor_slots(doctor_id):
    slots = Slot.query.filter_by(doctor_id=doctor_id).all()

    return jsonify({
        "slots": [
            {
                "id": s.id,
                "start": s.start,
                "end": s.end,
                "is_booked": s.is_booked
            }
            for s in slots
        ]
    }), 200


# -----------------------------------------------------------
# 4️⃣ DOCTOR UPDATES STATUS (ACCEPT / REJECT)
# -----------------------------------------------------------
@doctor_dashboard_bp.route("/appointments/<int:appt_id>/<action>", methods=["POST"])
def update_appointment_status(appt_id, action):
    appt = Appointment.query.get(appt_id)
    if not appt:
        return jsonify({"error": "Appointment not found"}), 404

    if action == "accept":
        appt.status = "accepted"
        send_notification(
            appt.patient_id,
            f"Your appointment with Dr. {appt.doctor.user.name} has been accepted."
        )

    elif action == "reject":
        appt.status = "rejected"
        send_notification(
            appt.patient_id,
            "Your appointment request has been rejected."
        )

    else:
        return jsonify({"error": "Invalid action"}), 400

    db.session.commit()
    return jsonify({"status": "success"}), 200


# -----------------------------------------------------------
# 5️⃣ DOCTOR SUBMITS FINAL CONSULTATION REPORT
# -----------------------------------------------------------
@doctor_dashboard_bp.route("/appointments/<int:appt_id>/final_report", methods=["POST"])
def submit_final_report(appt_id):
    data = request.json or {}
    report_text = data.get("report")

    appt = Appointment.query.get(appt_id)
    if not appt:
        return jsonify({"error": "Appointment not found"}), 404

    appt.final_report = report_text
    appt.status = "completed"

    db.session.commit()

    send_notification(
        appt.patient_id,
        "Your consultation report is now available."
    )

    return jsonify({"status": "success"}), 200


# -----------------------------------------------------------
# 6️⃣ FETCH FULL DOCTOR APPOINTMENT LIST
# -----------------------------------------------------------
@doctor_dashboard_bp.route("/doctor/<int:doctor_id>/appointments", methods=["GET"])
def get_doctor_appointments(doctor_id):
    appointments = Appointment.query.filter_by(doctor_id=doctor_id).all()

    appt_list = []

    for a in appointments:
        try:
            ai_data = json.loads(a.ai_analysis) if a.ai_analysis else []
        except:
            ai_data = []

        try:
            file_paths = json.loads(a.report_files) if a.report_files else []
            file_names = json.loads(a.report_names) if a.report_names else []
        except:
            file_paths, file_names = [], []

        reports = []
        for p, n in zip(file_paths, file_names):
            reports.append({
                "name": n,
                "path": p,
                "download_url": f"/api/reports/download?path={p}"
            })

        appt_list.append({
            "id": a.id,
            "patient_name": a.patient.name if a.patient else "Unknown",
            "disease": a.disease,
            "slot_start": a.slot.start if a.slot else None,
            "slot_end": a.slot.end if a.slot else None,
            "status": a.status,
            "video_channel": a.video_channel,
            "ai_analysis": ai_data,
            "reports": reports
        })

    return jsonify({"appointments": appt_list}), 200


# -----------------------------------------------------------
# 7️⃣ REPORT FILE DOWNLOAD ENDPOINT
# -----------------------------------------------------------
@doctor_dashboard_bp.route("/reports/download", methods=["GET"])
def download_report():
    file_path = request.args.get("path")

    if not file_path or not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    filename = os.path.basename(file_path)
    return send_file(file_path, as_attachment=True, download_name=filename)
