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

  // Inputs state
  const [directNum, setDirectNum] = useState('');
  const [directCount, setDirectCount] = useState('');

  const [shuffleNum, setShuffleNum] = useState('');
  const [shuffleCount, setShuffleCount] = useState('');

  const [pairAB, setPairAB] = useState('');
  const [pairABCount, setPairABCount] = useState('');
  const [pairBC, setPairBC] = useState('');
  const [pairBCCount, setPairBCCount] = useState('');
  const [pairAC, setPairAC] = useState('');
  const [pairACCount, setPairACCount] = useState('');

  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const unitPrice = 10; // ₹10 per count

  const handleAddDirect = () => {
    if (!directNum || directNum.length !== 3 || isNaN(Number(directNum))) {
      addToast('Please enter a valid 3-digit number (ABC)', 'error');
      return;
    }
    const count = parseInt(directCount);
    if (!count || count < 1 || count > 20) {
      addToast('Please enter valid count (1-20)', 'error');
      return;
    }
    addToBetSlip({
      number: directNum,
      count,
      type: 'Direct',
      unitPrice,
      totalAmount: count * unitPrice,
    });
    setDirectNum('');
    setDirectCount('');
  };

  const handleAddShuffle = () => {
    if (!shuffleNum || shuffleNum.length !== 3 || isNaN(Number(shuffleNum))) {
      addToast('Please enter a valid 3-digit number to shuffle', 'error');
      return;
    }
    const count = parseInt(shuffleCount);
    if (!count || count < 1 || count > 20) {
      addToast('Please enter valid count (1-20)', 'error');
      return;
    }
    addToBetSlip({
      number: shuffleNum,
      count,
      type: 'Shuffle',
      unitPrice,
      totalAmount: count * unitPrice,
    });
    setShuffleNum('');
    setShuffleCount('');
  };

  const handleAddPair = () => {
    let added = false;
    if (pairAB && pairABCount) {
      const c = parseInt(pairABCount);
      if (c > 0) {
        addToBetSlip({
          number: `AB:${pairAB}`,
          count: c,
          type: 'Pair',
          unitPrice,
          totalAmount: c * unitPrice,
        });
        added = true;
      }
    }
    if (pairBC && pairBCCount) {
      const c = parseInt(pairBCCount);
      if (c > 0) {
        addToBetSlip({
          number: `BC:${pairBC}`,
          count: c,
          type: 'Pair',
          unitPrice,
          totalAmount: c * unitPrice,
        });
        added = true;
      }
    }
    if (pairAC && pairACCount) {
      const c = parseInt(pairACCount);
      if (c > 0) {
        addToBetSlip({
          number: `AC:${pairAC}`,
          count: c,
          type: 'Pair',
          unitPrice,
          totalAmount: c * unitPrice,
        });
        added = true;
      }
    }

    if (!added) {
      addToast('Please enter digits and count for AB, BC, or AC', 'error');
    } else {
      setPairAB('');
      setPairABCount('');
      setPairBC('');
      setPairBCCount('');
      setPairAC('');
      setPairACCount('');
    }
  };

  const totalAmount = betSlip.reduce((sum, item) => sum + item.totalAmount, 0);

  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] bg-black text-white flex flex-col justify-between overflow-hidden relative pb-16 select-none">
      
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
            <h1 className="font-black text-sm sm:text-lg text-white tracking-wide uppercase">
              Hello {currentUser?.name || currentUser?.username || 'User'}
            </h1>
          </div>

          <div className="scale-75 origin-right">
            <Lucky10Logo size="sm" showSubtitle={false} />
          </div>
        </div>

        {/* Combined Sub-Header Info Ribbon */}
        <div className="w-full px-3 sm:px-8 py-1.5 bg-neutral-950/80 border-b border-neutral-900 flex items-center justify-between gap-2 text-xs sm:text-sm">
          {/* Game Slot Switcher */}
          <button
            onClick={() => setCurrentView('CHANGE_GAME')}
            className="px-3 py-1 bg-gold-metallic text-black font-black text-xs sm:text-sm rounded-lg border border-gold shadow animate-gold-blink flex items-center justify-center text-center shrink-0 uppercase tracking-wide"
          >
            <span>{activeGameSlot}</span>
          </button>

          {/* Min / Max Info Badge */}
          <div className="text-gold font-extrabold text-[11px] sm:text-xs tracking-tight text-center">
            Min ₹10 • Max ₹200
          </div>
        </div>

        {/* Responsive Grid Layout */}
        <div className="w-full px-3 sm:px-8 py-3 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 items-start">
          
          {/* Left Column (5/12): Bet Entry Form Card */}
          <div className="lg:col-span-5 bg-neutral-950/90 p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-neutral-800/80 shadow-lg space-y-2.5 sm:space-y-4">
            <h3 className="text-gold font-extrabold text-xs sm:text-sm border-b border-neutral-800/80 pb-1.5 uppercase tracking-wide flex items-center justify-start">
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
            </h3>

            {/* Direct Input Row */}
            <div className="grid grid-cols-12 gap-1.5 sm:gap-2 items-center">
              <input
                type="text"
                maxLength={3}
                placeholder="Direct (ABC)"
                value={directNum}
                onChange={(e) => setDirectNum(e.target.value)}
                className="col-span-6 px-2.5 py-1.5 sm:py-2 bg-white text-black text-xs font-semibold placeholder-gray-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold shadow"
              />
              <input
                type="number"
                placeholder="Count"
                value={directCount}
                onChange={(e) => setDirectCount(e.target.value)}
                className="col-span-2 px-1 py-1.5 sm:py-2 bg-white text-black text-xs font-semibold placeholder-gray-500 rounded-lg focus:outline-none text-center shadow"
              />
              <button
                onClick={handleAddDirect}
                className="col-span-4 py-1.5 sm:py-2 bg-gold-metallic text-black text-xs font-black rounded-lg shadow uppercase hover:opacity-95 transition-transform active:scale-98"
              >
                Direct
              </button>
            </div>

            {/* Shuffle Input Row */}
            <div className="grid grid-cols-12 gap-1.5 sm:gap-2 items-center">
              <input
                type="text"
                maxLength={3}
                placeholder="Shuffle (ABC)"
                value={shuffleNum}
                onChange={(e) => setShuffleNum(e.target.value)}
                className="col-span-6 px-2.5 py-1.5 sm:py-2 bg-white text-black text-xs font-semibold placeholder-gray-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold shadow"
              />
              <input
                type="number"
                placeholder="Count"
                value={shuffleCount}
                onChange={(e) => setShuffleCount(e.target.value)}
                className="col-span-2 px-1 py-1.5 sm:py-2 bg-white text-black text-xs font-semibold placeholder-gray-500 rounded-lg focus:outline-none text-center shadow"
              />
              <button
                onClick={handleAddShuffle}
                className="col-span-4 py-1.5 sm:py-2 bg-gold-metallic text-black text-xs font-black rounded-lg shadow uppercase hover:opacity-95 transition-transform active:scale-98"
              >
                Shuffle
              </button>
            </div>

            {/* Pair Input Row with White Input Boxes */}
            <div className="grid grid-cols-12 gap-1.5 sm:gap-2 items-center">
              <div className="col-span-8 grid grid-cols-3 gap-1 sm:gap-1.5">
                {/* AB Pair Box */}
                <div className="grid grid-cols-2 gap-1">
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="AB"
                    value={pairAB}
                    onChange={(e) => setPairAB(e.target.value)}
                    className="w-full px-1 py-1.5 sm:py-2 bg-white text-black text-xs font-semibold placeholder-gray-500 rounded-lg text-center shadow border-0 focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                  <input
                    type="number"
                    placeholder="Cnt"
                    value={pairABCount}
                    onChange={(e) => setPairABCount(e.target.value)}
                    className="w-full px-1 py-1.5 sm:py-2 bg-white text-black text-xs font-semibold placeholder-gray-500 rounded-lg text-center shadow border-0 focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </div>

                {/* BC Pair Box */}
                <div className="grid grid-cols-2 gap-1">
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="BC"
                    value={pairBC}
                    onChange={(e) => setPairBC(e.target.value)}
                    className="w-full px-1 py-1.5 sm:py-2 bg-white text-black text-xs font-semibold placeholder-gray-500 rounded-lg text-center shadow border-0 focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                  <input
                    type="number"
                    placeholder="Cnt"
                    value={pairBCCount}
                    onChange={(e) => setPairBCCount(e.target.value)}
                    className="w-full px-1 py-1.5 sm:py-2 bg-white text-black text-xs font-semibold placeholder-gray-500 rounded-lg text-center shadow border-0 focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </div>

                {/* AC Pair Box */}
                <div className="grid grid-cols-2 gap-1">
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="AC"
                    value={pairAC}
                    onChange={(e) => setPairAC(e.target.value)}
                    className="w-full px-1 py-1.5 sm:py-2 bg-white text-black text-xs font-semibold placeholder-gray-500 rounded-lg text-center shadow border-0 focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                  <input
                    type="number"
                    placeholder="Cnt"
                    value={pairACCount}
                    onChange={(e) => setPairACCount(e.target.value)}
                    className="w-full px-1 py-1.5 sm:py-2 bg-white text-black text-xs font-semibold placeholder-gray-500 rounded-lg text-center shadow border-0 focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </div>
              </div>

              <div className="col-span-4">
                <button
                  onClick={handleAddPair}
                  className="w-full py-1.5 sm:py-2 bg-gold-metallic text-black text-xs font-black rounded-lg shadow uppercase hover:opacity-95 transition-transform active:scale-98"
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
