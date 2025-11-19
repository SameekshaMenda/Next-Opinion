import React from "react";
import { Link } from "react-router-dom";
// 👇 Import the new background component
import { InteractiveNebulaShader } from "../components/ui/InteractiveNebulaShader";

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans relative overflow-hidden">
      
      {/* --- 🌟 BACKGROUND COMPONENT 🌟 --- */}
      <InteractiveNebulaShader />

      {/* --- Navigation Bar --- */}
      <nav className="relative z-10 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        {/* Logo (White text for dark background) */}
        <div className="text-2xl font-extrabold text-white tracking-wide">
          NextOpinion
        </div>

        {/* Menu Links */}
        <div className="hidden md:flex space-x-8 text-gray-300 font-medium">
          <a href="#" className="hover:text-blue-400 transition">Home</a>
          <a href="#" className="hover:text-blue-400 transition">About</a>
          <a href="#" className="hover:text-blue-400 transition">Services</a>
          <a href="#" className="hover:text-blue-400 transition">Contact</a>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center space-x-4">
          <Link 
            to="/login" 
            className="text-gray-300 hover:text-white font-medium px-4 py-2"
          >
            Login
          </Link>
          <Link 
            to="/register" 
            className="bg-blue-600 text-white px-6 py-2.5 rounded-full font-medium shadow-md hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-500/30"
          >
            Register
          </Link>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <header className="relative z-10 max-w-7xl mx-auto px-8 mt-8 md:mt-16 flex flex-col-reverse md:flex-row items-center gap-12">
        
        {/* Left Text Content */}
        <div className="md:w-1/2 space-y-6 text-center md:text-left">
          <div className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-blue-300 rounded-full text-sm font-semibold mb-2 shadow-sm">
            👋 Welcome to NextOpinion
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight">
            Your Health, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Our Priority.
            </span>
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed max-w-lg mx-auto md:mx-0">
            Get expert second opinions from top specialists worldwide. 
            Secure, fast, and reliable medical advice when you need it most.
          </p>
          
          <div className="flex justify-center md:justify-start space-x-4 pt-4">
            <Link 
              to="/register" 
              className="bg-blue-600 text-white text-lg px-8 py-3.5 rounded-full shadow-lg hover:bg-blue-700 transition-transform hover:-translate-y-1 hover:shadow-blue-500/30"
            >
              Get Started
            </Link>
            <button className="bg-white/10 backdrop-blur-md text-white font-medium px-6 py-3.5 rounded-full border border-white/20 hover:bg-white/20 transition shadow-sm">
              Learn More
            </button>
          </div>
          
          {/* Stats */}
          <div className="pt-8 flex items-center justify-center md:justify-start gap-8 text-gray-400 text-sm font-semibold uppercase tracking-wider">
             <div className="flex items-center gap-2">
               <span className="text-2xl text-blue-400">★</span> 4.9 Rating
             </div>
             <div className="flex items-center gap-2">
               <span className="text-2xl text-blue-400">✓</span> Verified Doctors
             </div>
          </div>
        </div>

        {/* Right Image Section */}
        <div className="md:w-1/2 relative">
          <div className="bg-white/5 backdrop-blur-sm rounded-full p-0 md:p-10 overflow-hidden relative z-0 border border-white/10 shadow-2xl">
             {/* Ensure this image file exists in your 'public' folder */}
             <img 
               src="https://img.freepik.com/free-vector/doctor-character-background_1270-84.jpg" 
               alt="Medical Professional" 
               className="w-full h-auto object-cover relative z-10"
             />
          </div>
        </div>

      </header>
    </div>
  );
}