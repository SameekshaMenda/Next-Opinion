// nextopinion/tailwind.config.js (Ensure this is updated)
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- Clinical Gray & Sky Blue Theme (Clean & Professional) ---
        'primary-dark': '#0F3A62',      // Deep Navy/Clinical Blue (Headers)
        'primary-light': '#1E88E5',     // Sky Blue (Buttons, Active)
        'accent-teal': '#00BCD4',       // Cyan/Teal Accent
        'surface-bg': '#EBF4F8',        // Very light background
        'surface-card': '#FFFFFF',      // Pure white card surfaces
        'text-dark': '#374151',         // Dark Gray text
        'risk-high': '#EF4444',         // Red
        'risk-medium': '#FBBF24',       // Yellow
        'risk-low': '#10B981',          // Green
      },
      boxShadow: {
        'card': '0 4px 12px rgba(0, 0, 0, 0.05)', 
        'header': '0 8px 16px rgba(15, 58, 98, 0.1)', 
      }
    },
  },
  plugins: [],
}