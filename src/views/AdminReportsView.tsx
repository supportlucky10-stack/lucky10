import React, { useState } from 'react';
import { HeaderBanner } from '../components/HeaderBanner';
import { Hash, DollarSign, Calendar, Calculator, TrendingUp } from 'lucide-react';

export const AdminReportsView: React.FC = () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [previousDate, setPreviousDate] = useState('2026-08-11');
  const [detailedDate, setDetailedDate] = useState(todayStr);
  const [activeReportTab, setActiveReportTab] = useState<'DAILY' | 'PREVIOUS' | 'DETAILED'>('DAILY');

  // Today Minimal Report Metrics
  const todayGross = 28500;
  const todayPayouts = 11200;
  const todayNet = todayGross - todayPayouts;
  const todayBetsCount = 285;

  // Previous Report Metrics (Mocked based on selected previousDate)
  const prevGross = 24200;
  const prevPayouts = 9800;
  const prevNet = prevGross - prevPayouts;
  const prevBetsCount = 242;

  // Detailed Report Metrics (for detailedDate)
  const detailedGross = detailedDate === todayStr ? todayGross : prevGross;
  const detailedPayouts = detailedDate === todayStr ? todayPayouts : prevPayouts;
  const detailedNet = detailedGross - detailedPayouts;

  const directCount = detailedDate === todayStr ? 142 : 120;
  const directAmount = directCount * 100;

  const shuffleCount = detailedDate === todayStr ? 86 : 72;
  const shuffleAmount = shuffleCount * 100;

  const pairCount = detailedDate === todayStr ? 57 : 50;
  const pairAmount = pairCount * 100;

  const totalBetCount = directCount + shuffleCount + pairCount;

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-16 select-none">
      {/* Gold Header */}
      <HeaderBanner title="Reports" />

      <div className="px-4 sm:px-6 py-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* Report Category Switcher */}
        <div className="flex bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs sm:text-sm font-extrabold">
          <button
            onClick={() => setActiveReportTab('DAILY')}
            className={`flex-1 py-2.5 rounded-lg transition-all cursor-pointer ${
              activeReportTab === 'DAILY' ? 'bg-gold-metallic text-black shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Daily Report
          </button>
          <button
            onClick={() => setActiveReportTab('PREVIOUS')}
            className={`flex-1 py-2.5 rounded-lg transition-all cursor-pointer ${
              activeReportTab === 'PREVIOUS' ? 'bg-gold-metallic text-black shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Previous Report
          </button>
          <button
            onClick={() => setActiveReportTab('DETAILED')}
            className={`flex-1 py-2.5 rounded-lg transition-all cursor-pointer ${
              activeReportTab === 'DETAILED' ? 'bg-gold-metallic text-black shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Detailed Report
          </button>
        </div>

        {/* TAB 1: DAILY REPORT (Minimal Today Summary - NO Date Picker) */}
        {activeReportTab === 'DAILY' && (
          <div className="space-y-6">
            {/* Header Badge */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gold" />
                <span>Today's Daily Report Summary</span>
              </h2>
              <span className="text-xs font-mono text-gold bg-neutral-900 border border-gold/40 px-3 py-1 rounded-lg">
                Date: {todayStr}
              </span>
            </div>

            {/* Minimal Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl shadow-md space-y-1">
                <span className="text-neutral-400 text-xs font-extrabold uppercase tracking-wider block">
                  Gross Collection
                </span>
                <span className="text-white font-black text-2xl font-mono block">
                  ₹ {todayGross.toLocaleString()}
                </span>
              </div>

              <div className="bg-neutral-900 border border-rose-500/40 p-4 rounded-xl shadow-md space-y-1">
                <span className="text-rose-400 text-xs font-extrabold uppercase tracking-wider block">
                  Total Payouts Released
                </span>
                <span className="text-rose-300 font-black text-2xl font-mono block">
                  ₹ {todayPayouts.toLocaleString()}
                </span>
              </div>

              <div className="bg-neutral-900 border border-gold/50 p-4 rounded-xl shadow-md space-y-1 relative overflow-hidden">
                <span className="text-gold text-xs font-black uppercase tracking-wider block flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5" /> Net Revenue Amount
                </span>
                <span className="text-gold font-black text-2xl font-mono block">
                  ₹ {todayNet.toLocaleString()}
                </span>
                <span className="text-[10px] text-neutral-500 font-mono block">
                  (Gross Collection - Payouts)
                </span>
              </div>
            </div>

            {/* Minimal Summary Stats */}
            <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-400">Total Bets Placed Today:</span>
              <span className="text-white font-black text-sm">{todayBetsCount} Bets</span>
            </div>
          </div>
        )}

        {/* TAB 2: PREVIOUS REPORT (Includes Date Select Option) */}
        {activeReportTab === 'PREVIOUS' && (
          <div className="space-y-6">
            {/* Date Select Option for Previous Report */}
            <div className="bg-neutral-950 border border-gold/40 p-4 rounded-xl space-y-2 shadow-md">
              <label className="text-xs text-neutral-400 font-bold block flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gold" /> Select Previous Date:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={previousDate}
                  max={new Date(Date.now() - 86400000).toISOString().split('T')[0]}
                  onChange={(e) => setPreviousDate(e.target.value)}
                  className="flex-1 bg-black border border-neutral-700 text-white font-mono text-xs px-3.5 py-2.5 rounded-lg"
                />
                <button className="px-5 py-2.5 bg-gold-metallic text-black text-xs font-extrabold rounded-lg uppercase cursor-pointer">
                  LOAD REPORT
                </button>
              </div>
            </div>

            {/* Previous Report Summary Cards for Selected Date */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <h3 className="text-sm font-extrabold text-white">
                  Previous Report Overview ({previousDate})
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl shadow-md space-y-1">
                  <span className="text-neutral-400 text-xs font-extrabold uppercase tracking-wider block">
                    Gross Collection
                  </span>
                  <span className="text-white font-black text-2xl font-mono block">
                    ₹ {prevGross.toLocaleString()}
                  </span>
                </div>

                <div className="bg-neutral-900 border border-rose-500/40 p-4 rounded-xl shadow-md space-y-1">
                  <span className="text-rose-400 text-xs font-extrabold uppercase tracking-wider block">
                    Total Payouts Released
                  </span>
                  <span className="text-rose-300 font-black text-2xl font-mono block">
                    ₹ {prevPayouts.toLocaleString()}
                  </span>
                </div>

                <div className="bg-neutral-900 border border-gold/50 p-4 rounded-xl shadow-md space-y-1">
                  <span className="text-gold text-xs font-black uppercase tracking-wider block flex items-center gap-1">
                    <Calculator className="w-3.5 h-3.5" /> Net Revenue Amount
                  </span>
                  <span className="text-gold font-black text-2xl font-mono block">
                    ₹ {prevNet.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400">Total Bets Placed on {previousDate}:</span>
                <span className="text-white font-black text-sm">{prevBetsCount} Bets</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DETAILED REPORT (Includes Date Select Option + Complete Breakdown) */}
        {activeReportTab === 'DETAILED' && (
          <div className="space-y-6">
            {/* Date Select Option for Detailed Report */}
            <div className="bg-neutral-950 border border-gold/40 p-4 rounded-xl space-y-2 shadow-md">
              <label className="text-xs text-neutral-400 font-bold block flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gold" /> Select Date for Detailed Report:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={detailedDate}
                  onChange={(e) => setDetailedDate(e.target.value)}
                  className="flex-1 bg-black border border-neutral-700 text-white font-mono text-xs px-3.5 py-2.5 rounded-lg"
                />
                <button className="px-5 py-2.5 bg-gold-metallic text-black text-xs font-extrabold rounded-lg uppercase cursor-pointer">
                  FILTER DETAILED REPORT
                </button>
              </div>
            </div>

            {/* Summary Net Calculation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl shadow-md">
                <span className="text-neutral-400 text-xs font-bold block mb-1">Gross Collection</span>
                <span className="text-white font-black text-2xl font-mono">₹ {detailedGross.toLocaleString()}</span>
              </div>

              <div className="bg-neutral-900 border border-rose-500/40 p-4 rounded-xl shadow-md">
                <span className="text-rose-400 text-xs font-bold block mb-1">Total Payouts Released</span>
                <span className="text-rose-300 font-black text-2xl font-mono">₹ {detailedPayouts.toLocaleString()}</span>
              </div>

              <div className="bg-neutral-900 border border-gold/50 p-4 rounded-xl shadow-md relative overflow-hidden">
                <span className="text-gold text-xs font-black block mb-1 flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5" /> Net Revenue Amount
                </span>
                <span className="text-gold font-black text-2xl font-mono">₹ {detailedNet.toLocaleString()}</span>
                <span className="text-[10px] text-neutral-500 block mt-1 font-mono">(Gross Collection - Payouts)</span>
              </div>
            </div>

            {/* All Bet Mode Counts (Separate Breakdown) */}
            <div className="bg-neutral-950 border border-gold/30 p-5 rounded-xl space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gold" />
                  <span>All Bet Mode Counts (Separate Breakdown)</span>
                </h3>
                <span className="text-xs text-neutral-400 font-mono">Total Bets: {totalBetCount}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-neutral-900 p-3.5 rounded-xl border border-neutral-800 space-y-1">
                  <span className="text-neutral-400 text-[11px] font-bold block">Direct Mode Bets</span>
                  <span className="text-white font-black text-lg font-mono">{directCount} Count</span>
                  <span className="text-gold font-bold text-xs block font-mono">₹ {directAmount.toLocaleString()}</span>
                </div>

                <div className="bg-neutral-900 p-3.5 rounded-xl border border-neutral-800 space-y-1">
                  <span className="text-neutral-400 text-[11px] font-bold block">Shuffle Mode Bets</span>
                  <span className="text-white font-black text-lg font-mono">{shuffleCount} Count</span>
                  <span className="text-gold font-bold text-xs block font-mono">₹ {shuffleAmount.toLocaleString()}</span>
                </div>

                <div className="bg-neutral-900 p-3.5 rounded-xl border border-neutral-800 space-y-1">
                  <span className="text-neutral-400 text-[11px] font-bold block">Pair Mode Bets</span>
                  <span className="text-white font-black text-lg font-mono">{pairCount} Count</span>
                  <span className="text-gold font-bold text-xs block font-mono">₹ {pairAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Sales & Payout Net Calculation by Game Slot */}
            <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-xl space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gold" />
                  <span>Game Slot Revenue &amp; Net Calculation</span>
                </h3>
                <span className="text-xs text-neutral-400 italic">Detailed Report ({detailedDate})</span>
              </div>

              <div className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-900 text-xs">
                <div className="grid grid-cols-12 bg-neutral-950 text-gold font-extrabold p-3">
                  <span className="col-span-3">Game Slot</span>
                  <span className="col-span-3 text-right">Collection</span>
                  <span className="col-span-3 text-right">Payout</span>
                  <span className="col-span-3 text-right">Net Amount</span>
                </div>

                <div className="divide-y divide-neutral-800 font-mono">
                  {[
                    { slot: '1 PM Game', sales: 8500, payout: 3500 },
                    { slot: '3 PM Game', sales: 7200, payout: 2800 },
                    { slot: '6 PM Game', sales: 6400, payout: 2400 },
                    { slot: '8 PM Game', sales: 6400, payout: 2500 },
                  ].map((row) => (
                    <div key={row.slot} className="grid grid-cols-12 p-3 items-center">
                      <span className="col-span-3 font-bold text-white">{row.slot}</span>
                      <span className="col-span-3 text-right text-white">₹{row.sales}</span>
                      <span className="col-span-3 text-right text-rose-400">₹{row.payout}</span>
                      <span className="col-span-3 text-right text-gold font-bold">
                        ₹{row.sales - row.payout}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
