// src/components/BookSlotModal.jsx
import React, { useState } from "react";
import API from "../api";

export default function BookSlotModal({ open, onClose, doctor, slot }) {
  // Use isProcessing to manage button state and prevent double clicks
  const [isProcessing, setIsProcessing] = useState(false);
  // State for success/error/warning messages displayed inside the modal
  const [message, setMessage] = useState(null); 
  // State for document sending checkbox
  const [sendDocs, setSendDocs] = useState(true); 

  if (!open) return null;

  // Function to handle the final booking and document sending process
  const handleConfirmBooking = async () => {
    if (!slot || isProcessing) return;

    // Reset message
    setMessage(null);
    
    // Use sessionStorage to retrieve user data
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    const patientId = user?.id;

    if (!patientId) {
        setMessage({ type: 'error', text: 'You must be logged in as a patient to book appointments.' });
        return;
    }

    try {
      setIsProcessing(true);
      
      // --- 1. POST appointment request ---
      const payload = {
        doctor_id: doctor.id || doctor.user_id,
        patient_id: patientId, // Using logged-in patientId
        disease: sessionStorage.getItem("lastPrediction") || "Consultation", // Using sessionStorage
        slot_id: slot.id,
      };
      
      // NOTE: Using the internal API call logic with exponential backoff for robustness
      let res;
      let attempt = 0;
      const maxRetries = 3;
      
      while (attempt < maxRetries) {
          try {
              res = await API.post("/appointment/request", payload);
              break; // Success, exit loop
          } catch (err) {
              attempt++;
              if (attempt >= maxRetries) throw err;
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000)); 
          }
      }

      const appointmentId = res.data.appointment_id;

      // --- 2. Send Documents if opted in (Replaces window.confirm) ---
      if (sendDocs) {
        const docIds = JSON.parse(sessionStorage.getItem("uploadedDocIds") || "[]");
        
        // POST to notify/send doc endpoint with backoff
        attempt = 0;
        while (attempt < maxRetries) {
            try {
                await API.post("/appointment/send_documents", {
                    appointment_id: appointmentId,
                    doc_ids: docIds,
                    doctor_id: doctor.id || doctor.user_id,
                });
                setMessage({ type: 'success', text: "Appointment requested and documents sent successfully!" });
                break; // Success, exit loop
            } catch (err) {
                attempt++;
                if (attempt >= maxRetries) {
                    // Appointment succeeded, but documents failed to send
                    setMessage({ type: 'warning', text: "Appointment requested, but failed to send documents. Please contact support." });
                    console.error("Failed to send documents:", err);
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000)); 
            }
        }
      } else {
        setMessage({ type: 'success', text: "Appointment requested successfully! Documents were not sent." });
      }

      // Close modal after a short delay for message visibility
      setTimeout(onClose, 2000); 

    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.error || "Failed to request appointment. Check your network or try again." });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    // 🌌 Backdrop - Dark and Blurry
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      
      {/* Modal Card - Dark Themed */}
      <div className="bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-sm border border-purple-500/30 text-white transform transition-all duration-300 scale-100">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-4">
          <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Confirm Booking
          </h3>
          <button 
            className="text-gray-400 hover:text-white transition-colors text-2xl" 
            onClick={onClose}
            disabled={isProcessing}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="text-gray-300 space-y-3">
          <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
            <p><strong className="text-white">Doctor:</strong> <span className="text-blue-300">{doctor.name}</span></p>
            <p className="mt-1"><strong className="text-white">Slot:</strong> <span className="text-purple-300">{slot?.start} — {slot?.end}</span></p>
          </div>
          
          <p className="text-sm text-gray-500 pt-2 border-t border-gray-800">
            By confirming you will request this slot. The doctor will review and confirm or propose a new time if needed.
          </p>
          
          {/* Document Sending Checkbox (Replaces second window.confirm) */}
          <label className="flex items-center space-x-2 text-sm text-gray-400 pt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sendDocs}
              onChange={(e) => setSendDocs(e.target.checked)}
              disabled={isProcessing}
              className="form-checkbox h-4 w-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="text-white font-medium">Send medical documents to doctor</span>
          </label>
        </div>
        
        {/* Message Display (Replaces Alerts) */}
        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${
            message.type === 'success' ? 'bg-green-600/30 text-green-400 border border-green-600' :
            message.type === 'error' ? 'bg-red-600/30 text-red-400 border border-red-600' :
            'bg-yellow-600/30 text-yellow-400 border border-yellow-600'
          }`}>
            {message.text}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          
          {/* Cancel Button */}
          <button
            className="px-4 py-2 rounded-full border border-gray-600 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </button>
          
          {/* Confirm Button (Gradient) */}
          <button
            className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold shadow-lg shadow-purple-500/30 hover:scale-[1.05] transition-all duration-300 disabled:opacity-50"
            onClick={handleConfirmBooking}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Confirm Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}