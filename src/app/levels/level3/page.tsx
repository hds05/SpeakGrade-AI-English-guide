"use client";
import Header from "@/app/components/header/page";
import Loader from "@/app/components/loader/page";
import { useState, useEffect } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

export default function Level3() {
  const [phase, setPhase] = useState<"intro" | "main">("intro");
  const [interviewerIndex, setInterviewerIndex] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div>
      {loading ? (
        <div className="bg-white">
          <Loader />
        </div>
      ) : (
        <>
          <Header />
          <div
            className="
    p-6
    bg-contain bg-no-repeat bg-center min-h-[100dvh] w-full bg-gray-100
    bg-[url('https://blog.glassdoor.com/site-us/wp-content/uploads/sites/2/New-asset-The-Pros-and-Cons-of-a-Panel-Interview-02-1.png?w=900')]
    sm:bg-[url('/interview_img.jpg')]
    sm:bg-cover
  "
          ></div>
        </>
      )}
    </div>
  );
}
