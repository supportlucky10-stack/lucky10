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
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto">
      {/* Gold Header Banner */}
      <HeaderBanner title="Today's Winning Numbers" />

      {/* 4 Large Game Buttons */}
      <div className="px-8 py-12 space-y-6 max-w-xl mx-auto w-full flex-1 flex flex-col justify-center">
        {games.map((slot) => (
          <button
            key={slot}
            onClick={() => handleSelectSlot(slot)}
            className="w-full py-5 bg-gold-metallic text-black font-black text-xl sm:text-2xl tracking-wider rounded-2xl shadow-2xl hover:opacity-95 transition-transform active:scale-98 uppercase flex items-center justify-center gap-3.5"
          >
            <img src="/assets/gold-trophy.png" alt="Trophy" className="w-8 h-8 object-contain" />
            <span>{slot}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
