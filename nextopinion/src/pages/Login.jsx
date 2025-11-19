import React, { useState } from "react";
import API from "../api";
import { useNavigate, Link } from "react-router-dom";
import { InteractiveNebulaShader } from "../ui/InteractiveNebulaShader"; // Import the Nebula Shader

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/auth/login", form);
      const userData = res.data.user;

      if (!userData) {
        alert("Invalid server response");
        return;
      }

      sessionStorage.setItem("user", JSON.stringify(userData));

      if (userData.role === "doctor") {
        navigate("/doctor");
      } else {
        navigate("/user");
      }

    } catch (err) {
      console.error("Login error:", err);
      alert(err.response?.data?.error || "Login failed. Check server.");
    }
  };

  return (
    // 🌌 Dark Nebula Background Container
    <div className="flex items-center justify-center min-h-screen bg-black relative overflow-hidden p-4">

      {/* Nebula Background (Z-index 0) */}
      <div className="absolute inset-0 z-0">
        <InteractiveNebulaShader />
      </div>

      {/* Subtle Background Lighting Effect (now on top of nebula but still subtle) */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse z-1"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500 z-1"></div>

      {/* Login Card (Z-index 10 or higher to appear above nebula and subtle lights) */}
      <div className="relative z-20 bg-gray-900/80 backdrop-blur-md p-10 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-700/50">

        {/* Header */}
        <h2 className="text-3xl font-extrabold mb-8 text-center text-white">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Welcome Back
          </span>
        </h2>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Email Input */}
          <input
            name="email"
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            className="w-full bg-gray-800 border border-gray-700 text-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-400"
            required
          />

          {/* Password Input */}
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full bg-gray-800 border border-gray-700 text-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-400"
            required
          />

          {/* Submit Button (Gradient Style) */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-full font-semibold shadow-lg shadow-purple-500/30 hover:scale-[1.02] transition-all duration-300"
          >
            Secure Login
          </button>
        </form>

        {/* Registration Link */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Don't have an account?{" "}
          <Link 
            to="/register" 
            className="text-blue-400 hover:text-blue-300 transition-colors font-medium hover:underline"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}