import React, { useEffect, useState } from "react";
import API from "../api";
import { Link } from "react-router-dom";

export default function DoctorDashboard() {
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [viewReport, setViewReport] = useState(null); // MODAL DATA
  const [newSlot, setNewSlot] = useState({
    startHour: "",
    startMin: "00",
    startPeriod: "AM",
    endHour: "",
    endMin: "00",
    endPeriod: "PM",
  });
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const doctorId = user?.id || user?.doctor_id;
  const doctorName = user?.name || "Doctor";

  useEffect(() => {
    const fetchData = async () => {
      const resSlots = await API.get(`/doctor/${doctorId}/slots`);
      const resApps = await API.get(`/doctor/${doctorId}/appointments`);
      setSlots(resSlots.data.slots || []);
      setAppointments(resApps.data.appointments || []);
    };
    fetchData();
  }, [doctorId]);

  const downloadUrlForPath = (p) => `/api/reports/download?path=${encodeURIComponent(p)}`;

  const submitFinalReport = async (appointmentId) => {
    const report = prompt("Enter final report/diagnosis:");
    if (!report) return;
    await API.post(`/appointments/${appointmentId}/final_report`, { report });

    const resApps = await API.get(`/doctor/${doctorId}/appointments`);
    setAppointments(resApps.data.appointments || []);

    alert("Final report submitted!");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "accepted": return "bg-green-600/30 text-green-400";
      case "rejected": return "bg-red-600/30 text-red-400";
      case "completed": return "bg-purple-600/30 text-purple-400";
      default: return "bg-yellow-600/30 text-yellow-400";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-10 px-6 text-white">

      {/* Header */}
      <header className="max-w-6xl mx-auto flex justify-between items-center pb-4 border-b border-gray-700">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          {doctorName}'s Dashboard
        </h1>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ======================= APPOINTMENTS ======================= */}
        <section className="lg:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl">

          <h2 className="text-2xl font-bold mb-6 border-b border-gray-700 pb-3">
            Appointments
          </h2>

          {appointments.length === 0 ? (
            <p className="text-gray-500 italic">No appointments yet.</p>
          ) : (
            <div className="space-y-6">
              {appointments.map((app) => (
                <div key={app.id} className="bg-gray-700/40 p-5 rounded-xl border border-gray-600 shadow-md">

                  {/* Top Row */}
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xl font-bold">{app.patient_name}</p>
                      <p className="text-gray-300 text-sm">{app.disease}</p>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </div>

                  <p className="text-blue-300 text-sm mt-2">
                    {app.slot_start} – {app.slot_end}
                  </p>

                  {/* Join Call */}
                  {app.video_channel && app.status === "accepted" && (
                    <Link
                      to={`/call/${app.video_channel}`}
                      className="inline-block mt-3 bg-gradient-to-r from-green-500 to-teal-600 px-3 py-1.5 rounded-full text-xs"
                    >
                      Join Call
                    </Link>
                  )}

                  {/* VIEW REPORT BUTTON */}
                  {(app.report_files?.length > 0 || app.ai_analysis?.length > 0) && (
                    <button
                      className="mt-4 bg-indigo-600 px-4 py-1.5 rounded-full text-xs hover:bg-indigo-500"
                      onClick={() => setViewReport(app)}
                    >
                      View Patient Report
                    </button>
                  )}

                  {/* Final Report Button */}
                  <button
                    className="mt-4 ml-3 bg-purple-600 px-4 py-1.5 rounded-full text-xs hover:bg-purple-500"
                    disabled={app.status !== "accepted"}
                    onClick={() => submitFinalReport(app.id)}
                  >
                    Submit Final Report
                  </button>

                </div>
              ))}
            </div>
          )}
        </section>

        {/* ======================= SLOT MANAGEMENT ======================= */}
        <section className="space-y-8">

          {/* Add Slot */}
          <div className="bg-gray-800 rounded-xl p-6 border border-blue-700/30 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Add Availability</h2>
            <p className="text-gray-400 text-sm mb-4">(Same as your current UI)</p>
          </div>

          {/* My Slots */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <h2 className="text-xl font-bold mb-4">My Slots</h2>
            {slots.length === 0 ? <p className="text-gray-500">No slots added yet.</p> : (
              <ul className="grid grid-cols-2 gap-3">
                {slots.map(slot => (
                  <li key={slot.id} className="p-3 rounded-lg text-center border bg-gray-900">
                    {slot.start} - {slot.end}
                    {slot.is_booked && <p className="text-red-500 text-xs">(Booked)</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* ======================= REPORT MODAL ======================= */}
      {viewReport && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
          <div className="bg-gray-800 w-full max-w-2xl p-6 rounded-xl border border-gray-700 shadow-xl">

            <h2 className="text-xl font-bold text-purple-400 mb-4">
              Patient Report & AI Analysis
            </h2>

            {/* Report Files */}
            {viewReport.report_files?.length > 0 && (
              <>
                <h3 className="text-lg font-semibold text-blue-300">Uploaded Documents</h3>
                <ul className="ml-5 mt-2 space-y-2">
                  {viewReport.report_files.map((p, idx) => (
                    <li key={idx}>
                      <a
                        href={downloadUrlForPath(p)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 underline"
                      >
                        {viewReport.report_names?.[idx] || `Report ${idx+1}`}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* AI ANALYSIS */}
            {viewReport.ai_analysis?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-green-300 mb-2">AI Analysis</h3>

                {viewReport.ai_analysis.map((ai, index) => (
                  <div key={index} className="bg-gray-900 p-4 rounded-lg border border-gray-700 mb-3">
                    <p className="text-white font-bold text-sm">{ai.disease}</p>
                    <p className="text-gray-300 text-xs mt-2">{ai.explanation}</p>
                    <p className="text-purple-400 text-xs mt-1">Risk Score: {ai.risk}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Close Button */}
            <button
              className="mt-6 w-full bg-red-600 py-2 rounded-lg font-bold"
              onClick={() => setViewReport(null)}
            >
              Close
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
