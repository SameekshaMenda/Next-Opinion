from flask import Flask
from flask_cors import CORS
from core import config
from core.database import db
from routes.second_opinion import second_opinion_bp
from routes.reports import reports_bp
from routes.chat import chat_bp
from routes.doctors import doctors_bp
from routes.appointments import appointments_bp
from routes.auth import auth_bp
import os
app = Flask(__name__)
CORS(app)

# ✅ Database Configuration
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# ✅ Initialize DB
db.init_app(app)

# ✅ Register Blueprints
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(second_opinion_bp, url_prefix="/api")
app.register_blueprint(reports_bp, url_prefix="/api")
app.register_blueprint(chat_bp, url_prefix="/api")
app.register_blueprint(doctors_bp, url_prefix="/api")
app.register_blueprint(appointments_bp, url_prefix="/api")

@app.route("/")
def home():
    return "Next Opinion API is running 🚀"

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
