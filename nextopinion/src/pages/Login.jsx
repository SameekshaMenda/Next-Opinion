import React, { useState } from "react";
import API from "../api";
import { useNavigate, Link } from "react-router-dom"; // 👈 IMPORT LINK HERE

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
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
          <button
            type="submit"
            className="w-full bg-gray-900 text-white py-2 rounded hover:bg-gray-600"
          >
            Login
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600 hover:underline font-medium">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
