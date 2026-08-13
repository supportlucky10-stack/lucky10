import React, { useState } from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';
import { useApp } from '../../context/AppContext';
import {
  ClipboardList,
  Trophy,
  BarChart3,
  Calendar,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

type ReportSection = 'HUB' | 'SALES' | 'WINNING' | 'DAILY';

export const MyPlayReportView: React.FC = () => {
  const { userTickets, setCurrentView } = useApp();
  const [activeSection, setActiveSection] = useState<ReportSection>('HUB');

  // Today's Date String
  const todayStr = new Date().toISOString().split('T')[0];

  // Aggregate user sales & winning data
  const totalSales = userTickets.reduce((acc, t) => acc + t.totalAmount, 0);
  const totalWinning = userTickets
    .filter((t) => t.status === 'WON')
    .reduce((acc, t) => acc + (t.winAmount || 0), 0);

  const reportItems = [
    {
      id: 'SALES',
      title: 'SALES REPORT',
      icon: ClipboardList,
      description: 'View sales breakdown by game slot and ticket types',
      action: () => setActiveSection('SALES'),
    },
    {
      id: 'WINNING',
      title: 'WINNING REPORT',
      icon: Trophy,
      description: 'View winning tickets and total payout amounts',
      action: () => setActiveSection('WINNING'),
    },
    {
      id: 'COUNT',
      title: 'COUNT REPORT',
      icon: BarChart3,
      description: 'View total count matrix for games (Super, Box, Pair)',
      action: () => setCurrentView('TODAYS_WINNING_NUMBERS'),
    },
    {
      id: 'DAILY',
      title: 'DAILY REPORT',
      icon: Calendar,
      description: 'View daily opening balance, total sales, and net summary',
      action: () => setActiveSection('DAILY'),
    },
  ];

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-28 sm:pb-36 antialiased select-none font-sans">
      {/* Header Banner */}
      <HeaderBanner
        title={
          activeSection === 'HUB'
            ? 'Report'
            : activeSection === 'SALES'
            ? 'Sales Report'
            : activeSection === 'WINNING'
            ? 'Winning Report'
            : 'Daily Report'
        }
        showBack={true}
        onBackClick={
          activeSection !== 'HUB'
            ? () => setActiveSection('HUB')
            : undefined
        }
      />

      <div className="max-w-md mx-auto w-full px-4 sm:px-6 py-6 space-y-4">
        
        {/* ================= 1. MAIN REPORT HUB MENU (Matching User Image Layout in Gold Theme) ================= */}
        {activeSection === 'HUB' && (
          <div className="space-y-3.5 animate-drop-in">
            {reportItems.map((item) => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full bg-neutral-950 p-4 sm:p-4.5 rounded-2xl border border-neutral-800 flex items-center justify-between shadow-md hover:border-gold/60 hover:bg-neutral-900/80 active:scale-[0.98] transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Metallic Gold Square Badge matching our design system */}
                    <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gold-metallic text-black rounded-xl border border-black flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                      <IconComp className="w-5 h-5 stroke-[2.5]" />
                    </div>

                    <div className="text-left">
                      <span className="text-sm sm:text-base font-black text-gold tracking-wide uppercase block">
                        {item.title}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-gold group-hover:translate-x-1 transition-all shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {/* ================= 2. SALES REPORT SUB-VIEW ================= */}
        {activeSection === 'SALES' && (
          <div className="space-y-4 animate-drop-in">
            {/* Sales Summary Card */}
            <div className="bg-neutral-950 p-4 rounded-2xl border border-gold/60 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="text-xs font-black text-neutral-400 uppercase">TOTAL SALES</span>
                <span className="text-xl font-black text-gold font-mono">₹{totalSales}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-black p-2.5 rounded-xl border border-neutral-850">
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold">Total Tickets</span>
                  <span className="text-white font-mono font-black text-sm">{userTickets.length}</span>
                </div>
                <div className="bg-black p-2.5 rounded-xl border border-neutral-850">
                  <span className="text-neutral-400 block text-[10px] uppercase font-bold">Status</span>
                  <span className="text-emerald-400 font-black text-xs uppercase">Active</span>
                </div>
              </div>
            </div>

            {/* Sales Breakdown by Game Slot Table */}
            <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950 text-xs font-bold">
              <div className="grid grid-cols-3 bg-neutral-900 border-b border-neutral-800 text-gold font-black py-2.5 px-3 text-center uppercase">
                <span>GAME SLOT</span>
                <span>TICKETS</span>
                <span>AMOUNT</span>
              </div>
              <div className="divide-y divide-neutral-850 text-center">
                {['1 PM Game', '3 PM Game', '6 PM Game', '8 PM Game'].map((slot) => {
                  const slotTkts = userTickets.filter((t) => t.gameSlot === slot);
                  const slotAmt = slotTkts.reduce((sum, t) => sum + t.totalAmount, 0);
                  return (
                    <div key={slot} className="grid grid-cols-3 py-3 px-3 items-center">
                      <span className="text-left font-black text-white pl-2">{slot.replace(' Game', '')}</span>
                      <span className="font-mono text-neutral-300">{slotTkts.length}</span>
                      <span className="font-mono text-gold">₹{slotAmt}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setActiveSection('HUB')}
              className="w-full py-2.5 bg-neutral-900 text-neutral-300 font-bold text-xs rounded-xl border border-neutral-800 hover:text-white flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Reports</span>
            </button>
          </div>
        )}

        {/* ================= 3. WINNING REPORT SUB-VIEW ================= */}
        {activeSection === 'WINNING' && (
          <div className="space-y-4 animate-drop-in">
            <div className="bg-neutral-950 p-4 rounded-2xl border border-gold/60 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="text-xs font-black text-neutral-400 uppercase">TOTAL WINNING PAYOUT</span>
                <span className="text-xl font-black text-gold font-mono">₹{totalWinning}</span>
              </div>

              <p className="text-xs text-neutral-400">
                Winning tickets are credited automatically to your account balance upon draw publication.
              </p>
            </div>

            {/* List of Winning Tickets */}
            <div className="space-y-2">
              {userTickets.filter((t) => t.status === 'WON').length === 0 ? (
                <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-800 text-center text-neutral-400 text-xs font-semibold">
                  No winning tickets found yet.
                </div>
              ) : (
                userTickets
                  .filter((t) => t.status === 'WON')
                  .map((tkt) => (
                    <div
                      key={tkt.id}
                      className="bg-neutral-950 p-3.5 rounded-xl border border-emerald-800/60 flex items-center justify-between shadow"
                    >
                      <div>
                        <span className="text-xs font-black text-white uppercase block">{tkt.gameSlot}</span>
                        <span className="text-[10px] text-neutral-400 font-mono">ID: {tkt.id}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-400 font-black text-sm block font-mono">
                          +₹{tkt.winAmount || 0}
                        </span>
                        <span className="text-[10px] text-emerald-500 font-extrabold uppercase">WON</span>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <button
              onClick={() => setActiveSection('HUB')}
              className="w-full py-2.5 bg-neutral-900 text-neutral-300 font-bold text-xs rounded-xl border border-neutral-800 hover:text-white flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Reports</span>
            </button>
          </div>
        )}

        {/* ================= 4. DAILY REPORT SUB-VIEW ================= */}
        {activeSection === 'DAILY' && (
          <div className="space-y-4 animate-drop-in">
            <div className="bg-neutral-950 p-4 rounded-2xl border border-gold/60 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="text-xs font-black text-gold uppercase">DAILY SUMMARY ({todayStr})</span>
              </div>

              <div className="space-y-2 text-xs font-bold">
                <div className="flex justify-between py-1 border-b border-neutral-850">
                  <span className="text-neutral-400">Total Sales</span>
                  <span className="text-white font-mono">₹{totalSales}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-850">
                  <span className="text-neutral-400">Total Payouts</span>
                  <span className="text-rose-400 font-mono">₹{totalWinning}</span>
                </div>
                <div className="flex justify-between py-1 pt-2 font-black text-sm">
                  <span className="text-gold">NET REVENUE</span>
                  <span className="text-gold font-mono">₹{totalSales - totalWinning}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveSection('HUB')}
              className="w-full py-2.5 bg-neutral-900 text-neutral-300 font-bold text-xs rounded-xl border border-neutral-800 hover:text-white flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Reports</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
