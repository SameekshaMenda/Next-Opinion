from flask import Blueprint, request, jsonify
from core.database import db
from core.models import Appointment, Notification
from core.notifications import send_notification

appointments_bp = Blueprint("appointments", __name__)

# ✅ User requests appointment
@appointments_bp.route("/appointment/request", methods=["POST"])
def request_appointment():
    data = request.get_json()
    doctor_id = data["doctor_id"]
    patient_id = data["patient_id"]
    disease = data["disease"]

    new_appt = Appointment(doctor_id=doctor_id, patient_id=patient_id, disease=disease)
    db.session.add(new_appt)
    db.session.commit()

    send_notification(doctor_id, f"New appointment request for {disease}")
    return jsonify({"status": "success", "appointment_id": new_appt.id})


# ✅ Doctor proposes a slot
@appointments_bp.route("/appointment/accept", methods=["POST"])
def accept_appointment():
    data = request.get_json()
    appt_id = data["appointment_id"]
    slot_time = data["slot_time"]

    appt = Appointment.query.get(appt_id)
    if not appt:
        return jsonify({"error": "Appointment not found"}), 404

    appt.status = "proposed"
    appt.slot_time = slot_time
    db.session.commit()

    send_notification(appt.patient_id, f"Doctor proposed slot: {slot_time}")
    return jsonify({"status": "success"})


# ✅ Patient confirms appointment
@appointments_bp.route("/appointment/confirm", methods=["POST"])
def confirm_appointment():
    data = request.get_json()
    appt_id = data["appointment_id"]

    appt = Appointment.query.get(appt_id)
    if not appt:
        return jsonify({"error": "Appointment not found"}), 404

    appt.status = "confirmed"
    db.session.commit()

    send_notification(appt.doctor_id, "Patient confirmed the appointment.")
    return jsonify({"status": "success"})
