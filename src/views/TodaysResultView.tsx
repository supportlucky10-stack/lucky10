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

  const games: GameSlot[] = ['1 PM Game', '4 PM Game', '6 PM Game', '8 PM Game'];

  const currentResult = gameResults[activeGameSlot] || {
    prize1: '742',
    prize2: '819',
    prize3: '350',
    prize4: '194',
    compliments: [
      ['743', '741', '744', '740'],
      ['820', '818', '821', '817'],
      ['351', '349', '352', '348'],
      ['195', '193', '196', '192'],
      ['529', '631', '412', '908'],
      ['111', '222', '333', '444'],
    ],
  };

  const slotTitle = activeGameSlot.replace(' Game', '') + ' Result';

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-24 sm:pb-32 select-none">
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

        {/* Tab 1: Today's Result */}
        {activeTab === 'TODAY' && (
          <div className="space-y-4">
            {/* Slot Switcher Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {games.map((slot) => {
                const isSelected = slot === activeGameSlot;
                return (
                  <button
                    key={slot}
                    onClick={() => setActiveGameSlot(slot)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase whitespace-nowrap border transition-all ${
                      isSelected
                        ? 'bg-gold-banner text-black border-gold shadow'
                        : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-gold/40'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>

            {/* 4 Winning Number Cards */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {[
                { id: 1, label: '1st Prize', val: currentResult.prize1 },
                { id: 2, label: '2nd Prize', val: currentResult.prize2 },
                { id: 3, label: '3rd Prize', val: currentResult.prize3 },
                { id: 4, label: '4th Prize', val: currentResult.prize4 },
              ].map((item) => (
                <div key={item.id} className="flex items-center gap-2 bg-neutral-950 p-2 rounded-xl border border-neutral-800 shadow">
                  <div className="w-7 h-7 bg-white text-black font-black text-xs flex items-center justify-center rounded-lg border border-black shrink-0">
                    {item.id}
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">{item.label}</span>
                    <span className="text-white font-black text-base font-mono tracking-widest block">
                      {item.val || '---'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Compliments Matrix Table */}
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
        )}

        {/* Tab 2: Previous Results */}
        {activeTab === 'PREVIOUS' && (
          <div className="space-y-4">
            {/* Date Picker */}
            <div className="bg-neutral-950 border border-gold/40 p-3 rounded-xl flex items-center justify-between text-xs text-neutral-300">
              <span className="flex items-center gap-2 font-bold text-gold">
                <Calendar className="w-4 h-4" /> Archive Date:
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-black border border-neutral-700 text-white font-mono text-xs px-2.5 py-1 rounded-lg focus:outline-none focus:border-gold"
              />
            </div>

            {/* Slot Results Summary for Selected Previous Date */}
            <div className="space-y-3">
              {games.map((slot, sIdx) => {
                const dummyNumbers = ['819', '350', '742', '194'];
                const num = dummyNumbers[sIdx % dummyNumbers.length];
                return (
                  <div key={slot} className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex items-center justify-between">
                    <div>
                      <span className="text-white font-black text-sm block">{slot}</span>
                      <span className="text-xs text-neutral-400">Date: {selectedDate}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 uppercase block font-bold">1st Prize</span>
                      <span className="text-gold font-mono font-black text-lg">{num}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
