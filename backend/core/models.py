from core.database import db
from datetime import datetime

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255))
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), default="user")

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
    user = db.relationship("User", backref="doctor", lazy=True)
    

class Slot(db.Model):
    __tablename__ = "slots"
    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id"), nullable=False)
    start = db.Column(db.String(20))
    end = db.Column(db.String(20))
    is_booked = db.Column(db.Boolean, default=False)
    note = db.Column(db.String(100))
    doctor = db.relationship("Doctor", backref="slots")

class Appointment(db.Model):
    __tablename__ = "appointments"

    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id"), nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    disease = db.Column(db.String(255), nullable=False)
    slot_id = db.Column(db.Integer, db.ForeignKey("slots.id"), nullable=True)
    slot_time = db.Column(db.String(50), nullable=True)
    status = db.Column(db.String(50), default="requested")
    final_report = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # ✅ Relationships — FIXED
    slot = db.relationship("Slot", backref="appointments", lazy=True)
    doctor = db.relationship("Doctor", backref="appointments", lazy=True)
    patient = db.relationship(
        "User",
        backref="patient_appointments",  # avoid conflict with doctor.user
        lazy=True,
        foreign_keys=[patient_id]  # <-- important fix
    )



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
