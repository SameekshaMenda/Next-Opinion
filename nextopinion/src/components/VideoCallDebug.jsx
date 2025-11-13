import AgoraRTC from "agora-rtc-sdk-ng";
import React, { useEffect } from "react";

export default function VideoCallDebug() {
  useEffect(() => {
    AgoraRTC.getDevices().then((devices) => {
      console.log("🎥 Available Devices:", devices);
      alert(`Found ${devices.length} devices. Check console for details.`);
    });
  }, []);

  return <div className="p-10 text-center text-gray-800">Check your console for device list</div>;
}
