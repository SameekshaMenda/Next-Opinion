// src/pages/FinalReportPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api"; // your axios instance with baseURL '/api' (adjust if different)

export default function FinalReportPage() {
  const { id: paramId } = useParams(); // url param appointment id (may be "null" or undefined)
  const navigate = useNavigate();

  // Determine appointmentId: prefer URL param if valid, otherwise fallback to sessionStorage
  const getAppointmentIdFromStorage = () => {
    const s = sessionStorage.getItem("activeAppointmentId");
    if (!s) return null;
    // session storage value may be string; attempt parseInt
    const num = Number(s);
    return Number.isFinite(num) && num > 0 ? num : s;
  };

  const [appointmentId, setAppointmentId] = useState(() => {
    // treat "null" or "undefined" strings as invalid
    if (paramId && paramId !== "null" && paramId !== "undefined") return paramId;
    return getAppointmentIdFromStorage() || null;
  });

  useEffect(() => {
    // keep state updated if URL changes later
    if (paramId && paramId !== "null" && paramId !== "undefined") setAppointmentId(paramId);
  }, [paramId]);

  // If we don't have an ID, warn and allow user to fix (no navigation away)
  useEffect(() => {
    if (!appointmentId) {
      // don't auto-navigate away — doctor might want to paste ID or sessionStorage might be missing
      // show a non-blocking message
      console.warn("FinalReportPage: appointment id missing in URL and sessionStorage.");
      // optionally show a friendly alert:
      // alert("Appointment ID missing — provide id in URL or ensure activeAppointmentId in sessionStorage.");
    }
  }, [appointmentId]);

  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState(null);

  const [form, setForm] = useState({
    consultation_summary: "",
    symptoms_reported: "",
    clinical_findings: "",
    diagnosis: "",
    recommended_tests: "",
    medications: "",
    lifestyle_advice: "",
    follow_up_days: "",
  });

  // Try to fetch appointment info (non-fatal if fails)
  useEffect(() => {
    const fetchAppointment = async (idToFetch) => {
      try {
        if (!idToFetch) return;
        // This requests to /api/appointments/:id (adjust if backend endpoint is different)
        const res = await API.get(`/api/appointments/${idToFetch}`);
        const appt = res.data.appointment || res.data || null;
        if (appt) setAppointment(appt);

        // If the appointment already has a saved final report (prefill)
        // adjust field names according to your backend response
        if (appt?.final_report) {
          setForm((f) => ({ ...f, consultation_summary: appt.final_report }));
        }
      } catch (err) {
        // do not block the page: log and continue
        console.warn("Could not fetch appointment details:", err?.response?.data || err.message);
      }
    };

    fetchAppointment(appointmentId);
  }, [appointmentId]);

  // generic handler
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Fill dummy sample values quickly for testing
  const fillDummy = () => {
    setForm({
      consultation_summary:
        "Patient presented with exertional chest pain for 2 months. Reviewed history and previous reports; discussed risk factors.",
      symptoms_reported: "Intermittent exertional chest pain, breathlessness on exertion, occasional palpitations.",
      clinical_findings: "BP 130/82 mmHg, HR 78 bpm, normal respiratory exam; no audible murmur.",
      diagnosis: "Probable stable angina. Differential: dyslipidemia, early hypertension.",
      recommended_tests: "ECG, 2D Echo, Lipid profile, Treadmill test (if available).",
      medications: "Aspirin 75 mg OD, Atorvastatin 20 mg HS, GTN 0.4 mg sublingual PRN for chest pain.",
      lifestyle_advice: "Avoid heavy exertion until evaluation, stop smoking, low-salt heart-healthy diet, daily walking 20–30 min.",
      follow_up_days: "10",
    });
  };

  // Submit (save) final report and optionally request PDF generation
  const submitReport = async (generatePdf = true) => {
    // attempt to use appointmentId state, then fallback to sessionStorage
    const idToUse = appointmentId || getAppointmentIdFromStorage();
    if (!idToUse) {
      alert("Appointment ID missing. Cannot submit.");
      return;
    }

    // basic validation (you can expand)
    if (!form.consultation_summary || !form.diagnosis) {
      const ok = window.confirm("Summary or diagnosis is empty — submit anyway?");
      if (!ok) return;
    }

    setLoading(true);
    try {
      const payload = {
        consultation_summary: form.consultation_summary,
        diagnosis: form.diagnosis,
        medications: form.medications,
        symptoms_reported: form.symptoms_reported,
        clinical_findings: form.clinical_findings,
        recommended_tests: form.recommended_tests,
        lifestyle_advice: form.lifestyle_advice,
        follow_up_days: form.follow_up_days,
      };

      // POST to backend endpoint (matches your provided Flask route)
      const res = await API.post(`/appointments/${idToUse}/final_report_full`, payload);

      const reportId = res.data.report_id || res.data?.report_id;
      alert("Final report saved successfully.");

      // optionally generate PDF (if backend supports)
      if (generatePdf && reportId) {
        try {
          const gen = await API.post("/reports/generate_pdf", {
            report_id: reportId,
            appointment_id: idToUse,
          });

          const pdfPath = gen.data.pdf_path || gen.data.path;
          if (pdfPath) {
            // Open the backend file-download endpoint — adjust path if your backend expects a different param
            const encoded = encodeURIComponent(pdfPath);
            window.open(`/api/reports/download?path=${encoded}`, "_blank");
          }
        } catch (errPdf) {
          console.warn("PDF generation failed or unsupported:", errPdf?.response?.data || errPdf.message);
        }
      }

      // redirect depending on user role
      const user = JSON.parse(sessionStorage.getItem("user") || "{}");
      const role = user?.role;
      if (role === "doctor") navigate("/doctor");
      else navigate("/thank-you");
    } catch (err) {
      console.error("submitReport error:", err?.response?.data || err.message);
      alert(err?.response?.data?.error || "Failed to save final report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6 text-white">
      <div className="max-w-3xl mx-auto bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          Final Consultation Report
        </h1>

        <p className="text-sm text-gray-400 mt-2">
          Appointment ID: <strong>{appointmentId || "— not set"}</strong>
          {appointment?.patient_name ? (
            <> — Patient: <strong>{appointment.patient_name}</strong></>
          ) : null}
        </p>

        <div className="mt-6 space-y-4">
          <label className="block text-sm text-gray-300">Summary of Discussion</label>
          <textarea
            name="consultation_summary"
            value={form.consultation_summary}
            onChange={onChange}
            className="w-full min-h-[80px] p-3 rounded-lg bg-gray-900 border border-gray-700 text-gray-100"
          />

          <label className="block text-sm text-gray-300">Symptoms Reported</label>
          <textarea
            name="symptoms_reported"
            value={form.symptoms_reported}
            onChange={onChange}
            className="w-full min-h-[60px] p-3 rounded-lg bg-gray-900 border border-gray-700 text-gray-100"
          />

          <label className="block text-sm text-gray-300">Doctor's Clinical Findings</label>
          <textarea
            name="clinical_findings"
            value={form.clinical_findings}
            onChange={onChange}
            className="w-full min-h-[60px] p-3 rounded-lg bg-gray-900 border border-gray-700 text-gray-100"
          />

          <label className="block text-sm text-gray-300">Final Diagnosis / Impression</label>
          <textarea
            name="diagnosis"
            value={form.diagnosis}
            onChange={onChange}
            className="w-full min-h-[70px] p-3 rounded-lg bg-gray-900 border border-gray-700 text-gray-100"
          />

          <label className="block text-sm text-gray-300">Recommended Tests</label>
          <textarea
            name="recommended_tests"
            value={form.recommended_tests}
            onChange={onChange}
            className="w-full min-h-[60px] p-3 rounded-lg bg-gray-900 border border-gray-700 text-gray-100"
          />

          <label className="block text-sm text-gray-300">Medications / Treatment Plan</label>
          <textarea
            name="medications"
            value={form.medications}
            onChange={onChange}
            className="w-full min-h-[70px] p-3 rounded-lg bg-gray-900 border border-gray-700 text-gray-100"
          />

          <label className="block text-sm text-gray-300">Lifestyle Advice</label>
          <textarea
            name="lifestyle_advice"
            value={form.lifestyle_advice}
            onChange={onChange}
            className="w-full min-h-[60px] p-3 rounded-lg bg-gray-900 border border-gray-700 text-gray-100"
          />

          <label className="block text-sm text-gray-300">Follow-up after (days)</label>
          <input
            name="follow_up_days"
            value={form.follow_up_days}
            onChange={onChange}
            className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 text-gray-100"
            placeholder="e.g., 7"
          />

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => submitReport(true)}
              className={`px-6 py-2 rounded-full font-semibold bg-gradient-to-r from-purple-600 to-blue-500 hover:opacity-90 ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
              disabled={loading}
            >
              {loading ? "Saving…" : "Submit Report & Generate PDF"}
            </button>

            <button
              onClick={() => submitReport(false)}
              className="px-4 py-2 rounded-full font-semibold bg-gray-700 border border-gray-600"
              disabled={loading}
            >
              Save (no PDF)
            </button>

            <button
              onClick={fillDummy}
              className="ml-auto px-3 py-2 rounded-full bg-gray-700 border border-gray-600 text-sm"
            >
              Fill dummy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
