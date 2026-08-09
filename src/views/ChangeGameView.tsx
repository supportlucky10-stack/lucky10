import React from 'react';
import { HeaderBanner } from '../components/HeaderBanner';
import { useApp } from '../context/AppContext';
import type { GameSlot } from '../types';

export const ChangeGameView: React.FC = () => {
  const { setActiveGameSlot, setCurrentView, activeGameSlot, addToast } = useApp();

  const games: GameSlot[] = ['1 PM Game', '4 PM Game', '6 PM Game', '8 PM Game'];

  const handleSelect = (slot: GameSlot) => {
    setActiveGameSlot(slot);
    addToast(`Selected ${slot}`, 'success');
    setCurrentView('GAME_DASHBOARD');
  };

  return (
    <div className="w-full h-[100dvh] bg-black text-white flex flex-col justify-between overflow-hidden pb-20 select-none">
      {/* Gold Header Banner */}
      <HeaderBanner title="Change Game" />

      {/* 4 Large Game Buttons - Perfectly Centered Vertically & Horizontally */}
      <div className="px-4 sm:px-8 py-4 space-y-3.5 sm:space-y-5 max-w-md mx-auto w-full flex-1 flex flex-col justify-center items-center my-auto">
        {games.map((slot) => {
          const isCurrent = slot === activeGameSlot;
          return (
            <button
              key={slot}
              onClick={() => handleSelect(slot)}
              className={`w-full py-3.5 sm:py-4 px-6 rounded-2xl font-black text-base sm:text-xl tracking-wider shadow-2xl transition-all active:scale-98 uppercase text-center flex items-center justify-center ${
                isCurrent
                  ? 'bg-gold-banner text-black animate-gold-blink ring-4 ring-gold/90'
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
