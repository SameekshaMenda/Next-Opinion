import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function AppointmentList() {
  const [appointments, setAppointments] = useState([]);
  const navigate = useNavigate();

  const user = JSON.parse(sessionStorage.getItem("user") || "{}"); // Added default empty object for safer parsing
  const patientId = user?.id;

  useEffect(() => {
    // Only fetch if patientId exists
    if (!patientId) return;

    const fetchAppointments = async () => {
      try {
        const res = await API.get(`/patient/${patientId}/appointments`);
        setAppointments(res.data.appointments || []);
      } catch (err) {
        console.error("Error fetching appointments:", err);
      }
    };

    fetchAppointments();
  }, [patientId]);

  // --- Common Styles for Dark Theme Cards ---
  const statusColor = (status) => {
    switch (status) {
      case "accepted":
        return "bg-green-600/30 text-green-400 border-green-600";
      case "rejected":
        return "bg-red-600/30 text-red-400 border-red-600";
      case "completed":
        return "bg-purple-600/30 text-purple-400 border-purple-600";
      case "pending":
      default:
        return "bg-yellow-600/30 text-yellow-400 border-yellow-600";
    }
  };

  // --- No Appointments State ---
  if (!appointments.length)
    return (
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl mb-8 border border-blue-500/30 text-white">
        <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          Your Appointments 
        </h2>
        <p className="text-gray-400 text-lg italic p-4 bg-gray-900 rounded-lg">
          You currently have no scheduled appointments.
        </p>
      </div>
    );

  // --- Appointments List (Themed Table) ---
  return (
    <div className="bg-gray-800 p-8 rounded-xl shadow-2xl mb-8 border border-blue-500/30 text-white w-full overflow-x-auto">
      
      {/* Gradient Title */}
      <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
        Your Appointments 
      </h2>

      {/* Styled Table */}
      <table className="min-w-full text-sm border-separate border-spacing-y-2">
        <thead className="text-left text-gray-400 uppercase tracking-wider text-xs">
          <tr>
            <th className="px-4 py-2">Doctor</th>
            <th className="px-4 py-2">Checkup Type</th>
            <th className="px-4 py-2">Slot & Date</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {appointments.map((app) => (
            <tr 
                key={app.id} 
                className="bg-gray-900 hover:bg-gray-700/70 transition-colors rounded-lg shadow-lg border border-gray-700"
            >
              
              {/* Doctor Name */}
              <td className="p-4 rounded-l-lg font-semibold text-white">
                {app.doctor_name || "N/A"}
              </td>
              
              {/* Disease/Checkup */}
              <td className="p-4 text-gray-300">
                {app.disease || "General Checkup"}
              </td>
              
              {/* Slot & Date */}
              <td className="p-4 text-sm text-blue-400">
                <div className="font-semibold">{app.slot_start} - {app.slot_end}</div>
                <div className="text-xs text-gray-500">{app.date}</div>
              </td>

              {/* Status Pill */}
              <td className="p-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${statusColor(app.status)}`}
                >
                  {app.status}
                </span>
              </td>

              {/* JOIN CALL Button */}
              <td className="p-4 rounded-r-lg">
                {app.video_channel && app.status === "accepted" ? (
                  <button
                    className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-4 py-2 rounded-full font-semibold shadow-md hover:scale-[1.05] transition-all disabled:opacity-50"
                    onClick={() => navigate(`/call/${app.video_channel}`)}
                  >
                    Join Call
                  </button>
                ) : (
                  <span className="text-gray-500 text-xs">Call Unavailable</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}