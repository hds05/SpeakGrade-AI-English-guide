'use client';

import React from 'react';
import Image from 'next/image';
import Header from '../header/page';

const games = [
    {
        title: 'Spelling Game',
        description: 'Practice spelling common words.',
        image: 'https://assets.ltkcontent.com/images/89993/spelling-word-game_7abbbb2796.jpg',
    },
    {
        title: 'Grammar Game',
        description: 'Learn basic grammar concepts.',
        image: 'https://www.plazoom.com/images/made/assets/resources/GG-Tile_(1)_700_700_c1.png',
    },
    {
        title: 'Vocabulary Match',
        description: 'Match words with meanings.',
        image:
            'https://cdnapisec.kaltura.com/html5/html5lib/v2.101/modules/KalturaSupport/thumbnail.php/p/4764982/uiconf_id/53181732/entry_id/1_ex1tt6og/height/480?&flashvars[parentDomain]=https%3A%2F%2Fwww.vocabulary.com%2F',
    },
    {
        title: 'Listening Game',
        description: 'Listen and choose the right word.',
        image: 'https://img.freepik.com/premium-photo/middle-age-greyhaired-man-wearing-casual-clothes-smiling-with-hand-ear-listening-hearing_660230-33133.jpg?semt=ais_hybrid&w=740&q=80',
    },
];

const GameCardGrid = () => {
    return (
        <div>
            <Header />
            <div className="relative  bg-white py-16 px-4 sm:px-8 lg:px-16 overflow-hidden ">
                {/* Decorative boat bg */}
                <div className="absolute top-0 left-0 w-full h-full bg-cover bg-[url('https://cdn.pixabay.com/animation/2024/08/28/00/02/00-02-25-950_512.gif')] bg-repeat-x z-0" />
                {/* Dog */}
                <div className="absolute bottom-0 right-10 w-[60px] h-[60px] md:w-[200px] md:h-[200px] bg-cover bg-[url('https://cdn.pixabay.com/animation/2024/10/18/13/57/13-57-40-141_512.gif')] bg-repeat-x z-100" />

                {/* Heading + GIF Section */}
                <div className="relative z-10  mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-center gap-6 text-center sm:text-left mb-10 bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-lg">
                    {/* GIF */}
                    <div className="w-[80px] h-[80px] rounded-full sm:w-[100px] sm:h-[100px] bg-cover bg-[url('https://cdn.pixabay.com/animation/2022/08/22/11/10/11-10-53-252_512.gif')] bg-no-repeat bg-center shrink-0" />

                    {/* Heading + Para */}
                    <div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-purple-800 mb-2">
                            Play English Games
                        </h2>
                        <p className="text-sm sm:text-base md:text-lg text-gray-600">
                            Fun and interactive games to improve your English!
                        </p>
                    </div>
                </div>


                {/* Scrollable Game Card Section */}
                <div className="relative z-10 overflow-y-auto scrollbar-hidden h-[calc(85vh-18rem)] p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 px-1 sm:px-0">
                        {games.map((game, index) => (
                            <div
                                key={index}
                                className="rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl border border-gray-200 hover:scale-[1.02] transition-transform duration-300 ease-in-out p-4 bg-white"
                            >
                                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden">
                                    <Image
                                        src={game.image}
                                        alt={game.title}
                                        fill
                                        className="object-cover rounded-xl"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        priority={index === 0}
                                    />
                                </div>
                                <h3 className="mt-3 text-lg sm:text-xl md:text-2xl font-semibold text-purple-700">
                                    {game.title}
                                </h3>
                                <p className="text-gray-500 text-sm sm:text-base md:text-base mt-1">
                                    {game.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameCardGrid;
