from app import app
from core.database import db
from core.models import User, Doctor

with app.app_context():
    # Create a doctor user
    doctor_user = User(name="Dr. Arjun Sharma", email="arjun@clinic.com", role="doctor", password="hashed_pw")
    db.session.add(doctor_user)
    db.session.commit()

    # Create a patient user
    patient_user = User(name="Sameeksha", email="sameeksha@user.com", role="patient", password="hashed_pw")
    db.session.add(patient_user)
    db.session.commit()

    # Create a doctor profile linked to the doctor_user
    doctor = Doctor(
        user_id=doctor_user.id,
        speciality="Cardiologist",
        experience="10",
        rating="4.8",
        location="Mumbai"
    )
    db.session.add(doctor)
    db.session.commit()

    print("✅ Doctor ID:", doctor.id)
    print("✅ Patient ID:", patient_user.id)
