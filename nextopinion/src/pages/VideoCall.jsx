import React, { useEffect, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { useNavigate } from "react-router-dom"; // 👈 Ensure this is imported
import API from "../api";

export default function VideoCall({ channelName }) {
  const appId = import.meta.env.VITE_AGORA_APP_ID;
  const navigate = useNavigate(); // 👈 Initialize navigate

  // Agora client instance
  const [client] = useState(() =>
    AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })
  );

  const [localTracks, setLocalTracks] = useState([]);
  const [joined, setJoined] = useState(false);
  const [tokenData, setTokenData] = useState(null);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // 1️⃣ Generate Unique UID
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const safeUID = user?.id || Math.floor(Date.now() + Math.random() * 1000000);

  // 2️⃣ Fetch Agora Token from backend
  useEffect(() => {
    const fetchToken = async () => {
      try {
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
        alert("Token generation failed. Check backend server.");
      }
    };

    fetchToken();
  }, [channelName, safeUID]);

  // 3️⃣ Initialize the Video Call (Core Logic & Fixes)
  useEffect(() => {
    if (!tokenData || joined) return;

    const initCall = async () => {
      try {
        const { uid, token } = tokenData;

        // Ask camera & mic permission
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

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

        setJoined(true);

        // -------------------------------------------
        // Remote User Published - FIX FOR CAMERA DISPLAY ASYMMETRY
        // -------------------------------------------
        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);

          if (mediaType === "video") {
            const playerId = `remote-${user.uid}`;
            const remoteVideosContainer = document.getElementById("remote-videos"); // 👈 FIX: Get the main container first

            // 🛑 CRITICAL FIX: Only proceed if the main container exists
            if (!remoteVideosContainer) {
                 console.warn("Remote videos container not found. Aborting remote video append.");
                 return; 
            }
            
            let container = document.getElementById(playerId);
            if (!container) {
              container = document.createElement("div");
              container.id = playerId;
              container.className = "w-full h-full bg-black rounded-xl overflow-hidden";
              remoteVideosContainer.appendChild(container); // Append to the confirmed container
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
          const el = document.getElementById(`remote-${user.uid}`);
          if (el) el.remove();
        });

      } catch (err) {
        console.error("❌ Agora INIT Error:", err);
        alert("Agora Call Failed. Check permissions or try again.");
      }
    };

    initCall();
    
    // Cleanup on unmount
    return () => {
        if (joined) {
            localTracks.forEach(track => {
                track.stop();
                track.close();
            });
            client.leave();
        }
    };
    
  }, [tokenData, joined, appId, client, channelName, localTracks]); 

  // -------------------------------------------
  // 4️⃣ Leave Call & Redirect (FINAL NAVIGATION)
  // -------------------------------------------
  const leaveCall = async () => {
    try {
      localTracks.forEach((track) => {
        track.stop();
        track.close();
      });

      // Only attempt to leave if connected
      if (client.connectionState.includes('CONNECTED')) {
          await client.leave();
      }

      document.getElementById("remote-videos").innerHTML = "";
      setJoined(false);

      // 👈 REDIRECT TO THANK YOU PAGE
      navigate("/thank-you"); 

    } catch (err) {
      console.error("❌ Error leaving call:", err);
      // Fallback: Always redirect for UX
      navigate("/thank-you"); 
    }
  };

  // -------------------------------------------
  // Toggle Mic / Camera
  // -------------------------------------------
  const toggleMic = () => {
    if (localTracks[0]) {
      localTracks[0].setEnabled(!micOn);
      setMicOn(!micOn);
    }
  };

  const toggleCam = () => {
    if (localTracks[1]) {
      localTracks[1].setEnabled(!camOn);
      setCamOn(!camOn);
    }
  };

  // --- Render Call UI (Themed Controls) ---
  return (
    <div className="relative h-screen w-screen bg-gray-900 flex items-center justify-center overflow-hidden">

      {/* REMOTE VIDEO (large) */}
      <div
        id="remote-videos"
        className="w-[90%] h-[80%] bg-black rounded-2xl shadow-2xl shadow-purple-500/20 flex items-center justify-center overflow-hidden"
      >
        {/* Fallback content when no remote streams are active */}
        {!joined && (
             <p className="text-xl font-medium text-gray-400">Joining consultation, please wait...</p>
        )}
      </div>

      {/* LOCAL VIDEO (small box) */}
      <div
        id="local-player"
        className="absolute bottom-28 right-10 w-48 h-36 bg-black rounded-xl shadow-2xl overflow-hidden border-2 border-purple-500/50"
      ></div>

      {/* Controls (Themed) */}
      <div className="absolute bottom-6 flex space-x-6 bg-gray-800/70 backdrop-blur-md px-8 py-4 rounded-full shadow-2xl border border-gray-700">
        
        <button
          onClick={toggleMic}
          className={`p-4 rounded-full text-white transition-colors shadow-lg ${
            micOn ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {micOn ? "🎤" : "🔇"}
        </button>

        <button
          onClick={toggleCam}
          className={`p-4 rounded-full text-white transition-colors shadow-lg ${
            camOn ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {camOn ? "📷" : "🚫"}
        </button>

        <button
          onClick={leaveCall}
          className="p-4 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shadow-lg"
        >
          🚪 End Call
        </button>
      </div>
    </div>
  );
}