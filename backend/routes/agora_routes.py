from flask import Blueprint, request, jsonify
from agora_token_builder import RtcTokenBuilder
import time, os

agora_bp = Blueprint("agora_bp", __name__)

# 🔑 Replace with your actual Agora credentials
APP_ID = os.getenv("AGORA_APP_ID", "<YOUR_AGORA_APP_ID>")
APP_CERTIFICATE = os.getenv("AGORA_APP_CERTIFICATE", "<YOUR_APP_CERTIFICATE>")

@agora_bp.route("/generate_token", methods=["POST"])
def generate_token():
    data = request.get_json()
    channel_name = data.get("channel_name", "default")
    uid = int(data.get("uid", 0))
    role = 1  # 1 = Publisher (host)

    expiration_time_in_seconds = 3600
    current_timestamp = int(time.time())
    privilege_expired_ts = current_timestamp + expiration_time_in_seconds

    token = RtcTokenBuilder.buildTokenWithUid(
        APP_ID, APP_CERTIFICATE, channel_name, uid, role, privilege_expired_ts
    )

    return jsonify({
        "token": token,
        "appId": APP_ID,
        "channelName": channel_name
    })
