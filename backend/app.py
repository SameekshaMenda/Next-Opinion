from core import config
from flask import Flask
from flask_cors import CORS
from routes.second_opinion import second_opinion_bp
from routes.reports import reports_bp
from routes.chat import chat_bp
from routes.doctors import doctors_bp

app = Flask(__name__)
CORS(app)

# Register Blueprints
app.register_blueprint(second_opinion_bp, url_prefix="/api")
app.register_blueprint(reports_bp, url_prefix="/api")
app.register_blueprint(chat_bp, url_prefix="/api")
app.register_blueprint(doctors_bp, url_prefix="/api")

if __name__ == "__main__":
    app.run(debug=True)
