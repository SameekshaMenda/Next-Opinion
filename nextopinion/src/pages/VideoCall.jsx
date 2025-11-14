import React, { useEffect, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import API from "../api";

export default function VideoCall({ channelName }) {
  const appId = import.meta.env.VITE_AGORA_APP_ID;

  // Agora client instance
  const [client] = useState(() =>
    AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })
  );

  const [localTracks, setLocalTracks] = useState([]);
  const [joined, setJoined] = useState(false);
  const [tokenData, setTokenData] = useState(null);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // -------------------------------------------
  // 1️⃣ Generate Unique UID for this browser
  // -------------------------------------------
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Use user's DB ID (guaranteed unique)
  // fallback to timestamp-based ID
  const safeUID =
    user?.id ||
    Math.floor(Date.now() + Math.random() * 1000000);

  console.log("👉 Using UID:", safeUID);

  // -------------------------------------------
  // 2️⃣ Fetch Agora Token from backend
  // -------------------------------------------
  useEffect(() => {
    const fetchToken = async () => {
      try {
        console.log("Fetching token for channel:", channelName);

        const res = await API.post("/generate_token", {
          channel_name: channelName,
          uid: safeUID,
        });

        setTokenData({
          token: res.data.token,
          uid: safeUID,
        });

      } catch (err) {
        console.error("❌ Token fetch failed:", err);
        alert("Token generation failed");
      }
    };

    fetchToken();
  }, [channelName]);

  // -------------------------------------------
  // 3️⃣ Initialize the Video Call
  // -------------------------------------------
  useEffect(() => {
    if (!tokenData || joined) return;

    const initCall = async () => {
      try {
        console.log("Initializing Agora Call with UID:", tokenData.uid);

        // Ask camera & mic permission
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        const { uid, token } = tokenData;

        // Join Agora Channel
        await client.join(appId, channelName, token, uid);

        // Create local audio+video tracks
        const [micTrack, camTrack] =
          await AgoraRTC.createMicrophoneAndCameraTracks();

        setLocalTracks([micTrack, camTrack]);

        // Play Local Preview
        camTrack.play("local-player");

        // Publish Local Tracks
        await client.publish([micTrack, camTrack]);

        console.log("🎉 Successfully joined Agora channel.");

        setJoined(true);

        // -------------------------------------------
        // Remote User Published
        // -------------------------------------------
        client.on("user-published", async (user, mediaType) => {
          console.log("📡 Remote user published:", user.uid);

          await client.subscribe(user, mediaType);

          if (mediaType === "video") {
            const playerId = `remote-${user.uid}`;

            let container = document.getElementById(playerId);
            if (!container) {
              container = document.createElement("div");
              container.id = playerId;
              container.className =
                "w-full h-full bg-black rounded-xl overflow-hidden";
              document.getElementById("remote-videos").appendChild(container);
            }

            user.videoTrack.play(playerId);
          }

          if (mediaType === "audio") {
            user.audioTrack.play();
          }
        });

        // -------------------------------------------
        // Remote User Left
        // -------------------------------------------
        client.on("user-unpublished", (user) => {
          console.log("❌ Remote user left:", user.uid);

          const el = document.getElementById(`remote-${user.uid}`);
          if (el) el.remove();
        });

      } catch (err) {
        console.error("❌ Agora INIT Error:", err);
        alert("Agora Call Failed");
      }
    };

    initCall();
  }, [tokenData, joined]);

  // -------------------------------------------
  // 4️⃣ Leave Call
  // -------------------------------------------
  const leaveCall = async () => {
    try {
      localTracks.forEach((track) => {
        track.stop();
        track.close();
      });

      await client.leave();

      document.getElementById("remote-videos").innerHTML = "";
      setJoined(false);

      console.log("👋 Left the call");
    } catch (err) {
      console.error("❌ Error leaving call:", err);
    }
  };

  // -------------------------------------------
  // Toggle Mic
  // -------------------------------------------
  const toggleMic = () => {
    if (localTracks[0]) {
      localTracks[0].setEnabled(!micOn);
      setMicOn(!micOn);
    }
  };

  // -------------------------------------------
  // Toggle Camera
  // -------------------------------------------
  const toggleCam = () => {
    if (localTracks[1]) {
      localTracks[1].setEnabled(!camOn);
      setCamOn(!camOn);
    }
  };

  return (
    <div className="relative h-screen w-screen bg-gray-900 flex items-center justify-center overflow-hidden">

      {/* REMOTE VIDEO (large) */}
      <div
        id="remote-videos"
        className="w-[90%] h-[80%] bg-black rounded-2xl shadow-2xl flex items-center justify-center overflow-hidden"
      ></div>

      {/* LOCAL VIDEO (small box) */}
      <div
        id="local-player"
        className="absolute bottom-28 right-10 w-48 h-36 bg-black rounded-xl shadow-lg overflow-hidden border border-white/30"
      ></div>

      {/* Controls */}
      <div className="absolute bottom-6 flex space-x-6 bg-white/10 backdrop-blur-lg px-8 py-4 rounded-full shadow-xl">
        <button
          onClick={toggleMic}
          className={`p-4 rounded-full text-white ${
            micOn ? "bg-gray-700" : "bg-red-600"
          }`}
        >
          {micOn ? "🎤" : "🔇"}
        </button>

        <button
          onClick={toggleCam}
          className={`p-4 rounded-full text-white ${
            camOn ? "bg-gray-700" : "bg-red-600"
          }`}
        >
          {camOn ? "📷" : "🚫"}
        </button>

        <button
          onClick={leaveCall}
          className="p-4 rounded-full bg-red-600 text-white font-semibold"
        >
          🚪
        </button>
      </div>
    </div>
  );
}
