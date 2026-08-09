import React from 'react';
import { HeaderBanner } from '../components/HeaderBanner';

export const PayoutStructureView: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-32 sm:pb-36">
      {/* Gold Header Banner */}
      <HeaderBanner title="Payout Structure" />

      <div className="max-w-6xl mx-auto w-full px-6 sm:px-10 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Direct Section */}
          <div className="bg-neutral-950 p-7 sm:p-8 rounded-3xl border-2 border-neutral-800 shadow-2xl space-y-4 flex flex-col justify-between hover:border-gold/40 transition-colors">
            <div>
              <div className="w-full py-3.5 bg-gold-banner text-black font-black text-2xl sm:text-3xl text-center rounded-xl shadow-lg uppercase tracking-wide flex items-center justify-center gap-3">
                <img src="/assets/gold-ticket.png" alt="Direct" className="w-8 h-8 object-contain" />
                <span>Direct</span>
              </div>
              <p className="text-sm sm:text-base italic text-gray-200 text-center font-normal pt-3">
                Match the winning number in the exact order.
              </p>

              <div className="space-y-3 pt-6 text-base sm:text-lg font-bold">
                <div className="flex justify-between text-gold border-b-2 border-gray-400 pb-2 font-black text-lg sm:text-xl">
                  <span className="underline">Prize Tier</span>
                  <span className="underline">Payout (per ₹10)</span>
                </div>
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-white font-extrabold">1st Prize</span>
                  <span className="text-white font-black font-mono">₹ 5,000/-</span>
                </div>
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-white font-extrabold">2nd Prize</span>
                  <span className="text-white font-black font-mono">₹ 5,000/-</span>
                </div>
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-white font-extrabold">3rd Prize</span>
                  <span className="text-white font-black font-mono">₹ 2,500/-</span>
                </div>
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-white font-extrabold">4th Prize</span>
                  <span className="text-white font-black font-mono">₹ 1,000/-</span>
                </div>
                <div className="flex justify-between border-b border-gray-700 pb-2 text-sm sm:text-base">
                  <span className="text-white font-extrabold">Complements</span>
                  <span className="text-white font-bold">
                    ₹ 20/- <span className="italic text-gray-300 font-normal">Per matching number</span>
                  </span>
                </div>
              </div>
            </div>

            <p className="text-gold font-black text-lg sm:text-xl text-center pt-6 border-t border-neutral-900">
              *Max Win: ₹1,00,000 (at ₹200 Stake)
            </p>
          </div>

          {/* Shuffle Section */}
          <div className="bg-neutral-950 p-7 sm:p-8 rounded-3xl border-2 border-neutral-800 shadow-2xl space-y-4 flex flex-col justify-between hover:border-gold/40 transition-colors">
            <div>
              <div className="w-full py-3.5 bg-gold-banner text-black font-black text-2xl sm:text-3xl text-center rounded-xl shadow-lg uppercase tracking-wide flex items-center justify-center gap-3">
                <img src="/assets/gold-calendar.png" alt="Shuffle" className="w-8 h-8 object-contain" />
                <span>Shuffle</span>
              </div>
              <p className="text-sm sm:text-base italic text-gray-200 text-center font-normal pt-3">
                Match the winning numbers in any order. Based on the 1st Prize Number
              </p>

              <div className="space-y-3 pt-6 text-base sm:text-lg font-bold">
                <div className="flex justify-between text-gold border-b-2 border-gray-400 pb-2 font-black text-lg sm:text-xl">
                  <span className="underline">Match Type</span>
                  <span className="underline">Payout (per ₹10)</span>
                </div>
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-white font-extrabold">Correct Digit</span>
                  <span className="text-white font-black font-mono">₹ 3,000/-</span>
                </div>
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-white font-extrabold">Other Rotation</span>
                  <span className="text-white font-black font-mono">₹ 800/-</span>
                </div>
              </div>
            </div>

            <p className="text-gold font-black text-lg sm:text-xl text-center pt-6 border-t border-neutral-900">
              *Max Win: ₹60,000 (at ₹200 Stake)
            </p>
          </div>

          {/* Pair Section */}
          <div className="bg-neutral-950 p-7 sm:p-8 rounded-3xl border-2 border-neutral-800 shadow-2xl space-y-4 flex flex-col justify-between hover:border-gold/40 transition-colors">
            <div>
              <div className="w-full py-3.5 bg-gold-banner text-black font-black text-2xl sm:text-3xl text-center rounded-xl shadow-lg uppercase tracking-wide flex items-center justify-center gap-3">
                <img src="/assets/gold-trophy.png" alt="Pair" className="w-8 h-8 object-contain" />
                <span>Pair</span>
              </div>
              <p className="text-sm sm:text-base italic text-gray-200 text-center font-normal pt-3">
                Match two specific digits in their exact positions. Based on the 1st Prize Number
              </p>

              <div className="space-y-3 pt-6 text-base sm:text-lg font-bold">
                <div className="flex justify-between text-gold border-b-2 border-gray-400 pb-2 font-black text-lg sm:text-xl">
                  <span className="underline">Position</span>
                  <span className="underline">Payout (per ₹10)</span>
                </div>
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-white font-extrabold">AB • BC • AC</span>
                  <span className="text-white font-black font-mono">₹ 500/-</span>
                </div>
              </div>
            </div>

            <p className="text-gold font-black text-lg sm:text-xl text-center pt-6 border-t border-neutral-900">
              *Max Win: ₹10,000 (at ₹200 Stake)
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
