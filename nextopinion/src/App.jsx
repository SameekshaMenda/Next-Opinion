import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import VideoCallWrapper from "./pages/VideoCallWrapper";  // ✅ correct import
import VideoCallDebug from "./components/VideoCallDebug";
import DoctorDetails from "./components/DoctorDetails";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/debug" element={<VideoCallDebug />} />
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/user" element={<UserDashboard />} />
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/doctor/:id" element={<DoctorDetails />} />

        {/* 🔥 IMPORTANT: Correct video call route */}
        <Route path="/call/:channel" element={<VideoCallWrapper />} />

      </Routes>
    </BrowserRouter>
  );
}
