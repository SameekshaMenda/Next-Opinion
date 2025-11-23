from flask import Blueprint, request, jsonify
from core.database import db
from core.models import Appointment, Notification, Slot, Doctor, User
from core.notifications import send_notification
from core.email_service import send_email   # ✅ EMAIL SUPPORT
import json
import os

appointments_bp = Blueprint("appointments", __name__)

# ------------------------------------------------
# 1️⃣ USER REQUESTS APPOINTMENT (AUTO-ACCEPT)
#    Accepts optional report_path & report_name to attach to doctor email
# ------------------------------------------------
def format_ai_analysis(ai_list):
    if not ai_list or not isinstance(ai_list, list):
        return "No AI analysis available."

    lines = ["AI Analysis Summary:\n"]

    for item in ai_list:
        disease = item.get("disease", "Unknown condition")
        risk = item.get("risk", "N/A")
        explanation = item.get("explanation", "").strip()

        lines.append(f"• {disease} — Risk: {risk}")
        if explanation:
            lines.append(f"  {explanation}\n")

    return "\n".join(lines)

@appointments_bp.route("/appointment/request", methods=["POST"])
def request_appointment():
    data = request.get_json()

    doctor_id       = data["doctor_id"]
    patient_id      = data["patient_id"]
    disease         = data["disease"]
    slot_id         = data.get("slot_id")

    ai_result       = data.get("ai_result", [])
    file_paths      = data.get("file_paths", [])
    filenames       = data.get("filenames", [])
    user_report_id  = data.get("user_report_id")

    # ---------------------------------------
    # SLOT VALIDATION
    # ---------------------------------------
    slot = Slot.query.get(slot_id)
    if not slot or slot.is_booked:
        return jsonify({"error": "Slot unavailable"}), 400

    # ---------------------------------------
    # UNIQUE VIDEO CHANNEL
    # ---------------------------------------
    import uuid
    video_channel = f"channel_{uuid.uuid4().hex[:10]}"

    # ---------------------------------------
    # CREATE APPOINTMENT
    # ---------------------------------------
    appt = Appointment(
        doctor_id=doctor_id,
        patient_id=patient_id,
        disease=disease,
        slot_id=slot_id,
        status="accepted",
        video_channel=video_channel,
        ai_analysis=json.dumps(ai_result),
        report_files=json.dumps(file_paths),
        report_names=json.dumps(filenames),
        user_report_id=user_report_id
    )

    slot.is_booked = True
    appt.slot_time = f"{slot.start} - {slot.end}"

    db.session.add(appt)
    db.session.commit()

    # ---------------------------------------
    # FETCH USER DETAILS
    # ---------------------------------------
    doctor = Doctor.query.get(doctor_id)
    patient = User.query.get(patient_id)

    call_link = f"http://localhost:5173/call/{video_channel}"

    # ---------------------------------------
    # CLEAN AI SUMMARY (NO EMOJIS, NO SPECIAL SYMBOLS)
    # ---------------------------------------
    ai_summary = "AI Analysis Summary:\n\n"
    for item in ai_result:
        disease_text = item.get("disease", "Condition")
        risk = item.get("risk", "N/A")
        explanation = item.get("explanation", "")

        ai_summary += f"Disease: {disease_text}\n"
        ai_summary += f"Risk: {risk}\n"
        ai_summary += f"Explanation: {explanation}\n\n"

    # ---------------------------------------
    # ATTACHMENTS
    # ---------------------------------------
    attachment_paths = []
    for p in file_paths:
        if os.path.exists(p):
            attachment_paths.append(p)

    # ---------------------------------------
    # EMAIL → DOCTOR
    # ---------------------------------------
    doctor_email_body = f"""
Hello Dr. {doctor.user.name},

A patient has booked a second-opinion consultation.

Patient: {patient.name}
Disease: {disease}
Slot: {appt.slot_time}

{ai_summary}

Video Call Link:
{call_link}

Patient reports are attached.

Regards,
NextOpinion
"""

    send_email(
        to=doctor.email,
        subject="New Second Opinion Appointment",
        body=doctor_email_body,
        attachment_paths=attachment_paths
    )

    # ---------------------------------------
    # EMAIL → PATIENT
    # ---------------------------------------
    patient_email_body = f"""
Hello {patient.name},

Your appointment with Dr. {doctor.user.name} has been confirmed.

Slot: {appt.slot_time}
Video Call Link: {call_link}

Regards,
NextOpinion
"""

    send_email(
        to=patient.email,
        subject="Your Appointment is Confirmed",
        body=patient_email_body
    )

    # ---------------------------------------
    # IN-APP NOTIFICATION
    # ---------------------------------------
    send_notification(doctor_id, "New appointment request received")

    return jsonify({
        "status": "success",
        "appointment_id": appt.id,
        "video_channel": video_channel
    })




# ------------------------------------------------
# 2️⃣ PATIENT APPOINTMENT HISTORY
# ------------------------------------------------
@appointments_bp.route("/patient/<int:patient_id>/appointments", methods=["GET"])
def get_patient_appointments(patient_id):
    appts = Appointment.query.filter_by(patient_id=patient_id).all()

    result = []
    for a in appts:
        result.append({
            "id": a.id,
            "doctor_name": a.doctor.user.name if a.doctor and a.doctor.user else "Unknown",
            "disease": a.disease,
            "slot_start": a.slot.start if a.slot else "-",
            "slot_end": a.slot.end if a.slot else "-",
            "status": a.status,
            "date": a.created_at.strftime("%Y-%m-%d"),
            "video_channel": a.video_channel,
            "final_report_path": a.final_report_path 
        })

    return jsonify({"appointments": result})


# ------------------------------------------------
# 3️⃣ CANCEL APPOINTMENT (FREE SLOT + EMAIL ALERT)
# ------------------------------------------------
@appointments_bp.route("/appointment/<int:id>/cancel", methods=["POST"])
def cancel_appointment(id):
    appt = Appointment.query.get(id)
    if not appt:
        return jsonify({"error": "Appointment not found"}), 404

    # Free the slot
    if appt.slot:
        appt.slot.is_booked = False

    appt.status = "cancelled"
    db.session.commit()

    patient = appt.patient
    doctor = appt.doctor

    # EMAIL: Patient
    try:
        if patient:
            send_email(
                to=patient.email,
                subject="Appointment Cancelled",
                body=f"""Hello {patient.name},

Your appointment with Dr. {doctor.user.name if doctor and doctor.user else 'Doctor'} has been cancelled.

Thank you,
NextOpinion
"""
            )
    except Exception as e:
        print(f"⚠️ Failed to send patient cancellation email: {e}")

    # EMAIL: Doctor
    try:
        if doctor:
            send_email(
                to=doctor.email,
                subject="Appointment Cancelled",
                body=f"""Hello Dr. {doctor.user.name if doctor and doctor.user else 'Doctor'},

The patient {patient.name if patient else 'Unknown'} has cancelled their appointment.

Regards,
NextOpinion
"""
            )
    except Exception as e:
        print(f"⚠️ Failed to send doctor cancellation email: {e}")

    try:
        send_notification(doctor.id, "A patient cancelled their appointment.")
    except Exception as e:
        print(f"⚠️ Failed to create notification: {e}")

    return jsonify({"status": "cancelled"})


# ------------------------------------------------
# 4️⃣ RESCHEDULE APPOINTMENT + EMAIL ALERT
# ------------------------------------------------
@appointments_bp.route("/appointment/<int:id>/reschedule", methods=["POST"])
def reschedule_appointment(id):
    data = request.get_json()
    new_slot_id = data["new_slot_id"]

    appt = Appointment.query.get(id)
    if not appt:
        return jsonify({"error": "Appointment not found"}), 404

    new_slot = Slot.query.get(new_slot_id)
    if not new_slot:
        return jsonify({"error": "Slot not found"}), 404

    if new_slot.is_booked:
        return jsonify({"error": "This slot is already booked"}), 400

    # Free old slot
    if appt.slot:
        appt.slot.is_booked = False

    # Book new slot
    appt.slot_id = new_slot_id
    new_slot.is_booked = True
    appt.slot_time = f"{new_slot.start} - {new_slot.end}"

    db.session.commit()

    patient = appt.patient
    doctor = appt.doctor

    # EMAIL: Patient
    try:
        if patient:
            send_email(
                to=patient.email,
                subject="Appointment Rescheduled",
                body=f"""Hello {patient.name},

Your appointment with Dr. {doctor.user.name if doctor and doctor.user else 'Doctor'} has been rescheduled.

New Slot: {appt.slot_time}

Thank you,
NextOpinion
"""
            )
    except Exception as e:
        print(f"⚠️ Failed to send patient reschedule email: {e}")

    # EMAIL: Doctor
    try:
        if doctor:
            send_email(
                to=doctor.email,
                subject="Appointment Rescheduled",
                body=f"""Hello Dr. {doctor.user.name if doctor and doctor.user else 'Doctor'},

The appointment for {patient.name if patient else 'Unknown'} has been rescheduled.

New Slot: {appt.slot_time}

Regards,
NextOpinion
"""
            )
    except Exception as e:
        print(f"⚠️ Failed to send doctor reschedule email: {e}")

    try:
        send_notification(doctor.id, "A patient rescheduled their appointment.")
    except Exception as e:
        print(f"⚠️ Failed to create notification: {e}")

    return jsonify({"status": "rescheduled"})
