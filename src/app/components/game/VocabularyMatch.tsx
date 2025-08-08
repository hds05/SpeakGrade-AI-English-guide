// Round3.tsx
'use client';

import { useState } from 'react';

const questions = [
  {
    question: 'Read: "The sun rises in the east." What is the main subject?',
    options: ['sun', 'east', 'rises', 'the'],
    answer: 'sun'
  },
  {
    question: 'Read: "Tom was tired, so he went to bed early." Why did Tom go to bed early?',
    options: ['He was happy', 'He was late', 'He was tired', 'He was bored'],
    answer: 'He was tired'
  },
  {
    question: 'Read: "Alice loves painting and spends her weekends doing it." What does Alice enjoy?',
    options: ['Drawing', 'Cooking', 'Painting', 'Running'],
    answer: 'Painting'
  },
  {
    question: 'Read: "John forgot his umbrella, so he got wet in the rain." Why did John get wet?',
    options: ['He played in water', 'He took a bath', 'He forgot his umbrella', 'He went swimming'],
    answer: 'He forgot his umbrella'
  },
  {
    question: 'Read: "She watered the plants daily, so they grew well." Why did the plants grow well?',
    options: ['She talked to them', 'She sang to them', 'She watered them daily', 'They got sunlight'],
    answer: 'She watered them daily'
  },
];

const Round3 = ({ onNext }: { onNext: (score: number) => void }) => {
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
      <h2 className="text-2xl font-bold mb-4">Round 3: Comprehension</h2>
      <p className="mb-4">{questions[current].question}</p>
      <div className="grid gap-2">
        {questions[current].options.map((opt, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(opt)}
            className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Round3;