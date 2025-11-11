import React, { useState } from "react";
import API from "../api";

export default function FinalReportForm({ reportId }) {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    await API.post(`/report/${reportId}/finalize`, { final_report: text });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!reportId) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <h2 className="text-lg font-semibold mb-3">Doctor’s Final Report</h2>
      <form onSubmit={submit}>
        <textarea
          className="w-full border rounded-md p-2"
          placeholder="Enter final report..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Submit Report
        </button>
        {saved && (
          <p className="text-green-600 mt-2 text-sm">✅ Saved successfully</p>
        )}
      </form>
    </div>
  );
}
