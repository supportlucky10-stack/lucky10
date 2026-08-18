import React from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';

export const PayoutStructureView: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-28 sm:pb-36 antialiased select-none font-sans">
      {/* Gold Header Banner */}
      <HeaderBanner title="Payout Structure" />

      <div className="max-w-6xl mx-auto w-full px-3.5 sm:px-8 py-4 sm:py-8 space-y-6">
        
        {/* Top Intro Notice */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 sm:p-5 text-center shadow-lg">
          <p className="text-xs sm:text-sm text-neutral-300 font-medium">
            Official winning prize rates and multiplier structures. All 1 Digit, 2 Digit, and Box prizes are calculated exclusively from the <strong className="text-gold font-bold">1st Prize</strong> number. Super prizes match across <strong className="text-gold font-bold">all 6 published prize tiers</strong>.
          </p>
        </div>

        {/* 4 Prize Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          
          {/* Card 1: 3-Digit Super (All 6 Prizes) */}
          <div className="bg-neutral-950 p-4 sm:p-6 rounded-2xl border border-neutral-800 shadow-xl space-y-4 flex flex-col justify-between hover:border-gold/40 transition-colors">
            <div className="space-y-3">
              <div className="w-full py-2.5 bg-gold-banner text-black font-black text-base sm:text-xl text-center rounded-xl shadow uppercase tracking-wider flex items-center justify-center">
                <span>3 Digit Super</span>
              </div>
              <p className="text-xs sm:text-sm italic text-gray-300 text-center font-normal">
                Matches across all 6 published prize numbers.
              </p>

              <div className="space-y-2 pt-2 text-xs sm:text-sm font-bold">
                <div className="flex justify-between text-gold border-b border-gray-700 pb-1.5 font-black text-xs sm:text-sm uppercase tracking-wide">
                  <span>Prize Tier</span>
                  <span>Payout (per ₹10)</span>
                </div>
                <div className="flex justify-between border-b border-gray-850 pb-1.5">
                  <span className="text-white font-extrabold">1st Prize</span>
                  <span className="text-gold font-black font-mono">₹ 5,000/-</span>
                </div>
                <div className="flex justify-between border-b border-gray-850 pb-1.5">
                  <span className="text-white font-extrabold">2nd Prize</span>
                  <span className="text-white font-black font-mono">₹ 500/-</span>
                </div>
                <div className="flex justify-between border-b border-gray-850 pb-1.5">
                  <span className="text-white font-extrabold">3rd Prize</span>
                  <span className="text-white font-black font-mono">₹ 250/-</span>
                </div>
                <div className="flex justify-between border-b border-gray-850 pb-1.5">
                  <span className="text-white font-extrabold">4th Prize</span>
                  <span className="text-white font-black font-mono">₹ 100/-</span>
                </div>
                <div className="flex justify-between border-b border-gray-850 pb-1.5">
                  <span className="text-white font-extrabold">5th Prize</span>
                  <span className="text-white font-black font-mono">₹ 50/-</span>
                </div>
                <div className="flex justify-between border-b border-gray-850 pb-1.5">
                  <span className="text-white font-extrabold">6th / Compliment</span>
                  <span className="text-white font-black font-mono">₹ 20/-</span>
                </div>
              </div>
            </div>

            <p className="text-gold font-bold text-xs text-center pt-3 border-t border-neutral-900">
              *Payout scales proportionally per ₹10 unit rate
            </p>
          </div>

          {/* Card 2: Box / Shuffle (1st Prize ONLY) */}
          <div className="bg-neutral-950 p-4 sm:p-6 rounded-2xl border border-neutral-800 shadow-xl space-y-4 flex flex-col justify-between hover:border-gold/40 transition-colors">
            <div className="space-y-3">
              <div className="w-full py-2.5 bg-gold-banner text-black font-black text-base sm:text-xl text-center rounded-xl shadow uppercase tracking-wider flex items-center justify-center">
                <span>Box (Shuffle)</span>
              </div>
              <div className="text-xs sm:text-sm italic text-center space-y-0.5">
                <p className="text-gray-300 font-normal">Match permutation rotations of the 3 digits.</p>
                <p className="font-bold text-gold">Based on 1st Prize ONLY</p>
              </div>

              <div className="space-y-2 pt-2 text-xs sm:text-sm font-bold">
                <div className="flex justify-between text-gold border-b border-gray-700 pb-1.5 font-black text-xs sm:text-sm uppercase tracking-wide">
                  <span>Match Category</span>
                  <span>Payout (per ₹10)</span>
                </div>
                <div className="flex justify-between border-b border-gray-850 pb-1.5">
                  <div>
                    <span className="text-white font-extrabold block">Straight</span>
                    <span className="text-[10px] text-gray-400 font-normal">3 unique, exact match</span>
                  </div>
                  <span className="text-gold font-black font-mono flex items-center">₹ 3,000/-</span>
                </div>
                <div className="flex justify-between border-b border-gray-850 pb-1.5">
                  <div>
                    <span className="text-white font-extrabold block">Ulta-Turn</span>
                    <span className="text-[10px] text-gray-400 font-normal">3 unique, permutation match</span>
                  </div>
                  <span className="text-white font-black font-mono flex items-center">₹ 800/-</span>
                </div>
                <div className="flex justify-between border-b border-gray-850 pb-1.5">
                  <div>
                    <span className="text-white font-extrabold block">Double Direct</span>
                    <span className="text-[10px] text-gray-400 font-normal">2 duplicate, exact match</span>
                  </div>
                  <span className="text-gold font-black font-mono flex items-center">₹ 3,800/-</span>
                </div>
                <div className="flex justify-between border-b border-gray-850 pb-1.5">
                  <div>
                    <span className="text-white font-extrabold block">Double Turn</span>
                    <span className="text-[10px] text-gray-400 font-normal">2 duplicate, permutation match</span>
                  </div>
                  <span className="text-white font-black font-mono flex items-center">₹ 1,600/-</span>
                </div>
              </div>
            </div>

            <p className="text-gold font-bold text-xs text-center pt-3 border-t border-neutral-900">
              *Permutations evaluated exclusively against 1st Prize
            </p>
          </div>

          {/* Card 3: 2 Digit (AB, BC, AC — 1st Prize ONLY) */}
          <div className="bg-neutral-950 p-4 sm:p-6 rounded-2xl border border-neutral-800 shadow-xl space-y-4 flex flex-col justify-between hover:border-gold/40 transition-colors">
            <div className="space-y-3">
              <div className="w-full py-2.5 bg-gold-banner text-black font-black text-base sm:text-xl text-center rounded-xl shadow uppercase tracking-wider flex items-center justify-center">
                <span>2 Digit (Pairs)</span>
              </div>
              <div className="text-xs sm:text-sm italic text-center space-y-0.5">
                <p className="text-gray-300 font-normal">Match 2-digit position pairs separately.</p>
                <p className="font-bold text-gold">Based on 1st Prize ONLY</p>
              </div>

              <div className="space-y-2 pt-2 text-xs sm:text-sm font-bold">
                <div className="flex justify-between text-gold border-b border-gray-700 pb-1.5 font-black text-xs sm:text-sm uppercase tracking-wide">
                  <span>Position Pair</span>
                  <span>Payout (per ₹10)</span>
                </div>
                <div className="flex justify-between border-b border-gray-850 pb-1.5">
                  <div>
                    <span className="text-white font-extrabold block">AB Pair</span>
                    <span className="text-[10px] text-gray-400 font-normal">Digits 1 & 2 of 1st Prize</span>
                  </div>
                  <span className="text-gold font-black font-mono flex items-center">₹ 700/-</span>
                </div>
                <div className="flex justify-between border-b border-gray-850 pb-1.5">
                  <div>
                    <span className="text-white font-extrabold block">BC Pair</span>
                    <span className="text-[10px] text-gray-400 font-normal">Digits 2 & 3 of 1st Prize</span>
                  </div>
                  <span className="text-gold font-black font-mono flex items-center">₹ 700/-</span>
                </div>
                <div className="flex justify-between border-b border-gray-850 pb-1.5">
                  <div>
                    <span className="text-white font-extrabold block">AC Pair</span>
                    <span className="text-[10px] text-gray-400 font-normal">Digits 1 & 3 of 1st Prize</span>
                  </div>
                  <span className="text-gold font-black font-mono flex items-center">₹ 700/-</span>
                </div>
              </div>
            </div>

            <p className="text-gold font-bold text-xs text-center pt-3 border-t border-neutral-900">
              *70x multiplier per ₹10 stake per position
            </p>
          </div>

          {/* Card 4: 1 Digit (A, B, C — 1st Prize ONLY) */}
          <div className="bg-neutral-950 p-4 sm:p-6 rounded-2xl border border-neutral-800 shadow-xl space-y-4 flex flex-col justify-between hover:border-gold/40 transition-colors">
            <div className="space-y-3">
              <div className="w-full py-2.5 bg-gold-banner text-black font-black text-base sm:text-xl text-center rounded-xl shadow uppercase tracking-wider flex items-center justify-center">
                <span>1 Digit (Single)</span>
              </div>
              <div className="text-xs sm:text-sm italic text-center space-y-0.5">
                <p className="text-gray-300 font-normal">Match individual digit positions in 1st prize.</p>
                <p className="font-bold text-gold">Based on 1st Prize ONLY</p>
              </div>

              <div className="space-y-2 pt-2 text-xs sm:text-sm font-bold">
                <div className="flex justify-between text-gold border-b border-gray-700 pb-1.5 font-black text-xs sm:text-sm uppercase tracking-wide">
                  <span>Board Position</span>
                  <span>Payout (5 Count)</span>
                </div>
                <div className="flex justify-between border-b border-gray-850 pb-1.5">
                  <div>
                    <span className="text-white font-extrabold block">Position A</span>
                    <span className="text-[10px] text-gray-400 font-normal">1st Digit of 1st Prize</span>
                  </div>
                  <span className="text-gold font-black font-mono flex items-center">₹ 500/-</span>
                </div>
                <div className="flex justify-between border-b border-gray-850 pb-1.5">
                  <div>
                    <span className="text-white font-extrabold block">Position B</span>
                    <span className="text-[10px] text-gray-400 font-normal">2nd Digit of 1st Prize</span>
                  </div>
                  <span className="text-gold font-black font-mono flex items-center">₹ 500/-</span>
                </div>
                <div className="flex justify-between border-b border-gray-850 pb-1.5">
                  <div>
                    <span className="text-white font-extrabold block">Position C</span>
                    <span className="text-[10px] text-gray-400 font-normal">3rd Digit of 1st Prize</span>
                  </div>
                  <span className="text-gold font-black font-mono flex items-center">₹ 500/-</span>
                </div>
              </div>
            </div>

            <p className="text-gold font-bold text-xs text-center pt-3 border-t border-neutral-900">
              *₹12 unit price per count (Minimum 5 Count = ₹60 stake → ₹500 payout)
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
