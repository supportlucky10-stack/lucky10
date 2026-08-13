import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Menu, Trash2, HelpCircle, X, CheckCircle2 } from 'lucide-react';

export const GameDashboardView: React.FC = () => {
  const {
    currentUser,
    activeGameSlot,
    betSlip,
    addToBetSlip,
    removeFromBetSlip,
    saveTicket,
    setCurrentView,
    addToast,
  } = useApp();

  // Mode Selection State: 1 (1 Digit), 2 (2 Digit), 3 (3 Digit) - Default to 3
  const [activeMode, setActiveMode] = useState<1 | 2 | 3>(3);
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [isReverse, setIsReverse] = useState(false);
  const [isSet, setIsSet] = useState(false);

  // Common Form State
  const [inputNum, setInputNum] = useState('');
  const [inputCount, setInputCount] = useState('');
  const [boxCount, setBoxCount] = useState('');

  const [showHowToPlay, setShowHowToPlay] = useState(false);

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
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start relative pb-36 sm:pb-44 antialiased">
      
      <div>
        {/* Top Header Bar */}
        <div className="w-full px-3 sm:px-8 py-2.5 bg-black/90 flex items-center justify-between border-b border-neutral-900">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('USER_DRAWER')}
              className="p-1.5 text-gold hover:opacity-80 transition-opacity bg-neutral-950 rounded-lg border border-neutral-800 shadow"
              title="Open Menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </button>
            <h1 className="font-black text-sm sm:text-lg text-white tracking-wide">
              Hello {currentUser?.name || currentUser?.username || 'User'}
            </h1>
          </div>
        </div>

        {/* Combined Sub-Header Info Ribbon */}
        <div className="w-full px-3 sm:px-8 py-1.5 bg-neutral-950/80 border-b border-neutral-900 flex items-center justify-between gap-2 text-xs sm:text-sm">
          {/* Game Slot Display Badge - Non-clickable blinking indicator */}
          <div className="px-3.5 py-1 bg-gold-metallic text-black font-black text-xs sm:text-sm rounded-lg border border-gold/90 shadow-md flex items-center justify-center text-center shrink-0 uppercase tracking-wide cursor-default select-none">
            <span className="animate-text-gold-glow inline-block">
              {activeGameSlot}
            </span>
          </div>
        </div>

        {/* Responsive Grid Layout */}
        <div className="w-full px-3 sm:px-8 py-3 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 items-start">
          
          {/* Left Column (5/12): Bet Entry Cards with Mode Tabs */}
          <div className="lg:col-span-5 space-y-3 sm:space-y-4">

            {/* TABBED GAME ENTRY CARD (Original Dark Gold Design Aesthetic) */}
            <div className="relative border-2 border-[#b88928] bg-black rounded-2xl p-3.5 sm:p-4 shadow-[0_0_15px_rgba(184,137,40,0.15)] space-y-3.5">

              {/* Mode Control Ribbon: Customer Name Box COMES FIRST */}
              <div className="bg-neutral-950 p-2 sm:p-2.5 rounded-xl border border-neutral-800 flex flex-wrap items-center gap-2">
                
                {/* Customer Name Box (First!) */}
                <div className="flex-1 min-w-[100px]">
                  <input
                    type="text"
                    placeholder="Customer"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-2.5 py-1 bg-white text-black font-bold text-xs rounded-lg placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-400 shadow-inner"
                  />
                </div>

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
                          ? 'bg-gold-metallic text-black border border-gold shadow-md font-black'
                          : 'bg-black text-gold border border-gold/40 hover:border-gold font-bold'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {/* Checkboxes: R & Set */}
                <div className="flex items-center gap-2 pl-1">
                  <label className="flex items-center gap-1 text-xs font-bold text-gold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isReverse}
                      onChange={(e) => setIsReverse(e.target.checked)}
                      className="w-3.5 h-3.5 accent-amber-500 rounded"
                    />
                    <span>R</span>
                  </label>

                  {activeMode === 3 && (
                    <label className="flex items-center gap-1 text-xs font-bold text-gold cursor-pointer select-none">
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

              {/* Dynamic Inputs Row (Number, Count, Box Count) */}
              <div className="grid grid-cols-12 gap-2 sm:gap-3">
                <div className={activeMode === 3 ? 'col-span-4' : 'col-span-8'}>
                  <input
                    type="text"
                    maxLength={activeMode}
                    placeholder="Number"
                    value={inputNum}
                    onChange={(e) => setInputNum(e.target.value)}
                    className="w-full px-3 py-2 sm:py-2.5 bg-white text-black text-center text-sm sm:text-base font-bold placeholder-gray-400 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
                  />
                </div>

                <div className={activeMode === 3 ? 'col-span-4' : 'col-span-4'}>
                  <input
                    type="number"
                    placeholder="Count"
                    value={inputCount}
                    onChange={(e) => setInputCount(e.target.value)}
                    className="w-full px-2 py-2 sm:py-2.5 bg-white text-black text-center text-sm sm:text-base font-bold placeholder-gray-400 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
                  />
                </div>

                {activeMode === 3 && (
                  <div className="col-span-4">
                    <input
                      type="number"
                      placeholder="Box Count"
                      value={boxCount}
                      onChange={(e) => setBoxCount(e.target.value)}
                      className="w-full px-2 py-2 sm:py-2.5 bg-white text-black text-center text-xs sm:text-sm font-bold placeholder-gray-400 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
                    />
                  </div>
                )}
              </div>

              {/* Mode-Specific Action Buttons (Original Gold Gradient Theme) */}
              <div>
                {/* MODE 1: A, B, C, ALL */}
                {activeMode === 1 && (
                  <div className="grid grid-cols-4 gap-2 sm:gap-3">
                    {(['A', 'B', 'C', 'ALL'] as const).map((btn) => (
                      <button
                        key={btn}
                        type="button"
                        onClick={() => handleMode1Add(btn)}
                        className="w-full py-2 sm:py-2.5 bg-gradient-to-b from-[#edd177] via-[#c89825] to-[#996e19] text-black font-black text-xs sm:text-sm rounded-lg sm:rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all uppercase tracking-wide border border-[#f5e396]/40 cursor-pointer"
                      >
                        {btn}
                      </button>
                    ))}
                  </div>
                )}

                {/* MODE 2: AB, AC, BC, ALL */}
                {activeMode === 2 && (
                  <div className="grid grid-cols-4 gap-2 sm:gap-3">
                    {(['AB', 'AC', 'BC', 'ALL'] as const).map((btn) => (
                      <button
                        key={btn}
                        type="button"
                        onClick={() => handleMode2Add(btn)}
                        className="w-full py-2 sm:py-2.5 bg-gradient-to-b from-[#edd177] via-[#c89825] to-[#996e19] text-black font-black text-xs sm:text-sm rounded-lg sm:rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all uppercase tracking-wide border border-[#f5e396]/40 cursor-pointer"
                      >
                        {btn}
                      </button>
                    ))}
                  </div>
                )}

                {/* MODE 3: BOTH, BOX, SUPER */}
                {activeMode === 3 && (
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => handleMode3Add('BOTH')}
                      className="w-full py-2 sm:py-2.5 bg-gradient-to-b from-[#edd177] via-[#c89825] to-[#996e19] text-black font-black text-xs sm:text-sm rounded-lg sm:rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all uppercase tracking-wide border border-[#f5e396]/40 cursor-pointer"
                    >
                      BOTH
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMode3Add('BOX')}
                      className="w-full py-2 sm:py-2.5 bg-gradient-to-b from-[#edd177] via-[#c89825] to-[#996e19] text-black font-black text-xs sm:text-sm rounded-lg sm:rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all uppercase tracking-wide border border-[#f5e396]/40 cursor-pointer"
                    >
                      BOX
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMode3Add('SUPER')}
                      className="w-full py-2 sm:py-2.5 bg-gradient-to-b from-[#edd177] via-[#c89825] to-[#996e19] text-black font-black text-xs sm:text-sm rounded-lg sm:rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all uppercase tracking-wide border border-[#f5e396]/40 cursor-pointer"
                    >
                      SUPER
                    </button>
                  </div>
                )}
              </div>

              {/* Subtotal Summary Footer matching original gold theme */}
              <div className="bg-neutral-950 text-gold px-3.5 py-2 rounded-xl border border-neutral-800 flex items-center justify-between text-xs sm:text-sm font-black tracking-wider uppercase shadow">
                <span>COUNT: {totalCount}</span>
                <span>TOT: ₹{totalAmount}</span>
              </div>

            </div>

          </div>

          {/* Right Column (7/12): Ticket Table Display & Action Controls */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-2.5 sm:space-y-4">
            
            {/* Slip Table */}
            <div className="w-full border border-neutral-700 rounded-xl overflow-hidden bg-white text-black shadow-lg">
              <div className="grid grid-cols-12 bg-gray-100 border-b border-gray-300 font-black text-xs sm:text-sm py-2 px-3 text-center">
                <span className="col-span-3 border-r border-gray-300">Number</span>
                <span className="col-span-3 border-r border-gray-300">Count</span>
                <span className="col-span-3 border-r border-gray-300">Type</span>
                <span className="col-span-3">Amount</span>
              </div>

              <div className="divide-y divide-gray-200 max-h-36 sm:max-h-64 overflow-y-auto text-xs sm:text-sm font-bold">
                {betSlip.length === 0 ? (
                  <div className="py-6 text-center text-neutral-400 italic font-normal text-xs sm:text-sm">
                    No numbers added to slip yet
                  </div>
                ) : (
                  betSlip.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 py-1.5 px-3 items-center text-center">
                      <span className="col-span-3 font-mono text-xs sm:text-sm text-black border-r border-gray-200">
                        {item.number}
                      </span>
                      <span className="col-span-3 font-mono text-xs sm:text-sm text-black border-r border-gray-200">
                        {item.count}
                      </span>
                      <span className="col-span-3 text-black font-bold text-xs sm:text-sm border-r border-gray-200">
                        {item.type}
                      </span>
                      <div className="col-span-3 flex items-center justify-between pl-1 sm:pl-2">
                        <span className="font-mono font-black text-xs sm:text-sm text-black">
                          ₹{item.totalAmount ?? (item.count * (item.unitPrice || 10))}
                        </span>
                        <button
                          onClick={() => removeFromBetSlip(item.id)}
                          className="text-red-600 hover:text-red-800 p-0.5 cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* TOTAL AMOUNT & Action Controls in a Compact Row */}
            <div className="bg-neutral-950 p-2.5 sm:p-4 rounded-xl border border-neutral-800 shadow-md flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-neutral-300">TOTAL:</span>
                <span className="text-lg sm:text-2xl font-black text-gold">₹{totalAmount}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={saveTicket}
                  className="px-6 py-2 bg-gold-metallic text-black font-black text-xs sm:text-sm tracking-wider rounded-lg shadow-md uppercase hover:opacity-95 transition-transform active:scale-95 cursor-pointer"
                >
                  SAVE
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* How to Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 select-none">
          <div className="bg-neutral-950 border-2 border-gold rounded-3xl p-4 sm:p-6 max-w-lg w-full max-h-[88vh] flex flex-col justify-between shadow-[0_0_30px_rgba(237,209,119,0.25)] relative">
            {/* Close X button */}
            <button
              onClick={() => setShowHowToPlay(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-full bg-neutral-900 border border-neutral-800 hover:border-gold transition-colors z-10"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-gold/30 pb-3.5 pr-8 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gold-metallic p-0.5 shadow-md flex items-center justify-center">
                <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-gold" />
                </div>
              </div>
              <div>
                <h3 className="text-gold font-black text-base sm:text-xl tracking-wider uppercase">
                  How to play the game?
                </h3>
                <p className="text-neutral-400 text-xs font-semibold">
                  Complete Game Guide & Payout Rules
                </p>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="overflow-y-auto my-3 pr-1 space-y-4 text-xs sm:text-sm text-neutral-200 leading-relaxed custom-scrollbar">
              
              {/* General Intro Banner */}
              <div className="bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 p-3.5 sm:p-4 rounded-2xl border border-gold/40 shadow-lg space-y-1">
                <p className="text-white font-extrabold text-xs sm:text-sm leading-snug">
                  Choose your number and play with a minimum stake of <span className="text-gold font-mono font-black text-sm sm:text-base underline">₹10</span> and a maximum stake of <span className="text-gold font-mono font-black text-sm sm:text-base underline">₹200</span>.
                </p>
                <div className="text-gold text-xs font-bold pt-1">
                  <span>Your prize amount increases according to your stake!</span>
                </div>
              </div>

              {/* 1. Direct Mode Card */}
              <div className="bg-neutral-900/90 p-4 rounded-2xl border border-neutral-800 space-y-3 hover:border-gold/60 transition-all shadow-md">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="text-gold font-black text-sm sm:text-base tracking-wide uppercase">
                    Direct Mode
                  </span>
                  <span className="bg-gold-metallic text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shadow">
                    3 Digit Game
                  </span>
                </div>

                <p className="text-white font-extrabold text-xs sm:text-sm">
                  Match the 3-digit winning number in the exact order.
                </p>

                {/* Example Box */}
                <div className="bg-black/90 p-3 rounded-xl border border-neutral-800 space-y-1.5">
                  <span className="text-gold font-black text-xs uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gold" /> Example
                  </span>
                  <p className="text-neutral-300 text-xs">
                    Enter <strong className="text-white font-mono font-bold">742</strong> → If the 1st Prize Winning Number is <strong className="text-gold font-mono font-black">742</strong>, you win the 1st Prize payout.
                  </p>
                </div>

                {/* Payout Stats Box */}
                <div className="space-y-1.5 text-xs bg-neutral-950 p-3 rounded-xl border border-neutral-800/80">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span className="font-bold">Stake Range:</span>
                    <strong className="text-white font-mono font-extrabold">₹10 – ₹200</strong>
                  </div>
                  <div className="flex justify-between items-center text-neutral-300 border-t border-neutral-900 pt-1.5">
                    <span className="font-bold text-gold">1st Prize Payout:</span>
                    <strong className="text-gold font-mono font-black text-sm">₹5,000 – ₹1,00,000</strong>
                  </div>
                  <p className="text-[11px] text-neutral-400 pt-1.5 border-t border-neutral-900 font-semibold">
                    2nd, 3rd & 4th & Compliments Prize payouts: As per the Payout Structure.
                  </p>
                </div>

                <p className="text-[11px] text-neutral-400 italic">
                  *The prize amount depends on your selected stake. The number must match in the exact order.
                </p>
              </div>

              {/* 2. Shuffle Mode Card */}
              <div className="bg-neutral-900/90 p-4 rounded-2xl border border-neutral-800 space-y-3 hover:border-gold/60 transition-all shadow-md">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="text-gold font-black text-sm sm:text-base tracking-wide uppercase">
                    Shuffle Mode
                  </span>
                  <span className="bg-gold-metallic text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shadow">
                    3 Digit Game
                  </span>
                </div>

                <p className="text-white font-extrabold text-xs sm:text-sm">
                  Match the 1st Prize winning number in any order.
                </p>

                {/* Example Box */}
                <div className="bg-black/90 p-3 rounded-xl border border-neutral-800 space-y-2">
                  <span className="text-gold font-black text-xs uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gold" /> Example
                  </span>
                  <p className="text-neutral-300 text-xs">
                    Enter <strong className="text-white font-mono font-bold">742</strong> → If the 1st Prize Number is <strong className="text-gold font-mono font-black">742</strong>, the possible combinations are:
                  </p>
                  <div className="bg-neutral-950 p-2 rounded-lg border border-gold/30 text-center">
                    <p className="text-gold font-mono font-black tracking-widest text-xs sm:text-sm">
                      742 • 724 • 472 • 427 • 274 • 247
                    </p>
                  </div>
                </div>

                {/* Payout Breakdown */}
                <div className="space-y-2 text-xs bg-neutral-950 p-3 rounded-xl border border-neutral-800/80">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                    <span className="text-white font-extrabold uppercase">Correct Digit</span>
                    <strong className="text-white font-mono font-bold text-xs">
                      <span className="text-gold font-black">₹3,000</span> at ₹10 stake → <span className="text-gold font-black">₹60,000</span> at ₹200 stake
                    </strong>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 border-t border-neutral-900 pt-2">
                    <span className="text-white font-extrabold uppercase">Other Rotation</span>
                    <strong className="text-neutral-200 font-mono font-bold text-xs">
                      <span className="text-white font-bold">₹800</span> at ₹10 stake → <span className="text-white font-bold">₹16,000</span> at ₹200 stake
                    </strong>
                  </div>
                </div>
              </div>

              {/* 3. Pair Mode Card */}
              <div className="bg-neutral-900/90 p-4 rounded-2xl border border-neutral-800 space-y-3 hover:border-gold/60 transition-all shadow-md">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="text-gold font-black text-sm sm:text-base tracking-wide uppercase">
                    Pair Mode
                  </span>
                  <span className="bg-gold-metallic text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shadow">
                    2 Digit Game
                  </span>
                </div>

                <p className="text-white font-extrabold text-xs sm:text-sm">
                  Match two specific digits from the 1st Prize Number in their exact positions.
                </p>

                {/* Example Box */}
                <div className="bg-black/90 p-3 rounded-xl border border-neutral-800 space-y-2">
                  <span className="text-gold font-black text-xs uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gold" /> Example
                  </span>
                  <p className="text-neutral-300 text-xs">
                    Enter <strong className="text-white font-mono font-bold">742</strong> → If the 1st Prize Number is <strong className="text-gold font-mono font-black">742</strong>
                  </p>
                  
                  {/* Pair Grid */}
                  <div className="grid grid-cols-2 gap-2 font-mono text-xs pt-1">
                    <div className="bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800 flex justify-between items-center">
                      <span className="text-neutral-400 font-bold">AB Pair</span>
                      <span className="text-gold font-black text-sm">74</span>
                    </div>
                    <div className="bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800 flex justify-between items-center">
                      <span className="text-neutral-400 font-bold">BC Pair</span>
                      <span className="text-gold font-black text-sm">42</span>
                    </div>
                    <div className="bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800 flex justify-between items-center">
                      <span className="text-neutral-400 font-bold">AC Pair</span>
                      <span className="text-gold font-black text-sm">72</span>
                    </div>
                    <div className="bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800 flex justify-between items-center">
                      <span className="text-neutral-400 font-bold">CA Pair</span>
                      <span className="text-gold font-black text-sm">27</span>
                    </div>
                  </div>
                </div>

                {/* Payout Box */}
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800/80 text-xs">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                    <span className="text-gold font-black uppercase shrink-0">Pair Prize Payout</span>
                    <strong className="text-white font-mono text-xs">
                      <span className="text-gold font-black">₹500</span> at ₹10 stake → <span className="text-gold font-black">₹10,000</span> at ₹200 stake
                    </strong>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Bottom Close Button */}
            <div className="pt-2 shrink-0">
              <button
                onClick={() => setShowHowToPlay(false)}
                className="w-full py-3 bg-gold-metallic text-black font-black text-xs sm:text-sm rounded-xl uppercase tracking-wider shadow-lg hover:opacity-95 cursor-pointer active:scale-98 transition-transform"
              >
                Got It, Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
