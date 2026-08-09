import React from 'react';
import { HeaderBanner } from '../components/HeaderBanner';
import { useApp } from '../context/AppContext';
import type { GameSlot } from '../types';

export const TodaysWinningNumbersView: React.FC = () => {
  const { setActiveGameSlot, setCurrentView, activeGameSlot } = useApp();

  const games: GameSlot[] = ['1 PM Game', '4 PM Game', '6 PM Game', '8 PM Game'];

  const handleSelectSlot = (slot: GameSlot) => {
    setActiveGameSlot(slot);
    setCurrentView('TODAYS_RESULT');
  };

  return (
    <div className="w-full h-[100dvh] bg-black text-white flex flex-col justify-between overflow-hidden pb-20 select-none">
      {/* Gold Header Banner */}
      <HeaderBanner title="Today's Winning Numbers" />

      {/* 4 Large Game Buttons - Perfectly Centered Vertically & Horizontally */}
      <div className="px-4 sm:px-8 py-4 space-y-3.5 sm:space-y-5 max-w-md mx-auto w-full flex-1 flex flex-col justify-center items-center my-auto">
        {games.map((slot) => {
          const isCurrent = slot === activeGameSlot;
          return (
            <button
              key={slot}
              onClick={() => handleSelectSlot(slot)}
              className={`w-full py-3.5 sm:py-4 px-6 rounded-2xl font-black text-base sm:text-xl tracking-wider shadow-md transition-all active:scale-98 uppercase flex items-center justify-center text-center ${
                isCurrent
                  ? 'bg-gold-banner text-black border-2 border-gold-dark'
                  : 'bg-gold-metallic text-black hover:opacity-95'
              }`}
            >
              <span className="w-full text-center">{slot}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
