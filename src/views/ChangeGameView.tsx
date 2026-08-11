import React from 'react';
import { HeaderBanner } from '../components/HeaderBanner';
import { useApp } from '../context/AppContext';
import type { GameSlot } from '../types';

export const ChangeGameView: React.FC = () => {
  const { setActiveGameSlot, setCurrentView, activeGameSlot, addToast } = useApp();

  const games: GameSlot[] = ['1 PM Game', '3 PM Game', '6 PM Game', '8 PM Game'];

  const handleSelect = (slot: GameSlot) => {
    setActiveGameSlot(slot);
    addToast(`Selected ${slot}`, 'success');
    setCurrentView('GAME_DASHBOARD');
  };

  return (
    <div className="w-full min-h-[100dvh] bg-black text-white flex flex-col justify-between overflow-y-auto pb-24 sm:pb-32 antialiased">
      {/* Gold Header Banner */}
      <HeaderBanner title="Change Game" />

      {/* 4 Large Game Buttons - Perfectly Centered Vertically & Horizontally */}
      <div className="px-4 sm:px-8 py-3 space-y-2.5 sm:space-y-5 max-w-sm sm:max-w-md mx-auto w-full flex-1 flex flex-col justify-center items-center my-auto">
        {games.map((slot) => {
          const isCurrent = slot === activeGameSlot;
          return (
            <button
              key={slot}
              onClick={() => handleSelect(slot)}
              className={`w-full py-2.5 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-black text-sm sm:text-xl tracking-wider shadow-md transition-all active:scale-98 uppercase flex items-center justify-center text-center ${
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
