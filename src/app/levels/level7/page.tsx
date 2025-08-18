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

export default function Level7() {
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
  const [orderIssues, setOrderIssues] = useState({
    burger: false,     // Wrong toppings (has onions, should be no onions)
    fries: false,      // Wrong size (got small, ordered medium)
    drink: false,      // Wrong type (got diet, ordered regular)
    coupon: false      // Missing item (no onion rings from coupon)
  });
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
    const completed = localStorage.getItem("level7Completed") === "true";
    if (completed) {
      setShowCompletion(true);
    }
  }, []);

  // Completion handler
  const handleCompletion = () => {
    console.log("✅ Level 7 completed. Saving to localStorage.");
    localStorage.setItem("level7Completed", "true");
    setShowCompletion(true);
  };

  const cashier = { name: "Mike", image: "/bob.webp" }; // Using Bob's image for the cashier

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

    const cashierGreeting = "Hi there—what can I help you with today?";

    // Add cashier's greeting to the conversation history
    setHistory((prev) => [
      ...prev,
      { role: "assistant", content: cashierGreeting, speaker: "Mike" },
    ]);

    // Play cashier's greeting voice
    await playVoice(cashierGreeting, "Mike");

    // Enable mic for user's first response
    setMicActive(true);
    SpeechRecognition.startListening({ continuous: true });

    // Set time limit (6 minutes for fast-food encounter)
    conversationTimerRef.current = setTimeout(() => {
      console.log("🛑 Conversation time limit reached. Stopping conversation.");
      handleStopConversation(true);
    }, 6 * 60 * 1000); // 6 minutes
  };

  // Fetch cashier's response
  const getCashierResponse = async (userMessage?: string) => {
    // Don't make API calls if conversation has ended
    if (!conversationStarted) {
      console.log("🛑 Conversation already ended, skipping API call");
      return;
    }
    
    setLoading(true);
    console.log(`🎤 Getting cashier response for: ${userMessage}`);
    try {
      const res = await fetch("/api/level7/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: userMessage || "",
          conversationHistory: history,
          questionCount: questionCount,
          orderIssues: orderIssues,
        }),
      });

      const data = await res.json();
      console.log(`🤖 Cashier responded:`, data);

      const reply = data?.conversation?.text || data.text || data.reply || "";
      const scoreData = data?.score || { points: 0, maxPoints: 1, feedback: "" };
      const updatedIssues = data?.orderIssues || orderIssues;

      if (reply.trim()) {
        // Check if conversation is still active before processing response
        if (!conversationStarted) {
          console.log("🛑 Conversation ended during API call, ignoring response");
          return;
        }

        setHistory((prev) => [
          ...prev,
          { role: "assistant", content: reply, speaker: "Mike" },
        ]);
        
        // Update scores and issues
        setScore(prev => prev + scoreData.points);
        setMaxScore(prev => prev + scoreData.maxPoints);
        setCurrentQuestionScore(scoreData.points);
        setQuestionCount(prev => prev + 1);
        setOrderIssues(updatedIssues);

        // Clear current question score after showing it for a moment
        if (scoreData.points > 0) {
          setTimeout(() => setCurrentQuestionScore(0), 3000);
        }

        // Check if conversation should end (after ~8-10 questions or all issues addressed)
        const allAddressed = Object.values(updatedIssues).every(addressed => addressed);
        if (allAddressed) {
          // Immediately stop conversation when all issues are resolved
          console.log("🎉 All issues resolved! Ending conversation.");
          handleStopConversation(true);
          return; // Don't continue with voice playback or mic activation
        } else if (questionCount >= 9) {
          setTimeout(() => {
            handleStopConversation(true);
          }, 3000); // Normal timeout delay
        }

        // Only play voice and enable mic if conversation is still active
        if (conversationStarted) {
          await playVoice(reply, "Mike");
          
          // Enable mic for user's answer
          setMicActive(true);
          SpeechRecognition.startListening({ continuous: true });
        }
      } else {
        console.warn("⚠️ No valid text to speak.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Play audio from TTS
  const playVoice = async (text: string, speaker: string) => {
    setSpeakingIndex(0); // Only one cashier
    try {
      const res = await fetch("/api/level7/tts", {
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

    // Get cashier's response
    await getCashierResponse(answer);
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
    console.log("🛑 Stopping conversation - isTimeUp:", isTimeUp);
    
    // Immediately stop all conversation activities
    SpeechRecognition.stopListening();
    setConversationStarted(false);
    setMicActive(false);
    setLoading(false); // Stop any pending API calls

    if (conversationTimerRef.current) {
      clearTimeout(conversationTimerRef.current);
      conversationTimerRef.current = null;
    }

    // Check if all goals were met
    const allGoalsMet = Object.values(orderIssues).every(addressed => addressed);
    
    if (isTimeUp || questionCount >= 8 || allGoalsMet) {
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
      setOrderIssues({ burger: false, fries: false, drink: false, coupon: false });
      setPhase("intro");
    }
  };

  const factParagraph = `At 1:05 PM you picked up your order at Burger Express drive-thru. You ordered: a double cheeseburger with no onions, medium fries, a large regular Coke, and a free small side of onion rings using your paper coupon. When you opened the bag, the burger had onions, the fries were small, the drink was a diet Coke, and there were no onion rings. You waited one minute at the window and have your receipt plus the coupon ready to show.`;

  const addressedCount = Object.values(orderIssues).filter(Boolean).length;

  return (
    <div className="relative w-full min-h-screen  bg-black text-white">
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
                  "url('https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-4.0.3&auto=format&fit=crop&w=2072&q=80')",
              }}
            >
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/80 z-0"></div>

              {/* Confetti */}
              {addressedCount >= 3 && (
                <Confetti className="w-full h-full z-10" />
              )}

              {/* Content */}
              <div className="relative z-20 max-w-2xl w-full px-4">
                <h2 className="text-2xl sm:text-4xl font-bold text-orange-400 mb-4">
                  {addressedCount === 4 ? "🎉 Order Completely Fixed!" : "🍔 Order Service Complete!"}
                </h2>
                
                {/* Score Display */}
                <div className="mb-6 p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <h3 className="text-xl font-semibold text-white mb-4">🏆 Your Performance</h3>
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
                  
                  {/* Order issues addressed */}
                  <div className="mt-4 p-3 rounded-lg border-2 border-dashed">
                    <h4 className="text-white font-semibold mb-2">Order Issues Fixed: {addressedCount}/4</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className={`${orderIssues.burger ? "text-green-300" : "text-red-300"}`}>
                        {orderIssues.burger ? "✅" : "❌"} Burger Toppings
                      </div>
                      <div className={`${orderIssues.fries ? "text-green-300" : "text-red-300"}`}>
                        {orderIssues.fries ? "✅" : "❌"} Fries Size
                      </div>
                      <div className={`${orderIssues.drink ? "text-green-300" : "text-red-300"}`}>
                        {orderIssues.drink ? "✅" : "❌"} Drink Type
                      </div>
                      <div className={`${orderIssues.coupon ? "text-green-300" : "text-red-300"}`}>
                        {orderIssues.coupon ? "✅" : "❌"} Coupon Item
                      </div>
                    </div>
                  </div>
                  
                  {/* Performance feedback */}
                  <div className="mt-4 text-center">
                    {(() => {
                      if (addressedCount === 4) return <div className="text-green-300">🌟 Perfect! Excellent food service communication!</div>;
                      if (addressedCount === 3) return <div className="text-green-300">✨ Great job! Most order issues addressed!</div>;
                      if (addressedCount === 2) return <div className="text-yellow-300">👍 Good work! Some issues still unresolved!</div>;
                      if (addressedCount === 1) return <div className="text-orange-300">📚 Room for improvement. Be more specific!</div>;
                      return <div className="text-red-300">💪 Keep practicing! Focus on clear order details!</div>;
                    })()}
                  </div>
                </div>

                <p className="text-sm sm:text-lg text-white mb-6">
                  {addressedCount >= 3 
                    ? "Excellent customer service skills! You handled the restaurant situation like a pro! 🍟"
                    : "Keep practicing! Clear communication about order issues is important. 💪"
                  }
                </p>
                <button
                  className="px-6 py-3 bg-white text-black font-semibold rounded-full transition duration-300 shadow-lg hover:bg-orange-500 hover:text-white"
                  onClick={() => router.push("/main")}
                >
                  Leave Restaurant
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
                      🍔 Burger Express Order Problem
                    </h2>
                    <div className="text-left mb-6">
                      <h3 className="font-semibold text-gray-800 mb-2">🎭 Your Role:</h3>
                      <p className="text-gray-700 text-sm mb-4">
                        You're a customer who just picked up a take-out order and discovered multiple mistakes. You need to get your order corrected.
                      </p>
                      
                      <h3 className="font-semibold text-gray-800 mb-2">🍟 What Actually Happened:</h3>
                      <div className="bg-gray-100 p-4 rounded-lg text-sm text-gray-700 mb-4">
                        {factParagraph}
                      </div>
                      
                      <h3 className="font-semibold text-gray-800 mb-2">🎯 Your Tasks:</h3>
                      <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                        <li>Explain that your burger has onions (you ordered no onions)</li>
                        <li>Point out you got small fries instead of medium</li>
                        <li>Mention you got diet Coke instead of regular</li>
                        <li>Show your coupon for the missing onion rings</li>
                        <li>Be polite but clear about what went wrong</li>
                      </ul>
                    </div>
                    
                    <button
                      onClick={() => {
                        setShowIntroPopup(false);
                        setPhase("main");
                      }}
                      className="px-6 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 mr-4"
                    >
                      Return to Window
                    </button>
                  </div>
                </div>
              )}

              <div
                className="relative bg-contain bg-no-repeat bg-center w-full bg-gray-100
                       bg-[url('https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-4.0.3&auto=format&fit=crop&w=2072&q=80')]
                       bg-cover"
              >
                <div className="absolute bg-black/40 w-full h-full z-[1]" />
                <div className="flex flex-col items-center justify-evenly min-h-screen">
                  {/* Cashier */}
                  <div className="flex flex-col items-center z-[100] mt-8">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-orange-500 bg-white shadow-md overflow-hidden">
                      <img
                        src={cashier.image}
                        alt={cashier.name}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <span className="mt-2 text-lg font-medium text-white bg-black rounded-full px-4 py-2 ring-2 ring-white">
                      {cashier.name} - Cashier 🍔
                    </span>
                    <SoundWave speaking={speakingIndex === 0} />
                  </div>

                  {/* You (Customer) */}
                  <div className="flex flex-col items-center z-[100] mt-8">
                    {micActive && <SoundWave speaking={listening} />}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 mt-2 rounded-full border-4 border-yellow-400 bg-white shadow-md overflow-hidden">
                      <img
                        src="/self-icon.png"
                        alt="You"
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <span className="mt-2 text-sm font-medium text-white bg-black rounded-full px-3 py-1 ring-2 ring-white">
                      You - Customer 🥤
                    </span>

                    {/* Controls */}
                    <div className="flex gap-3 mt-4">
                      {!conversationStarted ? (
                        <button
                          onClick={startConversation}
                          className="px-6 py-3 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 shadow-lg"
                        >
                          Approach Window
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
                            Leave Drive-Thru
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
                        <div className="text-white text-xs bg-orange-500/70 px-2 py-1 rounded-full mb-2">
                          Issues Fixed: {addressedCount}/4
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