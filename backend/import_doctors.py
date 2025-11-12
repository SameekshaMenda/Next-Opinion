import pandas as pd
from app import app
from core.database import db
from core.models import User, Doctor
from werkzeug.security import generate_password_hash

# Load CSV
df = pd.read_csv("data/doctor_list.csv")
df.columns = [c.strip().lower() for c in df.columns]

with app.app_context():
    count = 0
    for _, row in df.iterrows():
        name = str(row.get("doctor's name", "Unknown")).strip()
        email = row.get("email")
        phone = str(row.get("phone", "")).strip() if not pd.isna(row.get("phone")) else ""

        # ✅ Handle NaN or missing email
        if pd.isna(email) or not str(email).strip():
            email = f"doctor_{count}@placeholder.com"

        email = str(email).strip().lower()

        # ✅ Skip duplicates
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            continue

        # ✅ Hash password securely
        hashed_password = generate_password_hash("123", method="pbkdf2:sha256")

        # Create doctor user
        user = User(
            name=name,
            email=email,
            role="doctor",
            password=hashed_password
        )
        db.session.add(user)
        db.session.commit()

        # Create doctor profile
        doctor = Doctor(
            user_id=user.id,
            speciality=row.get("speciality", ""),
            experience=row.get("experience (years)", ""),
            rating=row.get("rating", ""),
            location=row.get("location", ""),
            phone=phone,
            email=email
        )
        db.session.add(doctor)
        db.session.commit()

        count += 1
        print(f"✅ Added Doctor: {user.name} ({doctor.speciality}) — {doctor.location}")

    print(f"🎉 Import complete! Total doctors added: {count}")
