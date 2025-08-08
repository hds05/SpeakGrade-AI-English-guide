// Round1.tsx
'use client';

import { useState } from 'react';

const questions = [
  {
    question: 'What is the synonym of "happy"?',
    options: ['Sad', 'Elated', 'Angry', 'Confused'],
    answer: 'Elated'
  },
  {
    question: 'Choose the word that is most similar to "quick".',
    options: ['Fast', 'Slow', 'Lazy', 'Tired'],
    answer: 'Fast'
  },
  {
    question: 'Select the synonym for "angry".',
    options: ['Calm', 'Joyful', 'Furious', 'Relaxed'],
    answer: 'Furious'
  },
  {
    question: 'Find the word closest in meaning to "begin".',
    options: ['End', 'Start', 'Sleep', 'Eat'],
    answer: 'Start'
  },
  {
    question: 'Which word means the same as "tiny"?',
    options: ['Large', 'Huge', 'Small', 'Tall'],
    answer: 'Small'
  },
];

const Round1 = ({ onNext }: { onNext: (score: number) => void }) => {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);

  const handleAnswer = (option: string) => {
    if (option === questions[current].answer) {
      setScore(score + 10);
    }
    const next = current + 1;
    if (next < questions.length) {
      setCurrent(next);
    } else {
      onNext(score);
    }
  };

  return (
    <div className="max-w-xl w-full bg-white text-black p-6 rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold mb-4">Round 1: Vocabulary</h2>
      <p className="mb-4">{questions[current].question}</p>
      <div className="grid gap-2">
        {questions[current].options.map((opt, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(opt)}
            className="bg-purple-600 text-white p-2 rounded hover:bg-purple-700"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Round1;