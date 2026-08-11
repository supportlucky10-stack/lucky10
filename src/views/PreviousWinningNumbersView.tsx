import React, { useState } from 'react';
import { HeaderBanner } from '../components/HeaderBanner';
import { useApp } from '../context/AppContext';
import type { GameSlot } from '../types';
import { Calendar } from 'lucide-react';

export const PreviousWinningNumbersView: React.FC = () => {
  const { setActiveGameSlot, setCurrentView } = useApp();
  const [selectedDate, setSelectedDate] = useState(
    new Date(Date.now() - 86400000).toISOString().split('T')[0]
  );

  const games: GameSlot[] = ['1 PM Game', '4 PM Game', '6 PM Game', '8 PM Game'];

  const handleSelectSlot = (slot: GameSlot) => {
    setActiveGameSlot(slot);
    setCurrentView('TODAYS_RESULT');
  };

  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] bg-black text-white flex flex-col justify-between overflow-hidden pb-16 select-none">
      {/* Gold Header matching Page 10 */}
      <HeaderBanner title="Previous Winning Numbers" />

      <div className="px-6 py-6 space-y-6 max-w-sm mx-auto w-full flex-1 flex flex-col justify-center">
        {/* Date Filter Picker */}
        <div className="bg-neutral-900 border border-gold/40 p-3 rounded flex items-center justify-between text-xs text-neutral-300">
          <span className="flex items-center gap-2 font-bold text-gold">
            <Calendar className="w-4 h-4" /> Select Archive Date:
          </span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-black border border-neutral-700 text-white font-mono text-xs px-2 py-1 rounded focus:outline-none focus:border-gold"
          />
        </div>

        {/* 4 Game Buttons matching Page 10 */}
        <div className="space-y-5 pt-2">
          {games.map((slot) => (
            <button
              key={slot}
              onClick={() => handleSelectSlot(slot)}
              className="w-full py-4 bg-gold-gradient text-black font-black text-lg sm:text-xl tracking-wider rounded shadow-lg hover:opacity-95 transition-transform active:scale-98"
            >
              {slot}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
