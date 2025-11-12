import React, { useState } from "react";
import API from "../api";

export default function UploadReports({ onReportCreated }) {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please upload a medical document");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_name", "Sameeksha");

    setLoading(true);
    try {
      const res = await API.post("/second_opinion", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResults(res.data.ai_result || []);
      onReportCreated(res.data.report_id);

      // ✅ Flatten and store recommended doctors
      const allDoctors = res.data.ai_result.flatMap(
        (disease) => disease.recommended_doctors || []
      );
      localStorage.setItem("recommendedDoctors", JSON.stringify(allDoctors));
    } catch (err) {
      console.error(err);
      alert("Error analyzing document");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-4">Upload Medical Document</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.txt"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full border p-2 rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white py-2 rounded hover:bg-gray-700"
        >
          {loading ? "Analyzing..." : "Upload & Analyze"}
        </button>
      </form>

      {/* ================= Results Table ================= */}
      {results.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <h3 className="text-lg font-semibold mb-2">AI Analysis Results</h3>
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Disease</th>
                <th className="p-2 border">Risk</th>
                <th className="p-2 border">Explanation</th>
                <th className="p-2 border">Recommended Doctors</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td className="p-2 border align-top">{r.disease}</td>
                  <td className="p-2 border align-top">{r.risk}</td>
                  <td className="p-2 border align-top">{r.explanation}</td>
                  <td className="p-2 border align-top">
                    {r.recommended_doctors?.map((doc, j) => (
                      <div
                        key={j}
                        className="border-b py-2 flex justify-between items-center"
                      >
                        <div>
                          <b>{doc.name}</b> ({doc.speciality})<br />
                          <span className="text-xs text-gray-600">
                            {doc.location} • ⭐ {doc.rating}
                          </span>
                        </div>
                        <button
                          className="w-full bg-gray-900 text-white py-2 rounded hover:bg-gray-700"
                          onClick={() => setSelectedDoctor(doc)}
                        >
                          View
                        </button>
                      </div>
                    )) || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* ================= Doctor Details Modal ================= */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setSelectedDoctor(null)}
            >
              ✖
            </button>
            <h3 className="text-lg font-semibold mb-4 text-center">
              Doctor Details
            </h3>
            <p>
              <b>Name:</b> {selectedDoctor.name}
            </p>
            <p>
              <b>Speciality:</b> {selectedDoctor.speciality}
            </p>
            <p>
              <b>Location:</b> {selectedDoctor.location}
            </p>
            <p>
              <b>Experience:</b> {selectedDoctor.experience} years
            </p>
            <p>
              <b>Rating:</b> ⭐ {selectedDoctor.rating}
            </p>
            <p>
              <b>Phone:</b> {selectedDoctor.phone || "N/A"}
            </p>
            <p>
              <b>Email:</b> {selectedDoctor.email || "N/A"}
            </p>
            <div className="mt-4 text-center">
              <button
                className="w-full bg-gray-900 text-white py-2 rounded hover:bg-gray-700"
                onClick={() => alert("Appointment booking coming soon!")}
              >
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
