from flask import Blueprint, request, jsonify
from core.extract_text import extract_text_from_file
from core.gemini_utils import get_related_terms_with_gemini
from core.data_loader import doctor_data
from core.doctor_matcher import match_doctors_from_dataset, call_gemini

second_opinion_bp = Blueprint("second_opinion", __name__)

reports = []
next_report_id = 1

@second_opinion_bp.route("/second_opinion", methods=["POST"])
def second_opinion():
    global next_report_id

    extracted_text = ""
    user_name = request.form.get("user_name", "Anonymous")

    if "file" in request.files:
        extracted_text = extract_text_from_file(request.files["file"])
    else:
        payload = request.get_json() or {}
        extracted_text = (
            payload.get("lab_report", "")
            + "\n"
            + payload.get("prescription", "")
            + "\n"
            + payload.get("doctor_notes", "")
        )

    ai_result = call_gemini(extracted_text)
    for entry in ai_result:
        disease = entry.get("disease", "")
        entry["recommended_doctors"] = match_doctors_from_dataset(disease)

    report = {
        "id": next_report_id,
        "user_name": user_name,
        "extracted_text": extracted_text,
        "ai_result": ai_result,
        "final_report": None
    }
    reports.append(report)
    next_report_id += 1

    return jsonify({"status": "success", "report_id": report["id"], "ai_result": ai_result})
