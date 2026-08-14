import React, { useState, useMemo, useRef } from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';
import { useApp } from '../../context/AppContext';
import { RefreshCw, Download } from 'lucide-react';

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
  const { placedTickets } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedSlot, setSelectedSlot] = useState<'ALL' | '1 PM' | '3 PM' | '6 PM' | '8 PM'>('ALL');
  
  // Single DIGIT selection: 'ALL' | '1' | '2' | '3'
  const [digitFilter, setDigitFilter] = useState<'ALL' | '1' | '2' | '3'>('2');
  
  // Multi-select SUB options for the active digit ('ALL' or array like ['AB', 'BC', 'AC'])
  const [selectedSubOptions, setSelectedSubOptions] = useState<string[]>(['ALL']);
  
  const [searchNumber, setSearchNumber] = useState<string>('');

  const dateInputRef = useRef<HTMLInputElement>(null);

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

  // Compute available sub-options based on single selected digitFilter
  const subOptions = useMemo(() => {
    if (digitFilter === '1') {
      return [
        { id: 'ALL', label: '★' },
        { id: 'A', label: 'A' },
        { id: 'B', label: 'B' },
        { id: 'C', label: 'C' },
      ];
    }
    if (digitFilter === '2') {
      return [
        { id: 'ALL', label: '★' },
        { id: 'AB', label: 'AB' },
        { id: 'BC', label: 'BC' },
        { id: 'AC', label: 'AC' },
      ];
    }
    if (digitFilter === '3') {
      return [
        { id: 'ALL', label: '★' },
        { id: 'SUPER', label: 'SUPER' },
        { id: 'BOX', label: 'BOX' },
      ];
    }
    return [{ id: 'ALL', label: '★' }];
  }, [digitFilter]);

  // Handle single Digit selection change
  const handleDigitSelect = (digitId: 'ALL' | '1' | '2' | '3') => {
    setDigitFilter(digitId);
    setSelectedSubOptions(['ALL']);
  };

  // Toggle Sub Option Multi-select within the active digit category
  const toggleSubOption = (optId: string) => {
    if (optId === 'ALL') {
      setSelectedSubOptions(['ALL']);
      return;
    }

    let next = selectedSubOptions.filter((s) => s !== 'ALL');
    if (next.includes(optId)) {
      next = next.filter((s) => s !== optId);
    } else {
      next.push(optId);
    }

    if (next.length === 0) {
      setSelectedSubOptions(['ALL']);
    } else {
      setSelectedSubOptions(next);
    }
  };

  // Dataset generator: combines real placed tickets with realistic sample count entries
  const countDataset: CountRowItem[] = useMemo(() => {
    const map = new Map<string, CountRowItem>();

    // 1. First add real placed tickets for selected date
    const matchedTickets = placedTickets.filter((t) => {
      const ticketDate = t.placedAt?.split(' ')[0] || todayStr;
      return ticketDate === selectedDate;
    });

    matchedTickets.forEach((t, tIdx) => {
      const ticketSlot = t.gameSlot || '8 PM';

      t.items.forEach((item, idx) => {
        let game = 'BOX';
        let num = item.number;
        const typeStr = (item.type || '').toUpperCase();

        if (typeStr === 'DIRECT' || typeStr === 'SUPER') {
          game = 'SUPER';
        } else if (typeStr === 'SHUFFLE' || typeStr === 'BOX') {
          game = 'BOX';
        } else if (['AB', 'BC', 'AC', 'PAIR'].includes(typeStr)) {
          if (num.includes(':')) {
            const [pfx, n] = num.split(':');
            game = pfx.toUpperCase();
            num = n;
          } else if (num.length === 2) {
            game = 'AB';
          } else {
            game = 'A';
          }
        } else if (['A', 'B', 'C', 'POSITION'].includes(typeStr)) {
          if (num.includes(':')) {
            const [pfx, n] = num.split(':');
            game = pfx.toUpperCase();
            num = n;
          } else {
            game = 'A';
          }
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
            date: selectedDate,
          });
        }
      });
    });

    // 2. If no real tickets exist for selected date, provide a realistic demo dataset
    if (map.size === 0) {
      const demoData: CountRowItem[] = [
        // 3 Digit SUPER & BOX
        { id: 'demo_1', game: 'SUPER', number: '789', count: 12, amount: 120, slot: '8 PM', date: selectedDate },
        { id: 'demo_2', game: 'BOX', number: '789', count: 25, amount: 250, slot: '8 PM', date: selectedDate },
        { id: 'demo_3', game: 'SUPER', number: '123', count: 8, amount: 80, slot: '8 PM', date: selectedDate },
        { id: 'demo_4', game: 'BOX', number: '123', count: 18, amount: 180, slot: '8 PM', date: selectedDate },
        { id: 'demo_5', game: 'SUPER', number: '456', count: 15, amount: 150, slot: '6 PM', date: selectedDate },
        { id: 'demo_6', game: 'BOX', number: '456', count: 30, amount: 300, slot: '6 PM', date: selectedDate },
        { id: 'demo_7', game: 'SUPER', number: '007', count: 45, amount: 450, slot: '3 PM', date: selectedDate },
        { id: 'demo_8', game: 'BOX', number: '007', count: 60, amount: 600, slot: '3 PM', date: selectedDate },

        // 2 Digit AB, BC, AC
        { id: 'demo_9', game: 'AB', number: '78', count: 40, amount: 400, slot: '8 PM', date: selectedDate },
        { id: 'demo_10', game: 'BC', number: '89', count: 35, amount: 350, slot: '8 PM', date: selectedDate },
        { id: 'demo_11', game: 'AC', number: '79', count: 22, amount: 220, slot: '8 PM', date: selectedDate },
        { id: 'demo_12', game: 'AB', number: '12', count: 50, amount: 500, slot: '6 PM', date: selectedDate },
        { id: 'demo_13', game: 'BC', number: '23', count: 28, amount: 280, slot: '6 PM', date: selectedDate },
        { id: 'demo_14', game: 'AC', number: '13', count: 31, amount: 310, slot: '1 PM', date: selectedDate },

        // 1 Digit A, B, C
        { id: 'demo_15', game: 'A', number: '7', count: 85, amount: 850, slot: '8 PM', date: selectedDate },
        { id: 'demo_16', game: 'B', number: '8', count: 70, amount: 700, slot: '8 PM', date: selectedDate },
        { id: 'demo_17', game: 'C', number: '9', count: 95, amount: 950, slot: '8 PM', date: selectedDate },
        { id: 'demo_18', game: 'A', number: '1', count: 60, amount: 600, slot: '3 PM', date: selectedDate },
        { id: 'demo_19', game: 'B', number: '2', count: 48, amount: 480, slot: '3 PM', date: selectedDate },
        { id: 'demo_20', game: 'C', number: '3', count: 52, amount: 520, slot: '1 PM', date: selectedDate },
      ];

      demoData.forEach((item) => map.set(item.id, item));
    }

    return Array.from(map.values());
  }, [placedTickets, selectedDate, todayStr]);

  // Filter dataset based on selected criteria
  const filteredCountDataset = useMemo(() => {
    return countDataset.filter((item) => {
      // Slot Filter
      if (selectedSlot !== 'ALL') {
        const slotPrefix = selectedSlot.split(' ')[0];
        if (!item.slot?.startsWith(slotPrefix) && !item.slot?.includes(selectedSlot)) {
          return false;
        }
      }

      // Single Digit Filter
      if (digitFilter !== 'ALL') {
        if (digitFilter === '1' && item.number.length !== 1) return false;
        if (digitFilter === '2' && item.number.length !== 2) return false;
        if (digitFilter === '3' && item.number.length !== 3) return false;
      }

      // Multi-Select Sub Option Filter within active Digit
      if (!selectedSubOptions.includes('ALL')) {
        if (!selectedSubOptions.includes(item.game)) {
          return false;
        }
      }

      // Search Number Filter
      if (searchNumber.trim() !== '') {
        if (!item.number.includes(searchNumber.trim())) {
          return false;
        }
      }

      return true;
    });
  }, [countDataset, selectedSlot, digitFilter, selectedSubOptions, searchNumber]);

  const totalCount = useMemo(() => {
    return filteredCountDataset.reduce((sum, item) => sum + item.count, 0);
  }, [filteredCountDataset]);

  const totalAmount = useMemo(() => {
    return filteredCountDataset.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredCountDataset]);

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-28 sm:pb-36 antialiased select-none font-sans">
      {/* Header Banner */}
      <HeaderBanner title="TOTAL COUNT VIEW" showBack={true} />

      <div className="max-w-md mx-auto w-full px-6 sm:px-8 py-5 space-y-4">
        
        {/* Form Controls Box */}
        <div className="bg-neutral-950 border border-neutral-800 p-4 sm:p-5 rounded-2xl shadow-xl space-y-4 font-sans">
          
          {/* Row 1: DIGIT Selector (Single Select: ★, 1, 2, 3) */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] sm:text-xs font-black text-neutral-300 uppercase tracking-wider w-12 shrink-0">
              DIGIT:
            </span>
            <div className="flex items-center gap-2.5">
              {[
                { id: 'ALL', label: '★' },
                { id: '1', label: '1' },
                { id: '2', label: '2' },
                { id: '3', label: '3' },
              ].map((item) => {
                const isSelected = digitFilter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleDigitSelect(item.id as any)}
                    className={`w-9 h-9 rounded-full font-black text-xs transition-all cursor-pointer border flex items-center justify-center ${
                      isSelected
                        ? 'bg-neutral-800 text-white border-2 border-white scale-105 shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                        : 'bg-black text-neutral-400 border-neutral-700 hover:border-neutral-500'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: SUB Selector (Multi-Select Enabled) */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] sm:text-xs font-black text-neutral-300 uppercase tracking-wider w-12 shrink-0">
              SUB:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {subOptions.map((opt) => {
                const isSelected = selectedSubOptions.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleSubOption(opt.id)}
                    className={`px-3 h-8 rounded-full min-w-[32px] font-black text-xs transition-all cursor-pointer border flex items-center justify-center ${
                      isSelected
                        ? 'bg-neutral-800 text-white border-2 border-white scale-105 shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                        : 'bg-black text-neutral-400 border-neutral-700 hover:border-neutral-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: SEARCH BY NUMBER */}
          <div className="space-y-1">
            <span className="text-[10px] sm:text-xs font-black text-neutral-300 uppercase tracking-wider block">
              SEARCH BY NUMBER
            </span>
            <div className="relative">
              <input
                type="text"
                value={searchNumber}
                onChange={(e) => setSearchNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Number"
                maxLength={3}
                className="w-full bg-black border-2 border-white focus:border-gold text-white font-mono font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl placeholder:text-neutral-400 outline-none transition-all shadow-inner"
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

          {/* Row 4: DATE Selection with CHANGE Button */}
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div
                onClick={() => triggerDatePicker(dateInputRef)}
                className="relative flex-1 bg-black border border-neutral-700 [@media(hover:hover)]:hover:border-gold/60 rounded-xl px-3.5 py-2 cursor-pointer group transition-all block overflow-hidden shadow-inner"
              >
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block pointer-events-none">
                  DATE
                </span>
                <span className="text-white font-black text-xs sm:text-sm tracking-wide block mt-0.5 font-mono pointer-events-none">
                  {formatDateDisplay(selectedDate)}
                </span>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={selectedDate}
                  onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 full-date-input"
                />
              </div>

              <button
                type="button"
                onClick={() => triggerDatePicker(dateInputRef)}
                className="relative bg-neutral-900 border border-neutral-700 [@media(hover:hover)]:hover:border-gold/80 px-4 py-3 rounded-xl text-xs font-black uppercase text-white tracking-wider hover:bg-neutral-800 transition-all shrink-0 active:scale-95 shadow flex items-center justify-center select-none overflow-hidden cursor-pointer"
              >
                <span>CHANGE</span>
              </button>
            </div>
          </div>

          {/* Row 5: CALCULATE Action Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {}}
              className="w-full py-3 px-4 bg-gold-metallic hover:brightness-110 active:scale-[0.98] text-black font-black text-xs sm:text-sm tracking-wider uppercase rounded-xl shadow-lg border border-gold-dark flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 stroke-[2.5]" />
              <span>CALCULATE</span>
            </button>
          </div>

          {/* Row 6: Game Slot Filter Radio Options */}
          <div className="pt-2 border-t border-neutral-900">
            <div className="flex flex-wrap items-center justify-between gap-1">
              {[
                { id: 'ALL', label: 'All' },
                { id: '1 PM', label: '1 PM' },
                { id: '3 PM', label: '3 PM' },
                { id: '6 PM', label: '6 PM' },
                { id: '8 PM', label: '8 PM' },
              ].map((opt) => {
                const isChecked = selectedSlot === opt.id;
                return (
                  <label
                    key={opt.id}
                    onClick={() => setSelectedSlot(opt.id as any)}
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

        </div>

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
        <div className="w-full border border-neutral-800 rounded-2xl overflow-hidden bg-[#0c0c0c] text-white text-xs font-bold shadow-xl animate-drop-in font-mono">
          {/* Header Row */}
          <div className="grid grid-cols-5 bg-neutral-900 border-b border-neutral-800 font-extrabold py-3 px-2 text-center uppercase tracking-wider text-gold text-[11px]">
            <span>#</span>
            <span className="text-left">GAME</span>
            <span>NUM</span>
            <span>CNT</span>
            <span>AMT</span>
          </div>

          {/* Data Rows */}
          <div className="divide-y divide-neutral-850 max-h-72 overflow-y-auto">
            {filteredCountDataset.length > 0 ? (
              filteredCountDataset.map((row, idx) => (
                <div key={row.id} className="grid grid-cols-5 py-2.5 px-2 items-center text-center font-bold hover:bg-neutral-900/60 transition-colors">
                  <span className="text-neutral-500 text-[11px]">{idx + 1}</span>
                  <span className="text-left font-black text-gold text-xs">{row.game}</span>
                  <span className="font-mono text-white text-xs font-black">{row.number}</span>
                  <span className="font-mono text-neutral-200 text-xs">{row.count}</span>
                  <span className="font-mono text-neutral-200 text-xs">₹{row.amount}</span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-neutral-400 font-sans text-xs">
                No count records match the selected filters.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
