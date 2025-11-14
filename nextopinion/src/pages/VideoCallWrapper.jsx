import { useParams } from "react-router-dom";
import VideoCall from "./VideoCall";

export default function VideoCallWrapper() {
  const { channel } = useParams();
  return <VideoCall channelName={channel} />;
}
