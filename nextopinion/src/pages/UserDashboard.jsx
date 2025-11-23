import React, { useState } from "react";
import UploadReports from "../components/UploadReports";
import DoctorList from "../components/DoctorList";
import AppointmentList from "../components/AppointmentList";

export default function UserDashboard() {
  const [reportId, setReportId] = useState(null);
  const [activeView, setActiveView] = useState("appointments"); 

  const renderMainContent = () => {
    switch (activeView) {
      case "upload":
        return <UploadReports onReportCreated={setReportId} />;

      case "appointments":
        return <AppointmentList />;

      case "doctors":
        return <DoctorList />;

      default:
        return <AppointmentList />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      
      {/* Header */}
      <header className="p-4 bg-gray-900 border-b border-gray-700 shadow-md">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          Patient Dashboard
        </h1>
      </header>

      {/* Layout */}
      <div className="flex">

        {/* Sidebar */}
        <nav className="w-64 bg-gray-800 p-6 space-y-4 shadow-xl min-h-[calc(100vh-69px)] border-r border-gray-700">

          <h3 className="text-sm font-semibold uppercase text-gray-400 mb-6 border-b border-gray-700 pb-2">
            Navigation
          </h3>

          <button
            onClick={() => setActiveView("appointments")}
            className={`w-full text-left py-3 px-4 rounded-lg font-medium transition-all ${
              activeView === "appointments"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                : "text-gray-300 hover:bg-gray-700/50"
            }`}
          >
            🗓️ My Appointments
          </button>

          <button
            onClick={() => setActiveView("upload")}
            className={`w-full text-left py-3 px-4 rounded-lg font-medium transition-all ${
              activeView === "upload"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                : "text-gray-300 hover:bg-gray-700/50"
            }`}
          >
            📤 Upload New Report
          </button>

          <button
            onClick={() => setActiveView("doctors")}
            className={`w-full text-left py-3 px-4 rounded-lg font-medium transition-all ${
              activeView === "doctors"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                : "text-gray-300 hover:bg-gray-700/50"
            }`}
          >
            🧑‍⚕️ Find Specialists
          </button>

        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8 bg-gray-900/95">
          <div className="max-w-7xl mx-auto">
            {renderMainContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
