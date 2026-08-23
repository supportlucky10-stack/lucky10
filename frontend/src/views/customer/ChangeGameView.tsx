import React, { useState, useEffect } from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';
import { useApp } from '../../context/AppContext';
import type { GameSlot } from '../../types';
import { isGameSlotOpen } from '../../utils/dateUtils';
import { Lock } from 'lucide-react';

export const ChangeGameView: React.FC = () => {
  const { setActiveGameSlot, setCurrentView, activeGameSlot, addToast } = useApp();
  const [, setTick] = useState(0);

  // Keep open/locked states live in real-time
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const games: GameSlot[] = ['1 PM Game', '3 PM Game', '6 PM Game', '8 PM Game'];

  const slotButtonStyles: Record<GameSlot, { active: string; inactive: string }> = {
    '1 PM Game': {
      active: 'bg-gradient-to-r from-blue-500 via-indigo-600 to-sky-500 text-white border-2 border-sky-300 shadow-[0_0_15px_rgba(59,130,246,0.4)]',
      inactive: 'bg-gradient-to-r from-blue-700/80 to-indigo-800/80 text-white hover:brightness-110 border border-blue-500/50',
    },
    '3 PM Game': {
      active: 'bg-gradient-to-r from-[#9a3412] via-[#7c2d12] to-[#5a1e06] text-white border-2 border-orange-400/60 shadow-[0_0_12px_rgba(154,52,18,0.4)]',
      inactive: 'bg-gradient-to-r from-[#7c2d12]/80 to-[#431407]/80 text-white hover:brightness-110 border border-orange-600/40',
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
    if (!isGameSlotOpen(slot)) {
      addToast(`${slot} billing is locked`, 'error');
      return;
    }
    setActiveGameSlot(slot);
    setCurrentView('GAME_DASHBOARD');
  };

  return (
    <div className="w-full min-h-screen min-h-[100dvh] bg-black text-white flex flex-col justify-start pb-24 sm:pb-32 antialiased overflow-y-auto">
      {/* Gold Header Banner */}
      <HeaderBanner title="Change Game" />

      {/* 4 Large Game Buttons - Dynamic Color Theme Styles */}
      <div className="px-4 sm:px-8 py-3 space-y-3 sm:space-y-5 max-w-sm sm:max-w-md mx-auto w-full flex-1 flex flex-col justify-center items-center my-auto">
        {games.map((slot) => {
          const isCurrent = slot === activeGameSlot;
          const isOpen = isGameSlotOpen(slot);
          const style = slotButtonStyles[slot];
          return (
            <button
              key={slot}
              disabled={!isOpen}
              onClick={() => handleSelect(slot)}
              className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-black text-sm sm:text-xl tracking-wider shadow-md transition-all uppercase flex items-center justify-center text-center ${
                !isOpen
                  ? 'opacity-40 cursor-not-allowed bg-neutral-900 text-neutral-500 border border-neutral-800'
                  : isCurrent
                  ? `${style.active} active:scale-98 cursor-pointer`
                  : `${style.inactive} active:scale-98 cursor-pointer`
              }`}
            >
              <span className="w-full text-center flex items-center justify-center gap-2">
                <span>{slot}</span>
                {!isOpen && <Lock className="w-4 h-4 text-neutral-400 inline" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
