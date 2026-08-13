import React from 'react';
import { HeaderBanner } from '../components/HeaderBanner';
import { useApp } from '../context/AppContext';
import type { GameSlot } from '../types';

export const ChangeGameView: React.FC = () => {
  const { setActiveGameSlot, setCurrentView, activeGameSlot } = useApp();

  const games: GameSlot[] = ['1 PM Game', '3 PM Game', '6 PM Game', '8 PM Game'];

  const slotButtonStyles: Record<GameSlot, { active: string; inactive: string }> = {
    '1 PM Game': {
      active: 'bg-gradient-to-r from-blue-500 via-indigo-600 to-sky-500 text-white border-2 border-sky-300 shadow-[0_0_15px_rgba(59,130,246,0.4)]',
      inactive: 'bg-gradient-to-r from-blue-700/80 to-indigo-800/80 text-white hover:brightness-110 border border-blue-500/50',
    },
    '3 PM Game': {
      active: 'bg-gold-metallic text-black border-2 border-gold-dark shadow-[0_0_15px_rgba(184,137,40,0.4)]',
      inactive: 'bg-gradient-to-r from-[#c89825]/80 to-[#996e19]/80 text-black hover:brightness-110 border border-gold/40',
    },
    '6 PM Game': {
      active: 'bg-gradient-to-r from-fuchsia-500 via-pink-600 to-rose-600 text-white border-2 border-fuchsia-300 shadow-[0_0_15px_rgba(217,70,239,0.4)]',
      inactive: 'bg-gradient-to-r from-fuchsia-700/80 to-rose-800/80 text-white hover:brightness-110 border border-fuchsia-500/50',
    },
    '8 PM Game': {
      active: 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600 text-black border-2 border-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.4)]',
      inactive: 'bg-gradient-to-r from-teal-600/80 to-cyan-800/80 text-white hover:brightness-110 border border-teal-500/50',
    },
  };

  const handleSelect = (slot: GameSlot) => {
    setActiveGameSlot(slot);
    setCurrentView('GAME_DASHBOARD');
  };

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-between pb-24 sm:pb-32 antialiased">
      {/* Gold Header Banner */}
      <HeaderBanner title="Change Game" />

      {/* 4 Large Game Buttons - Dynamic Color Theme Styles */}
      <div className="px-4 sm:px-8 py-3 space-y-3 sm:space-y-5 max-w-sm sm:max-w-md mx-auto w-full flex-1 flex flex-col justify-center items-center my-auto">
        {games.map((slot) => {
          const isCurrent = slot === activeGameSlot;
          const style = slotButtonStyles[slot];
          return (
            <button
              key={slot}
              onClick={() => handleSelect(slot)}
              className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-black text-sm sm:text-xl tracking-wider shadow-md transition-all active:scale-98 uppercase flex items-center justify-center text-center cursor-pointer ${
                isCurrent ? style.active : style.inactive
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
