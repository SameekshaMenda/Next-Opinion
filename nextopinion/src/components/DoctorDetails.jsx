import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api";

export default function DoctorDetails() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const userId = localStorage.getItem("userId") || 1; // Replace with actual auth later

  // Fetch doctor info + slots
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resDoctor = await API.get(`/doctors/${id}`);
        setDoctor(resDoctor.data);

        const resSlots = await API.get(`/doctor/${id}/slots`);
        setSlots(resSlots.data.slots || []);
      } catch (err) {
        console.error("Error fetching doctor:", err);
        alert("Error loading doctor info");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleBookSlot = async (slotId, start, end) => {
    if (!window.confirm(`Confirm appointment at ${start} - ${end}?`)) return;

    try {
      setBooking(true);

      // Optional document share confirmation
      const shareDocs = window.confirm("Do you want to share your uploaded medical documents with this doctor?");

      const appointmentPayload = {
        doctor_id: id,
        patient_id: userId,
        disease: "General Checkup", // or AI-predicted disease
        slot_id: slotId,
        share_docs: shareDocs,
      };

      const res = await API.post("/appointment/request", appointmentPayload);
      alert("✅ Appointment successfully requested!");
      console.log("Appointment Response:", res.data);
    } catch (err) {
      console.error(err);
      alert("Error booking appointment");
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <p className="text-center text-gray-600 mt-10">Loading...</p>;
  if (!doctor) return <p className="text-center text-red-500">Doctor not found.</p>;

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-start p-6">
      <div className="bg-white shadow-lg rounded-xl p-8 max-w-3xl w-full space-y-6">
        {/* ================= Doctor Info ================= */}
        <h2 className="text-3xl font-bold text-gray-800 text-center">
          {doctor.name}
        </h2>
        <div className="text-gray-700 space-y-2 text-center">
          <p><b>Speciality:</b> {doctor.speciality}</p>
          <p><b>Experience:</b> {doctor.experience} years</p>
          <p><b>Rating:</b> ⭐ {doctor.rating}</p>
          <p><b>Location:</b> {doctor.location}</p>
          <p><b>Email:</b> {doctor.email}</p>
          <p><b>Phone:</b> {doctor.phone}</p>
        </div>

        {/* ================= Available Slots ================= */}
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 text-center">
            Available Appointment Slots
          </h3>
          {slots.length === 0 ? (
            <p className="text-center text-gray-500">No available slots right now.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  disabled={booking}
                  onClick={() => handleBookSlot(slot.id, slot.start, slot.end)}
                  className="p-3 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  {slot.start} - {slot.end}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
