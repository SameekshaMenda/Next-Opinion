from flask import Blueprint, request, jsonify
from core.database import db
from core.models import Slot, Appointment, Doctor
from core.notifications import send_notification

slot_bp = Blueprint("slot_bp", __name__)

# ✅ Fetch all available slots for a doctor
@slot_bp.route("/doctor/<int:doctor_id>/slots", methods=["GET"])
def get_doctor_slots(doctor_id):
    slots = Slot.query.filter_by(doctor_id=doctor_id, is_booked=False).all()
    return jsonify({"slots": [{"id": s.id, "start": s.start, "end": s.end} for s in slots]})


# ✅ Book a slot (user chooses slot)
@slot_bp.route("/appointment/book", methods=["POST"])
def book_appointment():
    data = request.json
    doctor_id = data["doctor_id"]
    patient_id = data["patient_id"]
    slot_id = data["slot_id"]
    disease = data.get("disease", "Consultation")

    slot = Slot.query.get(slot_id)
    if not slot or slot.is_booked:
        return jsonify({"error": "Slot unavailable"}), 400

    new_appt = Appointment(
        doctor_id=doctor_id,
        patient_id=patient_id,
        disease=disease,
        slot_id=slot_id,
        status="requested",
    )
    slot.is_booked = True
    db.session.add(new_appt)
    db.session.commit()

    send_notification(doctor_id, f"New appointment request from patient for {disease}.")
    return jsonify({"message": "Appointment requested successfully", "appointment_id": new_appt.id})


# ✅ Send document notification to doctor
@slot_bp.route("/appointment/send_documents", methods=["POST"])
def send_documents():
    data = request.json
    doctor_id = data["doctor_id"]
    appointment_id = data["appointment_id"]

    send_notification(doctor_id, f"Documents shared for appointment ID: {appointment_id}")
    return jsonify({"status": "documents_sent"})



# from flask import Blueprint, jsonify, request
# from core.data_loader import doctor_data

# doctors_bp = Blueprint("doctors", __name__)

# @doctors_bp.route("/doctors", methods=["GET"])
# def get_all_doctors():
#     speciality = request.args.get("speciality", "").lower()
#     keyword = request.args.get("keyword", "").lower()
#     location = request.args.get("location", "").lower()

#     filtered = doctor_data.copy()
#     if speciality:
#         filtered = filtered[filtered["speciality"].str.lower().str.contains(speciality, na=False)]
#     if keyword:
#         filtered = filtered[filtered["keywords"].str.lower().str.contains(keyword, na=False)]
#     if location:
#         filtered = filtered[filtered["location"].str.lower().str.contains(location, na=False)]

#     doctors = filtered.to_dict(orient="records")
#     return jsonify({
#         "status": "success",
#         "count": len(doctors),
#         "doctors": doctors
#     })
