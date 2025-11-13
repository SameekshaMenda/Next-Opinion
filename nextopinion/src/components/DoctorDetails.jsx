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
  const user = JSON.parse(localStorage.getItem("user") || "{}");
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

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!doctor) return <p className="text-center text-red-500">Doctor not found.</p>;

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-start p-6">
      <div className="bg-white shadow-lg rounded-xl p-8 max-w-3xl w-full space-y-6">

        {/* Doctor Info */}
        <h2 className="text-3xl font-bold text-center">{doctor.name}</h2>

        <div className="text-gray-700 space-y-2 text-center">
          <p><b>Speciality:</b> {doctor.speciality}</p>
          <p><b>Experience:</b> {doctor.experience} years</p>
          <p><b>Rating:</b> ⭐ {doctor.rating}</p>
          <p><b>Location:</b> {doctor.location}</p>
          <p><b>Email:</b> {doctor.email}</p>
          <p><b>Phone:</b> {doctor.phone}</p>
        </div>

        {/* Slots */}
        <div>
          <h3 className="text-xl font-semibold text-center mt-4 mb-4">
            Available Appointment Slots
          </h3>

          {slots.length === 0 ? (
            <p className="text-center text-gray-500">No slots available right now.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {slots.map(slot => (
                <button
                  key={slot.id}
                  disabled={slot.is_booked || booking}
                  onClick={() => handleBookSlot(slot.id, slot.start, slot.end)}
                  className={`p-3 rounded-lg font-medium transition
                    ${
                      slot.is_booked
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : "bg-gray-900 text-white hover:bg-gray-700"
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
