import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Menu, Trash2 } from 'lucide-react';
import { Lucky10Logo } from '../components/Lucky10Logo';

export const GameDashboardView: React.FC = () => {
  const {
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
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-between overflow-y-auto relative pb-24">
      {/* 100% Full Webpage Width Header Bar */}
      <div className="w-full px-6 sm:px-10 py-4 bg-black flex items-center justify-between border-b border-neutral-900">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentView('USER_DRAWER')}
            className="p-2 text-gold hover:opacity-80 transition-opacity bg-neutral-950 rounded-lg border border-neutral-800 shadow"
            title="Open Menu"
          >
            <Menu className="w-7 h-7 stroke-[2.5]" />
          </button>
          <h1 className="font-black text-xl sm:text-2xl text-white tracking-wide hidden sm:block">
            LUCKY 10 GAME DASHBOARD
          </h1>
        </div>

        <div className="scale-90 origin-right">
          <Lucky10Logo size="sm" showSubtitle={false} />
        </div>
      </div>

      {/* Sub Header Bar - 100% Full Width */}
      <div className="w-full px-6 sm:px-10 py-3 flex items-center justify-between">
        <button
          onClick={() => setCurrentView('CHANGE_GAME')}
          className="px-5 py-2 bg-gold-metallic text-black font-black text-base rounded-lg shadow hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <img src="/assets/gold-calendar.png" alt="Calendar" className="w-6 h-6 object-contain" />
          <span>{activeGameSlot}</span>
        </button>

        <button
          onClick={() => setShowHowToPlay(true)}
          className="text-white hover:text-gold underline font-bold text-sm sm:text-base flex items-center gap-1.5"
        >
          <img src="/assets/gold-question.png" alt="Help" className="w-5 h-5 object-contain" />
          <span>How to Play the Game?</span>
        </button>
      </div>

      {/* Min / Max Info Bar - 100% Full Width */}
      <div className="w-full px-6 sm:px-10 py-2 flex items-center justify-between text-gold font-extrabold text-base border-b border-neutral-900">
        <span>Minimum ₹10</span>
        <span>Maximum ₹200</span>
      </div>

      {/* 100% Full Width Web Grid Layout */}
      <div className="w-full px-6 sm:px-10 my-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1">
        
        {/* Left Column (5/12): Bet Entry Form Card */}
        <div className="lg:col-span-5 bg-neutral-950 p-6 sm:p-7 rounded-2xl border border-neutral-800 shadow-xl space-y-5">
          <h3 className="text-gold font-extrabold text-lg border-b border-neutral-800 pb-2">
            Select Bet Mode &amp; Entry
          </h3>

          {/* Direct Input Row */}
          <div className="grid grid-cols-12 gap-2.5 items-center">
            <input
              type="text"
              maxLength={3}
              placeholder="Number [ABC]"
              value={directNum}
              onChange={(e) => setDirectNum(e.target.value)}
              className="col-span-6 px-4 py-3 bg-white text-black text-sm font-semibold placeholder-gray-500 rounded-lg focus:outline-none shadow"
            />
            <input
              type="number"
              placeholder="Count"
              value={directCount}
              onChange={(e) => setDirectCount(e.target.value)}
              className="col-span-2 px-2 py-3 bg-white text-black text-sm font-semibold placeholder-gray-500 rounded-lg focus:outline-none text-center shadow"
            />
            <button
              onClick={handleAddDirect}
              className="col-span-4 py-3 bg-gold-metallic text-black text-sm font-black rounded-lg shadow uppercase hover:opacity-95 transition-transform active:scale-98"
            >
              Direct
            </button>
          </div>

          {/* Shuffle Input Row */}
          <div className="grid grid-cols-12 gap-2.5 items-center">
            <input
              type="text"
              maxLength={3}
              placeholder="Number [ABC, BCA, ACB] etc."
              value={shuffleNum}
              onChange={(e) => setShuffleNum(e.target.value)}
              className="col-span-6 px-4 py-3 bg-white text-black text-sm font-semibold placeholder-gray-500 rounded-lg focus:outline-none shadow"
            />
            <input
              type="number"
              placeholder="Count"
              value={shuffleCount}
              onChange={(e) => setShuffleCount(e.target.value)}
              className="col-span-2 px-2 py-3 bg-white text-black text-sm font-semibold placeholder-gray-500 rounded-lg focus:outline-none text-center shadow"
            />
            <button
              onClick={handleAddShuffle}
              className="col-span-4 py-3 bg-gold-metallic text-black text-sm font-black rounded-lg shadow uppercase hover:opacity-95 transition-transform active:scale-98"
            >
              Shuffle
            </button>
          </div>

          {/* Pair Input Row */}
          <div className="grid grid-cols-12 gap-2 items-center bg-black p-3 rounded-xl border border-neutral-900 shadow">
            <div className="col-span-8 grid grid-cols-3 gap-1.5">
              <div className="flex items-center gap-1 bg-white rounded-lg px-2 py-2">
                <span className="text-xs text-gray-500 font-bold">AB</span>
                <input
                  type="text"
                  placeholder="Count"
                  value={pairABCount}
                  onChange={(e) => {
                    setPairAB('12');
                    setPairABCount(e.target.value);
                  }}
                  className="w-full text-black text-xs font-semibold text-center outline-none bg-transparent"
                />
              </div>
              <div className="flex items-center gap-1 bg-white rounded-lg px-2 py-2">
                <span className="text-xs text-gray-500 font-bold">BC</span>
                <input
                  type="text"
                  placeholder="Count"
                  value={pairBCCount}
                  onChange={(e) => {
                    setPairBC('34');
                    setPairBCCount(e.target.value);
                  }}
                  className="w-full text-black text-xs font-semibold text-center outline-none bg-transparent"
                />
              </div>
              <div className="flex items-center gap-1 bg-white rounded-lg px-2 py-2">
                <span className="text-xs text-gray-500 font-bold">AC</span>
                <input
                  type="text"
                  placeholder="Count"
                  value={pairACCount}
                  onChange={(e) => {
                    setPairAC('56');
                    setPairACCount(e.target.value);
                  }}
                  className="w-full text-black text-xs font-semibold text-center outline-none bg-transparent"
                />
              </div>
            </div>

            <div className="col-span-4">
              <button
                onClick={handleAddPair}
                className="w-full py-3 bg-gold-metallic text-black text-sm font-black rounded-lg shadow uppercase hover:opacity-95 transition-transform active:scale-98"
              >
                Pair
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (7/12): Ticket Table Display & Action Controls */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="w-full border-2 border-white rounded-2xl overflow-hidden bg-white text-black min-h-[300px] shadow-2xl">
            <div className="grid grid-cols-12 bg-white border-b-2 border-black font-extrabold text-lg py-3.5 px-4 text-center">
              <span className="col-span-4 border-r-2 border-black">Number</span>
              <span className="col-span-4 border-r-2 border-black">Count</span>
              <span className="col-span-4">Type</span>
            </div>

            <div className="divide-y divide-gray-200 max-h-[260px] overflow-y-auto text-base font-bold">
              {betSlip.length === 0 ? (
                <div className="py-20 text-center text-neutral-400 italic font-normal text-base">
                  No tickets added to slip yet
                </div>
              ) : (
                betSlip.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 py-3 px-4 items-center text-center">
                    <span className="col-span-4 font-mono text-lg text-black border-r border-gray-200">
                      {item.number}
                    </span>
                    <span className="col-span-4 font-mono text-lg text-black border-r border-gray-200">
                      {item.count}
                    </span>
                    <span className="col-span-3 text-black font-bold">{item.type}</span>
                    <button
                      onClick={() => removeFromBetSlip(item.id)}
                      className="col-span-1 text-red-600 hover:text-red-800 flex justify-center"
                      title="Remove"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* TOTAL AMOUNT Banner */}
          <div className="bg-white text-black font-black text-xl py-4 px-6 rounded-2xl border-2 border-black flex justify-between items-center shadow-lg">
            <span>TOTAL AMOUNT :</span>
            <span className="text-3xl font-black text-black">₹{totalAmount}</span>
          </div>

          {/* SAVE & PAY Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={saveTicket}
              className="w-full py-4 bg-gold-metallic text-black font-black text-lg tracking-wider rounded-xl shadow-lg uppercase hover:opacity-95 transition-transform active:scale-98"
            >
              SAVE
            </button>
            <button
              onClick={payTicket}
              className="w-full py-4 bg-gold-metallic text-black font-black text-lg tracking-wider rounded-xl shadow-lg uppercase hover:opacity-95 transition-transform active:scale-98"
            >
              PAY
            </button>
          </div>
        </div>

      </div>



      {/* How to Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-gold rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-center">
              <img src="/assets/gold-question.png" alt="How to Play" className="w-14 h-14 object-contain" />
            </div>
            <h3 className="text-gold font-extrabold text-xl text-center border-b border-neutral-800 pb-2">
              How to Play LUCKY 10
            </h3>
            <div className="space-y-3 text-sm text-neutral-200">
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
                or AC) in exact position. Win up to ₹10,000!
              </p>
            </div>
            <button
              onClick={() => setShowHowToPlay(false)}
              className="w-full py-3 bg-gold-metallic text-black font-bold text-sm rounded-lg"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
