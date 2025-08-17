"use client";
import { useState, useEffect, useRef } from "react";
import Header from "@/app/components/header/page";
import Loader from "@/app/components/loader/page";
import SoundWave from "@/app/components/soundwave/SoundWave";
import Confetti from "react-confetti";
import { useRouter } from "next/navigation";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

export default function Level5() {
  const [phase, setPhase] = useState<"intro" | "briefing" | "main">("intro");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [showIntroPopup, setShowIntroPopup] = useState(true);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [currentQuestionScore, setCurrentQuestionScore] = useState(0);
  const [ticketOutcome, setTicketOutcome] = useState<"valid" | "cancelled" | "pending">("pending");
  const router = useRouter();

  const conversationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const audioUnlockedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
      alert("Browser doesn't support speech recognition.");
    }
  }, []);

  // Load completion state from localStorage
  useEffect(() => {
    const completed = localStorage.getItem("level5Completed") === "true";
    if (completed) {
      setShowCompletion(true);
    }
  }, []);

  // Completion handler
  const handleCompletion = () => {
    console.log("✅ Level 5 completed. Saving to localStorage.");
    localStorage.setItem("level5Completed", "true");
    setShowCompletion(true);
  };

  const officer = { name: "Officer Davis", image: "/old-man-avatar.png" }; // We'll use the same avatar for now

  // Unlock audio context on first user interaction
  const unlockAudio = () => {
    if (audioUnlockedRef.current) return;
    const dummy = new Audio();
    dummy.src = "";
    dummy.play().catch(() => {});
    audioUnlockedRef.current = true;
    console.log("🔓 Audio context unlocked");
  };

  // Start conversation
  const startConversation = async () => {
    unlockAudio();
    setConversationStarted(true);
    setMicActive(false);
    setPhase("main");

    const officerOpening = "Here's your ticket. This is a no-parking zone. How long have you been parked here?";

    // Add officer's opening to the conversation history
    setHistory((prev) => [
      ...prev,
      { role: "assistant", content: officerOpening, speaker: "Officer Davis" },
    ]);

    // Play officer's opening voice
    await playVoice(officerOpening, "Officer Davis");

    // Enable mic for user's first response
    setMicActive(true);
    SpeechRecognition.startListening({ continuous: true });

    // Set time limit (6 minutes for police encounter)
    conversationTimerRef.current = setTimeout(() => {
      console.log("🛑 Conversation time limit reached. Stopping conversation.");
      handleStopConversation(true);
    }, 6 * 60 * 1000); // 6 minutes
  };

  // Fetch officer's response
  const getOfficerResponse = async (userMessage?: string) => {
    // Don't make API calls if conversation has ended
    if (!conversationStarted) {
      console.log("🛑 Conversation already ended, skipping API call");
      return;
    }
    
    setLoading(true);
    console.log(`🎤 Getting officer response for: ${userMessage}`);
    try {
      const res = await fetch("/api/level5/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: userMessage || "",
          conversationHistory: history,
          questionCount: questionCount,
        }),
      });

      const data = await res.json();
      console.log(`🤖 Officer responded:`, data);

      const reply = data?.conversation?.text || data.text || data.reply || "";
      const scoreData = data?.score || { points: 0, maxPoints: 1, feedback: "" };
      const outcome = data?.ticketOutcome || "pending";

      if (reply.trim()) {
        setHistory((prev) => [
          ...prev,
          { role: "assistant", content: reply, speaker: "Officer Davis" },
        ]);
        await playVoice(reply, "Officer Davis");
        
        // Update scores
        setScore(prev => prev + scoreData.points);
        setMaxScore(prev => prev + scoreData.maxPoints);
        setCurrentQuestionScore(scoreData.points);
        setQuestionCount(prev => prev + 1);
        setTicketOutcome(outcome);

        // Clear current question score after showing it for a moment
        if (scoreData.points > 0) {
          setTimeout(() => setCurrentQuestionScore(0), 3000);
        }

        // Check if conversation should end (after ~8-10 questions or if ticket is resolved)
        if (outcome === "cancelled" || outcome === "valid") {
          // Immediately stop conversation when ticket outcome is determined
          console.log(`🎉 Ticket outcome determined: ${outcome}! Ending conversation.`);
          handleStopConversation(true);
          return; // Don't continue with voice playback or mic activation
        } else if (questionCount >= 9) {
          setTimeout(() => {
            handleStopConversation(true);
          }, 3000); // Normal timeout delay
        }
      } else {
        console.warn("⚠️ No valid text to speak.");
      }

      // Enable mic for user's answer
      setMicActive(true);
      SpeechRecognition.startListening({ continuous: true });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Play audio from TTS
  const playVoice = async (text: string, speaker: string) => {
    setSpeakingIndex(0); // Only one officer
    try {
      const res = await fetch("/api/level5/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, speaker }),
      });

      if (!res.ok) throw new Error("TTS failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      await new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          console.log(`✅ Finished speaking: ${speaker}`);
          setSpeakingIndex(null);
          resolve();
        };
        audio.onerror = reject;
        audio.play().catch((err) => {
          console.warn("Autoplay blocked, user interaction required:", err);
          setSpeakingIndex(null);
          reject(err);
        });
      });
    } catch (e) {
      console.error("playVoice error:", e);
      setSpeakingIndex(null);
    }
  };

  // When user stops speaking
  useEffect(() => {
    if (!listening && transcript.trim()) {
      processUserAnswer(transcript);
      resetTranscript();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening]);

  // Handle user answer
  const processUserAnswer = async (answer: string) => {
    console.log("🗣️ User answered:", answer);
    SpeechRecognition.stopListening();
    setMicActive(false);

    setHistory((prev) => [...prev, { role: "user", content: answer }]);

    // Get officer's response
    await getOfficerResponse(answer);
  };

  // Mute mic manually
  const handleMute = () => {
    if (micActive) {
      SpeechRecognition.stopListening();
      setMicActive(false);
    } else {
      SpeechRecognition.startListening({ continuous: true });
      setMicActive(true);
    }
  };

  // Stop entire conversation
  const handleStopConversation = (isTimeUp = false) => {
    SpeechRecognition.stopListening();
    setConversationStarted(false);
    setMicActive(false);

    if (conversationTimerRef.current) {
      clearTimeout(conversationTimerRef.current);
      conversationTimerRef.current = null;
    }

    if (isTimeUp || questionCount >= 8) {
      handleCompletion();
      setShowCompletion(true);
    } else {
      // Reset everything for a manual restart
      setShowIntroPopup(true);
      setHistory([]);
      setQuestionCount(0);
      setScore(0);
      setMaxScore(0);
      setCurrentQuestionScore(0);
      setTicketOutcome("pending");
      setPhase("intro");
    }
  };

  const factParagraph = `At 9:15 this morning, you stopped your bakery delivery van in a no‑parking zone in front of Green Leaf Café because every other parking spot nearby was taken. You had to deliver a three‑tier wedding cake directly to the café's manager — it couldn't be left unattended. You switched on your hazard lights, carried the cake inside, and were gone for less than one minute. When you came back, I had already written the ticket. You have your delivery schedule and a signed receipt from the café manager to prove the delivery.`;

  return (
    <div>
      {loading && !conversationStarted ? (
        <div className="bg-white">
          <Loader />
        </div>
      ) : (
        <>
          {showCompletion ? (
            <div
              className="relative z-10 w-full min-h-screen flex flex-col justify-center items-center text-center px-4 py-10 sm:py-20 bg-cover bg-center bg-no-repeat animate__animated animate__fadeInUp"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1541516160071-4bb0c5af65ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')",
              }}
            >
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/80 z-0"></div>

              {/* Confetti */}
              {ticketOutcome === "cancelled" && (
                <Confetti className="w-full h-full z-10" />
              )}

              {/* Content */}
              <div className="relative z-20 max-w-2xl w-full px-4">
                <h2 className="text-2xl sm:text-4xl font-bold text-blue-400 mb-4">
                  {ticketOutcome === "cancelled" ? "🎉 Ticket Cancelled!" : "🚔 Encounter Complete"}
                </h2>
                
                {/* Score Display */}
                <div className="mb-6 p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <h3 className="text-xl font-semibold text-white mb-4">🏅 Your Performance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400">
                        {score}/{maxScore}
                      </div>
                      <div className="text-sm text-gray-300">Total Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-400">
                        {maxScore > 0 ? Math.round((score / maxScore) * 100) : 0}%
                      </div>
                      <div className="text-sm text-gray-300">Accuracy</div>
                    </div>
                  </div>
                  
                  {/* Ticket outcome */}
                  <div className="mt-4 p-3 rounded-lg border-2 border-dashed">
                    {ticketOutcome === "cancelled" ? (
                      <div className="text-green-300 font-semibold">
                        ✅ TICKET CANCELLED - Your explanation was convincing!
                      </div>
                    ) : ticketOutcome === "valid" ? (
                      <div className="text-red-300 font-semibold">
                        ❌ TICKET REMAINS VALID - Story wasn't convincing enough
                      </div>
                    ) : (
                      <div className="text-yellow-300 font-semibold">
                        ⏱️ ENCOUNTER INCOMPLETE - Time ran out
                      </div>
                    )}
                  </div>
                  
                  {/* Performance feedback */}
                  <div className="mt-4 text-center">
                    {(() => {
                      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
                      if (percentage >= 90) return <div className="text-green-300">🌟 Excellent! Outstanding explanation skills!</div>;
                      if (percentage >= 75) return <div className="text-green-300">✨ Great job! Clear and convincing communication!</div>;
                      if (percentage >= 60) return <div className="text-yellow-300">👍 Good work! Keep practicing your explanations!</div>;
                      if (percentage >= 40) return <div className="text-orange-300">📚 Room for improvement. Be more specific with details!</div>;
                      return <div className="text-red-300">💪 Keep practicing! Focus on the key facts!</div>;
                    })()}
                  </div>
                </div>

                <p className="text-sm sm:text-lg text-white mb-6">
                  {ticketOutcome === "cancelled" 
                    ? "Great job! You successfully explained your situation and got the ticket cancelled! 🚀"
                    : "Practice makes perfect! Try to provide more specific details next time. 💪"
                  }
                </p>
                <button
                  className="px-6 py-3 bg-white text-black font-semibold rounded-full transition duration-300 shadow-lg hover:bg-blue-500 hover:text-white"
                  onClick={() => router.push("/")}
                >
                  End Encounter
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Intro Popup */}
              {showIntroPopup && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999]">
                  <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6 text-center max-h-[90vh] overflow-y-auto">
                    <h2 className="text-xl text-gray-700 font-bold mb-4">
                      🚔 Police Parking Ticket Encounter
                    </h2>
                    <div className="text-left mb-6">
                      <h3 className="font-semibold text-gray-800 mb-2">🎭 Your Role:</h3>
                      <p className="text-gray-700 text-sm mb-4">
                        You are a delivery driver who just received a parking ticket. You need to explain your situation to the police officer.
                      </p>
                      
                      <h3 className="font-semibold text-gray-800 mb-2">📝 The Facts (What Really Happened):</h3>
                      <div className="bg-gray-100 p-4 rounded-lg text-sm text-gray-700 mb-4">
                        {factParagraph}
                      </div>
                      
                      <h3 className="font-semibold text-gray-800 mb-2">🎯 Your Goal:</h3>
                      <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                        <li>Explain your situation clearly and accurately</li>
                        <li>Provide specific details from the facts above</li>
                        <li>Be respectful but assertive about your case</li>
                        <li>Try to convince the officer to cancel the ticket</li>
                        <li>Stay consistent with your story throughout</li>
                      </ul>
                    </div>
                    
                    <button
                      onClick={() => {
                        setShowIntroPopup(false);
                        setPhase("main");
                      }}
                      className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 mr-4"
                    >
                      I'm Ready
                    </button>
                  </div>
                </div>
              )}

              <div
                className="relative bg-contain bg-no-repeat bg-center w-full bg-gray-100
                       bg-[url('https://images.unsplash.com/photo-1541516160071-4bb0c5af65ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')]
                       bg-cover"
              >
                <div className="absolute bg-black/40 w-full h-full z-[1]" />
                <div className="flex flex-col items-center justify-evenly min-h-screen">
                  {/* Police Officer */}
                  <div className="flex flex-col items-center z-[100] mt-8">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-blue-500 bg-white shadow-md overflow-hidden">
                      <img
                        src={officer.image}
                        alt={officer.name}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <span className="mt-2 text-lg font-medium text-white bg-black rounded-full px-4 py-2 ring-2 ring-white">
                      {officer.name} 👮‍♂️
                    </span>
                    <SoundWave speaking={speakingIndex === 0} />
                  </div>

                  {/* You (Driver) */}
                  <div className="flex flex-col items-center z-[100] mt-8">
                    {micActive && <SoundWave speaking={listening} />}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 mt-2 rounded-full border-4 border-green-400 bg-white shadow-md overflow-hidden">
                      <img
                        src="/self-icon.png"
                        alt="You"
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <span className="mt-2 text-sm font-medium text-white bg-black rounded-full px-3 py-1 ring-2 ring-white">
                      You - Delivery Driver 🚐
                    </span>

                    {/* Controls */}
                    <div className="flex gap-3 mt-4">
                      {!conversationStarted ? (
                        <button
                          onClick={startConversation}
                          className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-lg"
                        >
                          Start Encounter
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleMute}
                            className="px-4 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600"
                          >
                            {micActive ? "Mute" : "Unmute"}
                          </button>
                          <button
                            onClick={() => handleStopConversation(false)}
                            className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                          >
                            End Encounter
                          </button>
                        </>
                      )}
                    </div>

                    {/* Progress indicator */}
                    {conversationStarted && (
                      <div className="mt-4 text-center">
                        <div className="text-white text-sm bg-black/50 px-3 py-1 rounded-full mb-2">
                          Questions: {questionCount}/10
                        </div>
                        <div className="text-white text-sm bg-green-600/70 px-3 py-1 rounded-full mb-2">
                          Score: {score}/{maxScore} points
                        </div>
                        <div className={`text-white text-xs px-2 py-1 rounded-full ${
                          ticketOutcome === "cancelled" ? "bg-green-500/70" :
                          ticketOutcome === "valid" ? "bg-red-500/70" :
                          "bg-yellow-500/70"
                        }`}>
                          {ticketOutcome === "cancelled" ? "✅ Ticket Cancelled!" :
                           ticketOutcome === "valid" ? "❌ Ticket Valid" :
                           "⏱️ Ticket Pending"}
                        </div>
                        {currentQuestionScore > 0 && (
                          <div className="text-green-300 text-xs mt-1 animate-pulse">
                            +{currentQuestionScore} point{currentQuestionScore !== 1 ? 's' : ''}!
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
} 