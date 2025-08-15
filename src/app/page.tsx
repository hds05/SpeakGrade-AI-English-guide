'use client';

import { useState, useEffect } from 'react';
import Snowfall from './components/snowfall/page';
import Loader from './components/loader/page';
import MainPage from './main/page';
import Header from './components/header/page';
import Game from './components/game/Game';

export default function Home() {
  // const [loading, setLoading] = useState(true);
  // const [gameCompleted, setGameCompleted] = useState(false); // ✅ Track game completion

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setLoading(false);
  //   }, 3000);
  //   return () => clearTimeout(timer);
  // }, []);

  // if (loading) return <Loader />;

  return (
    <div className="fixed inset-0 w-full h-full  text-white">
      {/* 🔵 Background Layers */}
      {/* <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="w-full h-full bg-gradient-to-tr from-purple-700 via-indigo-600 to-pink-700 blur-3xl animate-pulse opacity-20" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-purple-500 rounded-full blur-2xl opacity-30 animate-floatY" />
        <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-pink-600 rounded-full blur-2xl opacity-30 animate-floatY delay-2000" />
        <Snowfall />
      </div> */}

      {/* 🔵 Foreground - Scrollable Content */}
      {/* <div className="relative z-10 w-full h-full overflow-y-auto">
        <Header />
        <main className="w-full flex justify-center px-4 py-6"> */}
          {/* ✅ Show Game until it's completed */}
          {/* {!gameCompleted ? (
            <Game/>
          ) : ( */}
          {/* <MainPage /> */}
          {/* )} */}
        {/* </main> */}
      {/* </div> */}
    </div>
  );
}
