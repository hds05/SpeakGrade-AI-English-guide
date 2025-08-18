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
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

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

  useEffect(() => {
    if (!interviewStarted) return; // ✅ only after Start
    if (!listening) {
      if (transcript.trim()) {
        processUserAnswer(transcript);
      } else {
        handleNoAnswer();
      }
      resetTranscript();
    }
  }, [listening]);

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

    // clear old data
    resetTranscript();        // ✅ clear previous transcript
    setHistory([]);           // ✅ clear previous conversation
    setIndex(0); // Start with Bob
    setSpeakingIndex(0);  // Highlight Bob immediately
    setInterviewStarted(true);
    setMicActive(false);

    const bobIntro =
      "Hello and welcome...can you pleasee..tell us about yourselffff.";

    // Add Bob's intro to the conversation history
    // setHistory((prev) => [
    //   ...prev,
    //   { role: "assistant", content: bobIntro, speaker: "Bob" },
    // ]);

    setHistory([{ role: "assistant", content: bobIntro, speaker: "Bob" }]);

    // Play Bob's intro voice
    await playVoice(bobIntro, "Bob");

    // Enable mic for user's first answer
    setMicActive(true);
    SpeechRecognition.startListening({ continuous: true });

    // ⏱️ Set time limit (e.g. 5 minutes = 300000 ms)
    interviewTimerRef.current = setTimeout(() => {
      console.log("🛑 Interview time limit reached. Stopping interview.");
      handleStopInterview(true);
    }, 30 * 1000); // 40 seconds for now. can change it according to need..... ;-)
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
        setMicActive(true);
        SpeechRecognition.startListening({ continuous: true });
      } else {
        console.warn("⚠️ No valid text to speak.");
      }

      // Enable mic for user’s answer
      setMicActive(true);
      // SpeechRecognition.startListening({ continuous: true });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Play audio from TTS
// ================= playVoice =================
// const playVoice = async (text: string, speaker: string) => {
//   // Stop mic while interviewer speaks
//   SpeechRecognition.stopListening();
//   setMicActive(false);

//   // Stop any previous audio
//   if (currentAudioRef.current) {
//     currentAudioRef.current.pause();
//     currentAudioRef.current.src = "";
//     currentAudioRef.current = null;
//   }

//   // Highlight speaker immediately
//   const speakerIdx = interviewers.findIndex((p) => p.name === speaker);
//   setSpeakingIndex(speakerIdx);

//   try {
//     const controller = new AbortController(); // optional: abort fetch if needed
//     const res = await fetch("/api/level3/tts", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ text, speaker }),
//       signal: controller.signal,
//     });

//     const blob = await res.blob();
//     const url = URL.createObjectURL(blob);
//     const audio = new Audio(url);
//     currentAudioRef.current = audio;

//     await new Promise<void>((resolve, reject) => {
//       const handleEnd = () => {
//         if (currentAudioRef.current !== audio) {
//           URL.revokeObjectURL(url);
//           resolve();
//           return;
//         }

//         console.log(`✅ Finished speaking: ${speaker}`);
//         setSpeakingIndex(null);
//         URL.revokeObjectURL(url);
//         currentAudioRef.current = null;

//         // Restart mic only if interview is active
//         if (interviewStarted) {
//           setMicActive(true);
//           SpeechRecognition.startListening({ continuous: true });
//         }
//         // else  {
//         //   SpeechRecognition.startListening();
//         //   setMicActive(false);
//         // }
//         // resolve();
//       };

//       audio.onended = handleEnd;
//       audio.onerror = (e) => {
//         if (currentAudioRef.current !== audio) {
//           resolve(); // ignore if manually stopped
//         } else {
//           reject(e);
//         }
//       };

//       audio.play().catch((e) => {
//         if (currentAudioRef.current === audio) reject(e);
//       });
//     });
//   } catch (e) {
//     console.error("❌ playVoice error:", e);
//     setSpeakingIndex(null);
//   }
// };
const playVoice = async (text: string, speaker: string) => {
  // Stop mic while "speaking"
  SpeechRecognition.stopListening();
  setMicActive(false);

  // Highlight speaker immediately
  const speakerIdx = interviewers.findIndex((p) => p.name === speaker);
  setSpeakingIndex(speakerIdx);

  // ✅ Instead of TTS, just log to console
  console.log(`💬 ${speaker} says: "${text}"`);

  // Simulate short delay to mimic speaking duration
  await new Promise((resolve) => setTimeout(resolve, Math.min(1000 + text.length * 50, 3000)));

  // Reset speaker and re-enable mic if interview is active
  setSpeakingIndex(null);
  if (interviewStarted) {
    setMicActive(true);
    SpeechRecognition.startListening({ continuous: true });
  }
};

  // When user stops speaking
  // useEffect(() => {
  //   if (!listening) {
  //     if (transcript.trim()) {
  //       // ✅ User actually said something
  //       processUserAnswer(transcript);
  //     } else {
  //       // 🚨 Silence detected
  //       handleNoAnswer();
  //     }
  //     resetTranscript();
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [listening]);

  const handleNoAnswer = async () => {
    if (!interviewStarted) return; // ⛔ not started
    const lastAssistant = history.find((msg) => msg.role === "assistant");
    if (!lastAssistant) return; // ⛔ no question asked yet

    console.log("🤐 User gave no response, interviewer will repeat.");
    SpeechRecognition.stopListening();
    setMicActive(false);

    const currentInterviewer = interviewers[index].name;
    const repeatPrompt =
      "It seems you didn’t respond. Would you like me to repeat the question?";

    setHistory((prev) => [
      ...prev,
      { role: "assistant", content: repeatPrompt, speaker: currentInterviewer },
    ]);

    await playVoice(repeatPrompt, currentInterviewer);

    setMicActive(true);
    SpeechRecognition.startListening({ continuous: true });
  };

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
  const handleStopInterview = (isTimeUp: boolean = false) => {
    SpeechRecognition.stopListening();
    resetTranscript();

    setInterviewStarted(false);
    setMicActive(false);
    // Force full mic reset
    if (SpeechRecognition.abortListening) {
      SpeechRecognition.abortListening(); // kills recognition session entirely
    }

    // ✅ Stop any ongoing voice
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.onended = null;
      currentAudioRef.current.src = "";
      currentAudioRef.current.load(); // force reset of the <audio> element
      currentAudioRef.current = null;
    }
    setSpeakingIndex(null);

    if (interviewTimerRef.current) {
      clearTimeout(interviewTimerRef.current);
      interviewTimerRef.current = null;
    }

    if (isTimeUp) {
      handleCompletion();
      // setShowCompletion(true); // Show confetti on time limit
    } else {
      // Reset everything for a manual restart
      setShowIntroPopup(true);
      setHistory([]);
      setSpeakingIndex(null);
      setIndex(0);
      setPhase("intro");
      setShowCompletion(false);
    }
    window.location.reload(); // forces browser to ask mic permission again on start

  };

  return (
    <div className="relative w-full min-h-screen  bg-black text-white">
      {loading && !interviewStarted ? (
        <div className="bg-white">
          <Loader />
        </div>
      ) : (
        <>
          {/* <Header /> */}
          {showCompletion ? (
            <div
              className="relative z-10 w-full min-h-screen flex flex-col justify-center items-center text-center px-4 py-10 sm:py-20 bg-cover bg-center bg-no-repeat animate__animated animate__fadeInUp"
              style={{
                backgroundImage:
                  "url('https://cdn.prod.website-files.com/61a05ff14c09ecacc06eec05/6720e94e1cd203b14c045522_%20Interview-Notes.jpg')",
              }}
            >
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/80 z-0"></div>

              {/* Confetti */}
              <Confetti className="w-full h-full z-10" />

              {/* Content */}
              <div className="relative z-20 max-w-2xl w-full px-4">
                <h2 className="text-2xl sm:text-4xl font-bold text-green-400 mb-4">
                  🎉 Conversation Completed!
                </h2>
                <p className="text-sm sm:text-lg text-white mb-6">
                  Great job! You’ve finished Level 3. Please sign up to know
                  your score. 😁
                </p>
                <button
                  className="px-6 py-3 bg-white text-black font-semibold rounded-full transition duration-300 shadow-lg hover:bg-violet-500 hover:text-white"
                  onClick={() => {
                    handleStopInterview(true); // ✅ stop mic + reset interview
                    router.push("/main");
                  }}
                >
                  End Session
                </button>
              </div>
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
