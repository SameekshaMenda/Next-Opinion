import React, { useEffect, useState } from "react";
import axios from "axios";

export default function DoctorList() {
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("recommendedDoctors");
    if (stored) setDoctors(JSON.parse(stored));
  }, []);

  const bookAppointment = async (doctorId, disease) => {
    try {
      const res = await axios.post("http://127.0.0.1:5000/api/appointment/request", {
        doctor_id: doctorId,
        patient_id: 1, // TODO: use logged-in user's ID later
        disease,
      });
      alert(`Appointment Requested! ID: ${res.data.appointment_id}`);
    } catch (err) {
      alert("Error booking appointment");
      console.error(err);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-3">Recommended Doctors</h2>
      {doctors.length === 0 ? (
        <p className="text-gray-500">No doctors found.</p>
      ) : (
        <ul className="space-y-3">
          {doctors.map((d, i) => (
            <li key={i} className="p-3 border rounded-md hover:bg-gray-100">
              <div className="font-semibold">{d.name}</div>
              <div className="text-sm text-gray-600">
                {d.speciality} • {d.location} • ⭐ {d.rating}
              </div>
              <div className="text-xs text-gray-500">
                {d.experience} years experience
              </div>
              <button
                onClick={() => bookAppointment(i + 1, "Hyperlipidemia")}
                className="mt-2 bg-gray-900 text-white text-sm px-3 py-1 rounded hover:bg-gray-700"
              >
                Book Appointment
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
