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
              className={`w-full py-4 px-6 rounded-2xl font-black text-xl sm:text-2xl tracking-wider shadow-2xl transition-transform active:scale-98 uppercase flex items-center justify-center gap-4 ${
                isCurrent ? 'bg-gold-banner ring-4 ring-gold/50 text-black' : 'bg-gold-metallic text-black hover:opacity-95'
              }`}
            >
              <div className="w-11 h-11 rounded-full bg-black p-2 flex items-center justify-center shrink-0 border-2 border-gold/90 shadow">
                <img src="/assets/gold-calendar.png" alt="Calendar" className="w-full h-full object-contain filter drop-shadow" />
              </div>
              <span>{slot}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
