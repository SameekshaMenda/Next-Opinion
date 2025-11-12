from flask import Blueprint, jsonify, request
from core.data_loader import doctor_data
from core.models import Doctor

doctors_bp = Blueprint("doctors", __name__)

@doctors_bp.route("/doctors", methods=["GET"])
def get_all_doctors():
    speciality = request.args.get("speciality", "").lower()
    keyword = request.args.get("keyword", "").lower()
    location = request.args.get("location", "").lower()

    filtered = doctor_data.copy()
    if speciality:
        filtered = filtered[filtered["speciality"].str.lower().str.contains(speciality, na=False)]
    if keyword:
        filtered = filtered[filtered["keywords"].str.lower().str.contains(keyword, na=False)]
    if location:
        filtered = filtered[filtered["location"].str.lower().str.contains(location, na=False)]

    doctors = filtered.to_dict(orient="records")
    return jsonify({
        "status": "success",
        "count": len(doctors),
        "doctors": doctors
    })
# ✅ NEW: Fetch a specific doctor by ID
# @doctors_bp.route("/doctors/<int:doctor_id>", methods=["GET"])
# def get_doctor_by_id(doctor_id):
#     doctor = Doctor.query.get(doctor_id)
#     if not doctor:
#         return jsonify({"error": "Doctor not found"}), 404

#     return jsonify({
#         "id": doctor.id,
#         "name": doctor.user.name if doctor.user else None,
#         "email": doctor.email,
#         "phone": doctor.phone,
#         "speciality": doctor.speciality,
#         "experience": doctor.experience,
#         "rating": doctor.rating,
#         "location": doctor.location,
#     }), 200# ✅ NEW: Fetch a specific doctor by ID


@doctors_bp.route("/doctors/<int:doctor_id>", methods=["GET"])
def get_doctor_by_id(doctor_id):
    # Try doctor_id directly first
    doctor = Doctor.query.get(doctor_id)
    if not doctor:
        # Fallback: check if this is a user_id instead
        doctor = Doctor.query.filter_by(user_id=doctor_id).first()

    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404

    return jsonify({
        "id": doctor.id,
        "user_id": doctor.user_id,
        "name": doctor.user.name,
        "email": doctor.email,
        "speciality": doctor.speciality,
        "location": doctor.location,
        "experience": doctor.experience,
        "rating": doctor.rating,
        "phone": doctor.phone,
    }), 200
