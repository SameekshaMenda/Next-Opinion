import React, { useEffect, useState } from "react";
import API from "../api";
import { Link } from "react-router-dom"; 

export default function DoctorDashboard() {
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [newSlot, setNewSlot] = useState({
    // Updated state to use 12-hour fields
    startHour: "",
    startMin: "00", // Default to 00 for minutes
    startPeriod: "AM",
    endHour: "",
    endMin: "00", // Default to 00 for minutes
    endPeriod: "PM",
  });
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const doctorId = user?.id || user?.doctor_id; 
  const doctorName = user?.name || "Doctor";

  useEffect(() => {
    if (!doctorId) {
      alert("Doctor ID missing. Please login again.");
      console.error("❌ Missing doctor_id in session storage");
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
        console.error("Error loading data:", err);
      }
    };

    if (doctorId) fetchData();
  }, [doctorId]);

  // --- Time Data ---
  const hours12 = Array.from({ length: 12 }, (_, i) => String(i === 0 ? 12 : i).padStart(2, "0")); // 01 to 12
  const minutes = ["00", "15", "30", "45"];
  const periods = ["AM", "PM"];
  // ---

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewSlot((prev) => ({ ...prev, [name]: value }));
  };
  
  // ⬇️ LOGIC TO CONVERT 12HR TO 24HR FORMAT ⬇️
  const convertTo24Hour = (hour12, minute, period) => {
    let hour = parseInt(hour12, 10);
    
    if (period === "PM" && hour !== 12) {
      hour += 12;
    } else if (period === "AM" && hour === 12) {
      hour = 0; // 12 AM is 00 hour
    }
    
    return `${String(hour).padStart(2, '0')}:${minute}`;
  };

  const addSlot = async (e) => {
    e.preventDefault();

    const { startHour, startMin, startPeriod, endHour, endMin, endPeriod } = newSlot;

    if (!startHour || !endHour)
      return alert("Please select both start and end times.");

    // Convert 12hr inputs to 24hr strings for API submission
    const start = convertTo24Hour(startHour, startMin, startPeriod);
    const end = convertTo24Hour(endHour, endMin, endPeriod);

    if (start >= end) return alert("End time must be after start time.");

    try {
      setLoading(true);
      const res = await API.post(`/doctor/${doctorId}/slots`, { start, end });

      setSlots((prev) => [...prev, res.data.slot]);
      // Reset form to default (or keep the same period for continuity)
      setNewSlot({ ...newSlot, startHour: "", endHour: "" }); 
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

  const getStatusColor = (status) => {
    switch (status) {
      case "accepted":
        return "bg-green-600/30 text-green-400";
      case "rejected":
        return "bg-red-600/30 text-red-400";
      case "completed":
        return "bg-purple-600/30 text-purple-400";
      case "pending":
      default:
        return "bg-yellow-600/30 text-yellow-400";
    }
  };

  return (
    // Clean Dark Background
    <div className="min-h-screen bg-gray-900 py-10 px-6 space-y-12 text-white">
      
      {/* Header - Minimal Shadow/Border, Gradient Text */}
      <header className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center bg-gray-900 pb-4 border-b border-gray-700">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          {doctorName}'s Dashboard
        </h1>
        <p className="text-gray-400 mt-2 sm:mt-0 text-lg font-medium">
          Welcome
        </p>
      </header>

      {/* Main Content Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Appointments Section (2/3 width) */}
        <section className="lg:col-span-2 bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-3">
            Appointments List
          </h2>

          {appointments.length === 0 ? (
            <p className="text-gray-500 italic p-4 bg-gray-900 rounded-lg">You have no pending or confirmed appointments.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-separate border-spacing-y-2">
                <thead className="text-left text-gray-400 uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-4 py-2">Patient</th>
                    <th className="px-4 py-2">CheckUp</th>
                    <th className="px-4 py-2">Slot</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Call</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {appointments.map((app) => (
                    <tr key={app.id} className="bg-gray-700/50 hover:bg-gray-700 transition-colors rounded-lg shadow-md">
                      <td className="p-4 rounded-l-lg font-semibold text-white">{app.patient_name}</td>
                      <td className="p-4 text-gray-300">{app.disease}</td>
                      <td className="p-4 text-sm text-blue-300">{app.slot_start} - {app.slot_end}</td>
                      
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                      </td>

                      {/* Call Link */}
                      <td className="p-4">
                        {app.video_channel && app.status === "accepted" ? (
                          <Link
                            to={`/call/${app.video_channel}`}
                            className="bg-gradient-to-r from-green-500 to-teal-600 text-white text-xs px-3 py-1.5 rounded-full font-semibold hover:opacity-90 transition-all"
                          >
                            Join Call
                          </Link>
                        ) : (
                          <span className="text-gray-500 text-xs">Not Ready</span>
                        )}
                      </td>

                      {/* Submit Report Button */}
                      <td className="p-4 rounded-r-lg">
                        <button
                          className="bg-purple-600 text-white text-xs px-3 py-1.5 rounded-full font-semibold hover:bg-purple-500 transition-colors disabled:opacity-50"
                          onClick={() => submitFinalReport(app.id)}
                          disabled={app.status !== 'accepted'}
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
        
        {/* Availability Section (1/3 width) */}
        <section className="lg:col-span-1 space-y-8">
          
          {/* Add Slot Form Card */}
          <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-blue-700/50">
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-3">
              Add Availability
            </h2>

            <form onSubmit={addSlot} className="space-y-4">
              
              {/* Start Time Selects (12-Hour Format) */}
              <div className="space-y-2">
                <label className="text-gray-400 text-sm font-medium block">Start Time (12 Hr):</label>
                <div className="flex items-center gap-3">
                  <select name="startHour" value={newSlot.startHour} onChange={handleChange} className="bg-gray-900 border border-gray-700 text-white p-2 rounded-lg w-full">
                    <option value="">Hour</option>
                    {hours12.map((h) => (<option key={h}>{h}</option>))}
                  </select>
                  <span className="text-gray-400">:</span>
                  <select name="startMin" value={newSlot.startMin} onChange={handleChange} className="bg-gray-900 border border-gray-700 text-white p-2 rounded-lg w-full">
                    {minutes.map((m) => (<option key={m}>{m}</option>))}
                  </select>
                  <select name="startPeriod" value={newSlot.startPeriod} onChange={handleChange} className="bg-gray-900 border border-gray-700 text-white p-2 rounded-lg">
                    {periods.map((p) => (<option key={p}>{p}</option>))}
                  </select>
                </div>
              </div>

              {/* End Time Selects (12-Hour Format) */}
              <div className="space-y-2">
                <label className="text-gray-400 text-sm font-medium block">End Time (12 Hr):</label>
                <div className="flex items-center gap-3">
                  <select name="endHour" value={newSlot.endHour} onChange={handleChange} className="bg-gray-900 border border-gray-700 text-white p-2 rounded-lg w-full">
                    <option value="">Hour</option>
                    {hours12.map((h) => (<option key={h}>{h}</option>))}
                  </select>
                  <span className="text-gray-400">:</span>
                  <select name="endMin" value={newSlot.endMin} onChange={handleChange} className="bg-gray-900 border border-gray-700 text-white p-2 rounded-lg w-full">
                    {minutes.map((m) => (<option key={m}>{m}</option>))}
                  </select>
                  <select name="endPeriod" value={newSlot.endPeriod} onChange={handleChange} className="bg-gray-900 border border-gray-700 text-white p-2 rounded-lg">
                    {periods.map((p) => (<option key={p}>{p}</option>))}
                  </select>
                </div>
              </div>

              {/* Add Slot Button (Gradient) */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2.5 rounded-full font-semibold shadow-md hover:opacity-90 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Slot"}
              </button>
            </form>
          </div>
          
          {/* Current Slots List Card */}
          <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">
              My Current Slots
            </h2>
            
            {slots.length === 0 ? (
              <p className="text-gray-500 italic">No available slots.</p>
            ) : (
              <ul className="grid grid-cols-2 gap-3">
                {slots.map((slot) => (
                  <li
                    key={slot.id}
                    className={`p-3 rounded-lg font-semibold border text-center text-sm ${slot.is_booked ? 'bg-gray-700 text-gray-400 border-gray-600' : 'bg-gray-900 text-blue-300 border-blue-500/40 hover:bg-gray-700'}`}
                  >
                    {slot.start} – {slot.end}
                    {/* Note: Time displayed here is still in 24hr format from the backend response */}
                    {slot.is_booked && <span className="text-red-500 text-xs block">(Booked)</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
        
      </div>
    </div>
  );
}