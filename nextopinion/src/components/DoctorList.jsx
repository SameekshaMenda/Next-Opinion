import React, { useEffect, useState } from "react";

export default function DoctorList() {
  const [doctors, setDoctors] = useState([]);

  const loadDoctors = () => {
    const stored = localStorage.getItem("recommendedDoctors");
    if (stored) {
      try {
        setDoctors(JSON.parse(stored));
      } catch {
        setDoctors([]);
      }
    } else {
      setDoctors([]);
    }
  };

  useEffect(() => {
    // Load immediately
    loadDoctors();

    // ✅ Listen for storage updates (if data changes in UploadReports)
    const handleStorageChange = (e) => {
      if (e.key === "recommendedDoctors") {
        loadDoctors();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-3">Recommended Doctors</h2>
      {doctors.length === 0 ? (
        <p className="text-gray-500">No doctors found.</p>
      ) : (
        <ul className="space-y-2">
          {doctors.map((d, i) => (
            <li
              key={i}
              className="p-3 border rounded-md hover:bg-gray-100 transition"
            >
              <div className="font-semibold">{d.name}</div>
              <div className="text-sm text-gray-600">
                {d.speciality} • {d.location} • ⭐ {d.rating}
              </div>
              <div className="text-xs text-gray-500">
                {d.experience} years experience
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
