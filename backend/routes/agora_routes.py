from flask import Blueprint, request, jsonify
from agora_token_builder import RtcTokenBuilder
import time, os, random

agora_bp = Blueprint("agora_bp", __name__)

APP_ID = os.getenv("AGORA_APP_ID", "<YOUR_AGORA_APP_ID>")
APP_CERTIFICATE = os.getenv("AGORA_APP_CERTIFICATE", "<YOUR_APP_CERTIFICATE>")

@agora_bp.route("/generate_token", methods=["POST"])
def generate_token():
    data = request.get_json()

    channel_name = data.get("channel_name")
    uid = data.get("uid")

    # ------------------------------
    # ❗ Required Fix: Validate UID
    # ------------------------------
    if uid is None:
        return jsonify({"error": "UID is required"}), 400

    try:
        uid = int(uid)
    except:
        return jsonify({"error": "Invalid UID"}), 400

    role = 1  # Publisher
    expiration_time_in_seconds = 3600
    current_timestamp = int(time.time())
    privilege_expired_ts = current_timestamp + expiration_time_in_seconds

    token = RtcTokenBuilder.buildTokenWithUid(
        APP_ID,
        APP_CERTIFICATE,
        channel_name,
        uid,
        role,
        privilege_expired_ts
    )

    return jsonify({
        "token": token,
        "uid": uid,
        "channelName": channel_name
    })
