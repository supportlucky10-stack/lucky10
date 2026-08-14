import React, { useState } from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';
import { Calendar, Calculator, TrendingUp } from 'lucide-react';

export const AdminReportsView: React.FC = () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [previousDate, setPreviousDate] = useState('2026-08-11');
  const [detailedDate] = useState(todayStr);
  const [activeReportTab, setActiveReportTab] = useState<'DAILY' | 'PREVIOUS' | 'DETAILED'>('DAILY');

  // Today Minimal Report Metrics
  const todayGross = 28500;
  const todayPayouts = 11200;
  const todayNet = todayGross - todayPayouts;

  // Previous Report Metrics
  const prevGross = 24200;
  const prevPayouts = 9800;

  // Detailed Report Metrics
  const detailedGross = detailedDate === todayStr ? todayGross : prevGross;
  const detailedPayouts = detailedDate === todayStr ? todayPayouts : prevPayouts;

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

        {/* TAB 1: DAILY REPORT */}
        {activeReportTab === 'DAILY' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gold" />
                <span>Today's Daily Report Summary</span>
              </h2>
              <span className="text-xs font-mono text-gold bg-neutral-900 border border-gold/40 px-3 py-1 rounded-lg">
                Date: {todayStr}
              </span>
            </div>

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
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PREVIOUS REPORT */}
        {activeReportTab === 'PREVIOUS' && (
          <div className="space-y-6">
            <div className="bg-neutral-950 border border-gold/40 p-4 rounded-xl space-y-2 shadow-md">
              <label className="text-xs text-neutral-400 font-bold block flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gold" /> Select Previous Date:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={previousDate}
                  onChange={(e) => setPreviousDate(e.target.value)}
                  className="flex-1 bg-black border border-neutral-700 text-white font-mono text-xs px-3.5 py-2.5 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DETAILED REPORT */}
        {activeReportTab === 'DETAILED' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl shadow-md">
                <span className="text-neutral-400 text-xs font-bold block mb-1">Gross Collection</span>
                <span className="text-white font-black text-2xl font-mono">₹ {detailedGross.toLocaleString()}</span>
              </div>

              <div className="bg-neutral-900 border border-rose-500/40 p-4 rounded-xl shadow-md">
                <span className="text-rose-400 text-xs font-bold block mb-1">Total Payouts Released</span>
                <span className="text-rose-300 font-black text-2xl font-mono">₹ {detailedPayouts.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
