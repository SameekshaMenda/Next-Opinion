from core.database import db
from datetime import datetime

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255))
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), default="user")

    # 🔥 All appointments where this user is a patient
    appointments = db.relationship(
        "Appointment",
        backref="patient",
        lazy=True,
        foreign_keys="Appointment.patient_id"
    )
    # 🔥 All reports uploaded by this user
    user_reports = db.relationship(
        "UserReport",
        backref="patient",
        lazy=True,
        foreign_keys="UserReport.user_id"
    )


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

    # 🔥 Link doctor → user record
    user = db.relationship("User", backref=db.backref("doctor_profile", uselist=False))

    # 🔥 Get all appointments for this doctor
    appointments = db.relationship("Appointment", backref="doctor", lazy=True)

    # 🔥 Slots created by this doctor
    slots = db.relationship("Slot", backref="doctor", lazy=True)


class Slot(db.Model):
    __tablename__ = "slots"

    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id"), nullable=False)

    start = db.Column(db.String(20))
    end = db.Column(db.String(20))

    is_booked = db.Column(db.Boolean, default=False)
    note = db.Column(db.String(100))


class UserReport(db.Model): 
    __tablename__ = "user_reports"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False) # Link to patient
    
    # Path to the stored file for email attachment
    file_path = db.Column(db.String(512), nullable=False) 
    
    # Relationship to AI analysis result (1:1)
    ai_analysis = db.relationship("AIAnalysis", backref="user_report", uselist=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class AIAnalysis(db.Model):
    __tablename__ = "ai_analyses"

    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("user_reports.id"), nullable=False, unique=True)
    
    # Key fields for quick lookup and display
    risk_score = db.Column(db.Integer) # 0-100
    risk_category = db.Column(db.String(50)) # Low, Medium, High
    suggested_specialty = db.Column(db.String(100))
    
    # Store the complete structured JSON output from Gemini
    full_analysis_json = db.Column(db.Text, nullable=False) 
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# RESTORED: This is the model for the DOCTOR's final report/prescription.
class Report(db.Model):
    __tablename__ = "reports"

    id = db.Column(db.Integer, primary_key=True)
    # Changed back to appointment_id FK
    appointment_id = db.Column(db.Integer, db.ForeignKey("appointments.id")) 

    doctor_notes = db.Column(db.Text)
    final_diagnosis = db.Column(db.Text)
    prescription = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Appointment(db.Model):
    __tablename__ = "appointments"

    id = db.Column(db.Integer, primary_key=True)

    doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id"), nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    # Link to the initial patient report (UserReport)
    user_report_id = db.Column(db.Integer, db.ForeignKey("user_reports.id"), nullable=True) 
    
    disease = db.Column(db.String(255), nullable=False)
    slot_id = db.Column(db.Integer, db.ForeignKey("slots.id"))
    slot_time = db.Column(db.String(50))
    status = db.Column(db.String(50), default="requested")
    final_report = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    video_channel = db.Column(db.String(255), nullable=True)
    
    slot = db.relationship("Slot", backref="appointments", lazy=True)
    # Relationship to UserReport
    user_report = db.relationship("UserReport", backref="appointment", uselist=False)
    # Relationship to Doctor's Final Report (Report)
    final_doctor_report = db.relationship("Report", backref="appointment", uselist=False)


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    message = db.Column(db.String(255))
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)