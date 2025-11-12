// src/components/BookSlotModal.jsx
import React, { useState } from "react";
import API from "../api";

export default function BookSlotModal({ open, onClose, doctor, slot }) {
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (!open) return null;

  const handleConfirmBooking = async () => {
    if (!slot) return;
    // 1) ask user final confirmation
    const ok = window.confirm(`Confirm booking with ${doctor.name} at ${slot.start} — ${slot.end}?`);
    if (!ok) return;

    try {
      setConfirming(true);
      // POST appointment request (replace patient_id with logged-in user's id)
      const payload = {
        doctor_id: doctor.id || doctor.user_id,
        patient_id: parseInt(localStorage.getItem("userId") || "1", 10),
        disease: localStorage.getItem("lastPrediction") || "Consultation",
        slot_id: slot.id,
      };
      const res = await API.post("/appointment/request", payload);

      // On success, ask whether to send documents
      const sendDocs = window.confirm("Appointment requested. Do you want to send your document(s) to the doctor now?");
      if (sendDocs) {
        // retrieve documents from localStorage or from user state
        const docIds = JSON.parse(localStorage.getItem("uploadedDocIds") || "[]");
        // POST to notify/send doc endpoint (backend should handle emailing)
        await API.post("/appointment/send_documents", {
          appointment_id: res.data.appointment_id,
          doc_ids: docIds,
          doctor_id: doctor.id || doctor.user_id,
        });
        alert("Documents sent to doctor and notification dispatched.");
      }

      // Show confirmation to user
      alert("Appointment requested successfully — you will receive an email confirmation shortly.");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to request appointment. Try again.");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Confirm Booking</h3>
          <button className="text-gray-500" onClick={onClose}>✖</button>
        </div>

        <div className="mt-3 text-gray-700">
          <p><strong>Doctor:</strong> {doctor.name}</p>
          <p className="mt-1"><strong>Slot:</strong> {slot?.start} — {slot?.end}</p>
          <p className="mt-2 text-sm text-gray-500">By confirming you will request this slot. Doctor will receive a notification and will confirm or propose a new time if needed.</p>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            className="px-3 py-1 rounded border text-gray-700"
            onClick={onClose}
            disabled={confirming}
          >
            Cancel
          </button>
          <button
            className="px-4 py-1 rounded bg-gray-900 text-white"
            onClick={handleConfirmBooking}
            disabled={confirming}
          >
            {confirming ? "Processing..." : "Confirm Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
