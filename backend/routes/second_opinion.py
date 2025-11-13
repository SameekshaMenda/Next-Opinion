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
    file_path = None
    filename = None

    user_name = request.form.get("user_name", "Anonymous")

    # -------------------------------------------------------
    # CASE 1: USER UPLOADED A FILE (PDF / JPG / PNG / TXT)
    # -------------------------------------------------------
    if "file" in request.files:
        file_result = extract_text_from_file(request.files["file"])

        extracted_text = file_result["text"]
        file_path = file_result["file_path"]     # <-- SAVE THIS
        filename = file_result["filename"]

    # -------------------------------------------------------
    # CASE 2: USER TYPED MANUALLY (NO FILE)
    # -------------------------------------------------------
    else:
        payload = request.get_json() or {}
        extracted_text = (
            payload.get("lab_report", "") + "\n" +
            payload.get("prescription", "") + "\n" +
            payload.get("doctor_notes", "")
        )

    # -------------------------------------------------------
    # AI PREDICTION
    # -------------------------------------------------------
    ai_result = call_gemini(extracted_text)

    # Add recommended doctors
    for entry in ai_result:
        disease = entry.get("disease", "")
        entry["recommended_doctors"] = match_doctors_from_dataset(disease)

    # -------------------------------------------------------
    # SAVE REPORT OBJECT
    # -------------------------------------------------------
    report = {
        "id": next_report_id,
        "user_name": user_name,
        "extracted_text": extracted_text,
        "file_path": file_path,       # <-- store the actual file path
        "filename": filename,
        "ai_result": ai_result,
        "final_report": None
    }

    reports.append(report)
    next_report_id += 1

    # -------------------------------------------------------
    # SEND RESPONSE TO FRONTEND
    # -------------------------------------------------------
    return jsonify({
        "status": "success",
        "report_id": report["id"],
        "ai_result": ai_result,
        "file_path": file_path,      # <-- Frontend uses this for appointment email
        "filename": filename
    })
