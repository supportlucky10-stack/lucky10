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

  // 3 Digit Game State
  const [threeDigitNum, setThreeDigitNum] = useState('');
  const [threeDigitCount, setThreeDigitCount] = useState('');

  // 2 Digit Game State
  const [pairAB, setPairAB] = useState('');
  const [pairABCount, setPairABCount] = useState('');
  const [pairBC, setPairBC] = useState('');
  const [pairBCCount, setPairBCCount] = useState('');
  const [pairAC, setPairAC] = useState('');
  const [pairACCount, setPairACCount] = useState('');
  const [pairCA, setPairCA] = useState('');
  const [pairCACount, setPairCACount] = useState('');

  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const unitPrice = 10; // ₹10 per count

  const handleAddDirect = () => {
    if (!threeDigitNum || threeDigitNum.length !== 3 || isNaN(Number(threeDigitNum))) {
      addToast('Please enter a valid 3-digit number (ABC)', 'error');
      return;
    }
    const count = parseInt(threeDigitCount);
    if (!count || count < 1 || count > 20) {
      addToast('Please enter valid count (1-20)', 'error');
      return;
    }
    addToBetSlip({
      number: threeDigitNum,
      count,
      type: 'Direct',
      unitPrice,
      totalAmount: count * unitPrice,
    });
    setThreeDigitNum('');
    setThreeDigitCount('');
  };

  const handleAddShuffle = () => {
    if (!threeDigitNum || threeDigitNum.length !== 3 || isNaN(Number(threeDigitNum))) {
      addToast('Please enter a valid 3-digit number (ABC)', 'error');
      return;
    }
    const count = parseInt(threeDigitCount);
    if (!count || count < 1 || count > 20) {
      addToast('Please enter valid count (1-20)', 'error');
      return;
    }
    addToBetSlip({
      number: threeDigitNum,
      count,
      type: 'Shuffle',
      unitPrice,
      totalAmount: count * unitPrice,
    });
    setThreeDigitNum('');
    setThreeDigitCount('');
  };

  const handleAddBoth = () => {
    if (!threeDigitNum || threeDigitNum.length !== 3 || isNaN(Number(threeDigitNum))) {
      addToast('Please enter a valid 3-digit number (ABC)', 'error');
      return;
    }
    const count = parseInt(threeDigitCount);
    if (!count || count < 1 || count > 20) {
      addToast('Please enter valid count (1-20)', 'error');
      return;
    }
    // Add Direct
    addToBetSlip({
      number: threeDigitNum,
      count,
      type: 'Direct',
      unitPrice,
      totalAmount: count * unitPrice,
    });
    // Add Shuffle
    addToBetSlip({
      number: threeDigitNum,
      count,
      type: 'Shuffle',
      unitPrice,
      totalAmount: count * unitPrice,
    });
    addToast('Added Direct & Shuffle to slip!', 'success');
    setThreeDigitNum('');
    setThreeDigitCount('');
  };

  const handleAddPair = () => {
    let addedCount = 0;

    const checkAndAdd = (num: string, cntStr: string, label: string) => {
      if (num && cntStr) {
        const c = parseInt(cntStr);
        if (c > 0 && num.length === 2 && !isNaN(Number(num))) {
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

    const abAdded = checkAndAdd(pairAB, pairABCount, 'AB');
    const bcAdded = checkAndAdd(pairBC, pairBCCount, 'BC');
    const acAdded = checkAndAdd(pairAC, pairACCount, 'AC');
    const caAdded = checkAndAdd(pairCA, pairCACount, 'CA');

    if (addedCount === 0) {
      addToast('Please enter valid 2-digit number and count for at least one pair (AB, BC, AC, CA)', 'error');
    } else {
      if (abAdded) { setPairAB(''); setPairABCount(''); }
      if (bcAdded) { setPairBC(''); setPairBCCount(''); }
      if (acAdded) { setPairAC(''); setPairACCount(''); }
      if (caAdded) { setPairCA(''); setPairCACount(''); }
    }
  };

  const totalAmount = betSlip.reduce((sum, item) => sum + item.totalAmount, 0);

  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] bg-black text-white flex flex-col justify-between overflow-y-auto lg:overflow-hidden relative pb-16 select-none">
      
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

          <div className="scale-75 origin-right">
            <Lucky10Logo size="sm" showSubtitle={false} />
          </div>
        </div>

        {/* Combined Sub-Header Info Ribbon */}
        <div className="w-full px-3 sm:px-8 py-1.5 bg-neutral-950/80 border-b border-neutral-900 flex items-center justify-between gap-2 text-xs sm:text-sm">
          {/* Game Slot Switcher - Glow on Text Only */}
          <button
            onClick={() => setCurrentView('CHANGE_GAME')}
            className="px-3.5 py-1 bg-gold-metallic text-black font-black text-xs sm:text-sm rounded-lg border border-gold/90 shadow-md flex items-center justify-center text-center shrink-0 uppercase tracking-wide hover:opacity-95 transition-all active:scale-95"
          >
            <span className="animate-text-gold-glow inline-block">
              {activeGameSlot}
            </span>
          </button>

          {/* Min / Max Info Badge */}
          <div className="text-gold font-extrabold text-[11px] sm:text-xs tracking-tight text-center">
            Min ₹10 • Max ₹200
          </div>
        </div>

        {/* Responsive Grid Layout */}
        <div className="w-full px-3 sm:px-8 py-3 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 items-start">
          
          {/* Left Column (5/12): Bet Entry Cards */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* How to play trigger button */}
            <div className="flex items-center justify-start">
              <button
                type="button"
                onClick={() => setShowHowToPlay(true)}
                className="text-gold hover:text-white underline font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
              >
                <div className="w-4 h-4 rounded-full bg-black p-0.5 flex items-center justify-center shrink-0 border border-gold">
                  <img src="/assets/gold-question.png" alt="Help" className="w-full h-full object-contain filter drop-shadow" />
                </div>
                <span>How to play the game?</span>
              </button>
            </div>

            {/* 3 DIGIT GAME CARD */}
            <div className="relative border-2 border-[#b88928] bg-black rounded-2xl p-3.5 sm:p-4 shadow-[0_0_15px_rgba(184,137,40,0.15)]">
              {/* Header Title with Lines */}
              <div className="flex items-center justify-center gap-3 mb-3.5 sm:mb-4">
                <div className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent via-[#c49727] to-[#c49727]" />
                <h2 className="text-[#e2b847] font-black text-sm sm:text-base tracking-widest uppercase whitespace-nowrap drop-shadow-sm">
                  3 DIGIT GAME
                </h2>
                <div className="h-[1.5px] flex-1 bg-gradient-to-l from-transparent via-[#c49727] to-[#c49727]" />
              </div>

              {/* Inputs Row */}
              <div className="grid grid-cols-12 gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                {/* Number Input (Col 8) */}
                <div className="col-span-8">
                  <input
                    type="text"
                    maxLength={3}
                    placeholder="Number"
                    value={threeDigitNum}
                    onChange={(e) => setThreeDigitNum(e.target.value)}
                    className="w-full px-3 py-2 sm:py-2.5 bg-white text-black text-center text-sm sm:text-base font-bold placeholder-gray-400 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner transition-all"
                  />
                </div>
                {/* Count Input (Col 4) */}
                <div className="col-span-4">
                  <input
                    type="number"
                    placeholder="Count"
                    value={threeDigitCount}
                    onChange={(e) => setThreeDigitCount(e.target.value)}
                    className="w-full px-2 py-2 sm:py-2.5 bg-white text-black text-center text-sm sm:text-base font-bold placeholder-gray-400 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner transition-all"
                  />
                </div>
              </div>

              {/* Buttons Row */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleAddDirect}
                  className="w-full py-2 sm:py-2.5 bg-gradient-to-b from-[#edd177] via-[#c89825] to-[#996e19] text-black font-black text-xs sm:text-sm md:text-base rounded-lg sm:rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all uppercase tracking-wide border border-[#f5e396]/40"
                >
                  Direct
                </button>
                <button
                  type="button"
                  onClick={handleAddShuffle}
                  className="w-full py-2 sm:py-2.5 bg-gradient-to-b from-[#edd177] via-[#c89825] to-[#996e19] text-black font-black text-xs sm:text-sm md:text-base rounded-lg sm:rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all uppercase tracking-wide border border-[#f5e396]/40"
                >
                  Shuffle
                </button>
                <button
                  type="button"
                  onClick={handleAddBoth}
                  className="w-full py-2 sm:py-2.5 bg-gradient-to-b from-[#edd177] via-[#c89825] to-[#996e19] text-black font-black text-xs sm:text-sm md:text-base rounded-lg sm:rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all uppercase tracking-wide border border-[#f5e396]/40"
                >
                  Both
                </button>
              </div>
            </div>

            {/* 2 DIGIT GAME CARD */}
            <div className="relative border-2 border-[#b88928] bg-black rounded-2xl p-3.5 sm:p-4 shadow-[0_0_15px_rgba(184,137,40,0.15)]">
              {/* Header Title with Lines */}
              <div className="flex items-center justify-center gap-3 mb-3.5 sm:mb-4">
                <div className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent via-[#c49727] to-[#c49727]" />
                <h2 className="text-[#e2b847] font-black text-sm sm:text-base tracking-widest uppercase whitespace-nowrap drop-shadow-sm">
                  2 DIGIT GAME
                </h2>
                <div className="h-[1.5px] flex-1 bg-gradient-to-l from-transparent via-[#c49727] to-[#c49727]" />
              </div>

              {/* 2x2 Grid of Pair Inputs - Always 2 Columns on Mobile & Desktop */}
              <div className="grid grid-cols-2 gap-1.5 sm:gap-3.5 mb-4">
                {/* Left Column Pair 1: AB */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-white font-black text-sm sm:text-xl min-w-[20px] sm:min-w-[30px] text-center shrink-0">
                    AB
                  </span>
                  <div className="grid grid-cols-12 gap-1 flex-1">
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="Number"
                      value={pairAB}
                      onChange={(e) => setPairAB(e.target.value)}
                      className="col-span-7 px-1 sm:px-2 py-1 sm:py-2 bg-white text-black text-center text-[10px] sm:text-sm font-bold placeholder-gray-400 rounded-md sm:rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400 shadow-inner"
                    />
                    <input
                      type="number"
                      placeholder="Count"
                      value={pairABCount}
                      onChange={(e) => setPairABCount(e.target.value)}
                      className="col-span-5 px-0.5 sm:px-1 py-1 sm:py-2 bg-white text-black text-center text-[10px] sm:text-sm font-bold placeholder-gray-400 rounded-md sm:rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400 shadow-inner"
                    />
                  </div>
                </div>

                {/* Right Column Pair 1: BC */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-white font-black text-sm sm:text-xl min-w-[20px] sm:min-w-[30px] text-center shrink-0">
                    BC
                  </span>
                  <div className="grid grid-cols-12 gap-1 flex-1">
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="Number"
                      value={pairBC}
                      onChange={(e) => setPairBC(e.target.value)}
                      className="col-span-7 px-1 sm:px-2 py-1 sm:py-2 bg-white text-black text-center text-[10px] sm:text-sm font-bold placeholder-gray-400 rounded-md sm:rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400 shadow-inner"
                    />
                    <input
                      type="number"
                      placeholder="Count"
                      value={pairBCCount}
                      onChange={(e) => setPairBCCount(e.target.value)}
                      className="col-span-5 px-0.5 sm:px-1 py-1 sm:py-2 bg-white text-black text-center text-[10px] sm:text-sm font-bold placeholder-gray-400 rounded-md sm:rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400 shadow-inner"
                    />
                  </div>
                </div>

                {/* Left Column Pair 2: AC */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-white font-black text-sm sm:text-xl min-w-[20px] sm:min-w-[30px] text-center shrink-0">
                    AC
                  </span>
                  <div className="grid grid-cols-12 gap-1 flex-1">
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="Number"
                      value={pairAC}
                      onChange={(e) => setPairAC(e.target.value)}
                      className="col-span-7 px-1 sm:px-2 py-1 sm:py-2 bg-white text-black text-center text-[10px] sm:text-sm font-bold placeholder-gray-400 rounded-md sm:rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400 shadow-inner"
                    />
                    <input
                      type="number"
                      placeholder="Count"
                      value={pairACCount}
                      onChange={(e) => setPairACCount(e.target.value)}
                      className="col-span-5 px-0.5 sm:px-1 py-1 sm:py-2 bg-white text-black text-center text-[10px] sm:text-sm font-bold placeholder-gray-400 rounded-md sm:rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400 shadow-inner"
                    />
                  </div>
                </div>

                {/* Right Column Pair 2: CA */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-white font-black text-sm sm:text-xl min-w-[20px] sm:min-w-[30px] text-center shrink-0">
                    CA
                  </span>
                  <div className="grid grid-cols-12 gap-1 flex-1">
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="Number"
                      value={pairCA}
                      onChange={(e) => setPairCA(e.target.value)}
                      className="col-span-7 px-1 sm:px-2 py-1 sm:py-2 bg-white text-black text-center text-[10px] sm:text-sm font-bold placeholder-gray-400 rounded-md sm:rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400 shadow-inner"
                    />
                    <input
                      type="number"
                      placeholder="Count"
                      value={pairCACount}
                      onChange={(e) => setPairCACount(e.target.value)}
                      className="col-span-5 px-0.5 sm:px-1 py-1 sm:py-2 bg-white text-black text-center text-[10px] sm:text-sm font-bold placeholder-gray-400 rounded-md sm:rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400 shadow-inner"
                    />
                  </div>
                </div>
              </div>

              {/* Centered Pair Button */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleAddPair}
                  className="w-36 sm:w-44 py-2 sm:py-2.5 bg-gradient-to-b from-[#edd177] via-[#c89825] to-[#996e19] text-black font-black text-xs sm:text-sm md:text-base rounded-lg sm:rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all uppercase tracking-wide border border-[#f5e396]/40 text-center"
                >
                  Pair
                </button>
              </div>
            </div>

          </div>

          {/* Right Column (7/12): Ticket Table Display & Action Controls */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-2.5 sm:space-y-4">
            
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

            {/* TOTAL AMOUNT & Action Controls in a Compact Row */}
            <div className="bg-neutral-950 p-2.5 sm:p-4 rounded-xl border border-neutral-800 shadow-md flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-neutral-300">TOTAL:</span>
                <span className="text-lg sm:text-2xl font-black text-gold">₹{totalAmount}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={saveTicket}
                  className="px-4 py-2 bg-neutral-800 text-white hover:text-gold font-extrabold text-xs sm:text-sm tracking-wider rounded-lg border border-neutral-700 shadow uppercase hover:opacity-95 transition-transform active:scale-95"
                >
                  SAVE
                </button>
                <button
                  onClick={payTicket}
                  className="px-5 py-2 bg-gold-metallic text-black font-black text-xs sm:text-sm tracking-wider rounded-lg shadow-md uppercase hover:opacity-95 transition-transform active:scale-95"
                >
                  PAY
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
