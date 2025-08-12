"use client";
import { useState, useEffect } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

export default function Level3() {
  const [phase, setPhase] = useState<"intro" | "main">("intro");
  const [interviewerIndex, setInterviewerIndex] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const { transcript, listening, resetTranscript } = useSpeechRecognition();

  useEffect(() => {
    if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
      alert("Browser doesn't support speech recognition.");
    }
  }, []);

  const startInterview = async () => {
    setLoading(true);
    const res = await fetch("/api/respond3", {
      method: "POST",
      body: JSON.stringify({ phase, interviewerIndex, history }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();

    setHistory((prev) => [...prev, { role: "assistant", content: data.reply }]);
    playVoice(data.reply, interviewerIndex);
    setLoading(false);
  };

  const playVoice = async (text: string, index: number) => {
    const res = await fetch("/api/tts3", {
      method: "POST",
      body: JSON.stringify({ text, interviewerIndex: index }),
      headers: { "Content-Type": "application/json" },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
  };

  const handleUserReply = () => {
    SpeechRecognition.startListening({ continuous: false });
  };

  const handleStop = () => {
    SpeechRecognition.stopListening();
    if (transcript.trim()) {
      setHistory((prev) => [...prev, { role: "user", content: transcript }]);
      resetTranscript();

      // Move to next interviewer
      const nextIndex = (interviewerIndex + 1) % 3;
      if (phase === "intro" && nextIndex === 0) {
        setPhase("main");
      }
      setInterviewerIndex(nextIndex);
      setTimeout(() => startInterview(), 1000);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">
        Level 3: Group Interview ({phase === "intro" ? "Intro" : "Main"})
      </h1>

      <div className="mt-4 space-y-2">
        {history.map((msg, i) => (
          <p
            key={i}
            className={msg.role === "user" ? "text-blue-500" : "text-green-500"}
          >
            <strong>
              {msg.role === "user" ? "You" : `Interviewer ${((i + 1) % 3) + 1}`}
              :
            </strong>{" "}
            {msg.content}
          </p>
        ))}
      </div>

      <div className="mt-4">
        {listening ? (
          <button
            onClick={handleStop}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Stop Listening
          </button>
        ) : (
          <button
            onClick={handleUserReply}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Answer
          </button>
        )}
      </div>

      {loading && <p className="mt-2 text-gray-500">Loading...</p>}
    </div>
  );
}
