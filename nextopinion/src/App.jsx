import React, { useState } from "react";
import UserDashboard from "./pages/userDashboard";

export default function App() {
  const [reportId, setReportId] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white p-4 text-center text-2xl font-semibold shadow">
        🩺 Second Opinion Platform
      </header>

      <main>
        <UserDashboard/>
      </main>
    </div>
  );
}
