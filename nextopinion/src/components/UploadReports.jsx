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

      const filePath = res.data.file_path;
      const filename = res.data.filename;

      if (filePath && filename) {
        sessionStorage.setItem("reportPath", filePath);
        sessionStorage.setItem("reportName", filename);
      }

      setResults(res.data.ai_result || []);
      onReportCreated(res.data.report_id);

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
    // 🌌 Dark Card Container
    <div className="bg-gray-800 p-8 rounded-xl shadow-2xl mb-8 max-w-6xl mx-auto border border-blue-500/30">
      
      {/* Gradient Title */}
      <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
        Upload Medical Document
      </h2>

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4">
          
          {/* File Input (Styled for Dark Theme) */}
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.txt"
            onChange={(e) => setFile(e.target.files[0])}
            className="flex-1 text-white text-sm bg-gray-700/50 border border-gray-600 rounded-lg p-3 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 hover:cursor-pointer transition duration-200"
            required
          />
          
          {/* Submit Button (Gradient Style) */}
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg shadow-purple-500/30 hover:scale-[1.01] transition-all duration-300 disabled:opacity-60 disabled:shadow-none"
          >
            {loading ? "Analyzing..." : "Upload & Analyze"}
          </button>
        </div>
      </form>

      {/* AI Analysis Results Section (Themed) */}
      {results.length > 0 && (
        <div className="mt-10 pt-6 border-t border-gray-700">
          <h3 className="text-xl font-semibold mb-5 text-blue-300">
            🤖 AI Analysis Results
          </h3>

          <div className="space-y-5">
            {results.map((r, i) => (
              // Individual Result Card
              <div key={i} className="border border-gray-700/70 rounded-xl p-5 bg-gray-900/50 shadow-lg hover:shadow-blue-500/10 transition-shadow">
                <div className="flex justify-between items-start gap-6">
                  
                  {/* Disease Info */}
                  <div className="flex-1 space-y-1">
                    <div className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="text-blue-400">💡</span> {r.disease}
                    </div>
                    <div className="text-sm text-gray-300">
                      {r.explanation}
                    </div>
                    <div className="mt-3 text-xs font-semibold text-purple-400/80">
                      Risk Assessment: {r.risk}
                    </div>
                  </div>

                  {/* Recommended Doctors - IMPROVED SCROLLBAR STYLING */}
                  <div className="w-[300px] bg-gray-700/30 p-4 rounded-lg border border-gray-600">
                    <div className="text-sm font-medium text-blue-300 mb-3 border-b border-gray-600 pb-2">
                      Recommended Specialists
                    </div>

                    {/* Hiding default scrollbar using a custom utility class or direct CSS */}
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 hide-scrollbar"> 
                      {r.recommended_doctors?.length > 0 ? (
                        r.recommended_doctors.map((doc, j) => {
                          const docId =
                            doc.id || doc.doctor_id || doc.user_id || null;

                          return (
                            // Doctor Item
                            <div
                              key={j}
                              className="flex items-center justify-between bg-gray-800 p-3 rounded-md shadow-md border border-gray-700"
                            >
                              <div>
                                <div className="font-bold text-sm text-white">
                                  {doc.name}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {doc.speciality} • {doc.location}
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-1">
                                <div className="text-sm font-semibold text-yellow-400">
                                  ⭐ {doc.rating}
                                </div>

                                <button
                                  className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full hover:bg-purple-500 transition-colors"
                                  onClick={() => {
                                    if (docId && !isNaN(docId)) {
                                      navigate(`/doctor/${docId}`);
                                    } else {
                                      alert("Doctor ID not found — please verify database linkage.");
                                    }
                                  }}
                                >
                                  View Profile
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-gray-500 text-sm italic">No specialist recommendations found.</div>
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