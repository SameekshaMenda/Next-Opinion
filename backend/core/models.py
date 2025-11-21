from core.database import db
from datetime import datetime

# ============================
# USER MODEL
# ============================
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255))
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), default="user")

    appointments = db.relationship(
        "Appointment",
        backref="patient",
        lazy=True,
        foreign_keys="Appointment.patient_id"
    )

    user_reports = db.relationship(
        "UserReport",
        backref="patient",
        lazy=True,
        foreign_keys="UserReport.user_id"
    )


# ============================
# DOCTOR MODEL
# ============================
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

    user = db.relationship("User", backref=db.backref("doctor_profile", uselist=False))

    appointments = db.relationship("Appointment", backref="doctor", lazy=True)
    slots = db.relationship("Slot", backref="doctor", lazy=True)


# ============================
# SLOT MODEL
# ============================
class Slot(db.Model):
    __tablename__ = "slots"

    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id"), nullable=False)

    start = db.Column(db.String(20))
    end = db.Column(db.String(20))
    is_booked = db.Column(db.Boolean, default=False)


# ============================
# USER REPORT MODEL
# ============================
class UserReport(db.Model):
    __tablename__ = "user_reports"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    file_path = db.Column(db.String(512), nullable=False)

    ai_analysis = db.relationship("AIAnalysis", backref="user_report", uselist=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# ============================
# AI ANALYSIS MODEL
# ============================
class AIAnalysis(db.Model):
    __tablename__ = "ai_analyses"

    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("user_reports.id"), nullable=False, unique=True)

    risk_score = db.Column(db.Integer)
    risk_category = db.Column(db.String(50))
    suggested_specialty = db.Column(db.String(100))
    full_analysis_json = db.Column(db.Text, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# ============================
# DOCTOR FINAL REPORT MODEL
# ============================
class Report(db.Model):
    __tablename__ = "reports"

    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey("appointments.id"))

    doctor_notes = db.Column(db.Text)
    final_diagnosis = db.Column(db.Text)
    prescription = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# ============================
# APPOINTMENT MODEL
# ============================
class Appointment(db.Model):
    __tablename__ = "appointments"

    id = db.Column(db.Integer, primary_key=True)

    doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id"))
    patient_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    slot_id = db.Column(db.Integer, db.ForeignKey("slots.id"))

    disease = db.Column(db.String(255))
    status = db.Column(db.String(50), default="requested")

    ai_analysis = db.Column(db.Text)
    report_files = db.Column(db.Text)
    report_names = db.Column(db.Text)

    user_report_id = db.Column(db.Integer)
    video_channel = db.Column(db.String(255))

    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    slot = db.relationship("Slot", backref="appointments")



# ============================
# NOTIFICATION MODEL
# ============================
class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    message = db.Column(db.String(255))
    is_read = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
