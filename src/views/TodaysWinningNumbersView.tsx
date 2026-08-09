import React from 'react';
import { HeaderBanner } from '../components/HeaderBanner';
import { useApp } from '../context/AppContext';
import type { GameSlot } from '../types';

export const TodaysWinningNumbersView: React.FC = () => {
  const { setActiveGameSlot, setCurrentView } = useApp();

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
        {games.map((slot) => (
          <button
            key={slot}
            onClick={() => handleSelectSlot(slot)}
            className="relative w-full py-3.5 sm:py-4 px-4 sm:px-6 bg-gold-metallic text-black font-black text-base sm:text-xl tracking-wider rounded-2xl shadow-2xl hover:opacity-95 transition-all active:scale-98 uppercase flex items-center justify-center text-center"
          >
            <div className="absolute left-3.5 sm:left-5 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black p-1.5 flex items-center justify-center shrink-0 border-2 border-gold/90 shadow">
              <img src="/assets/gold-trophy.png" alt="Trophy" className="w-full h-full object-contain filter drop-shadow" />
            </div>
            <span className="w-full text-center pl-6">{slot}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
