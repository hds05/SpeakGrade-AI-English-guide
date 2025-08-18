'use client';

import { useRouter } from 'next/navigation';

export default function MainPage() {
  const router = useRouter();

  const levels = [
    {
      title: 'English Guide',
      description: 'Start with basic English speaking.',
      image: '/testConvo.png',
      path: '/levels/level1',
    },
    {
      title: 'Bar conversation',
      description: 'Just entered Bar. Casual conversation with Bob & Bartender.',
      image: '/barConvo.png',
      path: '/levels/level2',
    },
    {
      title: 'Interview room',
      description: 'You are sitting in a Interview room.',
      image: '/interview_img.jpg', // Keep current image as requested
      path: '/levels/level3',
    },
    {
      title: 'Manager Meeting',
      description: 'Workplace conversation with your manager.',
      image: '/managerConvo.png',
      path: '/levels/level4',
    },
    {
      title: 'Parking Dispute',
      description: 'Police encounter - Explain your parking situation.',
      image: '/policeConvo.png',
      path: '/levels/level5',
    },
    {
      title: 'Outlet Rush',
      description: 'Fashion Outlet - Handle multiple customer service issues.',
      image: '/outletConvo.png',
      path: '/levels/level6',
    },
    {
      title: 'Order Mix-up',
      description: 'Burger Express - Fix your incorrect fast-food order.',
      image: '/burgerConvo.png',
      path: '/levels/level7',
    },
    
    {
      title: '911 Emergency',
      description: 'You have called 911. Tell them your Emergency.',
      image: '911-emergency.jpg', // Change to your image
      path: '/levels/level8',
    },

  ];

  return (
    <div className="relative w-full  text-white flex flex-col items-center justify-center px-6 py-12">
      
      <h1 className="text-4xl font-extrabold mb-10 text-center">
        🚀 SpeakGrade - Choose Your Scenario
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
