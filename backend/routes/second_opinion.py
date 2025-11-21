import os
from flask import Blueprint, request, jsonify
from core.extract_text import extract_text_from_file
from core.doctor_matcher import match_doctors_from_dataset, call_gemini

second_opinion_bp = Blueprint("second_opinion", __name__)

# Temporary in-memory storage (until DB integration)
reports = []
next_report_id = 1


@second_opinion_bp.route("/second_opinion", methods=["POST"])
def second_opinion():
    """
    Handles MULTIPLE report files:
    - Extracts text from all files
    - Sends combined text to Gemini
    - Adds recommended doctors
    - Returns AI + file_paths to frontend
    """
    global next_report_id

    extracted_text = ""
    file_paths = []
    filenames = []

    user_name = request.form.get("user_name", "Anonymous")

    # -------------------------------------------------------
    # 📌 CASE 1: MULTIPLE FILE UPLOAD (correct field = files[])
    # -------------------------------------------------------
    if "files[]" in request.files:
        uploaded_files = request.files.getlist("files[]")

        for file in uploaded_files:
            file_result = extract_text_from_file(file)

            extracted_text += "\n" + file_result["text"]
            file_paths.append(file_result["file_path"])
            filenames.append(file_result["filename"])

    # -------------------------------------------------------
    # 📌 CASE 2: SINGLE FILE UPLOAD (fallback support)
    # -------------------------------------------------------
    elif "file" in request.files:
        file_result = extract_text_from_file(request.files["file"])

        extracted_text += "\n" + file_result["text"]
        file_paths.append(file_result["file_path"])
        filenames.append(file_result["filename"])

    # -------------------------------------------------------
    # 📌 CASE 3: MANUAL TEXT ENTRY
    # -------------------------------------------------------
    else:
        payload = request.get_json() or {}
        extracted_text = (
            payload.get("lab_report", "") + "\n" +
            payload.get("prescription", "") + "\n" +
            payload.get("doctor_notes", "")
        )

    # -------------------------------------------------------
    # ❌ ERROR HANDLING: No text extracted from ANY source
    # -------------------------------------------------------
    if not extracted_text.strip():
        return jsonify({"error": "No valid report text found"}), 400

    # -------------------------------------------------------
    # 🤖 CALL GEMINI AI
    # -------------------------------------------------------
    ai_result = call_gemini(extracted_text)

    # Attach doctors for each predicted disease
    for entry in ai_result:
        disease = entry.get("disease", "").strip()
        entry["recommended_doctors"] = match_doctors_from_dataset(disease)

    # -------------------------------------------------------
    # 💾 TEMP STORE REPORT OBJECT
    # -------------------------------------------------------
    report = {
        "id": next_report_id,
        "user_name": user_name,
        "extracted_text": extracted_text,
        "file_paths": file_paths,  # list of uploaded files
        "filenames": filenames,
        "ai_result": ai_result,
        "final_report": None
    }

    reports.append(report)
    next_report_id += 1

    # -------------------------------------------------------
    # 📤 SEND RESPONSE
    # -------------------------------------------------------
    return jsonify({
        "status": "success",
        "report_id": report["id"],
        "ai_result": ai_result,
        "file_paths": file_paths,
        "filenames": filenames
    }), 200
