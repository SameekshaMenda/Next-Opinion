import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Import useNavigate for View Profile button

export default function DoctorList() {
  const [doctors, setDoctors] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Correctly using sessionStorage as defined in your components
    const stored = sessionStorage.getItem("recommendedDoctors");
    if (stored) setDoctors(JSON.parse(stored));
  }, []);

  const bookAppointment = async (doctorId, disease) => {
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    const patientId = user?.id;

    if (!patientId) {
      alert("Please log in to book an appointment.");
      return;
    }

    try {
      const res = await axios.post("http://127.0.0.1:5000/api/appointment/request", {
        doctor_id: doctorId,
        patient_id: patientId,
        disease,
      });

      alert(`Appointment Requested! ID: ${res.data.appointment_id}`);
    } catch (err) {
      alert("Error booking appointment. Ensure a valid Doctor ID and Patient ID are used.");
      console.error(err);
    }
  };


  return (
    // 🌌 Dark Card Container
    <div className="bg-gray-800 p-8 rounded-xl shadow-2xl mb-8 border border-blue-500/30 max-w-4xl mx-auto">
      
      {/* Gradient Title */}
      <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
        Top Recommended Specialists 🧑‍⚕️
      </h2>
      
      {doctors.length === 0 ? (
        <p className="text-gray-400 text-lg italic p-4 bg-gray-700/50 rounded-lg">
          No doctors found. Please ensure you have uploaded and analyzed a report to get personalized recommendations.
        </p>
      ) : (
        <ul className="space-y-4">
          {doctors.map((d, i) => (
            // Dark Doctor List Item - Cleaned up and improved layout
            <li key={i} className="p-5 border border-gray-700 rounded-xl bg-gray-900/50 hover:bg-gray-700/70 transition-all flex justify-between items-center gap-6">
              
              {/* Doctor Info */}
              <div className="flex-1">
                <div className="font-bold text-xl text-white mb-0.5">{d.name || `Doctor ${i + 1}`}</div>
                <div className="text-base text-blue-400 mb-2">
                  {d.speciality}
                </div>
                <div className="text-sm text-gray-400">
                  📍 {d.location}
                </div>
              </div>
              
              {/* Action and Rating */}
              <div className="flex flex-col items-end space-y-3">
                
                {/* Rating */}
                <div className="font-extrabold text-lg text-yellow-400 flex items-center gap-1">
                  ⭐ {d.rating || 'N/A'}
                </div>
                
                {/* Experience (Small text underneath rating) */}
                <span className="text-xs text-gray-500">{d.experience || 'N/A'} years exp.</span>

                {/* View Profile Button (Primary action link) */}
                 <button
                    onClick={() => navigate(`/doctor/${d.id || i + 1}`)} // Assuming the DoctorDetails route uses an ID
                    className="bg-purple-600 text-white text-sm px-4 py-2 rounded-full font-semibold hover:bg-purple-500 transition-colors shadow-md"
                  >
                    View Profile
                  </button>

                {/* Book Appointment Button (Secondary action) - Gradient style retained */}
                <button
                  onClick={() => bookAppointment(d.id || i + 1, d.disease || "Second Opinion")} 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm px-4 py-2 rounded-full font-semibold shadow-md hover:scale-[1.05] transition-all"
                >
                  Book Appointment
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}