import React from "react";
import { Link } from "react-router-dom";
import { InteractiveNebulaShader } from "../ui/InteractiveNebulaShader";

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans relative overflow-hidden bg-black">

      {/* Nebula Background (Z-index 0) */}
      <div className="absolute inset-0 z-0">
        <InteractiveNebulaShader />
      </div>

      {/* Navbar (Z-index 20) */}
      <nav className="relative z-20 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-extrabold text-white tracking-wide">NextOpinion</div>

        <div className="hidden md:flex space-x-8 text-gray-300 font-medium">
          <Link to="/" className="hover:text-blue-400 transition">Home</Link>
          <a href="#services" className="hover:text-blue-400 transition">Services</a>
          <a href="#about" className="hover:text-blue-400 transition">About</a>
          <a href="#contact" className="hover:text-blue-400 transition">Contact</a>
        </div>

        <div className="flex items-center space-x-4">
          <Link to="/login" className="text-gray-300 hover:text-white font-medium px-4 py-2 transition">Login</Link>

          <Link
            to="/register"
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2.5 rounded-full font-semibold shadow-lg hover:scale-105 hover:shadow-blue-500/40 transition-all"
          >
            Register
          </Link>
        </div>
      </nav>

      {/* HERO SECTION (Z-index 20) */}
      <header className="relative z-20 max-w-7xl mx-auto px-8 mt-20 flex flex-col md:flex-row items-center gap-16 pb-20">

        {/* LEFT SIDE - Content */}
        <div className="md:w-1/2 space-y-8"> {/* Increased space-y for better vertical rhythm */}

          <div className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-blue-300 rounded-full text-sm font-semibold shadow">
            👋 Welcome to NextOpinion
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight">
            Your Health,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Our Priority.
            </span>
          </h1>

          <p className="text-lg text-gray-300 leading-relaxed max-w-lg">
            Get expert **second opinions** from top specialists worldwide.
            Secure, fast, and reliable medical advice when you need it most.
          </p>

          <div className="flex space-x-4 pt-4">
            <Link
              to="/register"
              className="px-8 py-3.5 text-lg rounded-full font-semibold 
              bg-gradient-to-r from-blue-500 to-purple-500 shadow-xl 
              hover:shadow-purple-500/40 hover:scale-105 transition-all text-white"
            >
              Get Started
            </Link>

            <button
              className="px-8 py-3.5 text-lg rounded-full font-medium 
                border border-white/20 bg-white/10 backdrop-blur text-white 
                hover:bg-white/20 hover:scale-105 transition"
            >
              Learn More
            </button>
          </div>

          <div className="pt-6 flex items-center gap-10 text-gray-300 text-sm font-semibold tracking-wide">
            <div className="flex items-center gap-2"><span className="text-2xl text-blue-400">★</span> 4.9 Rating</div>
            <div className="flex items-center gap-2"><span className="text-2xl text-blue-400">✓</span> Verified Doctors</div>
          </div>

        </div>

        {/* RIGHT SIDE - Generated Image Integration */}
        <div className="md:w-1/2 flex justify-center md:justify-end relative">
          <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/30">
            {/* The generated image */}
            <img
              src="https://th.bing.com/th/id/OIP.aUQJ8wu17evAw4WthXFNTwHaMC?w=115&h=180&c=7&r=0&o=7&dpr=1.1&pid=1.7&rm=3"
              alt="Stethoscope turning into a heart, symbolizing health and care"
              className="w-full h-full object-cover object-center"
            />
            {/* Optional: Overlay for subtle effects, matching the theme */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
          </div>
        </div>
        
      </header>
    </div>
  );
}