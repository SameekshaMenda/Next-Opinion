# NextOpinion – AI-Powered Second Medical Opinion Platform

NextOpinion is a full-stack healthcare platform designed to help patients obtain **accurate second medical opinions** through AI-powered report analysis and real-time video consultations with certified doctors.

This system integrates:
- AI-based health report summarization  
- Automated disease risk analysis  
- Doctor appointment booking  
- Secure video consultations  
- Final medical report generation (PDF)  

The goal is to **simplify remote healthcare** and ensure patients receive trustworthy insights before proceeding with treatments.

---

## 🚀 Features

### 👤 **Patient Module**
- Upload medical reports (PDF/JPG/PNG)
- AI analysis of symptoms + risk estimation
- Automatic doctor recommendations
- Book appointment with specialists
- Join real-time video consultations
- Download final doctor-certified PDF report

### 👨‍⚕️ **Doctor Module**
- Manage availability slots
- View patient history and uploaded reports
- Access AI-generated health insights
- Conduct live video consultations
- Submit final medical opinion report (PDF auto-generated)

### 📞 **Video Consultation**
- Built using AGORA WebRTC SDK  
- Live audio + video + screen rendering  
- Auto-redirect to doctor final-report page after call  

### 🤖 **AI Analysis Engine**
- Extracts text from reports  
- Identifies potential diseases  
- Produces explanations, risk scores, and suggestions  

### 📄 **Report Generation**
- Final PDF includes:
  - Summary of consultation  
  - Final diagnosis  
  - Recommended tests  
  - Lifestyle advice  
  - Prescription  

---

## 🛠️ Tech Stack

### **Frontend**
- React.js (Vite)
- Tailwind CSS
- React Router DOM
- Axios
- Agora WebRTC SDK

### **Backend**
- Python Flask (REST API)
- SQLAlchemy ORM
- FPDF2 (PDF generation)
- smtplib (Email service)
- PostgresSQL (pgAdmin)

### **Database**
- PostgreSQL – structured relational DB  
- Tables:
  - users  
  - doctors  
  - slots  
  - appointments  
  - reports  
  - user_reports  

---


## ⚙️ Installation Guide

### 1️⃣ **Clone the Repository**
```sh
git clone https://github.com/yourusername/nextopinion.git
cd nextopinion
```

## 🔧 Backend Setup (Flask)

### 2️⃣ Create Virtual Environment
```sh
cd backend
python -m venv venv
venv/Scripts/activate   # Windows
```
### 3️⃣ Install Dependencies
```sh
pip install -r requirements.txt
```


### 4️⃣ Create .env
```sh
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
DATABASE_URL=postgresql://username:password@localhost/nextopinion
AGORA_APP_ID=xxxx
AGORA_CERTIFICATE=xxxx
```

### 5️⃣ Run Backend
```sh
python app.py
```

### Backend starts at:
```sh
http://localhost:5000
```
---

## 🎨 Frontend Setup (React)
```sh
cd frontend
npm install
npm run dev
```


### Frontend runs at:
```sh
http://localhost:5173
```

---
# 📡 Complete API Documentation

Below are all major backend endpoints used in the project.

## 🔐 Auth & User APIs

### `POST /api/register`
**Description:** Create a new user (patient or doctor).

### `POST /api/login`
**Description:** Authenticate and return user profile.

---

## 🧠 AI Report Analysis APIs

### `POST /api/analyze-report`
**Description:** Uploads a user report and performs AI analysis.
**Returns:**
* Disease prediction
* Risk score
* Explanation
* Recommended specialists

---

## 📤 User Reports

### `POST /api/upload-report`
**Description:** Uploads patient medical report(s).

### `GET /api/user_reports/:id`
**Description:** Fetch all uploaded reports for a patient.

---

## 👨‍⚕️ Doctor APIs

### `GET /api/doctors`
**Description:** List all doctors available.

### `GET /api/doctors/:id`
**Description:** Fetch doctor details & specialty.

### `GET /api/doctor/:id/slots`
**Description:** List all available consultation slots of a doctor.

### `POST /api/doctor/:id/slots`
**Description:** Add new availability slot.

---

## 📅 Appointment APIs

### `POST /api/appointment/request`
**Description:** Creates a new appointment, sends email, stores AI analysis.
**Sample Payload:**
```json
{
  "doctor_id": 1,
  "patient_id": 777,
  "disease": "Borderline LDL",
  "slot_id": 3,
  "ai_result": [],
  "file_paths": [],
  "filenames": []
}
```

### `GET /api/patient/:id/appointments`
**Description:** Fetch all appointments of a patient.

### `GET /api/doctor/:id/appointments`
**Description:** Fetch all appointments for a doctor.

### `POST /api/appointment/:id/cancel`
**Description:** Cancels appointment & sends cancellation email.

### `POST /api/appointment/:id/reschedule`
**Description:** Reschedules the appointment based on new slot.

---

## 📞 Video Call – Agora

### `POST /api/generate_token`
**Description:** Generates Agora RTC token for secure call session.

**Sample Payload:**
```json
{
  "channel_name": "channel_xyz",
  "uid": 123
}
```
---
## 📝 Final Consultation Report APIs

### `POST /api/appointments/:id/final_report_full`
**Description:** Doctor submits final consultation report.

**Side Effects:**
* Creates a new row in reports table.
* Generates a downloadable PDF saved at `/generated_reports`.
* Updates `appointments.final_report_path`.

**Sample Payload:**
```json
{
  "consultation_summary": "...",
  "diagnosis": "...",
  "medications": "...",
  "recommended_tests": "...",
  "lifestyle_advice": "..."
}
```
### `GET /api/reports/download?path=...`
**Description:** Download the final doctor report (PDF).
