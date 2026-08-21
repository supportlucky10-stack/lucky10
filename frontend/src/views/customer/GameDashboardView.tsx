import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Menu, CheckSquare, CheckCircle2, ChevronDown, Copy, Check } from 'lucide-react';
import type { GameSlot } from '../../types';

interface SlotTheme {
  name: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  cardBorder: string;
  cardShadow: string;
  buttonGradient: string;
  buttonText: string;
  buttonBorder: string;
  activeTabBg: string;
  activeTabText: string;
  activeTabBorder: string;
  inactiveTabText: string;
  inactiveTabBorder: string;
  menuIconText: string;
  saveBtnBg: string;
  saveBtnText: string;
}

const slotThemes: Record<string, SlotTheme> = {
  '1 PM Game': {
    name: '1 PM Game',
    badgeBg: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500',
    badgeText: 'text-white',
    badgeBorder: 'border-sky-300',
    cardBorder: 'border-sky-500/80',
    cardShadow: 'shadow-[0_0_20px_rgba(59,130,246,0.35)]',
    buttonGradient: 'bg-gradient-to-b from-blue-500 via-blue-600 to-indigo-700 hover:from-blue-400 hover:to-indigo-600',
    buttonText: 'text-white',
    buttonBorder: 'border-sky-300',
    activeTabBg: 'bg-gradient-to-r from-blue-600 to-indigo-600',
    activeTabText: 'text-white',
    activeTabBorder: 'border-sky-400',
    inactiveTabText: 'text-sky-300',
    inactiveTabBorder: 'border-sky-500/50',
    menuIconText: 'text-sky-300',
    saveBtnBg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
    saveBtnText: 'text-white border border-sky-300',
  },
  '3 PM Game': {
    name: '3 PM Game',
    badgeBg: 'bg-gradient-to-r from-[#9a3412] via-[#7c2d12] to-[#5a1e06]',
    badgeText: 'text-white',
    badgeBorder: 'border-orange-400/60',
    cardBorder: 'border-[#9a3412]/80',
    cardShadow: 'shadow-[0_0_15px_rgba(154,52,18,0.3)]',
    buttonGradient: 'bg-gradient-to-b from-[#9a3412] via-[#7c2d12] to-[#431407] hover:from-[#b45309] hover:to-[#5a1e06]',
    buttonText: 'text-white',
    buttonBorder: 'border-orange-400/50',
    activeTabBg: 'bg-gradient-to-r from-[#9a3412] to-[#7c2d12]',
    activeTabText: 'text-white',
    activeTabBorder: 'border-orange-400/70',
    inactiveTabText: 'text-orange-200/80',
    inactiveTabBorder: 'border-orange-600/40',
    menuIconText: 'text-orange-300',
    saveBtnBg: 'bg-gradient-to-r from-[#9a3412] to-[#7c2d12]',
    saveBtnText: 'text-white border border-orange-400/60',
  },
  '6 PM Game': {
    name: '6 PM Game',
    badgeBg: 'bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600',
    badgeText: 'text-white',
    badgeBorder: 'border-fuchsia-300',
    cardBorder: 'border-fuchsia-500/80',
    cardShadow: 'shadow-[0_0_20px_rgba(217,70,239,0.35)]',
    buttonGradient: 'bg-gradient-to-b from-fuchsia-500 via-pink-600 to-rose-700 hover:from-fuchsia-400 hover:to-rose-600',
    buttonText: 'text-white',
    buttonBorder: 'border-fuchsia-300',
    activeTabBg: 'bg-gradient-to-r from-fuchsia-600 to-rose-600',
    activeTabText: 'text-white',
    activeTabBorder: 'border-fuchsia-400',
    inactiveTabText: 'text-fuchsia-300',
    inactiveTabBorder: 'border-fuchsia-500/50',
    menuIconText: 'text-fuchsia-300',
    saveBtnBg: 'bg-gradient-to-r from-fuchsia-500 to-rose-600',
    saveBtnText: 'text-white border border-fuchsia-300',
  },
  '8 PM Game': {
    name: '8 PM Game',
    badgeBg: 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600',
    badgeText: 'text-black',
    badgeBorder: 'border-teal-300',
    cardBorder: 'border-teal-400/80',
    cardShadow: 'shadow-[0_0_20px_rgba(20,184,166,0.35)]',
    buttonGradient: 'bg-gradient-to-b from-emerald-400 via-teal-500 to-cyan-700 hover:from-emerald-300 hover:to-cyan-600',
    buttonText: 'text-black',
    buttonBorder: 'border-teal-200',
    activeTabBg: 'bg-gradient-to-r from-emerald-400 to-cyan-600',
    activeTabText: 'text-black',
    activeTabBorder: 'border-teal-300',
    inactiveTabText: 'text-teal-300',
    inactiveTabBorder: 'border-teal-500/50',
    menuIconText: 'text-teal-300',
    saveBtnBg: 'bg-gradient-to-r from-emerald-400 to-cyan-600',
    saveBtnText: 'text-black border border-teal-200',
  },
};

export const GameDashboardView: React.FC = () => {
  const {
    activeGameSlot,
    setActiveGameSlot,
    betSlip,
    addToBetSlip,
    removeFromBetSlip,
    clearBetSlip,
    saveTicket,
    setCurrentView,
    addToast,
  } = useApp();

  const [isSlotDropdownOpen, setIsSlotDropdownOpen] = useState(false);

  const theme = slotThemes[activeGameSlot] || slotThemes['3 PM Game'];

  // Mode Selection State: 1 (1 Digit), 2 (2 Digit), 3 (3 Digit) - Default to 3
  const [activeMode, setActiveMode] = useState<1 | 2 | 3>(3);
  const [customerName, setCustomerName] = useState('');
  const [isReverse, setIsReverse] = useState(false); // Checkbox 'R' (Range Mode)
  const [isSet, setIsSet] = useState(false);
  const [savedBillId, setSavedBillId] = useState<string | null>(null);
  const [copiedSavedBill, setCopiedSavedBill] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Common Input State
  const [inputNum, setInputNum] = useState('');
  const [inputCount, setInputCount] = useState('');
  const [boxCount, setBoxCount] = useState('');

  // Range Mode Inputs (Start, End, Step)
  const [startRange, setStartRange] = useState('');
  const [endRange, setEndRange] = useState('');
  const [stepVal, setStepVal] = useState('');

  // Input References for auto-advancing cursor
  const countInputRef = useRef<HTMLInputElement>(null);
  const endRangeRef = useRef<HTMLInputElement>(null);
  const stepValRef = useRef<HTMLInputElement>(null);

  const unitPrice = 10; // ₹10 per count

  // Clear unsaved generated draft numbers if user navigates to another page/section without saving
  useEffect(() => {
    return () => {
      clearBetSlip();
    };
  }, []);

  // Helper to generate range numbers (supports single number when End is empty)
  const getRangeNumbers = (padLength: number): string[] => {
    const sStr = startRange.trim() !== '' ? startRange : inputNum;
    const eStr = endRange.trim() !== '' ? endRange : sStr;
    const s = parseInt(sStr);
    const e = parseInt(eStr);
    const step = parseInt(stepVal) || 1;
    if (isNaN(s) || isNaN(e) || s > e || step <= 0) return [];
    const list: string[] = [];
    for (let i = s; i <= e; i += step) {
      list.push(String(i).padStart(padLength, '0'));
    }
    return list;
  };

  // Rotational Permutation Generator for Set Mode (e.g. 314 -> 314, 341, 134, 143, 431, 413)
  const getPermutations = (str: string): string[] => {
    if (str.length <= 1) return [str];
    const results = new Set<string>();
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const remaining = str.slice(0, i) + str.slice(i + 1);
      for (const subPerm of getPermutations(remaining)) {
        results.add(char + subPerm);
      }
    }
    return Array.from(results);
  };

  // Mode 1 Handlers (A, B, C, ALL) - Minimum 5 count required, ₹12 per count
  const handleMode1Add = (pos: 'A' | 'B' | 'C' | 'ALL') => {
    const cnt = parseInt(inputCount);
    if (!cnt || cnt < 5) {
      addToast('Minimum 5 count is required for 1-digit game', 'error');
      return;
    }

    const targetNums = isReverse ? getRangeNumbers(1) : [inputNum.trim()];
    if (targetNums.length === 0 || targetNums.some((n) => n.length !== 1 || isNaN(Number(n)))) {
      addToast('Please enter a valid 1-digit number or range', 'error');
      return;
    }

    const unitPrice1Digit = 12; // ₹12 per count for 1-digit game
    const currentPlayMode = isReverse ? 'R' : 'DIRECT';

    const positions = pos === 'ALL' ? ['A', 'B', 'C'] : [pos];
    targetNums.forEach((n) => {
      positions.forEach((p) => {
        addToBetSlip({
          number: `${p}:${n}`,
          count: cnt,
          type: 'Pair',
          playMode: currentPlayMode,
          unitPrice: unitPrice1Digit,
          totalAmount: cnt * unitPrice1Digit,
        });
      });
    });

    addToast(`Added Mode 1 (${pos}) bets for ${targetNums.length} item(s)`, 'success');
    setInputNum('');
    setStartRange('');
    setEndRange('');
    setStepVal('');
    setInputCount('');
  };

  // Mode 2 Handlers (AB, AC, BC, ALL)
  const handleMode2Add = (pair: 'AB' | 'AC' | 'BC' | 'ALL') => {
    const cnt = parseInt(inputCount);
    if (!cnt || cnt < 1) {
      addToast('Please enter a valid count', 'error');
      return;
    }

    const targetNums = isReverse ? getRangeNumbers(2) : [inputNum.trim()];
    if (targetNums.length === 0 || targetNums.some((n) => n.length !== 2 || isNaN(Number(n)))) {
      addToast('Please enter a valid 2-digit number or range', 'error');
      return;
    }

    const currentPlayMode = isReverse ? 'R' : 'DIRECT';
    const pairs = pair === 'ALL' ? ['AB', 'AC', 'BC'] : [pair];
    targetNums.forEach((n) => {
      pairs.forEach((pr) => {
        addToBetSlip({
          number: `${pr}:${n}`,
          count: cnt,
          type: 'Pair',
          playMode: currentPlayMode,
          unitPrice,
          totalAmount: cnt * unitPrice,
        });
      });
    });

    addToast(`Added Mode 2 (${pair}) bets for ${targetNums.length} item(s)`, 'success');
    setInputNum('');
    setStartRange('');
    setEndRange('');
    setStepVal('');
    setInputCount('');
  };

  // Mode 3 Handlers (BOTH, BOX, SUPER) with Set Rotational Permutations
  const handleMode3Add = (modeType: 'BOTH' | 'BOX' | 'SUPER') => {
    let targetNums = isReverse ? getRangeNumbers(3) : [inputNum.trim()];
    if (targetNums.length === 0 || targetNums.some((n) => n.length !== 3 || isNaN(Number(n)))) {
      addToast('Please enter a valid 3-digit number or range (000-999)', 'error');
      return;
    }

    const cDirect = parseInt(inputCount) || 0;
    const cBox = parseInt(boxCount) || 0;

    let directCnt = 0;
    let boxAmt = 0;

    if (modeType === 'BOTH') {
      directCnt = cDirect > 0 ? cDirect : (cBox > 0 ? cBox : 0);
      boxAmt = cBox > 0 ? cBox : (cDirect > 0 ? cDirect : 0);
      if (directCnt < 1 && boxAmt < 1) {
        addToast('Please enter a valid count or box count', 'error');
        return;
      }
    } else if (modeType === 'BOX') {
      boxAmt = cBox > 0 ? cBox : (cDirect > 0 ? cDirect : 0);
      if (boxAmt < 1) {
        addToast('Please enter a valid count or box count', 'error');
        return;
      }
    } else if (modeType === 'SUPER') {
      directCnt = cDirect > 0 ? cDirect : (cBox > 0 ? cBox : 0);
      if (directCnt < 1) {
        addToast('Please enter a valid count', 'error');
        return;
      }
    }

    const currentPlayMode = isSet ? 'SET' : (isReverse ? 'R' : 'DIRECT');

    // Expand into rotational permutations if Set is checked
    if (isSet) {
      const setPerms = new Set<string>();
      targetNums.forEach((n) => {
        getPermutations(n).forEach((p) => setPerms.add(p));
      });
      targetNums = Array.from(setPerms);
    }

    targetNums.forEach((numStr) => {
      if (modeType === 'BOTH') {
        if (directCnt > 0) {
          addToBetSlip({
            number: numStr,
            count: directCnt,
            type: 'Direct',
            playMode: currentPlayMode,
            unitPrice,
            totalAmount: directCnt * unitPrice,
          });
        }
        if (boxAmt > 0) {
          addToBetSlip({
            number: numStr,
            count: boxAmt,
            type: 'Shuffle',
            playMode: currentPlayMode,
            unitPrice,
            totalAmount: boxAmt * unitPrice,
          });
        }
      } else if (modeType === 'BOX') {
        addToBetSlip({
          number: numStr,
          count: boxAmt,
          type: 'Shuffle',
          playMode: currentPlayMode,
          unitPrice,
          totalAmount: boxAmt * unitPrice,
        });
      } else if (modeType === 'SUPER') {
        addToBetSlip({
          number: numStr,
          count: directCnt,
          type: 'Direct',
          playMode: currentPlayMode,
          unitPrice,
          totalAmount: directCnt * unitPrice,
        });
      }
    });

    addToast(`Added Mode 3 (${modeType}) bets for ${targetNums.length} item(s)`, 'success');
    setInputNum('');
    setStartRange('');
    setEndRange('');
    setStepVal('');
    setInputCount('');
    setBoxCount('');
  };

  const totalCount = betSlip.reduce((sum, item) => sum + item.count, 0);
  const totalAmount = betSlip.reduce((sum, item) => sum + item.totalAmount, 0);

  return (
    <div className="w-full h-screen min-h-[100dvh] max-h-screen bg-black text-white flex flex-col justify-start overflow-hidden antialiased select-none font-sans">
      {/* Top Header Bar */}
      <div
        className="w-full bg-neutral-950 px-3 sm:px-8 pb-2.5 border-b border-neutral-900 flex items-center justify-between shadow-md shrink-0"
        style={{ paddingTop: 'max(10px, env(safe-area-inset-top, 0px))' }}
      >
        {/* Left: Drawer Menu Toggle Icon Button */}
        <button
          onClick={() => setCurrentView('USER_DRAWER')}
          className={`p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 transition-colors border border-neutral-800 ${theme.menuIconText} cursor-pointer`}
          title="Open Menu"
        >
          <Menu className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
        </button>

        {/* Right: SAVE Button */}
        <button
          disabled={isSaving || betSlip.length === 0}
          onClick={async () => {
            if (isSaving || betSlip.length === 0) return;
            setIsSaving(true);
            try {
              const billId = await saveTicket(customerName);
              if (billId) {
                setSavedBillId(billId);
                setCustomerName('');
              }
            } finally {
              setIsSaving(false);
            }
          }}
          className={`px-5 py-1.5 ${theme.saveBtnBg} ${theme.saveBtnText} font-black text-xs sm:text-sm tracking-wider rounded-lg shadow uppercase transition-all tracking-wider ${
            isSaving || betSlip.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-95 active:scale-95 cursor-pointer'
          }`}
        >
          {isSaving ? 'SAVING...' : 'SAVE'}
        </button>
      </div>

      {/* Sub-Header Ribbon: Interactive Game Slot Switcher Dropdown */}
      <div className="w-full px-3 sm:px-8 py-1.5 bg-neutral-950/80 border-b border-neutral-900 flex items-center justify-start text-xs sm:text-sm select-none relative z-30 shrink-0">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsSlotDropdownOpen(!isSlotDropdownOpen)}
            className={`px-3.5 py-1 ${theme.badgeBg} ${theme.badgeText} font-black text-xs sm:text-sm rounded-lg border ${theme.badgeBorder} shadow flex items-center justify-between gap-2 cursor-pointer transition-all hover:brightness-110 active:scale-95`}
          >
            <span>{activeGameSlot}</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSlotDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Slot Selector Dropdown Menu (1PM, 3PM, 6PM, 8PM) */}
          {isSlotDropdownOpen && (
            <div className="absolute left-0 top-9 w-44 p-1.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1 shadow-2xl animate-drop-in z-50">
              {(['1 PM Game', '3 PM Game', '6 PM Game', '8 PM Game'] as GameSlot[]).map((slot) => {
                const slotTheme = slotThemes[slot];
                const isSelected = slot === activeGameSlot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => {
                      setActiveGameSlot(slot);
                      setIsSlotDropdownOpen(false);
                      addToast(`Switched to ${slot}`, 'info');
                    }}
                    className={`w-full py-2 px-3 rounded-lg font-black text-xs uppercase tracking-wide flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? `${slotTheme.badgeBg} ${slotTheme.badgeText} border ${slotTheme.badgeBorder}`
                        : 'bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <span>{slot}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Layout Flow */}
      <div className="w-full px-3 sm:px-8 py-3 max-w-4xl mx-auto flex-1 flex flex-col min-h-0 space-y-3 sm:space-y-4 overflow-hidden">
        
        {/* TABBED GAME ENTRY CARD */}
        <div className={`bg-neutral-950 text-white rounded-2xl p-3 sm:p-4 ${theme.cardBorder} ${theme.cardShadow} border-2 space-y-3 transition-all shrink-0`}>
          
          {/* Header Row inside Entry Card: Mode Tabs, Customer Box, R & Set Checkboxes */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-900 pb-2.5">
            
            {/* Mode Selector Tabs (1, 2, 3) */}
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    const newMode = m as 1 | 2 | 3;
                    setActiveMode(newMode);
                    setIsReverse(false);
                    setIsSet(false);
                    setInputNum('');
                    setStartRange('');
                    setEndRange('');
                    setStepVal('');
                    setInputCount('');
                    setBoxCount('');
                  }}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-black text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer ${
                    activeMode === m
                      ? `${theme.activeTabBg} ${theme.activeTabText} border ${theme.activeTabBorder} shadow-md font-black`
                      : `bg-black ${theme.inactiveTabText} border ${theme.inactiveTabBorder} font-bold`
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Customer Name Box */}
            <div className="flex-1 min-w-[90px]">
              <input
                type="text"
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-2.5 py-1 bg-white text-black font-bold text-xs rounded-lg placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-400 shadow-inner"
              />
            </div>

            {/* Checkboxes: R (Range Mode) for 1, 2, 3 Digit & Set (Only for 3 Digit Mode) */}
            <div className="flex items-center gap-2 pl-1">
              <label className={`flex items-center gap-1 text-xs font-black ${isReverse ? 'text-amber-400' : theme.inactiveTabText} cursor-pointer select-none`}>
                <input
                  type="checkbox"
                  checked={isReverse}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setIsReverse(true);
                      setIsSet(false);
                    } else {
                      setIsReverse(false);
                    }
                  }}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                <span>R</span>
              </label>

              {activeMode === 3 && (
                <label className={`flex items-center gap-1 text-xs font-black ${isSet ? 'text-amber-400' : theme.inactiveTabText} cursor-pointer select-none`}>
                  <input
                    type="checkbox"
                    checked={isSet}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setIsSet(true);
                        setIsReverse(false);
                      } else {
                        setIsSet(false);
                      }
                    }}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <span>Set</span>
                </label>
              )}
            </div>
          </div>

            {isReverse ? (
              /* Range Mode (4 inputs for Mode 1 & 2: Start, End, Step, Count; 5 inputs for Mode 3: + Box Count) */
              <div className={`grid ${activeMode === 3 ? 'grid-cols-5' : 'grid-cols-4'} gap-1 sm:gap-2`}>
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    maxLength={activeMode}
                    placeholder="Start"
                    value={startRange}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStartRange(val);
                      if (val.length === activeMode) {
                        endRangeRef.current?.focus();
                      }
                    }}
                    className="w-full h-10 sm:h-11 px-0.5 bg-white text-black font-extrabold text-[10px] sm:text-sm rounded-xl placeholder-gray-500 placeholder:text-[10px] sm:placeholder:text-xs text-center focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
                  />
                </div>

                <div>
                  <input
                    ref={endRangeRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    maxLength={activeMode}
                    placeholder="End"
                    value={endRange}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEndRange(val);
                      if (val.length === activeMode) {
                        stepValRef.current?.focus();
                      }
                    }}
                    className="w-full h-10 sm:h-11 px-0.5 bg-white text-black font-extrabold text-[10px] sm:text-sm rounded-xl placeholder-gray-500 placeholder:text-[10px] sm:placeholder:text-xs text-center focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
                  />
                </div>

                <div>
                  <input
                    ref={stepValRef}
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    placeholder="Step"
                    value={stepVal}
                    onChange={(e) => setStepVal(e.target.value)}
                    className="w-full h-10 sm:h-11 px-0.5 bg-white text-black font-extrabold text-[10px] sm:text-sm rounded-xl placeholder-gray-500 placeholder:text-[10px] sm:placeholder:text-xs text-center focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
                  />
                </div>

                <div>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    placeholder="Count"
                    value={inputCount}
                    onChange={(e) => setInputCount(e.target.value)}
                    className="w-full h-10 sm:h-11 px-0.5 bg-white text-black font-extrabold text-[10px] sm:text-sm rounded-xl placeholder-gray-500 placeholder:text-[10px] sm:placeholder:text-xs text-center focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
                  />
                </div>

                {activeMode === 3 && (
                  <div>
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      placeholder="Box Count"
                      value={boxCount}
                      onChange={(e) => setBoxCount(e.target.value)}
                      className="w-full h-10 sm:h-11 px-0.5 bg-white text-black font-extrabold text-[9px] sm:text-xs rounded-xl placeholder-gray-500 placeholder:text-[9px] sm:placeholder:text-xs text-center focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner leading-none"
                    />
                  </div>
                )}
              </div>
            ) : (
              /* Normal Mode (3 inputs: Number, Count, Box Count) matching Photo 1 */
              <div className="grid grid-cols-12 gap-2 sm:gap-3">
                <div className={activeMode === 3 ? 'col-span-4' : 'col-span-6'}>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    maxLength={activeMode}
                    placeholder="Number"
                    value={inputNum}
                    onChange={(e) => {
                      const val = e.target.value;
                      setInputNum(val);
                      if (val.length === activeMode) {
                        countInputRef.current?.focus();
                      }
                    }}
                    className="w-full h-10 sm:h-11 px-2 bg-white text-black font-extrabold text-xs sm:text-sm rounded-xl placeholder-gray-500 text-center focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
                  />
                </div>

                <div className={activeMode === 3 ? 'col-span-4' : 'col-span-6'}>
                  <input
                    ref={countInputRef}
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    placeholder="Count"
                    value={inputCount}
                    onChange={(e) => setInputCount(e.target.value)}
                    className="w-full h-10 sm:h-11 px-2 bg-white text-black font-extrabold text-xs sm:text-sm rounded-xl placeholder-gray-500 text-center focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
                  />
                </div>

                {activeMode === 3 && (
                  <div className="col-span-4">
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      placeholder="Box Count"
                      value={boxCount}
                      onChange={(e) => setBoxCount(e.target.value)}
                      className="w-full h-10 sm:h-11 px-1 bg-white text-black font-extrabold text-[11px] sm:text-xs rounded-xl placeholder-gray-500 placeholder:text-[10px] sm:placeholder:text-xs text-center focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner leading-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons Row matching selected Mode - Dynamic Slot Colors */}
            <div>
              {activeMode === 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {(['A', 'B', 'C'] as const).map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => handleMode1Add(pos)}
                      className="w-full h-10 sm:h-11 bg-gradient-to-b from-[#475569] via-[#334155] to-[#1e293b] text-white font-black text-xs sm:text-sm rounded-xl shadow-md hover:brightness-115 active:scale-95 transition-all uppercase tracking-wide border-2 border-[#94a3b8] cursor-pointer flex items-center justify-center [touch-action:manipulation] [-webkit-tap-highlight-color:transparent]"
                    >
                      {pos}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleMode1Add('ALL')}
                    className="w-full h-10 sm:h-11 bg-gradient-to-b from-[#7e6914] via-[#5e4e0e] to-[#3b3108] text-[#fce888] font-black text-xs sm:text-sm rounded-xl shadow-md hover:brightness-115 active:scale-95 transition-all uppercase tracking-wide border-2 border-[#a68c22] cursor-pointer flex items-center justify-center [touch-action:manipulation] [-webkit-tap-highlight-color:transparent]"
                  >
                    ALL
                  </button>
                </div>
              )}

              {activeMode === 2 && (
                <div className="grid grid-cols-4 gap-2">
                  {(['AB', 'AC', 'BC'] as const).map((pair) => (
                    <button
                      key={pair}
                      type="button"
                      onClick={() => handleMode2Add(pair)}
                      className="w-full h-10 sm:h-11 bg-gradient-to-b from-[#991b1b] via-[#7f1d1d] to-[#450a0a] text-white font-black text-xs sm:text-sm rounded-xl shadow-md hover:brightness-115 active:scale-95 transition-all uppercase tracking-wide border-2 border-[#ef4444] cursor-pointer flex items-center justify-center [touch-action:manipulation] [-webkit-tap-highlight-color:transparent]"
                    >
                      {pair}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleMode2Add('ALL')}
                    className="w-full h-10 sm:h-11 bg-gradient-to-b from-[#7e6914] via-[#5e4e0e] to-[#3b3108] text-[#fce888] font-black text-xs sm:text-sm rounded-xl shadow-md hover:brightness-115 active:scale-95 transition-all uppercase tracking-wide border-2 border-[#a68c22] cursor-pointer flex items-center justify-center [touch-action:manipulation] [-webkit-tap-highlight-color:transparent]"
                  >
                    ALL
                  </button>
                </div>
              )}

              {activeMode === 3 && (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleMode3Add('BOTH')}
                    className="w-full h-10 sm:h-11 bg-gradient-to-b from-[#7e6914] via-[#5e4e0e] to-[#3b3108] text-[#fce888] font-black text-xs sm:text-sm rounded-xl shadow-md hover:brightness-115 active:scale-95 transition-all uppercase tracking-wide border-2 border-[#a68c22] cursor-pointer flex items-center justify-center [touch-action:manipulation] [-webkit-tap-highlight-color:transparent]"
                  >
                    BOTH
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMode3Add('BOX')}
                    className="w-full h-10 sm:h-11 bg-gradient-to-b from-[#6b1675] via-[#4d0f54] to-[#2e0933] text-white font-black text-xs sm:text-sm rounded-xl shadow-md hover:brightness-115 active:scale-95 transition-all uppercase tracking-wide border-2 border-[#a82ab8] cursor-pointer flex items-center justify-center [touch-action:manipulation] [-webkit-tap-highlight-color:transparent]"
                  >
                    BOX
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMode3Add('SUPER')}
                    className="w-full h-10 sm:h-11 bg-black text-white font-black text-xs sm:text-sm rounded-xl shadow-md hover:brightness-115 active:scale-95 transition-all uppercase tracking-wide border-2 border-white/90 cursor-pointer flex items-center justify-center [touch-action:manipulation] [-webkit-tap-highlight-color:transparent]"
                  >
                    SUPER
                  </button>
                </div>
              )}
            </div>

          </div>

        {/* Subtotal Summary Bar (COUNT & TOTAL) Placed Down Below Entry Card */}
        <div className="bg-neutral-950 text-white px-4 py-2.5 rounded-xl border border-neutral-800 flex items-center justify-between text-xs sm:text-sm md:text-base font-black tracking-wider uppercase shadow-md shrink-0">
          <span>COUNT: {totalCount}</span>
          <span>TOTAL: {totalAmount}</span>
        </div>

        {/* Slip Table Placed Down Below Subtotal Bar (Increased length, clean internal scroll) */}
        <div className="w-full flex-1 min-h-[260px] sm:min-h-[320px] max-h-[420px] border border-neutral-700 rounded-xl overflow-hidden bg-white text-black shadow-lg flex flex-col">
          <div className="grid grid-cols-5 bg-gray-100 border-b border-gray-300 font-black text-xs sm:text-sm py-2 px-1 text-center shrink-0">
            <span className="border-r border-gray-300">Type</span>
            <span className="border-r border-gray-300">Number</span>
            <span className="border-r border-gray-300">Count</span>
            <span className="border-r border-gray-300">Amount</span>
            <span>Action</span>
          </div>

          <div className="divide-y divide-gray-200 flex-1 min-h-0 overflow-y-auto text-xs sm:text-sm font-bold">
              {betSlip.length === 0 ? null : (
                betSlip.map((item, idx) => {
                  const displayType = item.number.includes(':')
                    ? item.number.split(':')[0]
                    : item.type === 'Direct'
                    ? 'SUPER'
                    : item.type === 'Shuffle'
                    ? 'BOX'
                    : item.type;
                  const displayNumber = item.number.includes(':')
                    ? item.number.split(':')[1]
                    : item.number;

                  return (
                    <div key={item.id} className={`grid grid-cols-5 py-2 px-1 items-center text-center ${idx % 2 === 1 ? 'bg-[#f5e6fa]' : 'bg-white'}`}>
                      <span className="font-extrabold text-xs sm:text-sm text-purple-700 uppercase border-r border-gray-200 truncate px-0.5">
                        {displayType}
                      </span>
                      <span className="font-mono font-bold text-xs sm:text-sm text-black border-r border-gray-200 truncate px-0.5">
                        {displayNumber}
                      </span>
                      <span className="font-mono font-bold text-xs sm:text-sm text-black border-r border-gray-200 truncate px-0.5">
                        {item.count}
                      </span>
                      <span className="font-mono font-bold text-xs sm:text-sm text-black border-r border-gray-200 truncate px-0.5">
                        {item.totalAmount ?? (item.count * (item.unitPrice || 10))}
                      </span>
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => removeFromBetSlip(item.id)}
                          className="text-neutral-700 hover:text-red-600 p-0.5 cursor-pointer transition-colors"
                          title="Remove item"
                        >
                          <CheckSquare className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-neutral-800 hover:text-red-600" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      {/* SAVED SUCCESS CONFIRMATION POP-UP MODAL */}
      {savedBillId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-drop-in select-none">
          <div className="bg-neutral-950 border-2 border-emerald-500 rounded-2xl max-w-xs w-full p-5 shadow-[0_0_40px_rgba(16,185,129,0.4)] space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div className="space-y-1 font-mono">
              <h4 className="font-black text-white text-base uppercase tracking-wide">Successfully Saved</h4>
              <p className="text-sm text-gold font-bold flex items-center justify-center gap-2">
                <span>BILL ID: <span className="text-white font-black">{savedBillId}</span></span>
                <button
                  type="button"
                  onClick={() => {
                    if (savedBillId) {
                      navigator.clipboard.writeText(savedBillId);
                      setCopiedSavedBill(true);
                      addToast(`Copied Bill ID ${savedBillId}`, 'success');
                      setTimeout(() => setCopiedSavedBill(false), 2000);
                    }
                  }}
                  className="p-1 rounded-md bg-neutral-800 hover:bg-neutral-700 active:scale-90 text-neutral-300 hover:text-gold transition-all cursor-pointer inline-flex items-center justify-center border border-neutral-700"
                  title="Copy Bill ID"
                >
                  {copiedSavedBill ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSavedBillId(null);
                clearBetSlip();
              }}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow cursor-pointer transition-all border border-emerald-400 font-mono"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
