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
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto">
      {/* Gold Header Banner */}
      <HeaderBanner title="Change Game" />

      {/* 4 Large Game Buttons */}
      <div className="px-8 py-12 space-y-6 max-w-xl mx-auto w-full flex-1 flex flex-col justify-center">
        {games.map((slot) => {
          const isCurrent = slot === activeGameSlot;
          return (
            <button
              key={slot}
              onClick={() => handleSelect(slot)}
              className={`w-full py-5 rounded-2xl font-black text-xl sm:text-2xl tracking-wider shadow-2xl transition-transform active:scale-98 uppercase ${
                isCurrent ? 'bg-gold-banner ring-4 ring-gold/50 text-black' : 'bg-gold-metallic text-black hover:opacity-95'
              }`}
            >
              {slot}
            </button>
          );
        })}
      </div>
    </div>
  );
};
