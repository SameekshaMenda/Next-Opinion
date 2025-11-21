import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function UploadReports({ onReportCreated }) {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.length) return alert("Please upload at least one report");

    const formData = new FormData();
    files.forEach((file) => formData.append("files[]", file));
    formData.append("user_name", "Sameeksha");

    setLoading(true);

    try {
      const res = await API.post("/second_opinion", formData);

      const store = {
        ai_result: res.data.ai_result || [],
        file_paths: res.data.file_paths || [],
        filenames: res.data.filenames || [],
        report_id: res.data.report_id || null
      };

      // Save in ONE clean object
      sessionStorage.setItem("second_opinion_result", JSON.stringify(store));

      console.log("🔥 Stored second_opinion_result:", store);

      setResults(store.ai_result);
      onReportCreated(store.report_id);

      // Save recommended doctors for UI
      const recommended = store.ai_result.flatMap(
        (d) => d.recommended_doctors || []
      );
      sessionStorage.setItem("recommendedDoctors", JSON.stringify(recommended));

    } catch (err) {
      console.error(err);
      alert("Error analyzing the report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-8 rounded-xl shadow-2xl mb-8 max-w-6xl mx-auto border border-blue-500/30">
      <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
        Upload Medical Document(s)
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4">
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.txt"
            onChange={handleFileChange}
            className="flex-1 text-white text-sm bg-gray-700/50 border border-gray-600 rounded-lg p-3 
                       file:mr-4 file:py-2 file:px-4 file:rounded-full 
                       file:border-0 file:text-sm file:font-semibold 
                       file:bg-blue-600 file:text-white 
                       hover:file:bg-blue-700 transition"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg 
                       hover:scale-[1.01] transition-all duration-300 disabled:opacity-60"
          >
            {loading ? "Analyzing..." : "Upload & Analyze"}
          </button>
        </div>
      </form>

      {/* AI Results */}
      {results.length > 0 && (
        <div className="mt-10 pt-6 border-t border-gray-700">
          <h3 className="text-xl font-semibold mb-5 text-blue-300">
            🤖 AI Analysis Results
          </h3>

          <div className="space-y-5">
            {results.map((r, i) => (
              <div
                key={i}
                className="border border-gray-700/70 rounded-xl p-5 bg-gray-900/50 shadow-lg"
              >
                <div className="flex justify-between items-start gap-6">
                  <div className="flex-1 space-y-1">
                    <div className="text-lg font-bold text-white">💡 {r.disease}</div>
                    <div className="text-sm text-gray-300">{r.explanation}</div>
                    <div className="mt-3 text-xs font-semibold text-purple-400/80">
                      Risk Assessment: {r.risk}
                    </div>
                  </div>

                  <div className="w-[300px] bg-gray-700/30 p-4 rounded-lg border border-gray-600">
                    <div className="text-sm font-medium text-blue-300 mb-3 border-b border-gray-600 pb-2">
                      Recommended Specialists
                    </div>

                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 hide-scrollbar">
                      {(r.recommended_doctors || []).map((doc, j) => {
                        const doctorId =
                          doc.id || doc.doctor_id || doc.user_id || null;

                        return (
                          <div key={j} className="flex items-center justify-between bg-gray-800 p-3 rounded-md">
                            <div>
                              <div className="font-bold text-sm text-white">{doc.name}</div>
                              <div className="text-xs text-gray-400">
                                {doc.speciality} • {doc.location}
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              <div className="text-sm font-semibold text-yellow-400">⭐ {doc.rating}</div>
                              <button
                                className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full"
                                onClick={() => {
                                  if (doctorId) navigate(`/doctor/${doctorId}`);
                                  else alert("Doctor not found.");
                                }}
                              >
                                View Profile
                              </button>
                            </div>
                          </div>
                        );
                      })}
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
