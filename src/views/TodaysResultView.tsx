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
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-12">
      {/* Gold Header Banner */}
      <HeaderBanner title={slotTitle} />

      <div className="px-6 py-8 space-y-8 max-w-2xl mx-auto w-full">
        <h2 className="text-2xl sm:text-3xl font-black text-white text-center tracking-wide uppercase">
          Today Result
        </h2>

        {/* 4 Winning Number Cards */}
        <div className="space-y-4">
          {[
            { id: 1, val: currentResult.prize1 },
            { id: 2, val: currentResult.prize2 },
            { id: 3, val: currentResult.prize3 },
            { id: 4, val: currentResult.prize4 },
          ].map((item) => (
            <div key={item.id} className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white text-black font-black text-2xl flex items-center justify-center rounded-2xl shadow-lg border-2 border-black shrink-0">
                {item.id}
              </div>
              <div className="flex-1 h-16 bg-white text-black font-black text-3xl font-mono flex items-center justify-center rounded-2xl shadow-lg border-2 border-black tracking-widest">
                {item.val || '---'}
              </div>
            </div>
          ))}
        </div>

        {/* Compliments Matrix Table */}
        <div className="bg-white text-black rounded-2xl p-5 shadow-2xl border-2 border-black space-y-3">
          <h3 className="font-black text-xl text-center border-b-2 border-gray-300 pb-2 uppercase tracking-wide">
            Compliments
          </h3>

          <div className="grid grid-cols-4 gap-px bg-gray-300 border-2 border-gray-300 rounded-xl overflow-hidden">
            {currentResult.compliments.flatMap((row, rIdx) =>
              row.map((val, cIdx) => (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className="bg-white py-2.5 text-center text-base sm:text-lg font-mono font-black text-black"
                >
                  {val}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Previous Winning Numbers Button */}
        <div className="pt-2">
          <button
            onClick={() => setCurrentView('PREVIOUS_WINNING_NUMBERS')}
            className="w-full py-4.5 bg-gold-metallic text-black font-black text-lg sm:text-xl tracking-wide rounded-2xl shadow-xl uppercase hover:opacity-95"
          >
            Previous Winning Numbers
          </button>
        </div>
      </div>
    </div>
  );
};
