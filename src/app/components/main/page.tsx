'use client';

import { useState } from 'react';
import Script from 'next/script';
import WelcomeTestPage from '../welcome/page';
import 'animate.css/animate.min.css';

export default function MainPage() {
  const [showPopup, setShowPopup] = useState(true);
  const handleClose = () => setShowPopup(false);

  return (
    <div className="relative w-full max-w-6xl h-[80vh] sm:h-[83vh] mx-auto pb-20 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white rounded-2xl overflow-y-scroll scrollbar-hidden shadow-2xl border border-white/10">
      
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full z-0">
        <img
          src="/bot-with-man.avif"
          alt="SpeakGrade Background"
          className="w-100 h-100 object-cover sm:w-full sm:h-full animate__animated animate__fadeIn"
        />
        <div className="absolute inset-0 bg-black/70" /> {/* Optional dark overlay for readability */}
      </div>

      {/* Glowing Background Blur */}
      <div className="absolute -top-10 -left-10 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl animate-pulse z-10" />
      <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-pink-500/20 rounded-full blur-2xl animate-pulse z-10" />

      {/* Main Content */}
      <div className="h-full  overflow-y-scroll scrollbar-hidden  px-4 py-6 sm:px-6 sm:py-8 space-y-10 z-10 relative">
        
        {/* Overlayed Section - Logo + Title + Desc */}
        <div className="z-20 relative text-center space-y-4">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="/speakgrade_logo.png"
              alt="SpeakGrade Logo"
              className="h-20 w-20 sm:h-24 sm:w-24 object-cover rounded-full border-4 border-white/20 shadow-xl transition-transform duration-300 hover:scale-110 animate__animated animate__fadeIn animate__infinite animate__slow"
            />
          </div>

          {/* Title + Description */}
          <h1 className="text-4xl sm:text-5xl font-extrabold">
            🚀 SpeakGrade - AI English Fluency Guide
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Elevate your spoken English with real-time AI assessment. Speak naturally, and get instant, intelligent feedback
            on fluency, grammar, vocabulary, and clarity — all in just 3 minutes.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 z-20">
          {[
            {
              title: '🎙 Real-Time Speaking',
              desc: 'Answer dynamic questions using your microphone. Our AI listens and evaluates as you speak.',
            },
            {
              title: '📊 Smart Feedback',
              desc: 'Instant tips on grammar, sentence structure, pronunciation, and how to improve them.',
            },
            {
              title: '💡 Vocabulary Suggestions',
              desc: 'Used a weak or wrong word? Get real-time alternatives and examples to boost your vocab.',
            },
            {
              title: '⏱ Lightning Fast',
              desc: 'The entire test lasts only 3 minutes — speak confidently and get results instantly.',
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/10 shadow-lg hover:scale-[1.02] hover:bg-white/20 transition-all duration-300"
            >
              <h2 className="text-xl font-bold">{feature.title}</h2>
              <p className="mt-2 text-gray-300 text-sm sm:text-base">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* ElevenLabs Agent */}
        <div
          className="z-20 relative"
          dangerouslySetInnerHTML={{
            __html: `<elevenlabs-convai agent-id="agent_4501k1tk0ntff8rv8et3d804erbq"></elevenlabs-convai>`,
          }}
        />

        {/* Load ElevenLabs Widget Script */}
        <Script
          src="https://unpkg.com/@elevenlabs/convai-widget-embed"
          strategy="afterInteractive"
        />
      </div>

      {/* Welcome Modal */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50">
          <div className="relative max-w-3xl w-full p-4">
            <WelcomeTestPage onClose={handleClose} />
          </div>
        </div>
      )}
    </div>
  );
}
