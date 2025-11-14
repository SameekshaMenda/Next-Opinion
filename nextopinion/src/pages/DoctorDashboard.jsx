import React, { useEffect, useState } from "react";
import API from "../api";

export default function DoctorDashboard() {
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [newSlot, setNewSlot] = useState({
    startHour: "",
    startMin: "",
    endHour: "",
    endMin: "",
  });
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const doctorId = user?.doctor_id;
  const doctorName = user?.name || "Doctor";

  useEffect(() => {
    if (!doctorId) {
      alert("Doctor ID missing. Please login again.");
      console.error("❌ Missing doctor_id in localStorage");
    }
  }, [doctorId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resSlots = await API.get(`/doctor/${doctorId}/slots`);
        const resApps = await API.get(`/doctor/${doctorId}/appointments`);

        setSlots(resSlots.data.slots || []);
        setAppointments(resApps.data.appointments || []);
      } catch (err) {
        console.error("❌ Error loading data:", err);
      }
    };

    if (doctorId) fetchData();
  }, [doctorId]);

  const hours = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0")
  );
  const minutes = ["00", "15", "30", "45"];

  const addSlot = async (e) => {
    e.preventDefault();

    const { startHour, startMin, endHour, endMin } = newSlot;

    if (!startHour || !startMin || !endHour || !endMin)
      return alert("Please select both start and end times.");

    const start = `${startHour}:${startMin}`;
    const end = `${endHour}:${endMin}`;

    if (start >= end) return alert("End time must be after start time.");

    try {
      setLoading(true);
      const res = await API.post(`/doctor/${doctorId}/slots`, { start, end });

      setSlots((prev) => [...prev, res.data.slot]);
      setNewSlot({ startHour: "", startMin: "", endHour: "", endMin: "" });
    } catch (err) {
      console.error(err);
      alert("Error adding slot");
    } finally {
      setLoading(false);
    }
  };

  const submitFinalReport = async (appointmentId) => {
    const report = prompt("Enter final report/diagnosis:");
    if (!report) return;

    try {
      await API.post(`/appointments/${appointmentId}/final_report`, { report });
      alert("Final report submitted!");
    } catch (err) {
      console.error(err);
      alert("Error submitting report");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6 space-y-12">
      
      {/* Header */}
      <header className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center bg-white shadow p-6 rounded-2xl">
        <h1 className="text-3xl font-semibold text-gray-800">
          Hello, {doctorName} 👋
        </h1>
        <p className="text-gray-600 mt-2 sm:mt-0">
          Welcome to your Dashboard
        </p>
      </header>

      {/* Availability Section */}
      <section className="bg-white rounded-2xl shadow-md p-8 max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          My Availability
        </h2>

        <form
          onSubmit={addSlot}
          className="flex flex-col sm:flex-row gap-4 mb-6 items-center"
        >
          <div className="flex items-center gap-2 flex-1">
            <label className="text-gray-600 text-sm min-w-[80px]">Start:</label>
            <select
              value={newSlot.startHour}
              onChange={(e) =>
                setNewSlot({ ...newSlot, startHour: e.target.value })
              }
              className="border p-2 rounded-lg"
            >
              <option value="">HH</option>
              {hours.map((h) => (
                <option key={h}>{h}</option>
              ))}
            </select>
            :
            <select
              value={newSlot.startMin}
              onChange={(e) =>
                setNewSlot({ ...newSlot, startMin: e.target.value })
              }
              className="border p-2 rounded-lg"
            >
              <option value="">MM</option>
              {minutes.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 flex-1">
            <label className="text-gray-600 text-sm min-w-[80px]">End:</label>
            <select
              value={newSlot.endHour}
              onChange={(e) =>
                setNewSlot({ ...newSlot, endHour: e.target.value })
              }
              className="border p-2 rounded-lg"
            >
              <option value="">HH</option>
              {hours.map((h) => (
                <option key={h}>{h}</option>
              ))}
            </select>
            :
            <select
              value={newSlot.endMin}
              onChange={(e) =>
                setNewSlot({ ...newSlot, endMin: e.target.value })
              }
              className="border p-2 rounded-lg"
            >
              <option value="">MM</option>
              {minutes.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-gray-800"
          >
            {loading ? "Adding..." : "Add Slot"}
          </button>
        </form>

        {slots.length === 0 ? (
          <p className="text-gray-500 italic">No available slots yet.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {slots.map((slot) => (
              <li
                key={slot.id}
                className="bg-gray-100 p-4 rounded-lg flex justify-between items-center"
              >
                <span>
                  {slot.start} – {slot.end}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Appointments */}
      <section className="bg-white rounded-2xl shadow-md p-8 max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Appointments
        </h2>

        {appointments.length === 0 ? (
          <p className="text-gray-500 italic">No appointments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 border">Patient</th>
                  <th className="p-3 border">CheckUp</th>
                  <th className="p-3 border">Slot</th>
                  <th className="p-3 border">Status</th>

                  {/* ⭐ NEW COLUMN */}
                  <th className="p-3 border">Call</th>

                  <th className="p-3 border">Report</th>
                </tr>
              </thead>

              <tbody>
                {appointments.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="p-3 border">{app.patient_name}</td>
                    <td className="p-3 border">{app.disease}</td>
                    <td className="p-3 border">
                      {app.slot_start} - {app.slot_end}
                    </td>
                    <td className="p-3 border">{app.status}</td>

                    {/* ⭐ NEW CALL BUTTON */}
                    <td className="p-3 border">
                      {app.video_channel ? (
                        <a
                          href={`/call/${app.video_channel}`}
                          className="bg-green-600 text-white px-3 py-1 rounded"
                        >
                          Join Call
                        </a>
                      ) : (
                        <span className="text-gray-400">Not Available</span>
                      )}
                    </td>

                    <td className="p-3 border">
                      <button
                        className="bg-gray-900 text-white px-3 py-1 rounded"
                        onClick={() => submitFinalReport(app.id)}
                      >
                        Submit Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}
      </section>
    </div>
  );
}
