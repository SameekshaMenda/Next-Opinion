import React, { useEffect, useState } from "react";
import API from "../api";

export default function PatientReports() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user) return;

    API.get(`/patients/${user.id}/reports`)
      .then(res => setReports(res.data.reports))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-6 text-white bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold">My Medical Reports</h1>

      <div className="mt-6 space-y-4">
        {reports.map((rep) => (
          <div
            key={rep.id}
            className="bg-gray-800 p-4 rounded-lg border border-gray-700"
          >
            <p><strong>Appointment:</strong> {rep.appointment_id}</p>
            <p><strong>Doctor:</strong> {rep.doctor_name}</p>
            <p><strong>Diagnosis:</strong> {rep.final_diagnosis}</p>

            <button
              onClick={() => window.open(`/api/reports/download?path=${rep.pdf_path}`)}
              className="mt-2 px-4 py-2 bg-purple-600 rounded-lg"
            >
              Download PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
