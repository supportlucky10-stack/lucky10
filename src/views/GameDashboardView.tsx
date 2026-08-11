import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Menu, Trash2 } from 'lucide-react';
import { Lucky10Logo } from '../components/Lucky10Logo';

export const GameDashboardView: React.FC = () => {
  const {
    currentUser,
    activeGameSlot,
    betSlip,
    addToBetSlip,
    removeFromBetSlip,
    saveTicket,
    payTicket,
    setCurrentView,
    addToast,
  } = useApp();

  // 3 DIGIT GAME State
  const [num3Digit, setNum3Digit] = useState('');
  const [count3Digit, setCount3Digit] = useState('');

  // 2 DIGIT GAME State (AB, BC, AC, CA)
  const [pairABNum, setPairABNum] = useState('');
  const [pairABCount, setPairABCount] = useState('');

  const [pairBCNum, setPairBCNum] = useState('');
  const [pairBCCount, setPairBCCount] = useState('');

  const [pairACNum, setPairACNum] = useState('');
  const [pairACCount, setPairACCount] = useState('');

  const [pairCANum, setPairCANum] = useState('');
  const [pairCACount, setPairCACount] = useState('');

  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const unitPrice = 10; // ₹10 per count

  const handleAddDirect = () => {
    if (!num3Digit || num3Digit.length !== 3 || isNaN(Number(num3Digit))) {
      addToast('Please enter a valid 3-digit number (ABC)', 'error');
      return;
    }
    const count = parseInt(count3Digit);
    if (!count || count < 1 || count > 20) {
      addToast('Please enter valid count (1-20)', 'error');
      return;
    }
    addToBetSlip({
      number: num3Digit,
      count,
      type: 'Direct',
      unitPrice,
      totalAmount: count * unitPrice,
    });
    setNum3Digit('');
    setCount3Digit('');
  };

  const handleAddShuffle = () => {
    if (!num3Digit || num3Digit.length !== 3 || isNaN(Number(num3Digit))) {
      addToast('Please enter a valid 3-digit number to shuffle', 'error');
      return;
    }
    const count = parseInt(count3Digit);
    if (!count || count < 1 || count > 20) {
      addToast('Please enter valid count (1-20)', 'error');
      return;
    }
    addToBetSlip({
      number: num3Digit,
      count,
      type: 'Shuffle',
      unitPrice,
      totalAmount: count * unitPrice,
    });
    setNum3Digit('');
    setCount3Digit('');
  };

  const handleAddBoth = () => {
    if (!num3Digit || num3Digit.length !== 3 || isNaN(Number(num3Digit))) {
      addToast('Please enter a valid 3-digit number for Both', 'error');
      return;
    }
    const count = parseInt(count3Digit);
    if (!count || count < 1 || count > 20) {
      addToast('Please enter valid count (1-20)', 'error');
      return;
    }
    addToBetSlip({
      number: num3Digit,
      count,
      type: 'Direct',
      unitPrice,
      totalAmount: count * unitPrice,
    });
    addToBetSlip({
      number: num3Digit,
      count,
      type: 'Shuffle',
      unitPrice,
      totalAmount: count * unitPrice,
    });
    setNum3Digit('');
    setCount3Digit('');
  };

  const handleAddPair = () => {
    let addedCount = 0;

    const processPair = (label: string, num: string, cnt: string) => {
      if (num && num.length === 2 && !isNaN(Number(num))) {
        const c = parseInt(cnt);
        if (c > 0 && c <= 20) {
          addToBetSlip({
            number: `${label}:${num}`,
            count: c,
            type: 'Pair',
            unitPrice,
            totalAmount: c * unitPrice,
          });
          addedCount++;
          return true;
        }
      }
      return false;
    };

    if (processPair('AB', pairABNum, pairABCount)) {
      setPairABNum('');
      setPairABCount('');
    }
    if (processPair('BC', pairBCNum, pairBCCount)) {
      setPairBCNum('');
      setPairBCCount('');
    }
    if (processPair('AC', pairACNum, pairACCount)) {
      setPairACNum('');
      setPairACCount('');
    }
    if (processPair('CA', pairCANum, pairCACount)) {
      setPairCANum('');
      setPairCACount('');
    }

    if (addedCount === 0) {
      addToast('Please enter valid 2-digit number and count for at least one pair (AB, BC, AC, CA)', 'error');
    }
  };

  const totalAmount = betSlip.reduce((sum, item) => sum + item.totalAmount, 0);

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-between overflow-x-hidden relative pb-20 sm:pb-24 select-none">
      
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

          <div className="flex items-center">
            <Lucky10Logo size="sm" showSubtitle={false} variant="gold" />
          </div>
        </div>

        {/* Combined Sub-Header Info Ribbon */}
        <div className="w-full px-3 sm:px-8 py-1.5 bg-neutral-950/80 border-b border-neutral-900 flex items-center justify-between gap-2 text-xs sm:text-sm">
          {/* Game Slot Switcher - Glow on Text Only */}
          <button
            onClick={() => setCurrentView('CHANGE_GAME')}
            className="px-4 py-1.5 bg-gradient-to-b from-[#d9a738] to-[#a67c1e] rounded-xl border border-gold/90 shadow-md flex items-center justify-center text-center shrink-0 uppercase tracking-wide hover:opacity-95 transition-all active:scale-95"
          >
            <span className="slot-blinking-text inline-block font-black text-xs sm:text-sm">
              {activeGameSlot}
            </span>
          </button>

          {/* Min / Max Info Badge */}
          <div className="text-gold font-extrabold text-[11px] sm:text-xs tracking-tight text-center">
            Min ₹10 • Max ₹200
          </div>
        </div>

        {/* How to Play Banner Header - Left Aligned */}
        <div className="w-full px-3 sm:px-8 pt-3 pb-1 flex justify-start items-center">
          <button
            type="button"
            onClick={() => setShowHowToPlay(true)}
            className="text-gold hover:text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all hover:translate-x-0.5 group"
          >
            <div className="w-5 h-5 rounded-full bg-neutral-950 p-1 flex items-center justify-center shrink-0 border border-gold shadow">
              <img src="/assets/gold-question.png" alt="Help" className="w-full h-full object-contain" />
            </div>
            <span className="underline decoration-gold/80 underline-offset-4 tracking-wide group-hover:text-white">
              How to play the game?
            </span>
          </button>
        </div>

        {/* Responsive Grid Layout */}
        <div className="w-full px-3 sm:px-8 py-3 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          
          {/* Left Column (6/12): Exact 3 DIGIT & 2 DIGIT Game Design Cards */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* 3 DIGIT GAME CARD */}
            <div className="relative border border-[#d4af37] rounded-2xl p-3.5 sm:p-5 pt-6 bg-black shadow-xl">
              {/* Floating Section Title */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-black px-2.5 sm:px-3 flex items-center gap-1.5 sm:gap-2 z-10">
                <span className="w-5 sm:w-10 h-[1.5px] bg-[#d4af37]"></span>
                <span className="text-[#d4af37] font-black text-xs sm:text-sm tracking-widest uppercase whitespace-nowrap">
                  3 DIGIT GAME
                </span>
                <span className="w-5 sm:w-10 h-[1.5px] bg-[#d4af37]"></span>
              </div>

              {/* Row 1: Number & Count Inputs (100% width grid, no overflow) */}
              <div className="grid grid-cols-12 gap-2 mb-3.5 w-full">
                <input
                  type="text"
                  maxLength={3}
                  placeholder="Number"
                  value={num3Digit}
                  onChange={(e) => setNum3Digit(e.target.value)}
                  className="col-span-7 w-full min-w-0 bg-white text-black font-semibold text-center text-xs sm:text-sm rounded-xl py-2 px-2.5 placeholder:text-neutral-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#d4af37] shadow"
                />
                <input
                  type="number"
                  placeholder="Count"
                  value={count3Digit}
                  onChange={(e) => setCount3Digit(e.target.value)}
                  className="col-span-5 w-full min-w-0 bg-white text-black font-semibold text-center text-xs sm:text-sm rounded-xl py-2 px-2.5 placeholder:text-neutral-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#d4af37] shadow"
                />
              </div>

              {/* Row 2: Direct, Shuffle, Both Gold Buttons */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full">
                <button
                  type="button"
                  onClick={handleAddDirect}
                  className="py-2.5 sm:py-3 px-1 bg-gradient-to-b from-[#f3ca65] via-[#d4af37] to-[#b8860b] text-black font-black text-[11px] sm:text-sm rounded-xl uppercase shadow hover:brightness-110 active:scale-95 transition-all tracking-wider text-center"
                >
                  Direct
                </button>
                <button
                  type="button"
                  onClick={handleAddShuffle}
                  className="py-2.5 sm:py-3 px-1 bg-gradient-to-b from-[#f3ca65] via-[#d4af37] to-[#b8860b] text-black font-black text-[11px] sm:text-sm rounded-xl uppercase shadow hover:brightness-110 active:scale-95 transition-all tracking-wider text-center"
                >
                  Shuffle
                </button>
                <button
                  type="button"
                  onClick={handleAddBoth}
                  className="py-2.5 sm:py-3 px-1 bg-gradient-to-b from-[#f3ca65] via-[#d4af37] to-[#b8860b] text-black font-black text-[11px] sm:text-sm rounded-xl uppercase shadow hover:brightness-110 active:scale-95 transition-all tracking-wider text-center"
                >
                  Both
                </button>
              </div>
            </div>

            {/* 2 DIGIT GAME CARD */}
            <div className="relative border border-[#d4af37] rounded-2xl p-3.5 sm:p-5 pt-6 bg-black shadow-xl">
              {/* Floating Section Title */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-black px-2.5 sm:px-3 flex items-center gap-1.5 sm:gap-2 z-10">
                <span className="w-5 sm:w-10 h-[1.5px] bg-[#d4af37]"></span>
                <span className="text-[#d4af37] font-black text-xs sm:text-sm tracking-widest uppercase whitespace-nowrap">
                  2 DIGIT GAME
                </span>
                <span className="w-5 sm:w-10 h-[1.5px] bg-[#d4af37]"></span>
              </div>

              {/* 4 Pairs Grid (AB, BC, AC, CA) - Responsive 12-col layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 w-full">
                {/* AB Pair */}
                <div className="grid grid-cols-12 gap-1.5 items-center w-full">
                  <span className="col-span-2 text-white font-black text-xs sm:text-base text-center">AB</span>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="Number"
                    value={pairABNum}
                    onChange={(e) => setPairABNum(e.target.value)}
                    className="col-span-6 w-full min-w-0 bg-white text-black font-semibold text-center text-xs sm:text-sm rounded-xl py-2 px-2 placeholder:text-neutral-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#d4af37] shadow"
                  />
                  <input
                    type="number"
                    placeholder="Count"
                    value={pairABCount}
                    onChange={(e) => setPairABCount(e.target.value)}
                    className="col-span-4 w-full min-w-0 bg-white text-black font-semibold text-center text-xs sm:text-sm rounded-xl py-2 px-2 placeholder:text-neutral-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#d4af37] shadow"
                  />
                </div>

                {/* BC Pair */}
                <div className="grid grid-cols-12 gap-1.5 items-center w-full">
                  <span className="col-span-2 text-white font-black text-xs sm:text-base text-center">BC</span>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="Number"
                    value={pairBCNum}
                    onChange={(e) => setPairBCNum(e.target.value)}
                    className="col-span-6 w-full min-w-0 bg-white text-black font-semibold text-center text-xs sm:text-sm rounded-xl py-2 px-2 placeholder:text-neutral-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#d4af37] shadow"
                  />
                  <input
                    type="number"
                    placeholder="Count"
                    value={pairBCCount}
                    onChange={(e) => setPairBCCount(e.target.value)}
                    className="col-span-4 w-full min-w-0 bg-white text-black font-semibold text-center text-xs sm:text-sm rounded-xl py-2 px-2 placeholder:text-neutral-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#d4af37] shadow"
                  />
                </div>

                {/* AC Pair */}
                <div className="grid grid-cols-12 gap-1.5 items-center w-full">
                  <span className="col-span-2 text-white font-black text-xs sm:text-base text-center">AC</span>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="Number"
                    value={pairACNum}
                    onChange={(e) => setPairACNum(e.target.value)}
                    className="col-span-6 w-full min-w-0 bg-white text-black font-semibold text-center text-xs sm:text-sm rounded-xl py-2 px-2 placeholder:text-neutral-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#d4af37] shadow"
                  />
                  <input
                    type="number"
                    placeholder="Count"
                    value={pairACCount}
                    onChange={(e) => setPairACCount(e.target.value)}
                    className="col-span-4 w-full min-w-0 bg-white text-black font-semibold text-center text-xs sm:text-sm rounded-xl py-2 px-2 placeholder:text-neutral-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#d4af37] shadow"
                  />
                </div>

                {/* CA Pair */}
                <div className="grid grid-cols-12 gap-1.5 items-center w-full">
                  <span className="col-span-2 text-white font-black text-xs sm:text-base text-center">CA</span>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="Number"
                    value={pairCANum}
                    onChange={(e) => setPairCANum(e.target.value)}
                    className="col-span-6 w-full min-w-0 bg-white text-black font-semibold text-center text-xs sm:text-sm rounded-xl py-2 px-2 placeholder:text-neutral-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#d4af37] shadow"
                  />
                  <input
                    type="number"
                    placeholder="Count"
                    value={pairCACount}
                    onChange={(e) => setPairCACount(e.target.value)}
                    className="col-span-4 w-full min-w-0 bg-white text-black font-semibold text-center text-xs sm:text-sm rounded-xl py-2 px-2 placeholder:text-neutral-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#d4af37] shadow"
                  />
                </div>
              </div>

              {/* Centered Pair Gold Button */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleAddPair}
                  className="px-10 sm:px-14 py-2.5 sm:py-3 bg-gradient-to-b from-[#f3ca65] via-[#d4af37] to-[#b8860b] text-black font-black text-xs sm:text-sm rounded-xl uppercase shadow hover:brightness-110 active:scale-95 transition-all tracking-wider text-center"
                >
                  Pair
                </button>
              </div>
            </div>

          </div>

          {/* Right Column (6/12): Ticket Table Display & Action Controls */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-2.5 sm:space-y-4">
            
            {/* Slip Table */}
            <div className="w-full border border-neutral-700 rounded-xl overflow-hidden bg-white text-black shadow-lg">
              <div className="grid grid-cols-12 bg-gray-100 border-b border-gray-300 font-black text-xs sm:text-sm py-2 px-3 text-center">
                <span className="col-span-4 border-r border-gray-300">Number</span>
                <span className="col-span-4 border-r border-gray-300">Count</span>
                <span className="col-span-4">Type</span>
              </div>

              <div className="divide-y divide-gray-200 max-h-24 sm:max-h-48 overflow-y-auto text-xs sm:text-sm font-bold">
                {betSlip.length === 0 ? (
                  <div className="py-5 text-center text-neutral-400 italic font-normal text-xs sm:text-sm">
                    No numbers added to slip yet
                  </div>
                ) : (
                  betSlip.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 py-1.5 px-3 items-center text-center">
                      <span className="col-span-4 font-mono text-xs sm:text-sm text-black border-r border-gray-200">
                        {item.number}
                      </span>
                      <span className="col-span-4 font-mono text-xs sm:text-sm text-black border-r border-gray-200">
                        {item.count}
                      </span>
                      <span className="col-span-3 text-black font-bold text-xs sm:text-sm">{item.type}</span>
                      <button
                        onClick={() => removeFromBetSlip(item.id)}
                        className="col-span-1 text-red-600 hover:text-red-800 flex justify-center"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* TOTAL AMOUNT & Single SAVE & PAY Button */}
            <div className="bg-neutral-950 p-2.5 sm:p-4 rounded-xl border border-neutral-800 shadow-md flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-neutral-300">TOTAL:</span>
                <span className="text-lg sm:text-2xl font-black text-gold">₹{totalAmount}</span>
              </div>

              <div>
                <button
                  onClick={payTicket}
                  className="px-6 sm:px-8 py-2.5 bg-gradient-to-b from-[#f3ca65] via-[#d4af37] to-[#b8860b] text-black font-black text-xs sm:text-sm tracking-wider rounded-xl shadow-lg uppercase hover:brightness-110 active:scale-95 transition-transform"
                >
                  SAVE & PAY
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* How to Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-gold rounded-2xl p-5 max-w-md w-full space-y-3.5 shadow-2xl">
            <div className="flex justify-center">
              <img src="/assets/gold-question.png" alt="How to Play" className="w-12 h-12 object-contain" />
            </div>
            <h3 className="text-gold font-extrabold text-lg text-center border-b border-neutral-800 pb-2">
              How to play the game?
            </h3>
            <div className="space-y-2.5 text-xs text-neutral-200 leading-relaxed">
              <p>
                <strong className="text-gold">Direct Mode:</strong> Match the 3-digit winning number
                in exact order (e.g. 742). Win up to ₹1,00,000!
              </p>
              <p>
                <strong className="text-gold">Shuffle Mode:</strong> Match winning digits in any rotation
                (e.g. 742, 427, 274). Win up to ₹60,000!
              </p>
              <p>
                <strong className="text-gold">Pair Mode:</strong> Select specific digit pairs (AB, BC,
                or AC) in exact position. Win up to ₹1,0000!
              </p>
            </div>
            <button
              onClick={() => setShowHowToPlay(false)}
              className="w-full py-2.5 bg-gold-metallic text-black font-bold text-xs rounded-lg"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
