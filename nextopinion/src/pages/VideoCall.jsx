import React, { useEffect, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import API from "../api";

export default function VideoCall({ channelName = "doctor_patient" }) {
    const appId = import.meta.env.VITE_AGORA_APP_ID;

    const [client] = useState(() =>
        AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })
    );

    const [localTracks, setLocalTracks] = useState([]);
    const [joined, setJoined] = useState(false);
    const [tokenData, setTokenData] = useState(null);

    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);

    useEffect(() => {
        const fetchToken = async () => {
            try {
                const uid = Math.floor(Math.random() * 100000);

                const res = await API.post("/generate_token", {
                    channel_name: channelName,
                    uid,
                });

                setTokenData({ token: res.data.token, uid });
            } catch (err) {
                alert("Token generation failed");
            }
        };

        fetchToken();
    }, [channelName]);

    useEffect(() => {
        if (!tokenData || joined) return;

        const initCall = async () => {
            try {
                await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

                const { uid, token } = tokenData;

                await client.join(appId, channelName, token, uid);

                const [micTrack, camTrack] =
                    await AgoraRTC.createMicrophoneAndCameraTracks();

                setLocalTracks([micTrack, camTrack]);

                camTrack.play("local-player");

                await client.publish([micTrack, camTrack]);

                setJoined(true);

                client.removeAllListeners("user-published");
                client.removeAllListeners("user-unpublished");

                client.on("user-published", async (user, mediaType) => {
                    if (user.uid === client.uid) return;

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

                client.on("user-unpublished", (user) => {
                    const el = document.getElementById(`remote-${user.uid}`);
                    if (el) el.remove();
                });
            } catch (err) {
                alert("Agora Call Failed");
            }
        };

        initCall();
    }, [tokenData, joined]);

    const leaveCall = async () => {
        localTracks.forEach((track) => {
            track.stop();
            track.close();
        });

        await client.leave();
        setJoined(false);
        document.getElementById("remote-videos").innerHTML = "";
    };

    // ==== UI ====

    const toggleMic = () => {
        if (localTracks[0]) {
            if (micOn) localTracks[0].setEnabled(false);
            else localTracks[0].setEnabled(true);
            setMicOn(!micOn);
        }
    };

    const toggleCam = () => {
        if (localTracks[1]) {
            if (camOn) localTracks[1].setEnabled(false);
            else localTracks[1].setEnabled(true);
            setCamOn(!camOn);
        }
    };

    return (
        <div className="relative h-screen w-screen bg-gray-900 flex items-center justify-center overflow-hidden">

            {/* REMOTE VIDEO (Full Screen Center) */}
            <div
                id="remote-videos"
                className="w-[90%] h-[80%] bg-black rounded-2xl shadow-2xl flex items-center justify-center overflow-hidden"
            ></div>

            {/* LOCAL VIDEO (Bottom Right Floating) */}
            <div
                id="local-player"
                className="absolute bottom-28 right-10 w-48 h-36 bg-black rounded-xl shadow-lg overflow-hidden border border-white/30"
            ></div>

            {/* Control Bar */}
            <div className="absolute bottom-6 flex space-x-6 bg-white/10 backdrop-blur-lg px-8 py-4 rounded-full shadow-xl">

                {/* Mic */}
                <button
                    onClick={toggleMic}
                    className={`p-4 rounded-full text-white ${
                        micOn ? "bg-gray-700" : "bg-red-600"
                    }`}
                >
                    {micOn ? "🎤" : "🔇"}
                </button>

                {/* Camera */}
                <button
                    onClick={toggleCam}
                    className={`p-4 rounded-full text-white ${
                        camOn ? "bg-gray-700" : "bg-red-600"
                    }`}
                >
                    {camOn ? "📷" : "🚫"}
                </button>

                {/* Leave */}
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
