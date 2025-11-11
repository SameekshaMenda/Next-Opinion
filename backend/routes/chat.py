from flask import Blueprint, jsonify, request

chat_bp = Blueprint("chat", __name__)
chats = []

@chat_bp.route("/chat/<int:report_id>", methods=["GET"])
def get_chat(report_id):
    filtered = [m for m in chats if m["report_id"] == report_id]
    return jsonify({"status": "success", "messages": filtered})

@chat_bp.route("/chat/<int:report_id>/send", methods=["POST"])
def send_chat(report_id):
    payload = request.get_json() or {}
    chats.append({
        "report_id": report_id,
        "sender": payload.get("sender", "user"),
        "message": payload.get("message", "")
    })
    return jsonify({"status": "success"})
