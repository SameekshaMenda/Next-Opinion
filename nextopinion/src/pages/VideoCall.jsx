import React, { useEffect, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import API from "../api";

export default function VideoCall({ channelName = "doctor_patient" }) {
    const [client] = useState(() => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }));
    const [localTracks, setLocalTracks] = useState([]);
    const [remoteUsers, setRemoteUsers] = useState([]);
    const [joined, setJoined] = useState(false);
    const [tokenData, setTokenData] = useState(null);

    // ✅ Fetch Agora token from backend
    useEffect(() => {
        const fetchToken = async () => {
            const res = await API.post("/generate_token", {
                channel_name: channelName,
                uid: Math.floor(Math.random() * 10000),
            });
            setTokenData(res.data);
        };
        fetchToken();
    }, [channelName]);

    // ✅ Initialize and join call
    useEffect(() => {
        if (!tokenData) return;

        const initCall = async () => {
            try {
                client.on("user-published", async (user, mediaType) => {
                    await client.subscribe(user, mediaType);
                    if (mediaType === "video") {
                        const videoDiv = document.createElement("div");
                        videoDiv.id = `user-${user.uid}`;
                        videoDiv.style.width = "300px";
                        videoDiv.style.height = "200px";
                        videoDiv.style.backgroundColor = "#000";
                        document.getElementById("remote-videos").appendChild(videoDiv);
                        user.videoTrack.play(`user-${user.uid}`);
                    }
                    if (mediaType === "audio") user.audioTrack?.play();
                });

                client.on("user-unpublished", (user) => {
                    const el = document.getElementById(`user-${user.uid}`);
                    if (el) el.remove();
                });

                await client.join(tokenData.appId, tokenData.channelName, tokenData.token, null);

                // 🔥 Ask for permissions properly
                const tracks = await AgoraRTC.createMicrophoneAndCameraTracks({}, { encoderConfig: "720p" });
                setLocalTracks(tracks);

                const localVideoDiv = document.getElementById("local-player");
                tracks[1].play(localVideoDiv); // Camera
                tracks[0].play();              // Audio

                await client.publish(tracks);
                setJoined(true);
            } catch (err) {
                console.error("Agora init error:", err);
                alert("Camera/Microphone access denied or device not available.");
            }
        };


        initCall();

        return () => {
            localTracks.forEach((track) => track.stop() && track.close());
            client.leave();
        };
    }, [tokenData]);

    const leaveCall = async () => {
        localTracks.forEach((track) => track.stop() && track.close());
        await client.leave();
        setRemoteUsers([]);
        setJoined(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold mb-4">Agora Video Call</h1>
            <div className="flex gap-6">
                <div id="local-player" className="w-64 h-48 bg-black rounded-lg"></div>
                <div id="remote-videos" className="flex flex-wrap gap-4"></div>
            </div>
            {joined ? (
                <button onClick={leaveCall} className="mt-6 bg-red-600 text-white px-4 py-2 rounded">
                    Leave Call
                </button>
            ) : (
                <p className="text-gray-600 mt-6">Joining call...</p>
            )}
        </div>
    );
}
