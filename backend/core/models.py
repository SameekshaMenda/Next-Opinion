from core.database import db
from datetime import datetime

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(120), unique=True)
    role = db.Column(db.String(50))  # 'patient' or 'doctor'
    password = db.Column(db.String(200))

class Doctor(db.Model):
    __tablename__ = "doctors"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    speciality = db.Column(db.String(100))
    experience = db.Column(db.String(50))
    rating = db.Column(db.String(10))
    location = db.Column(db.String(100))
    phone = db.Column(db.String(50))
    email = db.Column(db.String(255))

class Appointment(db.Model):
    __tablename__ = "appointments"
    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id"))
    patient_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    disease = db.Column(db.String(255))
    status = db.Column(db.String(50), default="requested")  # requested, proposed, confirmed, completed
    slot_time = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Notification(db.Model):
    __tablename__ = "notifications"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    message = db.Column(db.String(255))
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Report(db.Model):
    __tablename__ = "reports"
    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey("appointments.id"))
    doctor_notes = db.Column(db.Text)
    final_diagnosis = db.Column(db.Text)
    prescription = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
