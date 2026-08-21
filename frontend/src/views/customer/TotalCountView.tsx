import React, { useState, useMemo, useRef } from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';
import { useApp } from '../../context/AppContext';
import { Download } from 'lucide-react';

interface CountRowItem {
  id: string;
  game: string;
  number: string;
  count: number;
  amount: number;
  slot?: string;
  date?: string;
}

export const TotalCountView: React.FC = () => {
  const { placedTickets, userTickets, setCurrentView } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState<string>(todayStr);
  const [toDate, setToDate] = useState<string>(todayStr);
  const [isFullView, setIsFullView] = useState<boolean>(false);
  const [slotFilter, setSlotFilter] = useState<'ALL' | '1 PM' | '3 PM' | '6 PM' | '8 PM'>('ALL');

  // Digit selection: 'ALL' | 'NONE' | '1' | '2' | '3'
  const [digitFilter, setDigitFilter] = useState<'ALL' | 'NONE' | '1' | '2' | '3'>('NONE');
  const [subOptionFilter, setSubOptionFilter] = useState<string>('NONE');
  const [searchNumber, setSearchNumber] = useState<string>('');

  const [showCountDetails, setShowCountDetails] = useState<boolean>(false);

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

  // Helper to match items against digit and sub-option filters
  const isItemMatch = (game: string, num: string, digitF: string, subF: string) => {
    const itemType = game.toUpperCase();
    const cleanNum = num.replace(/\D/g, '');
    const numLength = cleanNum.length;

    // 1. Digit Filter
    if (digitF === '1') {
      const isOneDigit = numLength === 1 || ['A', 'B', 'C'].includes(itemType);
      if (!isOneDigit) return false;
    } else if (digitF === '2') {
      const isTwoDigit = numLength === 2 || ['AB', 'BC', 'AC'].includes(itemType);
      if (!isTwoDigit) return false;
    } else if (digitF === '3') {
      const isThreeDigit = numLength === 3 || ['SUPER', 'BOX', 'DIRECT', 'SHUFFLE'].includes(itemType);
      if (!isThreeDigit) return false;
    }

    // 2. Sub Option Filter
    if (subF !== 'ALL' && subF !== 'NONE') {
      const sub = subF.toUpperCase();
      if (sub === 'SUPER' || sub === 'DIRECT') {
        if (itemType !== 'SUPER' && itemType !== 'DIRECT') return false;
      } else if (sub === 'BOX' || sub === 'SHUFFLE') {
        if (itemType !== 'BOX' && itemType !== 'SHUFFLE') return false;
      } else {
        if (itemType !== sub) return false;
      }
    }

    return true;
  };

  // Dataset generator: parses real added bills into game count entries
  const countDataset: CountRowItem[] = useMemo(() => {
    const map = new Map<string, CountRowItem>();
    const ticketSource = placedTickets.length > 0 ? placedTickets : userTickets;

    const matchedTickets = ticketSource.filter((t) => {
      let tDate = todayStr;
      if (t.placedAt) {
        if (t.placedAt.includes('T')) {
          tDate = t.placedAt.split('T')[0];
        } else if (t.placedAt.includes(' ')) {
          tDate = t.placedAt.split(' ')[0];
        } else {
          tDate = t.placedAt;
        }
      }
      return tDate >= fromDate && tDate <= toDate;
    });

    matchedTickets.forEach((t, tIdx) => {
      const ticketSlot = t.gameSlot || '8 PM';

      t.items.forEach((item, idx) => {
        let game = 'BOX';
        let num = item.number ? item.number.trim() : '';
        const typeStr = (item.type || '').toUpperCase();

        if (num.includes(':')) {
          const parts = num.split(':');
          if (parts.length === 2) {
            game = parts[0].toUpperCase();
            num = parts[1];
          }
        } else if (typeStr === 'DIRECT' || typeStr === 'SUPER') {
          game = 'SUPER';
        } else if (typeStr === 'SHUFFLE' || typeStr === 'BOX') {
          game = 'BOX';
        } else if (['AB', 'BC', 'AC'].includes(typeStr)) {
          game = typeStr;
        } else if (['A', 'B', 'C'].includes(typeStr)) {
          game = typeStr;
        } else if (num.length === 1) {
          game = 'A';
        } else if (num.length === 2) {
          game = 'AB';
        } else if (num.length === 3) {
          game = 'SUPER';
        }

        const key = `${game}_${num}_${ticketSlot}`;
        if (map.has(key)) {
          const existing = map.get(key)!;
          existing.count += item.count;
          existing.amount += item.totalAmount;
        } else {
          map.set(key, {
            id: `real_${t.id || tIdx}_${idx}`,
            game,
            number: num,
            count: item.count,
            amount: item.totalAmount,
            slot: ticketSlot,
            date: t.placedAt ? t.placedAt.split('T')[0] : todayStr,
          });
        }
      });
    });

    return Array.from(map.values());
  }, [placedTickets, userTickets, fromDate, toDate, todayStr]);

  // Filter dataset based on selected criteria
  const filteredCountDataset = useMemo(() => {
    return countDataset.filter((item) => {
      // Slot Filter
      if (slotFilter !== 'ALL') {
        const slotPrefix = slotFilter.split(' ')[0];
        if (!item.slot?.startsWith(slotPrefix) && !item.slot?.includes(slotFilter)) {
          return false;
        }
      }

      // Search Number Filter
      if (searchNumber.trim() !== '') {
        if (!item.number.includes(searchNumber.trim())) {
          return false;
        }
      }

      // Full View Digit & Sub Filter
      if (isFullView) {
        return isItemMatch(item.game, item.number, digitFilter, subOptionFilter);
      }

      return true;
    });
  }, [countDataset, slotFilter, isFullView, digitFilter, subOptionFilter, searchNumber]);

  const totalCount = useMemo(() => {
    return filteredCountDataset.reduce((sum, item) => sum + item.count, 0);
  }, [filteredCountDataset]);

  const totalAmount = useMemo(() => {
    return filteredCountDataset.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredCountDataset]);

  const handleShowReport = () => {
    setShowCountDetails(true);
  };

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-28 sm:pb-36 antialiased select-none font-sans">
      {/* Header Banner */}
      <HeaderBanner
        title="TOTAL COUNT VIEW"
        showBack={true}
        onBackClick={() => setCurrentView('USER_DRAWER')}
      />

      <div className="max-w-md mx-auto w-full px-5 sm:px-6 py-5 space-y-4">
        {/* Total Count Input Form Box (Matching Sales Report Layout) */}
        <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-2xl shadow-xl space-y-5 font-sans">
          
          {/* Single-Line FROM DATE & TO DATE Row */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* FROM DATE */}
            <div
              onClick={() => triggerDatePicker(fromDateRef)}
              className="relative flex-1 bg-black border border-neutral-700 [@media(hover:hover)]:hover:border-gold/60 rounded-xl px-3 sm:px-4 py-2 cursor-pointer group transition-all block overflow-hidden shadow-inner h-[44px] flex flex-col justify-center"
            >
              <span className="text-[9px] sm:text-[10px] font-black text-neutral-400 uppercase tracking-wider block pointer-events-none leading-none">
                FROM DATE
              </span>
              <span className="text-white font-black text-xs sm:text-sm tracking-wide block mt-0.5 font-mono pointer-events-none truncate">
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

            {/* TO DATE */}
            <div
              onClick={() => triggerDatePicker(toDateRef)}
              className="relative flex-1 bg-black border border-neutral-700 [@media(hover:hover)]:hover:border-gold/60 rounded-xl px-3 sm:px-4 py-2 cursor-pointer group transition-all block overflow-hidden shadow-inner h-[44px] flex flex-col justify-center"
            >
              <span className="text-[9px] sm:text-[10px] font-black text-neutral-400 uppercase tracking-wider block pointer-events-none leading-none">
                TO DATE
              </span>
              <span className="text-white font-black text-xs sm:text-sm tracking-wide block mt-0.5 font-mono pointer-events-none truncate">
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
          </div>

          {/* Full View Toggle Switch */}
          <div className="flex items-center justify-between pt-1 pb-1">
            <span className="text-xs sm:text-sm font-black text-neutral-300 tracking-wide">
              Full View
            </span>
            <button
              type="button"
              onClick={() => setIsFullView(!isFullView)}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 relative cursor-pointer ${
                isFullView ? 'bg-gold-metallic' : 'bg-neutral-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-black shadow-md transition-transform ${
                  isFullView ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Slot Filter Radio Options (All, 1 PM, 3 PM, 6 PM, 8 PM) */}
          <div className="pt-2 border-t border-neutral-900 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-1">
              {[
                { id: 'ALL', label: 'All' },
                { id: '1 PM', label: '1 PM' },
                { id: '3 PM', label: '3 PM' },
                { id: '6 PM', label: '6 PM' },
                { id: '8 PM', label: '8 PM' },
              ].map((opt) => {
                const isChecked = slotFilter === opt.id;
                return (
                  <label
                    key={opt.id}
                    onClick={() => setSlotFilter(opt.id as any)}
                    className="flex items-center gap-1.5 cursor-pointer group py-1 px-1 rounded-lg transition-all select-none"
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                        isChecked
                          ? 'border-gold bg-black'
                          : 'border-neutral-600 bg-black group-hover:border-neutral-400'
                      }`}
                    >
                      {isChecked && <div className="w-2 h-2 rounded-full bg-gold-metallic" />}
                    </div>
                    <span
                      className={`text-xs font-black tracking-wide ${
                        isChecked ? 'text-gold' : 'text-neutral-300'
                      }`}
                    >
                      {opt.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* FULL VIEW EXTRA OPTIONS (Digit selector, Sub-options, and Number Search Box) */}
          {isFullView && (
            <div className="pt-3 border-t border-neutral-900 space-y-3.5 animate-drop-in">
              {/* Row 1: Digit Count Selector (★, 1, 2, 3) */}
              <div className="space-y-1">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block text-center">
                  SELECT DIGIT TYPE
                </span>
                <div className="flex items-center justify-center gap-2.5">
                  {[
                    { id: 'ALL', label: '★' },
                    { id: '1', label: '1' },
                    { id: '2', label: '2' },
                    { id: '3', label: '3' },
                  ].map((item) => {
                    const isSelected =
                      digitFilter === 'ALL'
                        ? true
                        : digitFilter !== 'NONE' && digitFilter === item.id;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => {
                          if (item.id === 'ALL') {
                            if (digitFilter === 'ALL') {
                              setDigitFilter('NONE');
                              setSubOptionFilter('NONE');
                            } else {
                              setDigitFilter('ALL');
                              setSubOptionFilter('ALL');
                            }
                          } else {
                            if (digitFilter === item.id) {
                              setDigitFilter('NONE');
                              setSubOptionFilter('NONE');
                            } else {
                              setDigitFilter(item.id as any);
                              setSubOptionFilter('NONE');
                            }
                          }
                        }}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full font-black text-xs flex items-center justify-center transition-all cursor-pointer shadow border ${
                          isSelected
                            ? 'bg-neutral-800 text-white border-2 border-white scale-105 shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                            : 'bg-black text-neutral-300 border-neutral-700 hover:border-neutral-500'
                        }`}
                      >
                        <span className={item.label === '★' ? 'text-base sm:text-lg leading-none font-black' : ''}>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 2: Sub-options on Second Line */}
              <div className="flex items-center justify-center gap-1.5 pt-0.5 flex-nowrap overflow-x-auto">
                {digitFilter === '1' &&
                  [
                    { id: 'ALL', label: '★' },
                    { id: 'A', label: 'A' },
                    { id: 'B', label: 'B' },
                    { id: 'C', label: 'C' },
                  ].map((opt) => {
                    const isSelected =
                      subOptionFilter === 'ALL'
                        ? true
                        : subOptionFilter !== 'NONE' && subOptionFilter === opt.id;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => {
                          if (opt.id === 'ALL') {
                            setSubOptionFilter(subOptionFilter === 'ALL' ? 'NONE' : 'ALL');
                          } else {
                            setSubOptionFilter(subOptionFilter === opt.id ? 'NONE' : opt.id);
                          }
                        }}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full font-black text-xs flex items-center justify-center border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-800 text-white border-2 border-white scale-105 shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                            : 'bg-black border-neutral-700 text-neutral-300 hover:border-neutral-500'
                        }`}
                      >
                        <span className={opt.label === '★' ? 'text-base sm:text-lg leading-none font-black' : ''}>{opt.label}</span>
                      </button>
                    );
                  })}

                {digitFilter === '2' &&
                  [
                    { id: 'ALL', label: '★' },
                    { id: 'AB', label: 'AB' },
                    { id: 'AC', label: 'AC' },
                    { id: 'BC', label: 'BC' },
                  ].map((opt) => {
                    const isSelected =
                      subOptionFilter === 'ALL'
                        ? true
                        : subOptionFilter !== 'NONE' && subOptionFilter === opt.id;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => {
                          if (opt.id === 'ALL') {
                            setSubOptionFilter(subOptionFilter === 'ALL' ? 'NONE' : 'ALL');
                          } else {
                            setSubOptionFilter(subOptionFilter === opt.id ? 'NONE' : opt.id);
                          }
                        }}
                        className={`${
                          opt.id === 'ALL' ? 'w-7 h-7 sm:w-8 sm:h-8 rounded-full' : 'px-2.5 py-1 rounded-full text-[11px]'
                        } font-black flex items-center justify-center border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-800 text-white border-2 border-white scale-105 shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                            : 'bg-black text-neutral-300 border-neutral-700 hover:border-neutral-500'
                        }`}
                      >
                        <span className={opt.label === '★' ? 'text-base sm:text-lg leading-none font-black' : ''}>{opt.label}</span>
                      </button>
                    );
                  })}

                {digitFilter === '3' &&
                  [
                    { id: 'ALL', label: '★' },
                    { id: 'SUPER', label: 'SUPER' },
                    { id: 'BOX', label: 'BOX' },
                  ].map((opt) => {
                    const isSelected =
                      subOptionFilter === 'ALL'
                        ? true
                        : subOptionFilter !== 'NONE' && subOptionFilter === opt.id;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => {
                          if (opt.id === 'ALL') {
                            setSubOptionFilter(subOptionFilter === 'ALL' ? 'NONE' : 'ALL');
                          } else {
                            setSubOptionFilter(subOptionFilter === opt.id ? 'NONE' : opt.id);
                          }
                        }}
                        className={`${
                          opt.id === 'ALL' ? 'w-7 h-7 sm:w-8 sm:h-8 rounded-full' : 'px-2.5 py-1 rounded-full text-[10px] uppercase'
                        } font-black flex items-center justify-center border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-800 text-white border-2 border-white scale-105 shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                            : 'bg-black text-neutral-300 border-neutral-700 hover:border-neutral-500'
                        }`}
                      >
                        <span className={opt.label === '★' ? 'text-base sm:text-lg leading-none font-black' : ''}>{opt.label}</span>
                      </button>
                    );
                  })}

                {(digitFilter === 'ALL' || digitFilter === 'NONE') &&
                  [
                    { id: 'ALL', label: '★' },
                  ].map((opt) => {
                    const isSelected = subOptionFilter === 'ALL';
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setSubOptionFilter(subOptionFilter === 'ALL' ? 'NONE' : 'ALL')}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full font-black text-xs flex items-center justify-center border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-800 text-white border-2 border-white shadow-[0_0_10px_rgba(255,255,255,0.3)] scale-105'
                            : 'bg-black text-neutral-300 border-neutral-700 hover:border-neutral-500'
                        }`}
                      >
                        <span className="text-base sm:text-lg leading-none font-black">{opt.label}</span>
                      </button>
                    );
                  })}
              </div>

              {/* SEARCH BY NUMBER */}
              <div className="space-y-1">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                  SEARCH BY NUMBER
                </span>
                <div className="relative">
                  <input
                    type="text"
                    value={searchNumber}
                    onChange={(e) => setSearchNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="Number"
                    maxLength={4}
                    className="w-full bg-black border border-neutral-700 rounded-xl px-4 py-2 text-xs sm:text-sm font-mono font-black text-white focus:border-gold outline-none"
                  />
                  {searchNumber && (
                    <button
                      type="button"
                      onClick={() => setSearchNumber('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs font-bold p-1 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SHOW REPORT Action Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleShowReport}
              className="w-full py-3 bg-gradient-to-b from-[#edd177] via-[#c89825] to-[#996e19] text-black font-black text-xs sm:text-sm tracking-wider uppercase rounded-xl shadow-lg hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer"
            >
              SHOW REPORT
            </button>
          </div>
        </div>
      </div>

      {/* Full-Screen Overlay Window for Calculated Total Count Results */}
      {showCountDetails && (
        <div className="fixed inset-0 bg-black text-white z-50 flex flex-col justify-start overflow-y-auto animate-drop-in font-sans">
          {/* Header Banner */}
          <HeaderBanner
            title="TOTAL COUNT RESULT"
            showBack={true}
            onBackClick={() => setShowCountDetails(false)}
            onHomeClick={() => {
              setShowCountDetails(false);
              setCurrentView('GAME_DASHBOARD');
            }}
          />

          <div className="max-w-md mx-auto w-full px-4 sm:px-6 py-6 space-y-4">
            {/* Summary Banner Card */}
            <div className="border-2 border-gold/70 rounded-xl bg-black px-4 py-3 flex items-center justify-between shadow-[0_0_15px_rgba(212,175,55,0.15)] font-mono font-black text-xs sm:text-sm">
              <div className="flex items-center gap-6">
                <span className="text-gold">COUNT: <span className="text-white">{totalCount}</span></span>
                <span className="text-gold">TOT: <span className="text-white">₹{totalAmount.toFixed(1)}</span></span>
              </div>
              <button
                type="button"
                onClick={() => {}}
                className="p-1.5 rounded-lg border border-gold/50 text-gold hover:bg-gold/10 transition-all cursor-pointer"
                title="Download Report"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            {/* Data Table */}
            <div className="w-full border-2 border-gold/70 rounded-2xl overflow-hidden bg-[#0c0c0c] text-white text-xs font-bold shadow-[0_0_20px_rgba(212,175,55,0.15)] animate-drop-in font-mono">
              {/* Header Row */}
              <div className="grid grid-cols-5 bg-neutral-900 border-b-2 border-gold/70 font-extrabold py-3 px-2 text-center uppercase tracking-wider text-gold text-[11px]">
                <span>#</span>
                <span className="text-left">GAME</span>
                <span>NUM</span>
                <span>CNT</span>
                <span>AMT</span>
              </div>

              {/* Data Rows */}
              <div className="divide-y divide-gold/70 min-h-[220px] sm:min-h-[300px] max-h-[420px] sm:max-h-[500px] overflow-y-auto font-mono">
                {filteredCountDataset.length > 0 ? (
                  filteredCountDataset.map((row, idx) => (
                    <div key={row.id} className="grid grid-cols-5 py-2.5 px-2 items-center text-center font-bold hover:bg-neutral-900/60 transition-colors">
                      <span className="text-neutral-500 text-[11px]">{idx + 1}</span>
                      <span className="text-left font-black text-white text-xs">{row.game}</span>
                      <span className="font-mono text-white text-xs font-black">{row.number}</span>
                      <span className="font-mono text-neutral-200 text-xs">{row.count}</span>
                      <span className="font-mono text-neutral-200 text-xs">₹{row.amount}</span>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-neutral-400 font-sans text-xs">
                    No count records found
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
