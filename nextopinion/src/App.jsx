import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/landingpage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import ThankYouPage from "./pages/ThankYouPage";
import FinalReportPage from "./pages/FinalReportPage";
import VideoCallWrapper from "./pages/VideoCallWrapper";  // ✅ correct import
import VideoCallDebug from "./components/VideoCallDebug";
import DoctorDetails from "./components/DoctorDetails";
import PatientReports from "./components/PatientReports";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/debug" element={<VideoCallDebug />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/user" element={<UserDashboard />} />
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/doctor/:id" element={<DoctorDetails />} />
        <Route path="/thank-you" element={<ThankYouPage />} />
        <Route path="/call/:channel" element={<VideoCallWrapper />} />
        <Route path="/final-report/:appointmentId" element={<FinalReportPage />} />
        <Route path="/my-reports" element={<PatientReports />} />

      </Routes>
    </BrowserRouter>
  );
}
