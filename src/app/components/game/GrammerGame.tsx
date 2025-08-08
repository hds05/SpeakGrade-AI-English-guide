// Round2.tsx
'use client';

import { useState } from 'react';

const questions = [
  {
    question: 'Which sentence is grammatically correct?',
    options: [
      'She go to school.',
      'He going to market.',
      'They goes to park.',
      'She goes to school.'
    ],
    answer: 'She goes to school.'
  },
  {
    question: 'Identify the incorrect sentence.',
    options: [
      'He eat breakfast every morning.',
      'They are playing outside.',
      'I have done my homework.',
      'We were watching a movie.'
    ],
    answer: 'He eat breakfast every morning.'
  },
  {
    question: 'Choose the correct sentence.',
    options: [
      'The cat sleep on the mat.',
      'The cats sleeps on the mat.',
      'The cat sleeps on the mat.',
      'The cat slept on the mat.'
    ],
    answer: 'The cat sleeps on the mat.'
  },
  {
    question: 'Fill in the blank: He ____ playing cricket.',
    options: ['is', 'are', 'am', 'be'],
    answer: 'is'
  },
  {
    question: 'Which is the correct form: "She has ____ a song."',
    options: ['sing', 'sang', 'sung', 'singing'],
    answer: 'sung'
  },
];

const Round2 = ({ onNext }: { onNext: (score: number) => void }) => {
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
      <h2 className="text-2xl font-bold mb-4">Round 2: Grammar</h2>
      <p className="mb-4">{questions[current].question}</p>
      <div className="grid gap-2">
        {questions[current].options.map((opt, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(opt)}
            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Round2;
