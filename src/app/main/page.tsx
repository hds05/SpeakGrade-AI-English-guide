'use client';

import { useRouter } from 'next/navigation';

export default function MainPage() {
  const router = useRouter();

  const levels = [
    {
      title: 'Level 1',
      description: 'Start with basic English speaking assessment.',
      image: '/level1.jpg', // Change to your image
      path: '/levels/level1',
    },
    {
      title: 'Level 2',
      description: 'Intermediate speaking test with AI feedback.',
      image: '/level2.jpg', // Change to your image
      path: '/levels/level2',
    },
    {
      title: 'Level 3',
      description: 'Advanced real-time conversation challenge.',
      image: '/level3.jpg', // Change to your image
      path: '/levels/level3',
    },
  ];

  return (
    <div className="relative w-full  text-white flex flex-col items-center justify-center px-6 py-12">
      
      <h1 className="text-4xl font-extrabold mb-10 text-center">
        🚀 SpeakGrade - Choose Your Level
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        {levels.map((level, index) => (
          <div
            key={index}
            onClick={() => router.push(level.path)}
            className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden border border-white/20 shadow-lg cursor-pointer transform hover:scale-105 hover:shadow-2xl transition-all duration-300"
          >
            <img
              src={level.image}
              alt={level.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">{level.title}</h2>
              <p className="text-gray-300 text-sm">{level.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
