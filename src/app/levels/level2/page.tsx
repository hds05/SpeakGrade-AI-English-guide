// src/app/levels/level2/page.tsx
'use client';

import Header from '@/app/components/header/page';
import SpeakingOrb from '@/app/speakingOrb/SpeakingOrb';
import React, { useEffect, useRef, useState } from 'react';

export default function Level2() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpokenRef = useRef<string>('');

  const VOICE_ALICE = 'O4cGUVdAocn0z4EpQ9yF';
  const VOICE_BOB = '8sZxD42zKDvoEXNxBTdX';

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition not supported in this browser.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onresult = async (e: any) => {
      const txt = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(' ')
        .trim();

      if (txt && txt !== lastSpokenRef.current) {
        lastSpokenRef.current = txt;
        setTranscript(txt);
        await handleSend(txt); // Wait for bot to finish before continuing
        setTranscript('');
      }
    };

    rec.onend = () => {
      if (listening && recognitionRef.current) {
        // restart only if still in listening mode
        recognitionRef.current.start();
      }
    };

    rec.onerror = (err: any) => {
      console.error('rec error', err);
      setListening(false);
    };

    recognitionRef.current = rec;
  }, [listening]);

  const startListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition not supported in this browser.');
      return;
    }

    lastSpokenRef.current = '';
    setTranscript('');
    setListening(true);
    recognitionRef.current.start();

    // Auto stop after 3 minutes
    sessionTimerRef.current = setTimeout(() => {
      stopListening();
    }, 3 * 60 * 1000);
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setListening(false);
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
  };

  async function handleSend(customPrompt?: string) {
    const userText = customPrompt || transcript;
    if (!userText.trim()) return;

    const resp = await fetch('/api/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: userText }),
    });

    const data = await resp.json();
    const aliceText = data.alice;
    const bobText = data.bob;

    const aliceUrl = await getTTSAudio(aliceText, VOICE_ALICE);
    const bobUrl = await getTTSAudio(bobText, VOICE_BOB);

    await playWithOverlap(aliceUrl, bobUrl, 300);
  }

  async function startBotConversation() {
    await handleSend('Start a fun conversation with the user');
  }

  async function getTTSAudio(text: string, voiceId: string) {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    <div className="relative w-full min-h-screen bg-black text-white">
      <Header />
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

      <div className="relative z-20 max-w-4xl mx-auto p-6 flex flex-col items-center gap-6">
        <h1 className="text-3xl text-center font-bold mb-4">
          Bar Conversation — Level 2
        </h1>

        <SpeakingOrb isSpeaking={listening} />

        {!listening && (
          <button
            onClick={handleStartConversation}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-full font-semibold"
          >
            Start Conversation
          </button>
        )}

        {listening && (
          <button
            onClick={stopListening}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-full font-semibold"
          >
            Stop Conversation
          </button>
        )}
      </div>
    </div>
  );
}
