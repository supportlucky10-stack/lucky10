import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Menu, CheckSquare } from 'lucide-react';

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
    badgeBorder: 'border-blue-400',
    cardBorder: 'border-blue-500',
    cardShadow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]',
    buttonGradient: 'bg-gradient-to-b from-sky-400 via-blue-600 to-indigo-800',
    buttonText: 'text-white',
    buttonBorder: 'border-sky-300/40',
    activeTabBg: 'bg-gradient-to-r from-blue-500 to-sky-500',
    activeTabText: 'text-white',
    activeTabBorder: 'border-sky-400',
    inactiveTabText: 'text-sky-400',
    inactiveTabBorder: 'border-blue-500/40 hover:border-sky-400',
    menuIconText: 'text-sky-400',
    saveBtnBg: 'bg-gradient-to-r from-blue-500 via-indigo-600 to-sky-500',
    saveBtnText: 'text-white',
  },
  '3 PM Game': {
    name: '3 PM Game',
    badgeBg: 'bg-gold-metallic',
    badgeText: 'text-black',
    badgeBorder: 'border-gold/90',
    cardBorder: 'border-[#b88928]',
    cardShadow: 'shadow-[0_0_15px_rgba(184,137,40,0.2)]',
    buttonGradient: 'bg-gradient-to-b from-[#edd177] via-[#c89825] to-[#996e19]',
    buttonText: 'text-black',
    buttonBorder: 'border-[#f5e396]/40',
    activeTabBg: 'bg-gold-metallic',
    activeTabText: 'text-black',
    activeTabBorder: 'border-gold',
    inactiveTabText: 'text-gold',
    inactiveTabBorder: 'border-gold/40 hover:border-gold',
    menuIconText: 'text-gold',
    saveBtnBg: 'bg-gold-metallic',
    saveBtnText: 'text-black',
  },
  '6 PM Game': {
    name: '6 PM Game',
    badgeBg: 'bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600',
    badgeText: 'text-white',
    badgeBorder: 'border-fuchsia-400',
    cardBorder: 'border-fuchsia-500',
    cardShadow: 'shadow-[0_0_15px_rgba(217,70,239,0.3)]',
    buttonGradient: 'bg-gradient-to-b from-fuchsia-400 via-pink-600 to-rose-700',
    buttonText: 'text-white',
    buttonBorder: 'border-fuchsia-300/40',
    activeTabBg: 'bg-gradient-to-r from-fuchsia-500 to-pink-600',
    activeTabText: 'text-white',
    activeTabBorder: 'border-fuchsia-400',
    inactiveTabText: 'text-fuchsia-400',
    inactiveTabBorder: 'border-fuchsia-500/40 hover:border-fuchsia-400',
    menuIconText: 'text-fuchsia-400',
    saveBtnBg: 'bg-gradient-to-r from-fuchsia-500 via-pink-600 to-rose-600',
    saveBtnText: 'text-white',
  },
  '8 PM Game': {
    name: '8 PM Game',
    badgeBg: 'bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600',
    badgeText: 'text-black',
    badgeBorder: 'border-teal-400',
    cardBorder: 'border-teal-500',
    cardShadow: 'shadow-[0_0_15px_rgba(20,184,166,0.3)]',
    buttonGradient: 'bg-gradient-to-b from-emerald-300 via-teal-500 to-cyan-700',
    buttonText: 'text-black',
    buttonBorder: 'border-teal-300/40',
    activeTabBg: 'bg-gradient-to-r from-emerald-400 to-teal-500',
    activeTabText: 'text-black',
    activeTabBorder: 'border-teal-400',
    inactiveTabText: 'text-teal-400',
    inactiveTabBorder: 'border-teal-500/40 hover:border-teal-400',
    menuIconText: 'text-teal-400',
    saveBtnBg: 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600',
    saveBtnText: 'text-black',
  },
};

export const GameDashboardView: React.FC = () => {
  const {
    activeGameSlot,
    betSlip,
    addToBetSlip,
    removeFromBetSlip,
    clearBetSlip,
    saveTicket,
    setCurrentView,
    addToast,
  } = useApp();

  const theme = slotThemes[activeGameSlot] || slotThemes['3 PM Game'];

  // Mode Selection State: 1 (1 Digit), 2 (2 Digit), 3 (3 Digit) - Default to 3
  const [activeMode, setActiveMode] = useState<1 | 2 | 3>(3);
  const [customerName, setCustomerName] = useState('');
  const [isReverse, setIsReverse] = useState(false); // Checkbox 'R' (Range Mode)
  const [isSet, setIsSet] = useState(false);

  // Common Input State
  const [inputNum, setInputNum] = useState('');
  const [inputCount, setInputCount] = useState('');
  const [boxCount, setBoxCount] = useState('');

  // Range Mode Inputs (Start, End, Step)
  const [startRange, setStartRange] = useState('');
  const [endRange, setEndRange] = useState('');
  const [stepVal, setStepVal] = useState('');

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

  // Mode 1 Handlers (A, B, C, ALL) - Minimum 5 count required
  const handleMode1Add = (pos: 'A' | 'B' | 'C' | 'ALL') => {
    const cnt = parseInt(inputCount);
    if (!cnt || cnt < 5 || cnt > 50) {
      addToast('Minimum 5 count is required for 1-digit game', 'error');
      return;
    }

    const targetNums = getRangeNumbers(1);
    if (targetNums.length === 0 || targetNums.some((n) => n.length !== 1 || isNaN(Number(n)))) {
      addToast('Please enter a valid 1-digit number or range', 'error');
      return;
    }

    const positions = pos === 'ALL' ? ['A', 'B', 'C'] : [pos];
    targetNums.forEach((n) => {
      positions.forEach((p) => {
        addToBetSlip({
          number: `${p}:${n}`,
          count: cnt,
          type: 'Pair',
          unitPrice,
          totalAmount: cnt * unitPrice,
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
    if (!cnt || cnt < 1 || cnt > 50) {
      addToast('Please enter valid count (1-50)', 'error');
      return;
    }

    const targetNums = getRangeNumbers(2);
    if (targetNums.length === 0 || targetNums.some((n) => n.length !== 2 || isNaN(Number(n)))) {
      addToast('Please enter a valid 2-digit number or range', 'error');
      return;
    }

    const pairs = pair === 'ALL' ? ['AB', 'AC', 'BC'] : [pair];
    targetNums.forEach((n) => {
      pairs.forEach((pr) => {
        addToBetSlip({
          number: `${pr}:${n}`,
          count: cnt,
          type: 'Pair',
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
    const cnt = parseInt(inputCount);
    if (!cnt || cnt < 1 || cnt > 50) {
      addToast('Please enter valid count (1-50)', 'error');
      return;
    }

    let targetNums = isReverse ? getRangeNumbers(3) : [inputNum];
    if (targetNums.length === 0 || targetNums.some((n) => n.length !== 3 || isNaN(Number(n)))) {
      addToast('Please enter a valid 3-digit number or range (000-999)', 'error');
      return;
    }

    // Expand into rotational permutations if Set is checked
    if (isSet) {
      const setPerms = new Set<string>();
      targetNums.forEach((n) => {
        getPermutations(n).forEach((p) => setPerms.add(p));
      });
      targetNums = Array.from(setPerms);
    }

    targetNums.forEach((n) => {
      if (modeType === 'SUPER' || modeType === 'BOTH') {
        addToBetSlip({
          number: n,
          count: cnt,
          type: 'Direct',
          unitPrice,
          totalAmount: cnt * unitPrice,
        });
      }

      if (modeType === 'BOX' || modeType === 'BOTH') {
        const bCnt = parseInt(boxCount) || cnt;
        addToBetSlip({
          number: n,
          count: bCnt,
          type: 'Shuffle',
          unitPrice,
          totalAmount: bCnt * unitPrice,
        });
      }
    });

    addToast(`Added Mode 3 (${modeType}${isSet ? ' SET' : ''}) bets for ${targetNums.length} number(s)`, 'success');
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
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start relative pb-6 sm:pb-8 antialiased select-none">
      <div>
        {/* Top Header Bar */}
        <div className="w-full px-3 sm:px-8 py-2.5 bg-black/90 flex items-center justify-between border-b border-neutral-900">
          {/* Left: Drawer Menu Button */}
          <button
            onClick={() => setCurrentView('USER_DRAWER')}
            className={`p-1.5 ${theme.menuIconText} hover:opacity-80 transition-opacity bg-neutral-950 rounded-lg border border-neutral-800 shadow cursor-pointer`}
            title="Open Menu"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
          </button>

          {/* Right: SAVE Button */}
          <button
            onClick={saveTicket}
            className={`px-5 py-1.5 ${theme.saveBtnBg} ${theme.saveBtnText} font-black text-xs sm:text-sm tracking-wider rounded-lg shadow uppercase hover:opacity-95 transition-transform active:scale-95 cursor-pointer`}
          >
            SAVE
          </button>
        </div>

        {/* Sub-Header Ribbon: Dynamic Slot Color Badge */}
        <div className="w-full px-3 sm:px-8 py-1.5 bg-neutral-950/80 border-b border-neutral-900 flex items-center justify-start text-xs sm:text-sm">
          <div className={`px-3.5 py-1 ${theme.badgeBg} ${theme.badgeText} font-black text-xs sm:text-sm rounded-lg border ${theme.badgeBorder} shadow flex items-center justify-center text-center uppercase tracking-wide cursor-default select-none transition-all`}>
            <span className="inline-block">
              {activeGameSlot}
            </span>
          </div>
        </div>

        {/* Main Layout Flow */}
        <div className="w-full px-3 sm:px-8 py-3 max-w-4xl mx-auto space-y-3 sm:space-y-4">
          
          {/* TABBED GAME ENTRY CARD (Upper Controls Box with Dynamic Slot Border & Glow) */}
          <div className={`relative border-2 ${theme.cardBorder} bg-black rounded-2xl p-3.5 sm:p-4 ${theme.cardShadow} space-y-3.5 transition-all`}>
            
            {/* Mode Control Ribbon: Tabs (1,2,3) + Customer Name Box + Checkboxes */}
            <div className="bg-neutral-950 p-2 sm:p-2.5 rounded-xl border border-neutral-800 flex flex-wrap items-center gap-2">
              
              {/* Mode Selector Tabs (1, 2, 3) */}
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      const newMode = m as 1 | 2 | 3;
                      setActiveMode(newMode);
                      if (newMode === 1 || newMode === 2) {
                        setIsReverse(true);
                        setIsSet(false);
                      } else {
                        setIsReverse(false);
                        setIsSet(false);
                      }
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
                  placeholder="Customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-2.5 py-1 bg-white text-black font-bold text-xs rounded-lg placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-400 shadow-inner"
                />
              </div>

              {/* Checkboxes: R (Range Mode) & Set (Only for 3-Digit Mode; 1 & 2-Digit Games are Range Mode only) */}
              {activeMode === 3 ? (
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
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 rounded-lg">
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wide">R</span>
                </div>
              )}
            </div>

            {/* Dynamic Inputs Row (Range Mode for Mode 1 & 2; Normal vs Range/Set for Mode 3) */}
            {(activeMode === 1 || activeMode === 2 || isReverse) ? (
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
                    onChange={(e) => setStartRange(e.target.value)}
                    className="w-full h-10 sm:h-11 px-0.5 bg-white text-black font-extrabold text-[10px] sm:text-sm rounded-xl placeholder-gray-500 placeholder:text-[10px] sm:placeholder:text-xs text-center focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
                  />
                </div>

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
                    placeholder="End"
                    value={endRange}
                    onChange={(e) => setEndRange(e.target.value)}
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
                    onChange={(e) => setInputNum(e.target.value)}
                    className="w-full h-10 sm:h-11 px-2 bg-white text-black font-extrabold text-xs sm:text-sm rounded-xl placeholder-gray-500 text-center focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
                  />
                </div>

                <div className={activeMode === 3 ? 'col-span-4' : 'col-span-6'}>
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
                  {(['A', 'B', 'C', 'ALL'] as const).map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => handleMode1Add(pos)}
                      className={`w-full h-10 sm:h-11 ${theme.buttonGradient} ${theme.buttonText} font-black text-xs sm:text-sm rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all uppercase tracking-wide border ${theme.buttonBorder} cursor-pointer flex items-center justify-center [touch-action:manipulation] [-webkit-tap-highlight-color:transparent]`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              )}

              {activeMode === 2 && (
                <div className="grid grid-cols-4 gap-2">
                  {(['AB', 'AC', 'BC', 'ALL'] as const).map((pair) => (
                    <button
                      key={pair}
                      type="button"
                      onClick={() => handleMode2Add(pair)}
                      className={`w-full h-10 sm:h-11 ${theme.buttonGradient} ${theme.buttonText} font-black text-xs sm:text-sm rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all uppercase tracking-wide border ${theme.buttonBorder} cursor-pointer flex items-center justify-center [touch-action:manipulation] [-webkit-tap-highlight-color:transparent]`}
                    >
                      {pair}
                    </button>
                  ))}
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
          <div className="bg-neutral-950 text-white px-4 py-3 rounded-xl border border-neutral-800 flex items-center justify-between text-sm sm:text-base md:text-lg font-black tracking-wider uppercase shadow-md">
            <span>COUNT: {totalCount}</span>
            <span>TOTAL: {totalAmount}</span>
          </div>

          {/* Slip Table Placed Down Below Subtotal Bar */}
          <div className="w-full border border-neutral-700 rounded-xl overflow-hidden bg-white text-black shadow-lg">
            <div className="grid grid-cols-5 bg-gray-100 border-b border-gray-300 font-black text-xs sm:text-sm py-2 px-1 text-center">
              <span className="border-r border-gray-300">Type</span>
              <span className="border-r border-gray-300">Number</span>
              <span className="border-r border-gray-300">Count</span>
              <span className="border-r border-gray-300">Amount</span>
              <span>Action</span>
            </div>

            <div className="divide-y divide-gray-200 min-h-[220px] sm:min-h-[320px] max-h-[400px] sm:max-h-[550px] overflow-y-auto text-xs sm:text-sm font-bold">
              {betSlip.length === 0 ? null : (
                betSlip.map((item) => {
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
                    <div key={item.id} className="grid grid-cols-5 py-2 px-1 items-center text-center">
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
      </div>
    </div>
  );
};
