// src/components/UploadReports.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function UploadReports({ onReportCreated }) {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please upload a medical document");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_name", "Sameeksha"); // Replace with logged-in user name

    setLoading(true);
    try {
      const res = await API.post("/second_opinion", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // ⬇️ New: store file path + name so appointment/email route can use it
      const filePath = res.data.file_path;
      const filename = res.data.filename;

      if (filePath && filename) {
        sessionStorage.setItem("reportPath", filePath);
        sessionStorage.setItem("reportName", filename);
      }

      // AI results
      setResults(res.data.ai_result || []);
      onReportCreated(res.data.report_id);

      // Flatten and save recommended doctors
      const allDoctors = res.data.ai_result.flatMap(
        (disease) => disease.recommended_doctors || []
      );
      sessionStorage.setItem("recommendedDoctors", JSON.stringify(allDoctors));
    } catch (err) {
      console.error(err);
      alert("Error analyzing document");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg mb-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4 text-gray-900">
        Upload Medical Document
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.txt"
            onChange={(e) => setFile(e.target.files[0])}
            className="flex-1 border rounded-md p-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-60"
          >
            {loading ? "Analyzing..." : "Upload & Analyze"}
          </button>
        </div>
      </form>

      {results.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            AI Analysis Results
          </h3>

          <div className="space-y-4">
            {results.map((r, i) => (
              <div key={i} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="text-base font-semibold">{r.disease}</div>
                    <div className="text-sm text-gray-600">
                      {r.explanation}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Risk: {r.risk}
                    </div>
                  </div>

                  <div className="w-1/3">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Recommended Doctors
                    </div>

                    <div className="space-y-2 max-h-40 overflow-auto pr-2">
                      {r.recommended_doctors?.length > 0 ? (
                        r.recommended_doctors.map((doc, j) => {
                          const docId =
                            doc.id || doc.doctor_id || doc.user_id || null;

                          return (
                            <div
                              key={j}
                              className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm"
                            >
                              <div>
                                <div className="font-semibold text-sm">
                                  {doc.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {doc.speciality} • {doc.location}
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-2">
                                <div className="text-sm font-semibold">
                                  ⭐ {doc.rating}
                                </div>

                                <button
                                  className="bg-gray-900 text-white px-3 py-1 rounded hover:bg-gray-700"
                                  onClick={() => {
                                    if (docId && !isNaN(docId)) {
                                      navigate(`/doctor/${docId}`);
                                    } else {
                                      alert(
                                        "Doctor ID not found — please verify database linkage."
                                      );
                                    }
                                  }}
                                >
                                  View
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-gray-400">No doctors found</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
