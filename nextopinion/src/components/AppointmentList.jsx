import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function AppointmentList() {
  const [appointments, setAppointments] = useState([]);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const patientId = user?.id;

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await API.get(`/patient/${patientId}/appointments`);
        setAppointments(res.data.appointments || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchAppointments();
  }, [patientId]);

  if (!appointments.length)
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-3">Your Appointments</h2>
        <p className="text-gray-500 italic">No appointments yet.</p>
      </div>
    );

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Your Appointments</h2>

      <table className="w-full text-sm border rounded">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 border">Doctor</th>
            <th className="p-3 border">Checkup</th>
            <th className="p-3 border">Slot</th>
            <th className="p-3 border">Status</th>
            <th className="p-3 border">Date</th>
            <th className="p-3 border">Call</th>
          </tr>
        </thead>

        <tbody>
          {appointments.map((app) => (
            <tr key={app.id} className="hover:bg-gray-50">
              <td className="p-3 border">{app.doctor_name}</td>
              <td className="p-3 border">{app.disease}</td>
              <td className="p-3 border">
                {app.slot_start} - {app.slot_end}
              </td>

              <td className="p-3 border">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold
                    ${
                      app.status === "accepted"
                        ? "bg-green-100 text-green-700"
                        : app.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : app.status === "completed"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-200 text-gray-700"
                    }
                  `}
                >
                  {app.status}
                </span>
              </td>

              <td className="p-3 border">{app.date}</td>

              {/* JOIN CALL */}
              <td className="p-3 border">

                {app.video_channel ? (
                  <button
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    onClick={() => navigate(`/call/${app.video_channel}`)}
                  >
                    Join Call
                  </button>
                ) : (
                  <span className="text-gray-400 text-xs">Not Available</span>
                )}

              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
