from flask import Blueprint, jsonify, request
from core.database import db
from core.models import Doctor, Slot, Appointment, User
from core.notifications import send_notification

doctor_dashboard_bp = Blueprint("doctor_dashboard", __name__)

# ✅ Fetch doctor info (profile + schedule)
@doctor_dashboard_bp.route("/doctor/<int:doctor_id>", methods=["GET"])
def get_doctor_profile(doctor_id):
    doctor = Doctor.query.get(doctor_id)
    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404

    slots = Slot.query.filter_by(doctor_id=doctor_id).all()
    appointments = Appointment.query.filter_by(doctor_id=doctor_id).all()

    return jsonify({
        "doctor": {
            "id": doctor.id,
            "name": doctor.user.name,
            "email": doctor.email,
            "phone": doctor.phone,
            "speciality": doctor.speciality,
            "experience": doctor.experience,
            "rating": doctor.rating,
            "location": doctor.location,
        },
        "slots": [{"id": s.id, "start": s.start, "end": s.end, "is_booked": s.is_booked} for s in slots],
        "appointments": [{
            "id": a.id,
            "patient_name": a.patient.name,
            "disease": a.disease,
            "status": a.status,
            "slot_start": a.slot.start if a.slot else None,
            "slot_end": a.slot.end if a.slot else None,
        } for a in appointments]
    })


# ✅ Doctor adds available slot
@doctor_dashboard_bp.route("/doctor/<int:doctor_id>/slots", methods=["POST"])
def add_slot(doctor_id):
    data = request.json
    slot = Slot(doctor_id=doctor_id, start=data["start"], end=data["end"])
    db.session.add(slot)
    db.session.commit()
    return jsonify({"slot": {"id": slot.id, "start": slot.start, "end": slot.end}})


# ✅ Doctor accepts/rejects appointment
@doctor_dashboard_bp.route("/appointments/<int:appt_id>/<action>", methods=["POST"])
def update_appointment_status(appt_id, action):
    appt = Appointment.query.get(appt_id)
    if not appt:
        return jsonify({"error": "Appointment not found"}), 404

    if action == "accept":
        appt.status = "accepted"
        send_notification(appt.patient_id, f"Your appointment with Dr. {appt.doctor.user.name} has been accepted.")
    elif action == "reject":
        appt.status = "rejected"
        send_notification(appt.patient_id, f"Your appointment request was rejected.")
    else:
        return jsonify({"error": "Invalid action"}), 400

    db.session.commit()
    return jsonify({"status": "success"})


# ✅ Doctor submits final report after consultation
@doctor_dashboard_bp.route("/appointments/<int:appt_id>/final_report", methods=["POST"])
def submit_final_report(appt_id):
    data = request.json
    appt = Appointment.query.get(appt_id)
    if not appt:
        return jsonify({"error": "Appointment not found"}), 404

    appt.final_report = data["report"]
    appt.status = "completed"
    db.session.commit()

    send_notification(appt.patient_id, "Your consultation report is now available.")
    return jsonify({"status": "success"})

# ✅ User books a slot with doctor
@doctor_dashboard_bp.route("/appointments/book", methods=["POST"])
def book_appointment():
    data = request.get_json() or {}
    slot_id = data.get("slot_id")
    doctor_id = data.get("doctor_id")
    patient_id = data.get("patient_id")
    disease = data.get("disease", "Not specified")

    slot = Slot.query.get(slot_id)
    if not slot or slot.is_booked:
        return jsonify({"error": "Slot unavailable"}), 400

    appointment = Appointment(
        doctor_id=doctor_id,
        patient_id=patient_id,
        disease=disease,
        slot_id=slot_id,
        status="requested"
    )
    slot.is_booked = True

    db.session.add(appointment)
    db.session.commit()

    send_notification(doctor_id, "New appointment request from a patient.")
    return jsonify({"message": "Appointment requested successfully"})


# ✅ Fetch all appointments for a specific doctor
@doctor_dashboard_bp.route("/doctor/<int:doctor_id>/appointments", methods=["GET"])
def get_doctor_appointments(doctor_id):
    from core.models import Appointment

    appointments = Appointment.query.filter_by(doctor_id=doctor_id).all()

    if not appointments:
        return jsonify({"appointments": []}), 200

    result = []
    for a in appointments:
        result.append({
            "id": a.id,
            "patient_name": a.patient.name if a.patient else "Unknown",
            "disease": a.disease,
            "slot_start": a.slot.start if a.slot else None,
            "slot_end": a.slot.end if a.slot else None,
            "status": a.status,
        })

    return jsonify({"appointments": result}), 200

@doctor_dashboard_bp.route("/doctor/<int:doctor_id>/slots", methods=["GET"])
def get_doctor_slots(doctor_id):
    slots = Slot.query.filter_by(doctor_id=doctor_id, is_booked=False).all()
    return jsonify({
        "slots": [
            {"id": s.id, "start": s.start, "end": s.end}
            for s in slots
        ]
    }), 200
# flask db upgrade  # or python
# flask shell
# >>> from core.database import db
# >>> db.create_all()
