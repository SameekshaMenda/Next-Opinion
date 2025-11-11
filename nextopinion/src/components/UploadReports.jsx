import React, { useState } from "react";
import API from "../api";

export default function UploadReports({ onReportCreated }) {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

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
                  <td className="p-2 border">{r.disease}</td>
                  <td className="p-2 border">{r.risk}</td>
                  <td className="p-2 border">{r.explanation}</td>
                  <td className="p-2 border">
                    {r.recommended_doctors?.map((doc, j) => (
                      <div key={j} className="border-b py-1">
                        <b>{doc.name}</b> ({doc.speciality})<br />
                        <span className="text-xs text-gray-600">
                          {doc.location} • ⭐ {doc.rating}
                        </span>
                      </div>
                    )) || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
