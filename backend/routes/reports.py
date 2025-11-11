from flask import Blueprint, jsonify, request

reports_bp = Blueprint("reports", __name__)

reports = []

@reports_bp.route("/report/<int:report_id>", methods=["GET"])
def get_report(report_id):
    report = next((r for r in reports if r["id"] == report_id), None)
    if not report:
        return jsonify({"status": "error", "message": "Report not found"}), 404
    return jsonify({"status": "success", "report": report})

@reports_bp.route("/report/<int:report_id>/finalize", methods=["POST"])
def finalize_report(report_id):
    report = next((r for r in reports if r["id"] == report_id), None)
    if not report:
        return jsonify({"status": "error", "message": "Report not found"}), 404
    report["final_report"] = request.json.get("final_report", "")
    return jsonify({"status": "success", "message": "Final report saved"})
