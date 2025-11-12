import React, { useEffect, useState } from "react";
import API from "../api";

export default function DoctorDashboard() {
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [newSlot, setNewSlot] = useState({ startHour: "", startMin: "", endHour: "", endMin: "" });
  const [loading, setLoading] = useState(false);
  const [doctorName, setDoctorName] = useState("");

  const doctorId = localStorage.getItem("doctorId") || 1;

  // ✅ Load doctor info
  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await API.get(`/doctor/${doctorId}`);
        setDoctorName(localStorage.getItem("userName") || "Doctor");
      } catch {
        setDoctorName(res.data.name || "Doctor");
      }
    };
    fetchDoctor();
  }, [doctorId]);

  // ✅ Fetch slots & appointments
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resSlots = await API.get(`/doctor/${doctorId}/slots`);
        const resApps = await API.get(`/doctor/${doctorId}/appointments`);
        setSlots(resSlots.data.slots);
        setAppointments(resApps.data.appointments);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [doctorId]);

  // Dropdown options
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
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

  const handleAppointmentAction = async (id, action) => {
    try {
      await API.post(`/appointments/${id}/${action}`);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: action } : a))
      );
      alert(`Appointment ${action}ed`);
    } catch (err) {
      console.error(err);
      alert("Error updating appointment");
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
      {/* ================= Header ================= */}
      <header className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center bg-white shadow p-6 rounded-2xl">
        <h1 className="text-3xl font-semibold text-gray-800">
          Hello, {doctorName} 👋
        </h1>
        <p className="text-gray-600 mt-2 sm:mt-0">
          Welcome to your Dashboard
        </p>
      </header>

      {/* ================= My Availability Section ================= */}
      <section className="bg-white rounded-2xl shadow-md p-8 max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          My Availability
        </h2>

        {/* Add Slot Form */}
        <form
          onSubmit={addSlot}
          className="flex flex-col sm:flex-row gap-4 mb-6 items-center"
        >
          {/* Start Time */}
          <div className="flex flex-col sm:flex-row items-center gap-2 flex-1">
            <label className="text-gray-600 text-sm min-w-[80px]">Start:</label>
            <select
              value={newSlot.startHour}
              onChange={(e) =>
                setNewSlot({ ...newSlot, startHour: e.target.value })
              }
              className="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-gray-900 transition"
            >
              <option value="">HH</option>
              {hours.map((h) => (
                <option key={h}>{h}</option>
              ))}
            </select>
            <span>:</span>
            <select
              value={newSlot.startMin}
              onChange={(e) =>
                setNewSlot({ ...newSlot, startMin: e.target.value })
              }
              className="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-gray-900 transition"
            >
              <option value="">MM</option>
              {minutes.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* End Time */}
          <div className="flex flex-col sm:flex-row items-center gap-2 flex-1">
            <label className="text-gray-600 text-sm min-w-[80px]">End:</label>
            <select
              value={newSlot.endHour}
              onChange={(e) =>
                setNewSlot({ ...newSlot, endHour: e.target.value })
              }
              className="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-gray-900 transition"
            >
              <option value="">HH</option>
              {hours.map((h) => (
                <option key={h}>{h}</option>
              ))}
            </select>
            <span>:</span>
            <select
              value={newSlot.endMin}
              onChange={(e) =>
                setNewSlot({ ...newSlot, endMin: e.target.value })
              }
              className="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-gray-900 transition"
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
            className="bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition w-full sm:w-auto"
          >
            {loading ? "Adding..." : "Add Slot"}
          </button>
        </form>

        {/* Slot List */}
        {slots.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No available slots yet.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {slots.map((slot) => (
              <li
                key={slot.id}
                className="bg-gray-100 p-4 rounded-lg flex justify-between items-center shadow-sm hover:shadow transition"
              >
                <span className="text-gray-700 text-sm font-medium">
                  {slot.start} – {slot.end}
                </span>
                <button
                  onClick={() =>
                    setSlots((prev) => prev.filter((s) => s.id !== slot.id))
                  }
                  className="text-red-600 hover:text-red-700 text-xs font-semibold"
                >
                  ✖
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ================= Appointment Requests ================= */}
      <section className="bg-white rounded-2xl shadow-md p-8 max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Appointments
        </h2>

        {appointments.length === 0 ? (
          <p className="text-gray-500 italic">No appointments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-3 border">Patient</th>
                  <th className="p-3 border">CheckUp</th>
                  <th className="p-3 border">Slot</th>
                  <th className="p-3 border">Status</th>
                  <th className="p-3 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((app, index) => (
                  <tr
                    key={app.id}
                    className={`hover:bg-gray-50 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="p-3 border text-gray-800 font-medium">
                      {app.patient_name}
                    </td>
                    <td className="p-3 border text-gray-700">{app.disease}</td>
                    <td className="p-3 border text-gray-700">
                      {app.slot_start} - {app.slot_end}
                    </td>
                    <td className="p-3 border">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          app.status === "accepted"
                            ? "bg-green-100 text-green-700"
                            : app.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {app.status.charAt(0).toUpperCase() +
                          app.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-3 border space-x-2 text-center">
                      {app.status === "requested" && (
                        <>
                          <button
                            className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-green-700 transition"
                            onClick={() =>
                              handleAppointmentAction(app.id, "accept")
                            }
                          >
                            Accept
                          </button>
                          <button
                            className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-red-700 transition"
                            onClick={() =>
                              handleAppointmentAction(app.id, "reject")
                            }
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {app.status === "accepted" && (
                        <button
                          className="bg-gray-900 text-white px-3 py-1 rounded-lg text-xs hover:bg-gray-800 transition"
                          onClick={() => submitFinalReport(app.id)}
                        >
                          Submit Report
                        </button>
                      )}
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
