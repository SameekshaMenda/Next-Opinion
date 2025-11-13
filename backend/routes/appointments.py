from flask import Blueprint, request, jsonify
from core.database import db
from core.models import Appointment, Notification, Slot, Doctor, User
from core.notifications import send_notification
from core.email_service import send_email   # ✅ EMAIL SUPPORT

import os

appointments_bp = Blueprint("appointments", __name__)

# ------------------------------------------------
# 1️⃣ USER REQUESTS APPOINTMENT (AUTO-ACCEPT)
#    Accepts optional report_path & report_name to attach to doctor email
# ------------------------------------------------
@appointments_bp.route("/appointment/request", methods=["POST"])
def request_appointment():
    data = request.get_json()
    doctor_id = data["doctor_id"]
    patient_id = data["patient_id"]
    disease = data["disease"]
    slot_id = data.get("slot_id")
    report_path = data.get("report_path")      # optional: full file path on server
    report_name = data.get("report_name")      # optional: original filename

    # 🔥 STEP 1: Validate slot
    slot = None
    if slot_id:
        slot = Slot.query.get(slot_id)

        if not slot:
            return jsonify({"error": "Slot not found"}), 404

        if slot.is_booked:
            return jsonify({"error": "This slot is already booked"}), 400

    # 🔥 STEP 2: Create appointment (auto-accepted)
    new_appt = Appointment(
        doctor_id=doctor_id,
        patient_id=patient_id,
        disease=disease,
        slot_id=slot_id,
        status="accepted"
    )

    db.session.add(new_appt)

    # 🔥 STEP 3: Mark slot as booked and set readable slot_time
    if slot:
        slot.is_booked = True
        new_appt.slot_time = f"{slot.start} - {slot.end}"

    db.session.commit()

    # ------------------------------------------------
    # EMAIL SENDING (Patient + Doctor)
    # Attach report to doctor's email if provided and exists
    # ------------------------------------------------
    patient = User.query.get(patient_id)
    doctor = Doctor.query.get(doctor_id)

    # Prepare doctor's attachments list (if any)
    attachments = None
    if report_path and report_name:
        try:
            if os.path.exists(report_path) and os.path.isfile(report_path):
                with open(report_path, "rb") as fh:
                    file_bytes = fh.read()
                attachments = [(report_name, file_bytes)]
            else:
                # file not found — log and continue without attachment
                print(f"⚠️ Report file not found: {report_path}")
        except Exception as e:
            print(f"⚠️ Error reading report file for attachment: {e}")

    # Send emails if patient/doctor exist (fail silently otherwise)
    if patient:
        try:
            send_email(
                to=patient.email,
                subject="Appointment Confirmed",
                body=f"""Hello {patient.name},

Your appointment with Dr. {doctor.user.name if doctor and doctor.user else 'Doctor'} is confirmed.

Disease: {disease}
Slot: {new_appt.slot_time or 'Not assigned'}

Thank you for using NextOpinion.
"""
            )
        except Exception as e:
            print(f"⚠️ Failed to send patient email: {e}")

    if doctor:
        try:
            send_email(
                to=doctor.email,
                subject="New Appointment Booked",
                body=f"""Hello Dr. {doctor.user.name if doctor and doctor.user else 'Doctor'},

A new appointment has been booked.

Patient: {patient.name if patient else 'Unknown'}
Disease: {disease}
Slot: {new_appt.slot_time or 'Not assigned'}

Regards,
NextOpinion System
""",
                attachments=attachments
            )
        except Exception as e:
            print(f"⚠️ Failed to send doctor email: {e}")

    # 🔥 STEP 4: Internal notification
    try:
        send_notification(doctor_id, f"New appointment booked for {disease}")
    except Exception as e:
        print(f"⚠️ Failed to create notification: {e}")

    return jsonify({"status": "success", "appointment_id": new_appt.id})


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
            "date": a.created_at.strftime("%Y-%m-%d")
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
