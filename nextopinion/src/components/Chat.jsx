import React, { useEffect, useState } from "react";
import API from "../api";

export default function Chat({ reportId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (reportId) loadChat();
    const t = setInterval(() => reportId && loadChat(), 3000);
    return () => clearInterval(t);
  }, [reportId]);

  const loadChat = async () => {
    const res = await API.get(`/chat/${reportId}`);
    setMessages(res.data.messages || []);
  };

  const send = async () => {
    if (!text) return;
    await API.post(`/chat/${reportId}/send`, {
      sender: "user",
      message: text,
    });
    setText("");
    loadChat();
  };

  if (!reportId)
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-gray-500">
        Generate a report to start chatting with a doctor.
      </div>
    );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex flex-col h-96">
      <h2 className="text-lg font-semibold mb-2">Chat</h2>
      <div className="flex-1 overflow-y-auto border rounded-md p-2 mb-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`mb-2 ${
              m.sender === "user" ? "text-right" : "text-left"
            }`}
          >
            <span
              className={`inline-block px-3 py-1 rounded-lg ${
                m.sender === "user"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {m.message}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded-md p-2"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          onClick={send}
          className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
