import React, { useState } from 'react';
import { HeaderBanner } from '../components/HeaderBanner';
import { useApp } from '../context/AppContext';
import { Calendar, CheckCircle2, History } from 'lucide-react';
import type { GameSlot } from '../types';

export const TodaysResultView: React.FC = () => {
  const { activeGameSlot, gameResults, setActiveGameSlot } = useApp();
  const [activeTab, setActiveTab] = useState<'TODAY' | 'PREVIOUS'>('TODAY');
  const [selectedDate, setSelectedDate] = useState(
    new Date(Date.now() - 86400000).toISOString().split('T')[0]
  );

  const games: GameSlot[] = ['1 PM Game', '3 PM Game', '6 PM Game', '8 PM Game'];

  // Helper to resolve results for any date & slot
  const getResultForSlotAndDate = (slot: GameSlot, dateStr: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateStr === todayStr && gameResults[slot]) {
      return gameResults[slot];
    }
    // Deterministic mock data for previous dates based on seed
    const seed = (slot + dateStr).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const p1 = String((seed * 37) % 900 + 100);
    const p2 = String((seed * 53) % 900 + 100);
    const p3 = String((seed * 71) % 900 + 100);
    const p4 = String((seed * 97) % 900 + 100);

    const compliments = [
      [String(Number(p1) + 1), String(Number(p1) - 1), String(Number(p1) + 2), String(Number(p1) - 2)],
      [String(Number(p2) + 1), String(Number(p2) - 1), String(Number(p2) + 2), String(Number(p2) - 2)],
      [String(Number(p3) + 1), String(Number(p3) - 1), String(Number(p3) + 2), String(Number(p3) - 2)],
      [String(Number(p4) + 1), String(Number(p4) - 1), String(Number(p4) + 2), String(Number(p4) - 2)],
      ['529', '631', '412', '908'],
      ['111', '222', '333', '444'],
    ];

    return {
      prize1: p1,
      prize2: p2,
      prize3: p3,
      prize4: p4,
      compliments,
    };
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const activeDate = activeTab === 'TODAY' ? todayStr : selectedDate;
  const currentResult = getResultForSlotAndDate(activeGameSlot, activeDate);

  const slotTitle = activeGameSlot.replace(' Game', '') + ' Result';

  return (
    <div className="w-full min-h-[100dvh] bg-black text-white flex flex-col justify-start overflow-y-auto pb-24 sm:pb-32 antialiased">
      {/* Gold Header Banner */}
      <HeaderBanner title={slotTitle} />

      <div className="max-w-xl mx-auto w-full px-3.5 sm:px-6 py-4 space-y-4">
        
        {/* Results Section Tabs: Today & Previous */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-950 rounded-xl border border-neutral-800 text-xs sm:text-sm font-extrabold">
          <button
            onClick={() => setActiveTab('TODAY')}
            className={`py-2.5 px-3 rounded-lg transition-all flex items-center justify-center gap-2 text-center ${
              activeTab === 'TODAY'
                ? 'bg-gold-metallic text-black shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Today's Result</span>
          </button>

          <button
            onClick={() => setActiveTab('PREVIOUS')}
            className={`py-2.5 px-3 rounded-lg transition-all flex items-center justify-center gap-2 text-center ${
              activeTab === 'PREVIOUS'
                ? 'bg-gold-metallic text-black shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4 shrink-0" />
            <span>Previous Results</span>
          </button>
        </div>

        {/* Date Selector for Previous Tab */}
        {activeTab === 'PREVIOUS' && (
          <div className="bg-neutral-950 border border-gold/40 p-3 rounded-xl flex items-center justify-between text-xs text-neutral-300 shadow">
            <span className="flex items-center gap-2 font-black text-gold uppercase tracking-wider text-xs">
              <Calendar className="w-4 h-4 text-gold shrink-0" /> Select Date:
            </span>
            <div
              onClick={(e) => {
                const input = e.currentTarget.querySelector('input');
                input?.showPicker?.();
              }}
              className="flex items-center gap-2 bg-black border border-neutral-700 hover:border-gold/80 px-3 py-1.5 rounded-lg cursor-pointer transition-all shadow-inner group"
            >
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer"
              />
              <Calendar className="w-4 h-4 text-gold group-hover:scale-110 transition-transform cursor-pointer shrink-0" />
            </div>
          </div>
        )}

        {/* Slot Switcher Pills (1 PM, 3 PM, 6 PM, 8 PM) - Single View Grid */}
        <div className="grid grid-cols-4 gap-1.5 w-full">
          {games.map((slot) => {
            const isSelected = slot === activeGameSlot;
            return (
              <button
                key={slot}
                onClick={() => setActiveGameSlot(slot)}
                className={`py-2 px-1 text-[11px] sm:text-xs font-black uppercase text-center rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-gold-banner text-black border-gold shadow-md'
                    : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-gold/40'
                }`}
              >
                <span className="truncate block">{slot}</span>
              </button>
            );
          })}
        </div>

        {/* 4 Winning Number Cards (1st Prize Featured Top, 2nd-4th Below) */}
        <div className="space-y-2.5 sm:space-y-3">
          {/* 1st Prize Card - Featured Bigger on Top */}
          <div
            key={`prize-1-${activeTab}-${activeDate}-${activeGameSlot}`}
            style={{ animationDelay: '0ms' }}
            className="flex items-center justify-between bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 p-3.5 sm:p-4 rounded-2xl border-2 border-gold/70 shadow-[0_0_20px_rgba(237,209,119,0.2)] animate-drop-in hover:border-gold transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gold-metallic text-black font-black text-sm sm:text-base flex items-center justify-center rounded-xl border border-black shrink-0 shadow">
                1
              </div>
              <div>
                <span className="text-xs text-gold font-black uppercase tracking-wider block">
                  1st Prize
                </span>
                <span className="text-gold font-black text-xl sm:text-2xl font-mono tracking-widest block">
                  {currentResult.prize1 || '---'}
                </span>
              </div>
            </div>
            <div className="px-3 py-1 bg-gold/10 border border-gold/40 rounded-lg">
              <span className="text-[10px] sm:text-xs text-gold font-mono font-black uppercase tracking-wide">
                TOP WINNER
              </span>
            </div>
          </div>

          {/* 2nd, 3rd, 4th Prize Cards - 3-Column Grid Below (Fall down one by one) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {[
              { id: 2, label: '2nd Prize', val: currentResult.prize2, delay: '120ms' },
              { id: 3, label: '3rd Prize', val: currentResult.prize3, delay: '240ms' },
              { id: 4, label: '4th Prize', val: currentResult.prize4, delay: '360ms' },
            ].map((item) => (
              <div
                key={`prize-${item.id}-${activeTab}-${activeDate}-${activeGameSlot}`}
                style={{ animationDelay: item.delay }}
                className="flex flex-col items-center justify-center bg-neutral-950 p-2.5 sm:p-3 rounded-xl border border-neutral-800 shadow animate-drop-in hover:border-gold/40 transition-colors text-center"
              >
                <div className="w-6 h-6 bg-white text-black font-black text-xs flex items-center justify-center rounded-md border border-black shrink-0 shadow mb-1">
                  {item.id}
                </div>
                <span className="text-[10px] text-gray-400 font-bold uppercase">{item.label}</span>
                <span className="text-white font-black text-sm sm:text-base font-mono tracking-wider block mt-0.5">
                  {item.val || '---'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Compliments Matrix Table - Fixed, No Animation */}
        <div className="bg-neutral-950 text-white rounded-xl p-3 sm:p-4 shadow-lg border border-neutral-800 space-y-2">
          <h3 className="font-extrabold text-xs sm:text-sm text-gold text-center border-b border-neutral-800 pb-1 uppercase tracking-wide">
            Compliments
          </h3>

          <div className="grid grid-cols-4 gap-px bg-neutral-800 border border-neutral-800 rounded-lg overflow-hidden">
            {currentResult.compliments.flatMap((row, rIdx) =>
              row.map((val, cIdx) => (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className="bg-black py-1.5 text-center text-xs font-mono font-bold text-neutral-200"
                >
                  {val}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

