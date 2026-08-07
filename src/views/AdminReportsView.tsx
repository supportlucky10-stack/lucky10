import React, { useState } from 'react';
import { HeaderBanner } from '../components/HeaderBanner';
import { TrendingUp, Hash, DollarSign } from 'lucide-react';

export const AdminReportsView: React.FC = () => {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <div className="w-full flex-1 bg-black text-white flex flex-col justify-start overflow-y-auto pb-8">
      {/* Gold Header matching Page 15 */}
      <HeaderBanner title="Reports" />

      <div className="px-6 py-6 space-y-6">
        {/* Search Option Filter */}
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg space-y-2">
          <label className="text-xs text-neutral-400 font-bold block">
            Search Option (daily and previous dates):
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="flex-1 bg-black border border-neutral-700 text-white font-mono text-xs px-3 py-2 rounded"
            />
            <button className="px-4 py-2 btn-gold text-xs font-bold">FILTER</button>
          </div>
        </div>

        {/* Daily Report Card */}
        <div className="bg-neutral-950 border border-gold/30 p-4 rounded-lg space-y-3">
          <div className="flex items-center gap-2 text-gold font-black text-base border-b border-neutral-800 pb-2">
            <TrendingUp className="w-5 h-5" />
            <h3>Daily Report Overview</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-neutral-900 p-3 rounded border border-neutral-800">
              <span className="text-neutral-400 block text-[11px]">Total Bets Placed</span>
              <span className="text-white font-bold text-lg font-mono">148</span>
            </div>
            <div className="bg-neutral-900 p-3 rounded border border-neutral-800">
              <span className="text-neutral-400 block text-[11px]">Gross Revenue</span>
              <span className="text-gold font-bold text-lg font-mono">₹ 14,800</span>
            </div>
          </div>
        </div>

        {/* Numbers Count Report */}
        <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <Hash className="w-4 h-4 text-gold" /> Numbers Count Report
            </h3>
            <span className="text-xs text-neutral-400 italic">(Direct, Shuffle, Pair)</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-neutral-900">
              <span className="font-bold text-white">Direct Mode Tickets:</span>
              <span className="font-mono text-gold font-bold">76 Count (₹ 7,600)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-900">
              <span className="font-bold text-white">Shuffle Mode Tickets:</span>
              <span className="font-mono text-gold font-bold">42 Count (₹ 4,200)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-bold text-white">Pair Mode Tickets:</span>
              <span className="font-mono text-gold font-bold">30 Count (₹ 3,000)</span>
            </div>
          </div>
        </div>

        {/* Sales Report (Detail Report) */}
        <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gold" /> Sales Report
            </h3>
            <span className="text-xs text-neutral-400 italic">(Detail Report)</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1">
              <span className="text-neutral-300">1 PM Game Sales:</span>
              <span className="font-mono font-bold text-white">₹ 4,200</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-neutral-300">4 PM Game Sales:</span>
              <span className="font-mono font-bold text-white">₹ 3,800</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-neutral-300">6 PM Game Sales:</span>
              <span className="font-mono font-bold text-white">₹ 3,400</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-neutral-300">8 PM Game Sales:</span>
              <span className="font-mono font-bold text-white">₹ 3,400</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
