# scripts/import_doctors.py
import pandas as pd
from app import app
from core.database import db
from core.models import User, Doctor
from werkzeug.security import generate_password_hash
import re

CSV_PATH = "data/doctor_list.csv"
DEFAULT_PASSWORD = "123"

def normalize_col(name: str) -> str:
    # lowercase, remove punctuation, spaces -> underscore
    name = name.strip().lower()
    name = re.sub(r"[^\w\s]", "", name)
    name = re.sub(r"\s+", "_", name)
    return name

with app.app_context():
    df = pd.read_csv(CSV_PATH)
    # normalize column names
    df.columns = [normalize_col(c) for c in df.columns]

    # attempt to find common names for columns
    name_col = None
    for candidate in ("doctors_name", "doctorsname", "doctor_name", "name"):
        if candidate in df.columns:
            name_col = candidate
            break

    email_col = None
    for candidate in ("email", "e_mail"):
        if candidate in df.columns:
            email_col = candidate
            break

    phone_col = None
    for candidate in ("phone", "phone_number", "mobile"):
        if candidate in df.columns:
            phone_col = candidate
            break

    speciality_col = "speciality" if "speciality" in df.columns else None
    experience_col = None
    for c in ("experience_years", "experience", "experience_(years)"):
        if c in df.columns:
            experience_col = c
            break

    rating_col = "rating" if "rating" in df.columns else None
    location_col = "location" if "location" in df.columns else None

    count = 0
    for idx, row in df.iterrows():
        # Basic values with fallbacks
        name = str(row.get(name_col, f"Doctor_{idx}")).strip() if name_col else f"Doctor_{idx}"
        email = row.get(email_col) if email_col else None
        phone = row.get(phone_col, "")
        speciality = row.get(speciality_col) if speciality_col else ""
        experience = row.get(experience_col) if experience_col else None
        rating = row.get(rating_col) if rating_col else None
        location = row.get(location_col) if location_col else ""

        # Normalize email
        if pd.isna(email) or not str(email).strip():
            email = f"doctor_{idx}@placeholder.local"
        email = str(email).strip().lower()

        # Clean phone
        phone = "" if pd.isna(phone) else str(phone).strip()

        # Skip if user exists by email
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            # Optionally update doctor's profile if user exists but doctor row missing
            doc = Doctor.query.filter_by(user_id=existing_user.id).first()
            if not doc:
                # create doctor record mapping to existing user
                doc = Doctor(
                    user_id=existing_user.id,
                    speciality=speciality or "",
                    experience=experience or None,
                    rating=rating or None,
                    location=location or "",
                    phone=phone,
                    email=email
                )
                db.session.add(doc)
                db.session.commit()
                print(f"Updated doctor profile for existing user {existing_user.id} ({email})")
            continue

        try:
            # Create both user and doctor then commit together (atomic-ish)
            hashed_password = generate_password_hash(DEFAULT_PASSWORD, method="pbkdf2:sha256")

            user = User(
                name=name,
                email=email,
                role="doctor",
                password=hashed_password
            )
            db.session.add(user)
            db.session.flush()   # get user.id without full commit

            doctor = Doctor(
                user_id=user.id,
                speciality=speciality or "",
                experience=(int(experience) if pd.notna(experience) and str(experience).isdigit() else None),
                rating=(float(rating) if pd.notna(rating) and str(rating).replace('.','',1).isdigit() else None),
                location=location or "",
                phone=phone,
                email=email
            )
            db.session.add(doctor)
            db.session.commit()
            count += 1
            print(f"Added {name} — {email}")

        except Exception as e:
            db.session.rollback()
            print(f"Failed to add row {idx} ({email}) -> {e}")

    print(f"Import finished. Added {count} doctors.")
