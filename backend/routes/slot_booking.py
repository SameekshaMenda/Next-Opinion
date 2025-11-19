from flask import Blueprint, request, jsonify
from core.database import db
from core.models import Slot, Appointment, Doctor, User, UserReport, AIAnalysis
from core.notifications import send_notification
from core.email_service import send_email 
import json 

slot_bp = Blueprint("slot_bp", __name__)

# ✅ Fetch all available slots for a doctor
@slot_bp.route("/doctor/<int:doctor_id>/slots", methods=["GET"])
def get_doctor_slots(doctor_id):
    slots = Slot.query.filter_by(doctor_id=doctor_id, is_booked=False).all()
    return jsonify({"slots": [{"id": s.id, "start": s.start, "end": s.end} for s in slots]})


# ✅ Book a slot (user chooses slot) - UPDATED TO INCLUDE REPORT & EMAIL
@slot_bp.route("/appointment/book", methods=["POST"])
def book_appointment():
    data = request.json
    doctor_id = data["doctor_id"]
    patient_id = data["patient_id"]
    slot_id = data["slot_id"]
    disease = data.get("disease", "Consultation")
    user_report_id = data.get("user_report_id") # Expecting the ID of the analyzed report

    slot = Slot.query.get(slot_id)
    if not slot or slot.is_booked:
        return jsonify({"error": "Slot unavailable"}), 400
    
    # 1. Fetch relevant records
    # Assumes Doctor model has a relationship to User (doctor.user)
    doctor = Doctor.query.options(db.joinedload(Doctor.user)).get(doctor_id)
    patient = User.query.get(patient_id)
    
    report = None
    ai_analysis = None
    if user_report_id:
        report = UserReport.query.get(user_report_id)
        # Fetch AI analysis linked to this report
        ai_analysis = AIAnalysis.query.filter_by(report_id=user_report_id).first() 
    
    if not doctor or not patient:
        return jsonify({"error": "Doctor or Patient not found"}), 404
    if not doctor.email:
         return jsonify({"error": "Doctor email missing, cannot send notification"}), 500


    # 2. Create Appointment
    new_appt = Appointment(
        doctor_id=doctor_id,
        patient_id=patient_id,
        user_report_id=user_report_id, # Link the report
        disease=disease,
        slot_id=slot_id,
        slot_time=slot.start, 
        status="requested",
    )
    slot.is_booked = True
    db.session.add(new_appt)
    db.session.commit()

    # 3. Prepare and Send Email Notification to Doctor
    email_subject = f"New Appointment: {patient.name} - {disease} ({slot.start})"
    
    email_body = f"""
    Dear Dr. {doctor.user.name},

    You have a new appointment request from {patient.name}.

    - Patient: {patient.name}
    - Time: {slot.start} - {slot.end}
    - Reason: {disease}
    - Appointment ID: {new_appt.id}
    
    """
    
    attachment_paths = []
    if report and ai_analysis:
        attachment_paths.append(report.file_path)
        
        # Load the full JSON analysis for detailed email body
        analysis_data = json.loads(ai_analysis.full_analysis_json)
        
        email_body += f"""
    
    --- AI SECOND OPINION ANALYSIS ---
    
    - Risk Score: {ai_analysis.risk_score}/100 ({ai_analysis.risk_category})
    - Suggested Specialty: {ai_analysis.suggested_specialty}
    - Patient Summary: {analysis_data.get('patient_summary', 'N/A')}

    Differential Diagnosis:
    """
        for i, diag in enumerate(analysis_data.get('differential_diagnosis', [])[:3]):
            email_body += f"    {i+1}. {diag['condition']} (Confidence: {diag['confidence_percent']}%) \n"
            
        email_body += f"""
    
    Please find the patient's original uploaded report attached to this email. 
    The full AI analysis is also available on your dashboard.
    """

    send_email(
        to=doctor.email, 
        subject=email_subject, 
        body=email_body, 
        attachment_paths=attachment_paths
    )

    # 4. Send Notification to Doctor
    send_notification(doctor.user_id, f"New appointment request from {patient.name} for {disease}.")
    
    return jsonify({
        "message": "Appointment requested successfully and doctor notified.", 
        "appointment_id": new_appt.id
    })


# (Existing route kept for compatibility)
@slot_bp.route("/appointment/send_documents", methods=["POST"])
def send_documents():
    data = request.json
    doctor_id = data["doctor_id"]
    appointment_id = data["appointment_id"]

    send_notification(doctor_id, f"Documents shared for appointment ID: {appointment_id}")
    return jsonify({"status": "documents_sent"})