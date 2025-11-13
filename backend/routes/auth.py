from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from core.database import db
from core.models import User, Doctor
import jwt, datetime, os
from dotenv import load_dotenv

load_dotenv()
auth_bp = Blueprint("auth", __name__)

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")

# ------------------- Register (Users Only) -------------------
@auth_bp.route("/register", methods=["POST"])
def register_user():
    data = request.get_json()
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not all([name, email, password]):
        return jsonify({"error": "All fields are required"}), 400

    existing = User.query.filter_by(email=email).first()
    if existing:
        return jsonify({"error": "Email already registered"}), 400

    hashed_pw = generate_password_hash(password)
    user = User(name=name, email=email, password=hashed_pw, role="user")
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201


# ------------------- Login (User or Doctor) -------------------
@auth_bp.route("/login", methods=["POST"])
def login_user():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = jwt.encode(
        {
            "user_id": user.id,
            "role": user.role,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=8),
        },
        SECRET_KEY,
        algorithm="HS256",
    )

    doctor_id = None
    if user.role == "doctor":
        doctor = Doctor.query.filter_by(user_id=user.id).first()
        if doctor:
            doctor_id = doctor.id

    return jsonify({
        "status": "success",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "doctor_id": doctor_id,
            "token": token
        }
    }), 200
