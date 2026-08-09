import React from 'react';
import { HeaderBanner } from '../components/HeaderBanner';
import { useApp } from '../context/AppContext';

export const TodaysResultView: React.FC = () => {
  const { activeGameSlot, gameResults, setCurrentView } = useApp();

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
    <div className="w-full h-[100dvh] max-h-[100dvh] bg-black text-white flex flex-col justify-between overflow-hidden pb-16 select-none">
      {/* Gold Header Banner */}
      <HeaderBanner title={slotTitle} />

      <div className="px-3 sm:px-6 py-3 sm:py-6 space-y-3 sm:space-y-6 max-w-xl mx-auto w-full flex-1">
        <h2 className="text-sm sm:text-xl font-black text-white text-center tracking-wide uppercase">
          Today Result
        </h2>

        {/* 4 Winning Number Cards */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {[
            { id: 1, val: currentResult.prize1 },
            { id: 2, val: currentResult.prize2 },
            { id: 3, val: currentResult.prize3 },
            { id: 4, val: currentResult.prize4 },
          ].map((item) => (
            <div key={item.id} className="flex items-center gap-2 bg-neutral-950 p-1.5 rounded-xl border border-neutral-800 shadow">
              <div className="w-8 h-8 bg-white text-black font-black text-xs flex items-center justify-center rounded-lg border border-black shrink-0">
                {item.id}
              </div>
              <div className="flex-1 h-8 bg-white text-black font-black text-base font-mono flex items-center justify-center rounded-lg border border-black tracking-widest">
                {item.val || '---'}
              </div>
            </div>
          ))}
        </div>

        {/* Compliments Matrix Table */}
        <div className="bg-neutral-950 text-white rounded-xl p-2.5 sm:p-4 shadow-lg border border-neutral-800 space-y-2">
          <h3 className="font-extrabold text-xs sm:text-sm text-gold text-center border-b border-neutral-800 pb-1 uppercase tracking-wide">
            Compliments
          </h3>

          <div className="grid grid-cols-4 gap-px bg-neutral-800 border border-neutral-800 rounded-lg overflow-hidden">
            {currentResult.compliments.flatMap((row, rIdx) =>
              row.map((val, cIdx) => (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className="bg-black py-1 text-center text-xs font-mono font-bold text-neutral-200"
                >
                  {val}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Previous Winning Numbers Button */}
        <div className="pt-1">
          <button
            onClick={() => setCurrentView('PREVIOUS_WINNING_NUMBERS')}
            className="w-full py-2.5 bg-gold-metallic text-black font-extrabold text-xs sm:text-base tracking-wide rounded-xl shadow-lg uppercase hover:opacity-95"
          >
            Previous Winning Numbers
          </button>
        </div>
      </div>
    </div>
  );
};
