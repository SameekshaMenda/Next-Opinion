from flask import Blueprint, jsonify, request
from core.data_loader import doctor_data

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
