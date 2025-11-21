import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";

export default function DoctorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  // Logged-in user
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const userId = user?.id;
  const userRole = user?.role;

  // 🔥 Load the unified second opinion object
  const reportInfo = JSON.parse(
    sessionStorage.getItem("second_opinion_result") || "{}"
  );

  // optional chaining for safety
  const ai_result = reportInfo?.ai_result || [];
  const file_paths = reportInfo?.file_paths || [];
  const filenames = reportInfo?.filenames || [];
  const user_report_id = reportInfo?.report_id || null;

  useEffect(() => {
    if (!userId) alert("Please login to book an appointment.");
  }, [userId]);

  useEffect(() => {
    const load = async () => {
      try {
        const docRes = await API.get(`/doctors/${id}`);
        setDoctor(docRes.data);

        const slotRes = await API.get(`/doctor/${id}/slots`);
        setSlots(slotRes.data.slots || []);
      } catch (err) {
        console.error(err);
        alert("Error loading doctor data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // -------------------------------------------------------
  // 📌 BOOKING
  // -------------------------------------------------------
  const handleBookSlot = async (slotId, start, end) => {
    if (userRole === "doctor") {
      return alert("Doctors cannot book appointments.");
    }

    if (!userId) {
      return alert("Please login to continue.");
    }

    if (!window.confirm(`Confirm appointment at ${start} – ${end}?`)) return;

    try {
      setBooking(true);

      const payload = {
        doctor_id: Number(id),
        patient_id: Number(userId),
        disease: ai_result?.[0]?.disease || "General Checkup",
        slot_id: slotId,

        // Exact backend fields
        ai_result,
        file_paths,
        filenames,
        user_report_id,
      };

      await API.post("/appointment/request", payload);

      alert("Appointment booked successfully!");

      // Update UI instantly
      setSlots((prev) =>
        prev.map((s) => (s.id === slotId ? { ...s, is_booked: true } : s))
      );

      navigate("/user");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Slot unavailable.");
    } finally {
      setBooking(false);
    }
  };

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------
  if (loading)
    return <p className="text-center mt-10 text-white">Loading...</p>;

  if (!doctor)
    return <p className="text-center text-red-400 mt-10">Doctor not found.</p>;

  return (
    <div className="min-h-screen bg-gray-900 flex justify-center items-start p-10">
      <div className="bg-gray-800 shadow-2xl rounded-xl p-10 max-w-4xl w-full space-y-8 border border-purple-500/30">

        <h2 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          {doctor.name}
        </h2>

        <div className="text-gray-300 space-y-3 text-center border-b border-gray-700 pb-6">
          <p><b className="text-white">Speciality:</b> <span className="text-blue-400">{doctor.speciality}</span></p>
          <p><b className="text-white">Experience:</b> {doctor.experience} years</p>
          <p><b className="text-white">Rating:</b> ⭐ {doctor.rating}</p>
          <p><b className="text-white">Location:</b> {doctor.location}</p>
          <p className="text-sm text-gray-500">Email: {doctor.email} | Phone: {doctor.phone}</p>
        </div>

        <h3 className="text-xl font-bold text-center mt-4 mb-6 text-white">
          Available Appointment Slots 🗓️
        </h3>

        {slots.length === 0 ? (
          <p className="text-center text-gray-500 p-4 bg-gray-700/50 rounded-lg">
            No slots available at the moment.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {slots.map((slot) => (
              <button
                key={slot.id}
                disabled={slot.is_booked || booking}
                onClick={() => handleBookSlot(slot.id, slot.start, slot.end)}
                className={`p-4 rounded-full font-semibold shadow-md transition-all
                  ${
                    slot.is_booked
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600"
                      : "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:scale-[1.02]"
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
  );
}
