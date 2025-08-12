"use client";

import Header from "@/app/components/header/page";
import SpeakingOrb from "@/app/speakingOrb/SpeakingOrb";
import React, { useEffect, useRef, useState } from "react";
import Confetti from "react-confetti";
import { useRouter } from "next/navigation";
import Loader from "@/app/components/loader/page";

export default function Level2() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [showCompletion, setShowCompletion] = useState(false);
  const recognitionRef = useRef<any>(null);
  const lastSpokenRef = useRef<string>("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // 🔊 Track all active audios to stop them instantly
  const activeAudiosRef = useRef<HTMLAudioElement[]>([]);

  const VOICE_ALICE = "O4cGUVdAocn0z4EpQ9yF";
  const VOICE_BOB = "8sZxD42zKDvoEXNxBTdX";

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // ✅ Load completion state from localStorage
  useEffect(() => {
    const completed = localStorage.getItem("level2Completed") === "true";
    if (completed) {
      setShowCompletion(true);
    }
  }, []);

  // ✅ SpeechRecognition setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("SpeechRecognition not supported in this browser.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onresult = async (e: any) => {
      const txt = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(" ")
        .trim();

      if (txt && txt !== lastSpokenRef.current) {
        lastSpokenRef.current = txt;
        setTranscript(txt);
        await handleSend(txt);
        setTranscript("");
      }
    };

    rec.onend = () => {
      if (listening && recognitionRef.current) {
        recognitionRef.current.start();
      }
    };

    rec.onerror = (err: any) => {
      console.error("SpeechRecognition error", err);
      setListening(false);
    };

    recognitionRef.current = rec;
  }, [listening]);

  const startListening = () => {
    if (!recognitionRef.current) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }
    lastSpokenRef.current = "";
    setTranscript("");
    setListening(true);
    recognitionRef.current.start();

    // ⏳ End after 30 seconds
    timerRef.current = setTimeout(() => {
      stopListening();
      handleCompletion();
    }, 30 * 1000);
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setListening(false);
    if (timerRef.current) clearTimeout(timerRef.current);

    // ⛔ Stop all currently playing bot voices
    activeAudiosRef.current.forEach((audio) => {
      audio.pause();
      audio.src = "";
    });
    activeAudiosRef.current = [];
  };

  // ✅ Completion handler
  const handleCompletion = () => {
    localStorage.setItem("level2Completed", "true");
    setShowCompletion(true);
  };

  async function handleSend(customPrompt?: string) {
    const userText = customPrompt || transcript;
    if (!userText.trim()) return;

    const resp = await fetch("/api/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: userText }),
    });

    const data = await resp.json();
    const aliceText = data.alice;
    const bobText = data.bob;

    const aliceUrl = await getTTSAudio(aliceText, VOICE_ALICE);
    const bobUrl = await getTTSAudio(bobText, VOICE_BOB);

    await playWithOverlap(aliceUrl, bobUrl, 0);
  }

  async function startBotConversation() {
    await handleSend("Start a fun conversation with the user");
  }

  async function getTTSAudio(text: string, voiceId: string) {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice: voiceId }),
    });

    if (!res.ok) throw new Error(await res.text());
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }

  function playWithOverlap(firstUrl: string, secondUrl: string, overlapMs: number) {
    return new Promise<void>((resolve, reject) => {
      const firstAudio = new Audio(firstUrl);
      const secondAudio = new Audio(secondUrl);

      // Track both audios so we can stop them later
      activeAudiosRef.current.push(firstAudio, secondAudio);

      let overlapTimer: NodeJS.Timeout;

      firstAudio.onplay = () => {
        const estimatedDuration = firstAudio.duration * 1000;
        if (!isNaN(estimatedDuration) && estimatedDuration > overlapMs) {
          overlapTimer = setTimeout(() => {
            secondAudio.play().catch(reject);
          }, Math.max(0, estimatedDuration - overlapMs));
        } else {
          firstAudio.onended = () => {
            secondAudio.play().catch(reject);
          };
        }
      };

      secondAudio.onended = () => {
        URL.revokeObjectURL(firstUrl);
        URL.revokeObjectURL(secondUrl);
        clearTimeout(overlapTimer);
        resolve();
      };

      firstAudio.onerror = reject;
      secondAudio.onerror = reject;

      firstAudio.play().catch(reject);
    });
  }

  const handleStartConversation = async () => {
    await startBotConversation();
    startListening();
  };

  return (
    <div className="relative w-full min-h-screen  bg-black text-white">
      {loading ? (
        <div className="bg-white">
          <Loader />
        </div>
      ) : (
        <>
          <Header />

          {/* Background Video */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute top-0 left-0 w-full h-full object-cover z-0"
          >
            <source
              src="https://cdn.pixabay.com/video/2024/03/21/205006-926015709_large.mp4"
              type="video/mp4"
            />
          </video>
          <div className="absolute inset-0 bg-black/60 z-10" />

          {showCompletion ? (
            <div className="relative z-20 w-full h-screen flex flex-col justify-center items-center text-center px-4 animate__animated animate__fadeInUp">
              <Confetti className="w-full h-full"/>
              <h2 className="text-3xl mt-10 sm:text-4xl font-bold text-green-400 mb-2">
                🎉 Conversation Completed!
              </h2>
              <p className="text-base sm:text-lg text-gray-300">
                Great job! You’ve finished Level 2.
              </p>
              <button
                className="mt-4 px-8 py-3 bg-white text-black font-semibold rounded-full transition duration-300 shadow-lg hover:bg-violet-500 hover:text-white"
                onClick={() => router.push("/levels/level3")}
              >
                Next Level
              </button>
            </div>
          ) : (
            <div className="relative z-20 h-full flex flex-col justify-center items-center px-4 text-center gap-4">
              <h1 className="text-2xl mt-10 sm:text-4xl font-bold">
                Bar Conversation — Level 2
              </h1>

              <p className="text-sm sm:text-base text-gray-300 max-w-md bg-gray-900 sm:p-3 px-8 py-3 rounded-[50px]">
                📍 <strong>Scene:</strong> You’re at a lively bar where Alice
                and Bob are deep in conversation. They're witty, curious, and
                love getting you involved. Just have fun and join in like one of
                the gang.
              </p>

              <SpeakingOrb isSpeaking={listening} />
              <div className="sm:relative sm:bottom-18">
                {!listening ? (
                  <button
                    onClick={handleStartConversation}
                    className="px-6 py-2 sm:py-3 bg-green-500 hover:bg-green-600 rounded-full font-semibold text-sm sm:text-base"
                  >
                    Start Conversation
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      stopListening();
                      handleCompletion();
                    }}
                    className="px-6 py-2 sm:py-3 bg-red-500 hover:bg-red-600 rounded-full font-semibold text-sm sm:text-base"
                  >
                    End Conversation
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
