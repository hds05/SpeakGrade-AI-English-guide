'use client';

import 'animate.css/animate.min.css';

type Props = {
  onClose: () => void;
};

export default function WelcomeTestPage({ onClose }: Props) {
  return (
    <div className="relative min-h-[60vh] w-full max-w-3xl mx-auto my-2 backdrop-blur-md bg-white/5 border border-white/10 shadow-xl rounded-2xl p-8 animate__animated animate__fadeIn text-white">
      {/* <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-full text-sm shadow"
      >
        ✕
      </button> */}

      <div className="text-center space-y-6">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-wide text-white drop-shadow-md">
          Welcome to SpeakGrade <br />
          <span className="mt-6">🎯</span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-300 leading-relaxed">
          This is a test to evaluate your <strong className="text-white">English proficiency</strong> and <strong className="text-white">communication</strong> style.
        </p>

        <p className="text-base sm:text-lg text-indigo-300 italic">
          When you're ready, answer the questions asked by our AI.
        </p>

        <button
          onClick={onClose}
          className="inline-block animate__animated animate__pulse animate__infinite animate_slower mt-2 px-8 py-3 bg-white text-black font-semibold rounded-full transition duration-300 shadow-lg hover:cursor-pointer hover:bg-violet-500 hover:text-white hover:shadow-zinc-950"
        >
          Begin
        </button>
      </div>
    </div>
  );
}
