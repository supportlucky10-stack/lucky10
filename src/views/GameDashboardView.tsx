import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
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
    badgeBg: 'bg-gradient-to-r from-amber-500 to-amber-600',
    badgeText: 'text-black',
    badgeBorder: 'border-amber-400',
    cardBorder: 'border-amber-500',
    cardShadow: 'shadow-[0_0_15px_rgba(245,158,11,0.25)]',
    buttonGradient: 'bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700',
    buttonText: 'text-black',
    buttonBorder: 'border-amber-300/40',
    activeTabBg: 'bg-gradient-to-r from-amber-400 to-amber-500',
    activeTabText: 'text-black',
    activeTabBorder: 'border-amber-400',
    inactiveTabText: 'text-amber-400',
    inactiveTabBorder: 'border-amber-500/40 hover:border-amber-400',
    menuIconText: 'text-amber-400',
    saveBtnBg: 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600',
    saveBtnText: 'text-black',
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
    saveTicket,
    setCurrentView,
    addToast,
  } = useApp();

  const theme = slotThemes[activeGameSlot] || slotThemes['3 PM Game'];

  // Mode Selection State: 1 (1 Digit), 2 (2 Digit), 3 (3 Digit) - Default to 3
  const [activeMode, setActiveMode] = useState<1 | 2 | 3>(3);
  const [customerName, setCustomerName] = useState('');
  const [isReverse, setIsReverse] = useState(false);
  const [isSet, setIsSet] = useState(false);

  // Common Form State
  const [inputNum, setInputNum] = useState('');
  const [inputCount, setInputCount] = useState('');
  const [boxCount, setBoxCount] = useState('');

  const unitPrice = 10; // ₹10 per count

  // Mode 1 Handlers (A, B, C, ALL)
  const handleMode1Add = (pos: 'A' | 'B' | 'C' | 'ALL') => {
    if (!inputNum || inputNum.length !== 1 || isNaN(Number(inputNum))) {
      addToast('Please enter a valid 1-digit number (0-9)', 'error');
      return;
    }
    const cnt = parseInt(inputCount);
    if (!cnt || cnt < 1 || cnt > 50) {
      addToast('Please enter valid count (1-50)', 'error');
      return;
    }

    const positions = pos === 'ALL' ? ['A', 'B', 'C'] : [pos];
    positions.forEach((p) => {
      addToBetSlip({
        number: `${p}:${inputNum}`,
        count: cnt,
        type: 'Pair',
        unitPrice,
        totalAmount: cnt * unitPrice,
      });
    });

    addToast(`Added Mode 1 (${pos}) bet for ${inputNum}`, 'success');
    setInputNum('');
    setInputCount('');
  };

  // Mode 2 Handlers (AB, AC, BC, ALL)
  const handleMode2Add = (pair: 'AB' | 'AC' | 'BC' | 'ALL') => {
    if (!inputNum || inputNum.length !== 2 || isNaN(Number(inputNum))) {
      addToast('Please enter a valid 2-digit number (00-99)', 'error');
      return;
    }
    const cnt = parseInt(inputCount);
    if (!cnt || cnt < 1 || cnt > 50) {
      addToast('Please enter valid count (1-50)', 'error');
      return;
    }

    const pairs = pair === 'ALL' ? ['AB', 'AC', 'BC'] : [pair];
    pairs.forEach((pr) => {
      addToBetSlip({
        number: `${pr}:${inputNum}`,
        count: cnt,
        type: 'Pair',
        unitPrice,
        totalAmount: cnt * unitPrice,
      });
      if (isReverse) {
        const rev = inputNum.split('').reverse().join('');
        addToBetSlip({
          number: `${pr}:${rev}`,
          count: cnt,
          type: 'Pair',
          unitPrice,
          totalAmount: cnt * unitPrice,
        });
      }
    });

    addToast(`Added Mode 2 (${pair}) bet for ${inputNum}`, 'success');
    setInputNum('');
    setInputCount('');
  };

  // Mode 3 Handlers (BOTH, BOX, SUPER)
  const handleMode3Add = (modeType: 'BOTH' | 'BOX' | 'SUPER') => {
    if (!inputNum || inputNum.length !== 3 || isNaN(Number(inputNum))) {
      addToast('Please enter a valid 3-digit number (ABC)', 'error');
      return;
    }
    const cnt = parseInt(inputCount);
    if (!cnt || cnt < 1 || cnt > 50) {
      addToast('Please enter valid count (1-50)', 'error');
      return;
    }

    if (modeType === 'SUPER' || modeType === 'BOTH') {
      addToBetSlip({
        number: inputNum,
        count: cnt,
        type: 'Direct',
        unitPrice,
        totalAmount: cnt * unitPrice,
      });
    }

    if (modeType === 'BOX' || modeType === 'BOTH') {
      const bCnt = parseInt(boxCount) || cnt;
      addToBetSlip({
        number: inputNum,
        count: bCnt,
        type: 'Shuffle',
        unitPrice,
        totalAmount: bCnt * unitPrice,
      });
    }

    addToast(`Added Mode 3 (${modeType}) bet for ${inputNum}`, 'success');
    setInputNum('');
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
                      setActiveMode(m as 1 | 2 | 3);
                      setInputNum('');
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
              <div className="flex-1 min-w-[100px]">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-2.5 py-1 bg-white text-black font-bold text-xs rounded-lg placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-400 shadow-inner"
                />
              </div>

              {/* Checkboxes: R & Set */}
              <div className="flex items-center gap-2 pl-1">
                <label className={`flex items-center gap-1 text-xs font-bold ${theme.inactiveTabText} cursor-pointer select-none`}>
                  <input
                    type="checkbox"
                    checked={isReverse}
                    onChange={(e) => setIsReverse(e.target.checked)}
                    className="w-3.5 h-3.5 accent-amber-500 rounded"
                  />
                  <span>R</span>
                </label>

                {activeMode === 3 && (
                  <label className={`flex items-center gap-1 text-xs font-bold ${theme.inactiveTabText} cursor-pointer select-none`}>
                    <input
                      type="checkbox"
                      checked={isSet}
                      onChange={(e) => setIsSet(e.target.checked)}
                      className="w-3.5 h-3.5 accent-amber-500 rounded"
                    />
                    <span>Set</span>
                  </label>
                )}
              </div>
            </div>

            {/* Dynamic Inputs Row (Number, Count, Box Count) - Equal Size & Height */}
            <div className="grid grid-cols-12 gap-2 sm:gap-3">
              <div className={activeMode === 3 ? 'col-span-4' : 'col-span-6'}>
                <input
                  type="text"
                  maxLength={activeMode}
                  placeholder="Number"
                  value={inputNum}
                  onChange={(e) => setInputNum(e.target.value)}
                  className="w-full h-10 sm:h-11 px-2.5 bg-white text-black font-extrabold text-xs sm:text-sm rounded-xl placeholder-gray-400 text-center focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
                />
              </div>

              <div className={activeMode === 3 ? 'col-span-4' : 'col-span-6'}>
                <input
                  type="number"
                  placeholder="Count"
                  value={inputCount}
                  onChange={(e) => setInputCount(e.target.value)}
                  className="w-full h-10 sm:h-11 px-2.5 bg-white text-black font-extrabold text-xs sm:text-sm rounded-xl placeholder-gray-400 text-center focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
                />
              </div>

              {activeMode === 3 && (
                <div className="col-span-4">
                  <input
                    type="number"
                    placeholder="Box Count"
                    value={boxCount}
                    onChange={(e) => setBoxCount(e.target.value)}
                    className="w-full h-10 sm:h-11 px-2.5 bg-white text-black font-extrabold text-xs sm:text-sm rounded-xl placeholder-gray-400 text-center focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons Row matching selected Mode - Dynamic Slot Colors */}
            <div>
              {activeMode === 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {(['A', 'B', 'C', 'ALL'] as const).map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => handleMode1Add(pos)}
                      className={`w-full h-10 sm:h-11 ${theme.buttonGradient} ${theme.buttonText} font-black text-xs sm:text-sm rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all uppercase tracking-wide border ${theme.buttonBorder} cursor-pointer flex items-center justify-center`}
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
                      className={`w-full h-10 sm:h-11 ${theme.buttonGradient} ${theme.buttonText} font-black text-xs sm:text-sm rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all uppercase tracking-wide border ${theme.buttonBorder} cursor-pointer flex items-center justify-center`}
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
                    className={`w-full h-10 sm:h-11 ${theme.buttonGradient} ${theme.buttonText} font-black text-xs sm:text-sm rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all uppercase tracking-wide border ${theme.buttonBorder} cursor-pointer flex items-center justify-center`}
                  >
                    BOTH
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMode3Add('BOX')}
                    className={`w-full h-10 sm:h-11 ${theme.buttonGradient} ${theme.buttonText} font-black text-xs sm:text-sm rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all uppercase tracking-wide border ${theme.buttonBorder} cursor-pointer flex items-center justify-center`}
                  >
                    BOX
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMode3Add('SUPER')}
                    className={`w-full h-10 sm:h-11 ${theme.buttonGradient} ${theme.buttonText} font-black text-xs sm:text-sm rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all uppercase tracking-wide border ${theme.buttonBorder} cursor-pointer flex items-center justify-center`}
                  >
                    SUPER
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Subtotal Summary Bar (COUNT & TOTAL) Placed Down Below Entry Card */}
          <div className="bg-neutral-950 text-white px-3.5 py-2.5 rounded-xl border border-neutral-800 flex items-center justify-between text-xs sm:text-sm font-black tracking-wider uppercase shadow">
            <span>COUNT: {totalCount}</span>
            <span>TOTAL: ₹{totalAmount}</span>
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

            <div className="divide-y divide-gray-200 min-h-[220px] sm:min-h-[320px] max-h-[450px] sm:max-h-[600px] overflow-y-auto text-xs sm:text-sm font-bold">
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
                        ₹{item.totalAmount ?? (item.count * (item.unitPrice || 10))}
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
