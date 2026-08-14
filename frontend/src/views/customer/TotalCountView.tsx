import React, { useState, useMemo, useRef } from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';
import { useApp } from '../../context/AppContext';
import { ClipboardList, Calendar } from 'lucide-react';

export const TotalCountView: React.FC = () => {
  const { placedTickets } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];
  const [countTab, setCountTab] = useState<'TODAY' | 'PREVIOUS'>('TODAY');
  const [fromDate, setFromDate] = useState<string>(todayStr);
  const [toDate, setToDate] = useState<string>(todayStr);
  const [selectedSlot, setSelectedSlot] = useState<'ALL' | '1 PM' | '3 PM' | '6 PM' | '8 PM'>('ALL');

  const fromDateRef = useRef<HTMLInputElement>(null);
  const toDateRef = useRef<HTMLInputElement>(null);

  const triggerDatePicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    if (ref.current) {
      if ('showPicker' in ref.current && typeof (ref.current as any).showPicker === 'function') {
        try {
          (ref.current as any).showPicker();
        } catch (err) {
          ref.current.click();
        }
      } else {
        ref.current.click();
      }
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  const { countReportRows, countReportTotalCount, countReportTotalCash } = useMemo(() => {
    const targetFrom = countTab === 'TODAY' ? todayStr : fromDate;
    const targetTo = countTab === 'TODAY' ? todayStr : toDate;

    const filtered = placedTickets.filter((tkt) => {
      if (selectedSlot !== 'ALL') {
        const slotPrefix = selectedSlot.split(' ')[0];
        if (!tkt.gameSlot.startsWith(slotPrefix) && !tkt.gameSlot.includes(selectedSlot)) {
          return false;
        }
      }
      const tktDate = tkt.placedAt?.split(' ')[0] || todayStr;
      if (tktDate < targetFrom || tktDate > targetTo) {
        return false;
      }
      return true;
    });

    let superCount = 0, superCash = 0;
    let boxCount = 0, boxCash = 0;
    let pairCount = 0, pairCash = 0;
    let singleCount = 0, singleCash = 0;

    filtered.forEach((tkt) => {
      tkt.items.forEach((item: any) => {
        const type = (item.type || '').toUpperCase();
        const cnt = Number(item.count || 0);
        const amt = Number(item.totalAmount || 0);

        if (type === 'SUPER' || type === 'DIRECT') {
          superCount += cnt;
          superCash += amt;
        } else if (type === 'BOX' || type === 'SHUFFLE') {
          boxCount += cnt;
          boxCash += amt;
        } else if (['AB', 'BC', 'AC', 'PAIR'].includes(type)) {
          pairCount += cnt;
          pairCash += amt;
        } else if (['A', 'B', 'C', 'POSITION'].includes(type)) {
          singleCount += cnt;
          singleCash += amt;
        }
      });
    });

    const rows = [
      {
        name: 'SUPER',
        count: superCount,
        rate: superCount > 0 ? (superCash / superCount).toFixed(1) : '-',
        cash: superCash,
      },
      {
        name: 'BOX',
        count: boxCount,
        rate: boxCount > 0 ? (boxCash / boxCount).toFixed(1) : '-',
        cash: boxCash,
      },
      {
        name: 'AB/BC/AC',
        count: pairCount,
        rate: pairCount > 0 ? (pairCash / pairCount).toFixed(1) : '-',
        cash: pairCash,
      },
      {
        name: 'A/B/C',
        count: singleCount,
        rate: singleCount > 0 ? (singleCash / singleCount).toFixed(1) : '-',
        cash: singleCash,
      },
    ];

    const totalCount = superCount + boxCount + pairCount + singleCount;
    const totalCash = superCash + boxCash + pairCash + singleCash;

    return { countReportRows: rows, countReportTotalCount: totalCount, countReportTotalCash: totalCash };
  }, [placedTickets, fromDate, toDate, selectedSlot, todayStr, countTab]);

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-28 sm:pb-36 antialiased select-none font-sans">
      {/* Header Banner */}
      <HeaderBanner title="TOTAL COUNT VIEW" showBack={true} />

      <div className="max-w-md mx-auto w-full px-6 sm:px-8 py-5 space-y-4.5">
        
        {/* Top Tab Bar: Today's Report vs Previous History */}
        <div className="bg-neutral-950 border border-neutral-800 p-1.5 rounded-2xl flex items-center gap-1.5 font-sans shadow-xl">
          <button
            type="button"
            onClick={() => setCountTab('TODAY')}
            className={`flex-1 py-2.5 px-2 sm:px-3 rounded-xl font-black text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              countTab === 'TODAY'
                ? 'bg-gold-metallic text-black shadow-md border border-gold-dark'
                : 'bg-black/40 text-neutral-300 border border-neutral-800/80 hover:text-white hover:border-neutral-700'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Today's Report</span>
          </button>

          <button
            type="button"
            onClick={() => setCountTab('PREVIOUS')}
            className={`flex-1 py-2.5 px-2 sm:px-3 rounded-xl font-black text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              countTab === 'PREVIOUS'
                ? 'bg-gold-metallic text-black shadow-md border border-gold-dark'
                : 'bg-black/40 text-neutral-300 border border-neutral-800/80 hover:text-white hover:border-neutral-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Previous History</span>
          </button>
        </div>

        {/* Input Form Box (Shown ONLY when Previous History tab is selected) */}
        {countTab === 'PREVIOUS' && (
          <div className="bg-[#0c0c0c] border border-neutral-800 p-3.5 sm:p-4 rounded-2xl shadow-xl space-y-3.5 font-sans animate-drop-in">
            {/* FROM DATE Input Row */}
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div
                  onClick={() => triggerDatePicker(fromDateRef)}
                  className="relative flex-1 bg-black border border-neutral-700 [@media(hover:hover)]:hover:border-gold/60 rounded-xl px-3.5 py-2 cursor-pointer group transition-all block overflow-hidden shadow-inner"
                >
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block pointer-events-none">
                    FROM DATE
                  </span>
                  <span className="text-white font-black text-xs sm:text-sm tracking-wide block mt-0.5 font-mono pointer-events-none">
                    {formatDateDisplay(fromDate)}
                  </span>
                  <input
                    ref={fromDateRef}
                    type="date"
                    value={fromDate}
                    onChange={(e) => e.target.value && setFromDate(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 full-date-input"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => triggerDatePicker(fromDateRef)}
                  className="relative bg-neutral-900 border border-neutral-700 [@media(hover:hover)]:hover:border-gold/80 px-3.5 py-3 rounded-xl text-[11px] sm:text-xs font-black uppercase text-white tracking-wider hover:bg-neutral-800 transition-all shrink-0 active:scale-95 shadow flex items-center justify-center select-none overflow-hidden cursor-pointer"
                >
                  <span>CHANGE</span>
                </button>
              </div>
            </div>

            {/* TO DATE Input Row */}
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div
                  onClick={() => triggerDatePicker(toDateRef)}
                  className="relative flex-1 bg-black border border-neutral-700 [@media(hover:hover)]:hover:border-gold/60 rounded-xl px-3.5 py-2 cursor-pointer group transition-all block overflow-hidden shadow-inner"
                >
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block pointer-events-none">
                    TO DATE
                  </span>
                  <span className="text-white font-black text-xs sm:text-sm tracking-wide block mt-0.5 font-mono pointer-events-none">
                    {formatDateDisplay(toDate)}
                  </span>
                  <input
                    ref={toDateRef}
                    type="date"
                    value={toDate}
                    onChange={(e) => e.target.value && setToDate(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 full-date-input"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => triggerDatePicker(toDateRef)}
                  className="relative bg-neutral-900 border border-neutral-700 [@media(hover:hover)]:hover:border-gold/80 px-3.5 py-3 rounded-xl text-[11px] sm:text-xs font-black uppercase text-white tracking-wider hover:bg-neutral-800 transition-all shrink-0 active:scale-95 shadow flex items-center justify-center select-none overflow-hidden cursor-pointer"
                >
                  <span>CHANGE</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Slot Selection Pills (ALL, 1 PM, 3 PM, 6 PM, 8 PM) */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 w-full pt-0.5 px-0.5">
          {(['ALL', '1 PM', '3 PM', '6 PM', '8 PM'] as const).map((opt) => {
            const isSelected = selectedSlot === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setSelectedSlot(opt)}
                className={`py-2 px-1 text-[11px] sm:text-xs font-black uppercase text-center rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gold-metallic text-black border-gold-dark shadow-md scale-[1.02]'
                    : 'bg-[#0c0c0c] text-white border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {/* SHOW REPORT Banner Button */}
        <div className="w-full flex justify-center py-1.5">
          <button
            type="button"
            onClick={() => {}}
            className="px-9 py-2.5 bg-gradient-to-b from-[#edd177] via-[#c89825] to-[#996e19] text-black font-black text-xs sm:text-sm tracking-wider uppercase rounded-xl shadow-xl cursor-pointer hover:brightness-110 active:scale-95 transition-all border border-gold-dark"
          >
            SHOW REPORT
          </button>
        </div>

        {/* Summary Table - Inset & Clean Borders */}
        <div className="w-full border-2 border-gold/70 rounded-2xl overflow-hidden bg-[#0c0c0c] text-white text-xs sm:text-sm font-bold shadow-[0_0_25px_rgba(184,137,40,0.15)] animate-drop-in font-mono">
          {/* Header Row */}
          <div className="grid grid-cols-4 bg-gradient-to-r from-neutral-900 via-[#3a2a07] to-neutral-900 border-b border-neutral-800 font-extrabold py-3 px-2 sm:px-3 text-center uppercase tracking-wider text-gold text-[11px] sm:text-xs shadow-inner">
            <span className="text-left pl-2">GAME</span>
            <span>COUNT</span>
            <span>RATE</span>
            <span>CASH</span>
          </div>

          {/* Data Rows */}
          <div className="divide-y divide-neutral-850">
            {countReportRows.map((row) => (
              <div key={row.name} className="grid grid-cols-4 py-3 px-2 sm:px-3 items-center text-center font-bold hover:bg-neutral-900/60 transition-colors">
                <span className="text-left font-black text-gold pl-2 tracking-wide text-xs">{row.name}</span>
                <span className="font-mono text-neutral-200 text-xs sm:text-sm">{row.count > 0 ? row.count : '-'}</span>
                <span className="font-mono text-neutral-200 text-xs sm:text-sm">{row.count > 0 ? (typeof row.rate === 'number' ? `₹${row.rate}` : row.rate) : '-'}</span>
                <span className="font-mono text-neutral-200 text-xs sm:text-sm">{row.cash > 0 ? `₹${row.cash.toFixed(0)}` : '-'}</span>
              </div>
            ))}
          </div>

          {/* Total Row */}
          <div className="grid grid-cols-4 py-3 px-2 sm:px-3 items-center text-center border-t-2 border-gold/50 bg-black font-black text-xs sm:text-sm">
            <span className="text-left pl-2 uppercase font-black text-rose-400">TOTAL</span>
            <span className="font-mono text-gold text-xs sm:text-sm">{countReportTotalCount > 0 ? countReportTotalCount : '-'}</span>
            <span className="font-mono text-neutral-500">-</span>
            <span className="font-mono text-gold text-xs sm:text-sm">{countReportTotalCash > 0 ? `₹${countReportTotalCash.toFixed(0)}` : '-'}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
