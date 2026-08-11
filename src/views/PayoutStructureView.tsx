import React from 'react';
import { HeaderBanner } from '../components/HeaderBanner';

export const PayoutStructureView: React.FC = () => {
  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] bg-black text-white flex flex-col justify-start overflow-y-auto pb-16 select-none">
      {/* Gold Header Banner */}
      <HeaderBanner title="Payout Structure" />

      <div className="max-w-6xl mx-auto w-full px-3.5 sm:px-10 py-4 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
          
          {/* Direct Section */}
          <div className="bg-neutral-950 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-neutral-800 shadow-xl space-y-3 sm:space-y-4 flex flex-col justify-between hover:border-gold/40 transition-colors">
            <div>
              <div className="w-full py-2 sm:py-3.5 bg-gold-banner text-black font-black text-lg sm:text-2xl text-center rounded-lg sm:rounded-xl shadow uppercase tracking-wide flex items-center justify-center gap-2 sm:gap-3">
                <img src="/assets/gold-ticket.png" alt="Direct" className="w-5 h-5 sm:w-8 sm:h-8 object-contain brightness-0" />
                <span>Direct</span>
              </div>
              <p className="text-xs sm:text-base italic text-gray-200 text-center font-normal pt-2 sm:pt-3">
                Match the winning number in the exact order.
              </p>

              <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-6 text-xs sm:text-base font-bold">
                <div className="flex justify-between text-gold border-b border-gray-400 pb-1.5 font-black text-xs sm:text-lg">
                  <span className="underline">Prize Tier</span>
                  <span className="underline">Payout (per ₹10)</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-1.5">
                  <span className="text-white font-extrabold">1st Prize</span>
                  <span className="text-white font-black font-mono">₹ 5,000/-</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-1.5">
                  <span className="text-white font-extrabold">2nd Prize</span>
                  <span className="text-white font-black font-mono">₹ 5,000/-</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-1.5">
                  <span className="text-white font-extrabold">3rd Prize</span>
                  <span className="text-white font-black font-mono">₹ 2,500/-</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-1.5">
                  <span className="text-white font-extrabold">4th Prize</span>
                  <span className="text-white font-black font-mono">₹ 1,000/-</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-1.5 text-xs sm:text-base">
                  <span className="text-white font-extrabold">Complements</span>
                  <span className="text-white font-bold text-right">
                    ₹ 20/- <span className="italic text-gray-300 font-normal text-[11px] block sm:inline">Per matching number</span>
                  </span>
                </div>
              </div>
            </div>

            <p className="text-gold font-black text-sm sm:text-lg text-center pt-3 sm:pt-6 border-t border-neutral-900">
              *Max Win: ₹1,00,000 (at ₹200 Stake)
            </p>
          </div>

          {/* Shuffle Section */}
          <div className="bg-neutral-950 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-neutral-800 shadow-xl space-y-3 sm:space-y-4 flex flex-col justify-between hover:border-gold/40 transition-colors">
            <div>
              <div className="w-full py-2 sm:py-3.5 bg-gold-banner text-black font-black text-lg sm:text-2xl text-center rounded-lg sm:rounded-xl shadow uppercase tracking-wide flex items-center justify-center gap-2 sm:gap-3">
                <img src="/assets/gold-calendar.png" alt="Shuffle" className="w-5 h-5 sm:w-8 sm:h-8 object-contain brightness-0" />
                <span>Shuffle</span>
              </div>
              <p className="text-xs sm:text-base italic text-gray-200 text-center font-normal pt-2 sm:pt-3">
                Match the winning numbers in any order. Based on the 1st Prize Number
              </p>

              <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-6 text-xs sm:text-base font-bold">
                <div className="flex justify-between text-gold border-b border-gray-400 pb-1.5 font-black text-xs sm:text-lg">
                  <span className="underline">Match Type</span>
                  <span className="underline">Payout (per ₹10)</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-1.5">
                  <span className="text-white font-extrabold">Correct Digit</span>
                  <span className="text-white font-black font-mono">₹ 3,000/-</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-1.5">
                  <span className="text-white font-extrabold">Other Rotation</span>
                  <span className="text-white font-black font-mono">₹ 800/-</span>
                </div>
              </div>
            </div>

            <p className="text-gold font-black text-sm sm:text-lg text-center pt-3 sm:pt-6 border-t border-neutral-900">
              *Max Win: ₹60,000 (at ₹200 Stake)
            </p>
          </div>

          {/* Pair Section */}
          <div className="bg-neutral-950 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-neutral-800 shadow-xl space-y-3 sm:space-y-4 flex flex-col justify-between hover:border-gold/40 transition-colors">
            <div>
              <div className="w-full py-2 sm:py-3.5 bg-gold-banner text-black font-black text-lg sm:text-2xl text-center rounded-lg sm:rounded-xl shadow uppercase tracking-wide flex items-center justify-center gap-2 sm:gap-3">
                <img src="/assets/gold-trophy.png" alt="Pair" className="w-5 h-5 sm:w-8 sm:h-8 object-contain brightness-0" />
                <span>Pair</span>
              </div>
              <p className="text-xs sm:text-base italic text-gray-200 text-center font-normal pt-2 sm:pt-3">
                Match two specific digits in their exact positions. Based on the 1st Prize Number
              </p>

              <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-6 text-xs sm:text-base font-bold">
                <div className="flex justify-between text-gold border-b border-gray-400 pb-1.5 font-black text-xs sm:text-lg">
                  <span className="underline">Position</span>
                  <span className="underline">Payout (per ₹10)</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-1.5">
                  <span className="text-white font-extrabold">AB • BC • AC</span>
                  <span className="text-white font-black font-mono">₹ 500/-</span>
                </div>
              </div>
            </div>

            <p className="text-gold font-black text-sm sm:text-lg text-center pt-3 sm:pt-6 border-t border-neutral-900">
              *Max Win: ₹10,000 (at ₹200 Stake)
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
