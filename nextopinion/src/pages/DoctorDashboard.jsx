import React, { useEffect, useState } from "react";
import API from "../api";

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Fetch appointments assigned to this doctor
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await API.get("/appointments?doctor_id=1"); // change doctor_id dynamically after login
        setAppointments(res.data.appointments || []);
      } catch (err) {
        console.error("Error fetching appointments:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const handleAccept = async (id) => {
    try {
      await API.post(`/appointments/${id}/accept`);
      alert("Appointment accepted!");
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: "accepted" } : a
        )
      );
    } catch (err) {
      alert("Error updating appointment");
    }
  };

  const handleReject = async (id) => {
    try {
      await API.post(`/appointments/${id}/reject`);
      alert("Appointment rejected!");
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: "rejected" } : a
        )
      );
    } catch (err) {
      alert("Error updating appointment");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-semibold mb-6">Doctor Dashboard</h1>

      {loading ? (
        <p className="text-gray-500">Loading appointments...</p>
      ) : appointments.length === 0 ? (
        <p className="text-gray-500">No appointments found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border text-sm bg-white rounded-lg shadow-md">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Patient Name</th>
                <th className="p-2 border">Disease</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Preferred Slot</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="p-2 border">{a.patient_name}</td>
                  <td className="p-2 border">{a.disease}</td>
                  <td className="p-2 border capitalize">{a.status}</td>
                  <td className="p-2 border">
                    {a.slot_time ? a.slot_time : "Not set"}
                  </td>
                  <td className="p-2 border text-center space-x-2">
                    {a.status === "requested" && (
                      <>
                        <button
                          onClick={() => handleAccept(a.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-500"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(a.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {a.status === "accepted" && (
                      <button
                        onClick={() => setSelectedAppointment(a)}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500"
                      >
                        View Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setSelectedAppointment(null)}
            >
              ✖
            </button>
            <h3 className="text-lg font-semibold mb-3 text-center">
              Appointment Details
            </h3>
            <p><b>Patient:</b> {selectedAppointment.patient_name}</p>
            <p><b>Disease:</b> {selectedAppointment.disease}</p>
            <p><b>Status:</b> {selectedAppointment.status}</p>
            <p><b>Slot:</b> {selectedAppointment.slot_time || "Not yet scheduled"}</p>

            <div className="mt-4 text-center space-x-2">
              <button
                onClick={() => alert("Chat feature coming soon!")}
                className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-500"
              >
                Open Chat
              </button>
              <button
                onClick={() => alert("Final report submission coming soon!")}
                className="bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-700"
              >
                Final Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
