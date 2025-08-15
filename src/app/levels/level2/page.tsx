"use client";

import axios from "axios";
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
  // Track if we should be listening
  const shouldListenRef = useRef<boolean>(false);
  // Health check timer for recognition
  const healthCheckRef = useRef<NodeJS.Timeout | null>(null);
  // Track if recognition is currently active
  const isRecognitionActiveRef = useRef<boolean>(false);
  // Track pending operations to cancel them
  const pendingOperationsRef = useRef<Set<string>>(new Set());

  // Helper function to cancel pending operations
  const cancelPendingOperations = () => {
    console.log(
      `Cancelling ${pendingOperationsRef.current.size} pending operations`
    );
    pendingOperationsRef.current.clear();
  };

  // Helper function to stop all audio
  const stopAllAudio = () => {
    console.log(
      `Stopping ${activeAudiosRef.current.length} active audio elements`
    );

    activeAudiosRef.current.forEach((audio, index) => {
      try {
        audio.pause();
        audio.src = "";
        console.log(`Stopped audio ${index + 1}`);
      } catch (e) {
        console.warn(`Error stopping audio ${index + 1}:`, e);
      }
    });

    activeAudiosRef.current = [];
    console.log("All audio elements stopped");
  };

  // Health check function to ensure recognition stays active
  const startHealthCheck = () => {
    if (healthCheckRef.current) {
      clearInterval(healthCheckRef.current);
    }

    healthCheckRef.current = setInterval(() => {
      if (listening && shouldListenRef.current && recognitionRef.current) {
        // Check if recognition is actually running
        try {
          // Try to restart if it seems inactive
          if (!isRecognitionActiveRef.current) {
            console.log("Health check: Restarting inactive recognition...");
            recognitionRef.current.start();
          }
        } catch (err) {
          console.warn("Health check: Failed to restart recognition:", err);
        }
      }
    }, 5000); // Check every 5 seconds
  };

  // Helper function to play audio
  const playAudio = (url: string): Promise<void> => {
    return new Promise((resolve) => {
      // Check if we should still be playing (conversation not ended)
      if (!listening || !shouldListenRef.current) {
        console.log("Audio playback skipped - conversation ended");
        resolve();
        return;
      }

      const audio = new Audio(url);
      activeAudiosRef.current.push(audio);

      audio.onended = () => {
        try {
          URL.revokeObjectURL(url);
        } catch (_) {}
        activeAudiosRef.current = activeAudiosRef.current.filter(
          (a) => a !== audio
        );
        resolve();
      };

      audio.onerror = (e) => {
        // Don't log errors when conversation has ended - this is expected
        if (listening && shouldListenRef.current) {
          console.warn("Audio playback error:", e);
        }
        try {
          URL.revokeObjectURL(url);
        } catch (_) {}
        activeAudiosRef.current = activeAudiosRef.current.filter(
          (a) => a !== audio
        );
        resolve();
      };

      audio.play().catch((err) => {
        // Don't log errors when conversation has ended - this is expected
        if (listening && shouldListenRef.current) {
          console.warn("Audio play failed:", err);
        }
        try {
          URL.revokeObjectURL(url);
        } catch (_) {}
        activeAudiosRef.current = activeAudiosRef.current.filter(
          (a) => a !== audio
        );
        resolve();
      });
    });
  };

  const VOICE_BARTENDER = "tQ4MEZFJOzsahSEEZtHK";
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

    rec.onstart = () => {
      isRecognitionActiveRef.current = true;
      console.log("Recognition started");
    };

    rec.onresult = (e: any) => {
      if (!listening || !shouldListenRef.current) return;

      // Combine all transcripts
      const txt = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(" ")
        .trim();

      if (!txt || txt === lastSpokenRef.current) return;

      // Update last spoken immediately
      lastSpokenRef.current = txt;
      setTranscript(txt);

      // Debounce sending to API
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(async () => {
        if (!listening || !shouldListenRef.current) return;

        // Cancel any pending operations
        cancelPendingOperations();

        // Track this operation
        const opId = crypto.randomUUID();
        pendingOperationsRef.current.add(opId);

        try {
          await handleSend(txt);
        } finally {
          pendingOperationsRef.current.delete(opId);
        }

        // Reset transcript after sending
        setTranscript("");
      }, 700); // 700ms after last speech chunk
    };

    rec.onend = () => {
      isRecognitionActiveRef.current = false;
      console.log("Recognition ended");

      // Only restart if we're supposed to be listening and not playing
      if (listening && recognitionRef.current && shouldListenRef.current) {
        console.log("Recognition ended, restarting...");
        setTimeout(() => {
          if (listening && recognitionRef.current && shouldListenRef.current) {
            try {
              recognitionRef.current.start();
              console.log("Recognition restarted successfully");
            } catch (err) {
              console.warn("Failed to restart recognition:", err);
            }
          }
        }, 100); // Small delay to ensure clean restart
      }
    };

    rec.onerror = (err: any) => {
      // Only log errors if conversation is still active
      if (listening) {
        // Handle no-speech error gracefully - don't stop conversation
        if (err && err.error === "no-speech") {
          console.log("No speech detected, continuing to listen...");
          // Don't stop listening, just let it continue
          return;
        }

        console.warn("SpeechRecognition error:", err);
        // Only stop listening on critical errors
        if (err && (err.error === "network" || err.error === "not-allowed")) {
          setListening(false);
        }
      }
    };

    recognitionRef.current = rec;

    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onresult = null;
          recognitionRef.current.onstart = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current = null;
        } catch (_) {}
      }
      // Reset all refs
      shouldListenRef.current = false;
      isRecognitionActiveRef.current = false;

      // Clear timers
      if (healthCheckRef.current) {
        clearInterval(healthCheckRef.current);
        healthCheckRef.current = null;
      }
    };
  }, [listening]);

  const startListening = () => {
    if (!recognitionRef.current) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }
    lastSpokenRef.current = "";
    setTranscript("");
    shouldListenRef.current = true;
    recognitionRef.current.start();

    // Start health check
    startHealthCheck();
  };

  const stopListening = (markComplete: boolean = false) => {
    console.log("Stopping conversation...");

    // Update state FIRST to prevent new operations
    setListening(false);
    shouldListenRef.current = false;

    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn("Error stopping recognition:", err);
      }
    }

    // Clear timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Stop health check
    if (healthCheckRef.current) {
      clearInterval(healthCheckRef.current);
      healthCheckRef.current = null;
    }

    // ⛔ Stop all currently playing bot voices IMMEDIATELY
    stopAllAudio();

    // Cancel any pending operations
    cancelPendingOperations();

    // Only mark as completed if explicitly requested
    if (markComplete) {
      handleCompletion();
    }

    console.log("Conversation stopped successfully");
  };

  // ✅ Completion handler
  const handleCompletion = () => {
    localStorage.setItem("level2Completed", "true");
    setShowCompletion(true);
  };

  async function handleSend(
    customPrompt?: string,
    firstInteraction: boolean = false
  ) {
    const userText = customPrompt || transcript;
    if (!userText.trim()) return;

    try {
      if (!listening || !shouldListenRef.current) return;

      const resp = await fetch("/api/level_2/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: userText, firstInteraction }),
      });

      if (!resp.ok) throw new Error(`API error: ${resp.status}`);

      const data = await resp.json();
      console.log("API response:", data);

      // Extract and clean text (ensure correct speaker)
      const bartenderText = data.bartender?.trim() || "";
      const bobText = data.bob?.trim() || "";

      if (!bartenderText && !bobText) return;
      if (!listening) return;

      // Generate TTS audio for each speaker separately
      const urls: (string | null)[] = [];

      if (bartenderText) {
        const bartenderUrl = await getTTSAudio(bartenderText, VOICE_BARTENDER);
        urls.push(bartenderUrl);
      }

      if (bobText) {
        const bobUrl = await getTTSAudio(bobText, VOICE_BOB);
        urls.push(bobUrl);
      }

      // Play voices in the correct order (bartender first, then bob)
      await playSequence(urls);
    } catch (error) {
      if (listening) console.error("Error in handleSend:", error);
    }
  }

  async function startBotConversation() {
    console.log("Starting bot conversation...");
    try {
      // Check if conversation is still active
      if (!listening || !shouldListenRef.current) {
        console.log("Conversation ended, skipping bot conversation");
        return;
      }

      await handleSend("START_CONVO", true); // true = firstInteraction
      console.log("Bot conversation started successfully");
    } catch (error) {
      console.error("Failed to start bot conversation:", error);
    }
  }

  async function getTTSAudio(text: string, voiceId: string) {
    try {
      // Check if conversation is still active
      if (!listening) {
        console.log("Conversation ended, skipping TTS");
        return null;
      }

      const res = await fetch("/api/level_2/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: voiceId }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn("TTS API error:", errorText);
        return null;
      }

      const blob = await res.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      // Only log error if conversation is still active
      if (listening) {
        console.warn("TTS error:", error);
      }
      return null;
    }
  }

  async function playSequence(urls: (string | null | undefined)[]) {
    // Check if conversation is still active
    if (!listening || !shouldListenRef.current) {
      console.log("Conversation ended, skipping audio sequence");
      return;
    }

    console.log(
      `Starting audio sequence with ${urls.filter((u) => u).length} audio files`
    );

    // Ensure preceding audios not playing
    stopAllAudio();

    for (const u of urls) {
      // Check state before each audio
      if (u && listening && shouldListenRef.current) {
        await playAudio(u);
      } else if (!listening || !shouldListenRef.current) {
        console.log("Conversation ended during audio sequence, stopping");
        break;
      }
    }

    console.log("Audio sequence completed");
  }

  // function playWithOverlap(firstUrl: string, secondUrl: string, overlapMs: number) {
  //   return new Promise<void>((resolve, reject) => {
  //     const firstAudio = new Audio(firstUrl);
  //     const secondAudio = new Audio(secondUrl);

  //     // Track both audios so we can stop them later
  //     activeAudiosRef.current.push(firstAudio, secondAudio);

  //     let overlapTimer: NodeJS.Timeout;

  //     firstAudio.onplay = () => {
  //       const estimatedDuration = firstAudio.duration * 1000;
  //       if (!isNaN(estimatedDuration) && estimatedDuration > overlapMs) {
  //         overlapTimer = setTimeout(() => {
  //           secondAudio.play().catch(reject);
  //         }, Math.max(0, estimatedDuration - overlapMs));
  //       } else {
  //         firstAudio.onended = () => {
  //           secondAudio.play().catch(reject);
  //         };
  //       }
  //     };

  //     secondAudio.onended = () => {
  //       URL.revokeObjectURL(firstUrl);
  //       URL.revokeObjectURL(secondUrl);
  //       clearTimeout(overlapTimer);
  //       resolve();
  //     };

  //     firstAudio.onerror = reject;
  //     secondAudio.onerror = reject;

  //     firstAudio.play().catch(reject);
  //   });
  // }

  const handleStartConversation = async () => {
    try {
      // Immediately set listening to true to show "End Conversation" button
      setListening(true);
      shouldListenRef.current = true;

      // 🎯 Step 1: Play greeting immediately
      const greeting = "Welcome sir....... how are you??";
      const voiceId = "tQ4MEZFJOzsahSEEZtHK"; // replace with your ElevenLabs voice ID

      const ttsRes = await axios.post(
        "/api/level_2/tts",
        {
          text: greeting,
          voice: voiceId, // ✅ matches backend's expected param
        },
        {
          responseType: "arraybuffer", // so we get audio data
        }
      );

      const audioBlob = new Blob([ttsRes.data], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      await audio.play();

      // 🎯 Step 2: Start bot conversation
      await startBotConversation();

      // 🎯 Step 3: Start listening
      startListening();
    } catch (err) {
      console.error("Error starting conversation:", err);
    }
  };

  return (
    <div className="relative w-full min-h-screen  bg-black text-white">
      {loading ? (
        <div className="bg-white">
          <Loader />
        </div>
      ) : (
        <>
          {/* <Header /> */}

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
              <Confetti className="w-full h-full" />
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

              {/* <p className="text-sm sm:text-base text-gray-300 max-w-md bg-gray-900 sm:p-3 px-8 py-3 rounded-[50px]">
                📍 <strong>Scene:</strong> You’re at a lively bar where a
                friendly bartender and Bob, a regular customer, are chatting
                casually. They’re playful, relaxed, and love when others join
                the conversation — so jump in and enjoy the banter.
              </p> */}
              <p className="text-sm sm:text-base text-gray-300 max-w-md bg-gray-900 sm:p-3 px-8 py-3 rounded-[50px]">
                📍 <strong>Scene:</strong> You’ve just stepped into a lively
                bar. The friendly bartender greets you warmly, and your buddy
                Bob is already sitting there with a drink in hand. They’re
                playful, relaxed, and love when others join the conversation —
                so jump in and enjoy the banter.
              </p>

              <SpeakingOrb isSpeaking={listening} />
              <div className="sm:relative sm:bottom-18">
                {!listening ? (
                  <button
                    onClick={handleStartConversation}
                    className="px-6 py-2 sm:py-3 bg-green-500 hover:bg-green-600 rounded-full font-semibold text-sm sm:text-base hover:cursor-pointer"
                  >
                    Start Conversation
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      stopListening(false); // false = don't mark as completed
                    }}
                    className="px-6 py-2 sm:py-3 bg-red-500 hover:bg-red-600 rounded-full font-semibold text-sm sm:text-base hover:cursor-pointer"
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
