import React, { useState } from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';
import { useApp } from '../../context/AppContext';
import { History, Calendar, FileText } from 'lucide-react';
import type { GameSlot } from '../../types';

export const TodaysWinningNumbersView: React.FC = () => {
  const { placedTickets } = useApp();
  const [activeTab, setActiveTab] = useState<'TODAY' | 'PREVIOUS'>('TODAY');
  const [selectedSlot, setSelectedSlot] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date(Date.now() - 86400000).toISOString().split('T')[0]
  );

  const games: GameSlot[] = ['1 PM Game', '3 PM Game', '6 PM Game', '8 PM Game'];
  const slotOptions = ['ALL', ...games];

  // Filter tickets by slot and date
  const filteredTickets = placedTickets.filter((ticket) => {
    if (selectedSlot !== 'ALL' && ticket.gameSlot !== selectedSlot) return false;
    if (activeTab === 'PREVIOUS') {
      return ticket.placedAt?.startsWith(selectedDate);
    }
    return true;
  });

  // Aggregate items into game categories
  let superCount = 0;
  let superCash = 0;
  let boxCount = 0;
  let boxCash = 0;
  let pair2Count = 0;
  let pair2Cash = 0;
  let pair1Count = 0;
  let pair1Cash = 0;

  filteredTickets.forEach((t) => {
    t.items.forEach((item) => {
      const type = item.type;
      const num = item.number;

      if (type === 'Direct') {
        superCount += item.count;
        superCash += item.totalAmount;
      } else if (type === 'Shuffle') {
        boxCount += item.count;
        boxCash += item.totalAmount;
      } else if (type === 'Pair') {
        const cleanNum = num.includes(':') ? num.split(':')[1] : num;
        if (cleanNum.length === 2) {
          pair2Count += item.count;
          pair2Cash += item.totalAmount;
        } else {
          pair1Count += item.count;
          pair1Cash += item.totalAmount;
        }
      }
    });
  });

  const superRate = superCount > 0 ? Math.round(superCash / superCount) : 10;
  const boxRate = boxCount > 0 ? Math.round(boxCash / boxCount) : 10;
  const pair2Rate = pair2Count > 0 ? Math.round(pair2Cash / pair2Count) : 10;
  const pair1Rate = pair1Count > 0 ? Math.round(pair1Cash / pair1Count) : 10;

  const totalCount = superCount + boxCount + pair2Count + pair1Count;
  const totalCash = superCash + boxCash + pair2Cash + pair1Cash;

  const reportRows = [
    { name: 'SUPER', count: superCount, rate: superRate, cash: superCash },
    { name: 'BOX', count: boxCount, rate: boxRate, cash: boxCash },
    { name: 'AB/BC/AC', count: pair2Count, rate: pair2Rate, cash: pair2Cash },
    { name: 'A/B/C', count: pair1Count, rate: pair1Rate, cash: pair1Cash },
  ];

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-28 sm:pb-36 antialiased select-none">
      {/* Header Banner */}
      <HeaderBanner title="Total count view" />

      <div className="max-w-md mx-auto w-full px-3.5 sm:px-6 py-4 space-y-4">
        
        {/* Navigation Tabs: Today's Report & Previous History */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-950 rounded-xl border border-neutral-800 text-xs sm:text-sm font-extrabold shadow">
          <button
            onClick={() => setActiveTab('TODAY')}
            className={`py-2.5 px-3 rounded-lg transition-all flex items-center justify-center gap-2 text-center ${
              activeTab === 'TODAY'
                ? 'bg-gold-metallic text-black shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Today's Report</span>
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
            <span>Previous History</span>
          </button>
        </div>

        {/* Date Selector for Previous History Tab */}
        {activeTab === 'PREVIOUS' && (
          <div className="bg-neutral-950 border border-gold/40 p-3 rounded-xl flex items-center justify-between text-xs text-neutral-300 shadow">
            <span className="font-black text-gold uppercase tracking-wider text-xs">
              SELECT DATE
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

        {/* Slot Selection Pills (ALL, 1 PM, 3 PM, 6 PM, 8 PM) */}
        <div className="grid grid-cols-5 gap-1 sm:gap-1.5 w-full">
          {slotOptions.map((opt) => {
            const isSelected = selectedSlot === opt;
            const label = opt === 'ALL' ? 'ALL' : opt.replace(' Game', '');
            return (
              <button
                key={opt}
                onClick={() => setSelectedSlot(opt)}
                className={`py-2 px-1 text-[10px] sm:text-xs font-black uppercase text-center rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-gold-banner text-black border-gold shadow-md'
                    : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-gold/40'
                }`}
              >
                <span className="truncate block">{label}</span>
              </button>
            );
          })}
        </div>

        {/* SHOW REPORT Banner Button */}
        <div className="w-full flex justify-center pt-2">
          <button className="px-8 py-2.5 bg-gradient-to-b from-[#edd177] via-[#c89825] to-[#996e19] text-black font-black text-xs sm:text-sm tracking-wider uppercase rounded-xl shadow-md cursor-pointer hover:brightness-110 active:scale-95 transition-all">
            SHOW REPORT
          </button>
        </div>

        {/* Total Count Report Table - Dark Metallic Gold Theme */}
        <div className="w-full border-2 border-gold/70 rounded-2xl overflow-hidden bg-neutral-950 text-white text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(184,137,40,0.15)] animate-drop-in">
          {/* Header Row */}
          <div className="grid grid-cols-4 bg-gradient-to-r from-neutral-900 via-[#3a2a07] to-neutral-900 border-b border-neutral-800 font-extrabold py-3 px-3 text-center uppercase tracking-wider text-gold text-xs sm:text-sm shadow-inner">
            <span>GAME</span>
            <span>COUNT</span>
            <span>RATE</span>
            <span>CASH</span>
          </div>

          {/* Data Rows */}
          <div className="divide-y divide-neutral-850">
            {reportRows.map((row) => (
              <div key={row.name} className="grid grid-cols-4 py-3 px-3 items-center text-center font-bold hover:bg-neutral-900/60 transition-colors">
                <span className="text-left font-black text-gold pl-2 tracking-wide">{row.name}</span>
                <span className="font-mono text-neutral-200">{row.count > 0 ? row.count : '-'}</span>
                <span className="font-mono text-neutral-200">{row.count > 0 ? `₹${row.rate}` : '-'}</span>
                <span className="font-mono text-neutral-200">{row.cash > 0 ? `₹${row.cash}` : '-'}</span>
              </div>
            ))}
          </div>

          {/* Total Row */}
          <div className="grid grid-cols-4 py-3.5 px-3 items-center text-center border-t-2 border-gold/50 bg-black font-black text-xs sm:text-sm">
            <span className="text-left pl-2 uppercase font-black text-rose-400">TOTAL</span>
            <span className="font-mono text-gold text-sm sm:text-base">{totalCount > 0 ? totalCount : '-'}</span>
            <span className="font-mono text-neutral-500">-</span>
            <span className="font-mono text-gold text-sm sm:text-base">{totalCash > 0 ? `₹${totalCash}` : '-'}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
