import React, { useState } from "react";
import UploadReports from "../components/UploadReports";
import DoctorList from "../components/DoctorList";
import Chat from "../components/Chat";
import FinalReportForm from "../components/FinalReportForm";
import AppointmentList from "../components/AppointmentList";


export default function UserDashboard() {
  const [reportId, setReportId] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* <main className="p-6 grid grid-cols-2 md:grid-cols-2 gap-6"> */}
      <main className="p-6 ">
        <div>
          <UploadReports onReportCreated={setReportId} />
        </div>

        <div>
          <AppointmentList />
        </div>

        {/* <div>
          <DoctorList />
        </div> */}
        <div>
          {/* <Chat reportId={reportId} />
          <FinalReportForm reportId={reportId} /> */}
        </div>
      </main>
    </div>
  );
}
