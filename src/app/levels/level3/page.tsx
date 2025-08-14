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

export default function Level3() {
  const [phase, setPhase] = useState<"intro" | "main">("intro");
  const [index, setIndex] = useState(0); // which interviewer’s turn
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [showIntroPopup, setShowIntroPopup] = useState(true);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const router = useRouter();

  const interviewTimerRef = useRef<NodeJS.Timeout | null>(null);
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

  // ✅ Load completion state from localStorage
  useEffect(() => {
    const completed = localStorage.getItem("level3Completed") === "true";
    if (completed) {
      setShowCompletion(true);
    }
  }, []);

  // ✅ Completion handler
  const handleCompletion = () => {
    console.log("✅ Level 3 completed. Saving to localStorage.");
    localStorage.setItem("level3Completed", "true");
    setShowCompletion(true);
  };

  const interviewers = [
    { name: "Bob", image: "/bob.webp" },
    { name: "Charlie", image: "/old-man-avatar.png" },
    { name: "Alice", image: "/alice.jpg" },
  ];
  // Unlock audio context on first user interaction
  const unlockAudio = () => {
    if (audioUnlockedRef.current) return;
    const dummy = new Audio();
    dummy.src = "";
    dummy.play().catch(() => {});
    audioUnlockedRef.current = true;
    console.log("🔓 Audio context unlocked");
  };
  // Start interview
  // const startInterview = async () => {
  //   unlockAudio();
  //   setInterviewStarted(true);
  //   setMicActive(false);
  //   setIndex(0); // Start with Bob
  //   await getInterviewerQuestion(interviewers[0].name);
  // };
  const startInterview = async () => {
    unlockAudio();
    setInterviewStarted(true);
    setMicActive(false);
    setIndex(0); // Start with Bob

    const bobIntro =
      "Hello and welcome, can you please tell us about yourself.";

    // Add Bob's intro to the conversation history
    setHistory((prev) => [
      ...prev,
      { role: "assistant", content: bobIntro, speaker: "Bob" },
    ]);

    // Play Bob's intro voice
    await playVoice(bobIntro, "Bob");

    // Enable mic for user's first answer
    setMicActive(true);
    SpeechRecognition.startListening({ continuous: true });

    // ⏱️ Set time limit (e.g. 5 minutes = 300000 ms)
    interviewTimerRef.current = setTimeout(() => {
      console.log("🛑 Interview time limit reached. Stopping interview.");
      handleStopInterview(true);
    }, 20 * 1000); // 20 seconds for now. can change it according to need..... ;-)
  };

  // Fetch one interviewer’s question
  const getInterviewerQuestion = async (
    speaker: string,
    userMessage?: string
  ) => {
    setLoading(true);
    console.log(`🎤 Asking ${speaker} for their question...`);
    try {
      const res = await fetch("/api/level3/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentSpeaker: speaker,
          userMessage: userMessage || "",
          conversationHistory: history,
        }),
      });

      const data = await res.json();
      console.log(`🤖 ${speaker} asked:`, data);

      // ✅ Extract from nested structure
      const reply = data?.conversation?.text || data.text || data.reply || "";

      const actualSpeaker = data?.conversation?.speaker || speaker;

      if (reply.trim()) {
        setHistory((prev) => [
          ...prev,
          { role: "assistant", content: reply, speaker: actualSpeaker },
        ]);
        await playVoice(reply, actualSpeaker);
      } else {
        console.warn("⚠️ No valid text to speak.");
      }

      // Enable mic for user’s answer
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
    setSpeakingIndex(interviewers.findIndex((p) => p.name === speaker));
    try {
      const res = await fetch("/api/level3/tts", {
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

    // Get next interviewer in cycle
    const nextIndex = (index + 1) % interviewers.length;
    setIndex(nextIndex);

    // Ask next interviewer
    await getInterviewerQuestion(interviewers[nextIndex].name, answer);
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

  // Stop entire interview
  const handleStopInterview = (isTimeUp = false) => {
    SpeechRecognition.stopListening();
    setInterviewStarted(false);
    setMicActive(false);

    if (interviewTimerRef.current) {
      clearTimeout(interviewTimerRef.current);
      interviewTimerRef.current = null;
    }

    if (isTimeUp) {
      handleCompletion();
      setShowCompletion(true); // Show confetti on time limit
    } else {
      // Reset everything for a manual restart
      setShowIntroPopup(true);
      setHistory([]);
      setIndex(0);
      setPhase("intro");
    }
  };

  return (
    <div>
      {loading && !interviewStarted ? (
        <div className="bg-white">
          <Loader />
        </div>
      ) : (
        <>
          <Header />
          {showCompletion ? (
            <div className="relative z-20 w-full h-screen flex flex-col justify-center items-center text-center px-4 animate__animated animate__fadeInUp">
              <Confetti className="w-full h-full" />
              <h2 className="text-3xl mt-10 sm:text-4xl font-bold text-green-400 mb-2">
                🎉 Conversation Completed!
              </h2>
              <p className="text-base sm:text-lg text-gray-700">
                Great job! You’ve finished Level 3. Please Sign Up to know your score.😁
              </p>
              <button
                className="mt-4 px-8 py-3 bg-white text-black font-semibold rounded-full transition duration-300 shadow-lg hover:bg-violet-500 hover:text-white"
                onClick={() => router.push("/")}
              >
                End
              </button>
            </div>
          ) : (
            <>
              {/* Intro Popup */}
              {showIntroPopup && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999]">
                  <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6 text-center">
                    <h2 className="text-xl text-gray-700 font-bold mb-4">
                      Welcome to Your Interview
                    </h2>
                    <p className="text-gray-700 mb-6">
                      You are in a professional interview room with three
                      interviewers. Each will take turns asking you questions.
                      Speak clearly when it’s your turn.
                    </p>
                    <button
                      onClick={() => setShowIntroPopup(false)}
                      className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      Proceed
                    </button>
                  </div>
                </div>
              )}

              <div
                className="relative bg-contain bg-no-repeat bg-center w-full bg-gray-100
                       bg-[url('https://blog.glassdoor.com/site-us/wp-content/uploads/sites/2/New-asset-The-Pros-and-Cons-of-a-Panel-Interview-02-1.png?w=900')]
                       sm:bg-[url('/interview_img.jpg')]
                       sm:bg-cover"
              >
                <div className="absolute bg-black/40 w-full h-full z-[1]" />
                <div className="flex flex-col items-center justify-evenly min-h-screen">
                  {/* Interviewers */}
                  <div className="flex flex-wrap items-start justify-center gap-8 z-[100]">
                    {interviewers.map((interviewer, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-full border-4 border-green-400 bg-white shadow-md overflow-hidden">
                          <img
                            src={interviewer.image}
                            alt={interviewer.name}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <span className="mt-2 text-sm font-medium text-white bg-black rounded-full px-3 py-1 ring-2 ring-white">
                          {interviewer.name}
                        </span>
                        <SoundWave speaking={speakingIndex === idx} />
                      </div>
                    ))}
                  </div>

                  {/* You */}
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
                      You
                    </span>

                    {/* Controls */}
                    <div className="flex gap-3 mt-4">
                      {!interviewStarted ? (
                        <button
                          onClick={startInterview}
                          className="px-4 py-2 rounded-lg bg-indigo-600 text-white"
                        >
                          Start Interview
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleMute}
                            className="px-4 py-2 rounded-lg bg-yellow-500 text-white"
                          >
                            {micActive ? "Mute" : "Unmute"}
                          </button>
                          <button
                            onClick={() => handleStopInterview(false)}
                            className="px-4 py-2 rounded-lg bg-rose-600 text-white"
                          >
                            Stop Interview
                          </button>
                        </>
                      )}
                    </div>
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
