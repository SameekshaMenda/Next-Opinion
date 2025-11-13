import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorDetails from "./components/DoctorDetails";
import VideoCall from "./pages/VideoCall";
import VideoCallDebug from "./components/VideoCallDebug";


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
        <Route path="/video/:channelName" element={<VideoCall />} />

      </Routes>
    </BrowserRouter>
  );
}
