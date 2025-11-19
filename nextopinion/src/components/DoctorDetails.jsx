import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api";

export default function DoctorDetails() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  // Get Logged-in User
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const userId = user?.id;
  const userRole = user?.role;

  // Warn if not logged in
  useEffect(() => {
    if (!userId) {
      alert("Please login to book an appointment.");
    }
  }, [userId]);

  // Fetch doctor & available slots
  useEffect(() => {
    const load = async () => {
      try {
        const docRes = await API.get(`/doctors/${id}`);
        setDoctor(docRes.data);

        const slotRes = await API.get(`/doctor/${id}/slots`);
        setSlots(slotRes.data.slots || []);
      } catch (err) {
        console.error(err);
        alert("Error loading doctor information.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Book appointment
  const handleBookSlot = async (slotId, start, end) => {
    if (userRole === "doctor") {
      alert("Doctors cannot book appointments. Please login as a patient.");
      return;
    }

    if (!userId) {
      alert("Please login to book an appointment.");
      return;
    }

    if (!window.confirm(`Confirm appointment at ${start} - ${end}?`)) return;

    try {
      setBooking(true);

      const res = await API.post("/appointment/request", {
        doctor_id: Number(id),
        patient_id: Number(userId),
        // NOTE: Ideally, the disease should be pulled from a user report or input field
        disease: "General Checkup", 
        slot_id: slotId
      });

      alert("Appointment booked successfully!");

      // Update the UI instantly
      setSlots(prev =>
        prev.map(s => (s.id === slotId ? { ...s, is_booked: true } : s))
      );

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Could not book appointment.");
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <p className="text-center mt-10 text-white">Loading...</p>;
  if (!doctor) return <p className="text-center text-red-400 mt-10">Doctor not found.</p>;

  return (
    // 🌌 Dark background container
    <div className="min-h-screen bg-gray-900 flex justify-center items-start p-10">
      
      {/* Dark Details Card */}
      <div className="bg-gray-800 shadow-2xl rounded-xl p-10 max-w-4xl w-full space-y-8 border border-purple-500/30">

        {/* Doctor Info */}
        <h2 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          {doctor.name}
        </h2>
        
        {/* Detail List */}
        <div className="text-gray-300 space-y-3 text-center border-b border-gray-700 pb-6">
          <p className="text-lg">
            <b className="text-white">Speciality:</b> <span className="text-blue-400">{doctor.speciality}</span>
          </p>
          <p>
            <b className="text-white">Experience:</b> {doctor.experience} years
          </p>
          <p>
            <b className="text-white">Rating:</b> <span className="text-yellow-400">⭐ {doctor.rating}</span>
          </p>
          <p>
            <b className="text-white">Location:</b> {doctor.location}
          </p>
          <p className="text-sm text-gray-500">
            Email: {doctor.email} | Phone: {doctor.phone}
          </p>
        </div>

        {/* Slots Section */}
        <div>
          <h3 className="text-xl font-bold text-center mt-4 mb-6 text-white">
            Available Appointment Slots 🗓️
          </h3>

          {slots.length === 0 ? (
            <p className="text-center text-gray-500 p-4 bg-gray-700/50 rounded-lg">No slots available right now.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {slots.map(slot => (
                <button
                  key={slot.id}
                  disabled={slot.is_booked || booking}
                  onClick={() => handleBookSlot(slot.id, slot.start, slot.end)}
                  className={`p-4 rounded-full font-semibold transition-all shadow-md
                    ${
                      slot.is_booked
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600"
                        : "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-blue-500/50 hover:scale-[1.02]"
                    }
                  `}
                >
                  {slot.start} – {slot.end}
                  {slot.is_booked && " (Booked)"}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}