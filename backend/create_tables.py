# create_tables.py
from app import app           # your Flask app
from core.database import db  # SQLAlchemy instance
# make sure all models are imported so SQLAlchemy knows about them
import core.models            # noqa: F401

with app.app_context():
    print("Creating all tables...")
    db.create_all()
    print("✅ Tables created (if they didn't exist).")
