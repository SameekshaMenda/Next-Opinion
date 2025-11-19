// src/pages/ThankYouPage.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function ThankYouPage() {
  const navigate = useNavigate();
  const [dashboardPath, setDashboardPath] = useState('/');
  const [userName, setUserName] = useState('Valued User');

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    
    // Determine the user's role and set the path and name
    if (user.role === 'doctor') {
      setDashboardPath('/doctor');
    } else if (user.role === 'user') {
      setDashboardPath('/user');
    } else {
      setDashboardPath('/'); // Fallback to landing page
    }

    if (user.name) {
        setUserName(user.name);
    }
    
    // Auto-redirect after a short delay (optional, but good UX)
    // const timer = setTimeout(() => {
    //   navigate(dashboardPath);
    // }, 5000); 

    // return () => clearTimeout(timer);
  }, []);
  
  return (
    // 🌌 Dark Nebula Background Container
    <div className="flex flex-col items-center justify-center min-h-screen bg-black relative overflow-hidden p-6">
      
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>

      {/* Content Card (Z-index 10) */}
      <div className="relative z-10 bg-gray-900/80 backdrop-blur-md p-10 md:p-12 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-700/50 text-center space-y-6">

        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          Thank You, {userName}!
        </h1>

        <p className="text-lg text-gray-300">
          The video consultation has ended. We hope you received the clarity and support you needed.
        </p>
        
        <div className="pt-4">
            <Link
              to={dashboardPath}
              className="px-8 py-3 text-lg rounded-full font-semibold 
              bg-gradient-to-r from-blue-500 to-purple-500 shadow-xl 
              hover:shadow-purple-500/40 hover:scale-105 transition-all text-white inline-flex items-center gap-2"
            >
              Go to Your Dashboard ➡️
            </Link>
        </div>

        <p className="text-sm text-gray-500 mt-4">
            If you need further assistance, please check your appointment history.
        </p>

      </div>
    </div>
  );
}