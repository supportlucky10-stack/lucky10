import React, { useState } from 'react';
import { HeaderBanner } from '../components/HeaderBanner';
import { useApp } from '../context/AppContext';
import { Calendar, Ticket, CreditCard, Clock, CheckCircle2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import type { GameSlot } from '../types';

export const MyPlayReportView: React.FC = () => {
  const { userTickets } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'TODAYS_GAMES' | 'PREVIOUS_HISTORY' | 'PAYMENTS'>('TODAYS_GAMES');
  const [historyDate, setHistoryDate] = useState(
    new Date(Date.now() - 86400000).toISOString().split('T')[0]
  );
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'BET' | 'PAYOUT'>('ALL');

  // Today's Date String
  const todayStr = new Date().toISOString().split('T')[0];

  // Filter Today's Tickets
  const todaysTickets = userTickets.filter(
    (t) => t.placedAt.startsWith(todayStr) || t.placedAt.includes('Today')
  );

  // Mock Previous Tickets
  const previousTickets = [
    {
      id: 'TKT-77102',
      gameSlot: '8 PM Game' as GameSlot,
      items: [
        { id: '1', number: '742', count: 2, type: 'Direct' as const, unitPrice: 10, totalAmount: 20 },
        { id: '2', number: '350', count: 1, type: 'Shuffle' as const, unitPrice: 10, totalAmount: 10 },
      ],
      totalAmount: 30,
      placedAt: 'Yesterday, 7:45 PM',
      status: 'WON' as const,
      winAmount: 5000,
    },
    {
      id: 'TKT-77098',
      gameSlot: '6 PM Game' as GameSlot,
      items: [
        { id: '3', number: 'AB: 81', count: 3, type: 'Pair' as const, unitPrice: 10, totalAmount: 30 },
      ],
      totalAmount: 30,
      placedAt: 'Yesterday, 5:50 PM',
      status: 'LOST' as const,
    },
    {
      id: 'TKT-76541',
      gameSlot: '3 PM Game' as GameSlot,
      items: [
        { id: '4', number: '819', count: 5, type: 'Direct' as const, unitPrice: 10, totalAmount: 50 },
      ],
      totalAmount: 50,
      placedAt: '10 Aug 2026, 2:40 PM',
      status: 'WON' as const,
      winAmount: 15500,
    },
  ];

  // Mock Payments / Transactions
  const paymentHistory = [
    {
      id: 'TXN-99812',
      title: 'Game Bet Payment (1 PM Game)',
      amount: -120,
      method: 'Wallet Balance',
      status: 'SUCCESS',
      timestamp: 'Today, 12:45 PM',
      type: 'BET',
    },
    {
      id: 'TXN-99754',
      title: 'Winning Payout Received',
      amount: +5000,
      method: 'Bank Transfer (HDFC Bank •••• 4312)',
      status: 'SUCCESS',
      timestamp: 'Today, 1:15 PM',
      type: 'PAYOUT',
    },
    {
      id: 'TXN-99610',
      title: 'Game Bet Payment (8 PM Game)',
      amount: -50,
      method: 'Wallet Balance',
      status: 'SUCCESS',
      timestamp: 'Yesterday, 7:50 PM',
      type: 'BET',
    },
    {
      id: 'TXN-99580',
      title: 'Winning Payout Received',
      amount: +15500,
      method: 'Bank Transfer (SBI •••• 8819)',
      status: 'SUCCESS',
      timestamp: '10 Aug 2026, 3:30 PM',
      type: 'PAYOUT',
    },
  ];

  const filteredPayments = paymentHistory.filter((p) => {
    if (paymentFilter === 'BET') return p.type === 'BET';
    if (paymentFilter === 'PAYOUT') return p.type === 'PAYOUT';
    return true;
  });

  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] bg-black text-white flex flex-col justify-start overflow-y-auto pb-16 select-none">
      {/* Gold Header Banner */}
      <HeaderBanner title="My Play Report" />

      <div className="max-w-4xl mx-auto w-full px-3.5 sm:px-6 py-4 space-y-4">
        
        {/* Navigation Sub-Tabs */}
        <div className="bg-neutral-950 p-1.5 rounded-xl border border-neutral-800 grid grid-cols-3 gap-1 shadow-md">
          <button
            onClick={() => setActiveSubTab('TODAYS_GAMES')}
            className={`py-2 px-2 rounded-lg font-black text-[11px] sm:text-sm tracking-tight flex items-center justify-center gap-1.5 transition-all ${
              activeSubTab === 'TODAYS_GAMES'
                ? 'bg-gold-banner text-black shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Today's Games</span>
          </button>

          <button
            onClick={() => setActiveSubTab('PREVIOUS_HISTORY')}
            className={`py-2 px-2 rounded-lg font-black text-[11px] sm:text-sm tracking-tight flex items-center justify-center gap-1.5 transition-all ${
              activeSubTab === 'PREVIOUS_HISTORY'
                ? 'bg-gold-banner text-black shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Previous History</span>
          </button>

          <button
            onClick={() => setActiveSubTab('PAYMENTS')}
            className={`py-2 px-2 rounded-lg font-black text-[11px] sm:text-sm tracking-tight flex items-center justify-center gap-1.5 transition-all ${
              activeSubTab === 'PAYMENTS'
                ? 'bg-gold-banner text-black shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Payments</span>
          </button>
        </div>

        {/* ================= TAB 1: TODAY'S GAMES ================= */}
        {activeSubTab === 'TODAYS_GAMES' && (
          <div className="space-y-4">
            {/* Quick Summary Badge */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-neutral-950 p-3 sm:p-4 rounded-xl border border-neutral-800 shadow">
                <span className="text-neutral-400 text-xs font-semibold block">Total Bets Today</span>
                <span className="text-white font-mono font-black text-base sm:text-xl">
                  ₹ {todaysTickets.reduce((sum, t) => sum + t.totalAmount, 0)}
                </span>
              </div>
              <div className="bg-neutral-950 p-3 sm:p-4 rounded-xl border border-neutral-800 shadow">
                <span className="text-neutral-400 text-xs font-semibold block">Total Won Today</span>
                <span className="text-gold font-mono font-black text-base sm:text-xl">
                  ₹ {todaysTickets.reduce((sum, t) => sum + (t.winAmount || 0), 0)}
                </span>
              </div>
            </div>

            {/* List of Today's Tickets */}
            {todaysTickets.length === 0 ? (
              <div className="bg-neutral-950 p-8 rounded-2xl border border-neutral-800 text-center space-y-2">
                <Ticket className="w-10 h-10 text-neutral-600 mx-auto" />
                <p className="text-neutral-300 font-extrabold text-sm sm:text-base">No bets placed today yet</p>
                <p className="text-neutral-500 text-xs">Select a game slot on the home screen to place your bets.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysTickets.map((tkt) => (
                  <div
                    key={tkt.id}
                    className="bg-neutral-950 p-3.5 sm:p-4 rounded-xl border border-neutral-800 shadow-md space-y-3 hover:border-gold/40 transition-colors"
                  >
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-gold-metallic text-black font-black text-xs px-2.5 py-0.5 rounded uppercase">
                          {tkt.gameSlot}
                        </span>
                        <span className="text-neutral-400 font-mono text-xs">{tkt.id}</span>
                      </div>

                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded ${
                          tkt.status === 'WON'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : tkt.status === 'PENDING'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                        }`}
                      >
                        {tkt.status === 'WON' ? `WON ₹${tkt.winAmount}` : tkt.status}
                      </span>
                    </div>

                    {/* Items List */}
                    <div className="space-y-1.5 text-xs">
                      {tkt.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-neutral-300">
                          <span>
                            <strong className="text-white font-extrabold">{item.type}</strong> ({item.number}) x {item.count} count
                          </span>
                          <span className="font-mono text-white font-bold">₹ {item.totalAmount}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-900 text-xs">
                      <span className="text-neutral-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {tkt.placedAt}
                      </span>
                      <span className="text-gold font-mono font-black text-sm">Total: ₹ {tkt.totalAmount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: PREVIOUS HISTORY ================= */}
        {activeSubTab === 'PREVIOUS_HISTORY' && (
          <div className="space-y-4">
            {/* Archive Date Selector */}
            <div className="bg-neutral-950 border border-gold/40 p-3 rounded-xl flex items-center justify-between text-xs text-neutral-300 shadow">
              <span className="flex items-center gap-2 font-extrabold text-gold">
                <Calendar className="w-4 h-4" /> Filter Archive Date:
              </span>
              <input
                type="date"
                value={historyDate}
                onChange={(e) => setHistoryDate(e.target.value)}
                className="bg-black border border-neutral-700 text-white font-mono text-xs px-2.5 py-1 rounded focus:outline-none focus:border-gold"
              />
            </div>

            {/* Previous Tickets List */}
            <div className="space-y-3">
              {previousTickets.map((tkt) => (
                <div
                  key={tkt.id}
                  className="bg-neutral-950 p-3.5 sm:p-4 rounded-xl border border-neutral-800 shadow-md space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-gold-banner text-black font-black text-xs px-2.5 py-0.5 rounded uppercase">
                        {tkt.gameSlot}
                      </span>
                      <span className="text-neutral-400 font-mono text-xs">{tkt.id}</span>
                    </div>

                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded ${
                        tkt.status === 'WON'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                      }`}
                    >
                      {tkt.status === 'WON' ? `WON ₹${tkt.winAmount}` : 'LOST'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {tkt.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-neutral-300">
                        <span>
                          <strong className="text-white font-extrabold">{item.type}</strong> ({item.number}) x {item.count} count
                        </span>
                        <span className="font-mono text-white font-bold">₹ {item.totalAmount}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-900 text-xs">
                    <span className="text-neutral-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {tkt.placedAt}
                    </span>
                    <span className="text-gold font-mono font-black text-sm">Total: ₹ {tkt.totalAmount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: PAYMENTS ================= */}
        {activeSubTab === 'PAYMENTS' && (
          <div className="space-y-4">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setPaymentFilter('ALL')}
                className={`px-3 py-1 rounded-full font-extrabold transition-colors ${
                  paymentFilter === 'ALL'
                    ? 'bg-gold-banner text-black'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                All Payments
              </button>
              <button
                onClick={() => setPaymentFilter('BET')}
                className={`px-3 py-1 rounded-full font-extrabold transition-colors ${
                  paymentFilter === 'BET'
                    ? 'bg-gold-banner text-black'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                Bets Placed
              </button>
              <button
                onClick={() => setPaymentFilter('PAYOUT')}
                className={`px-3 py-1 rounded-full font-extrabold transition-colors ${
                  paymentFilter === 'PAYOUT'
                    ? 'bg-gold-banner text-black'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                Payout Credits
              </button>
            </div>

            {/* Payments List */}
            <div className="space-y-3">
              {filteredPayments.map((p) => {
                const isCredit = p.amount > 0;
                return (
                  <div
                    key={p.id}
                    className="bg-neutral-950 p-3.5 sm:p-4 rounded-xl border border-neutral-800 shadow-md flex items-center justify-between gap-3 hover:border-gold/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          isCredit
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                        }`}
                      >
                        {isCredit ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <h4 className="text-white font-extrabold text-xs sm:text-sm">{p.title}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                          <span>{p.method}</span>
                          <span>•</span>
                          <span>{p.timestamp}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`font-mono font-black text-xs sm:text-base block ${
                          isCredit ? 'text-emerald-400' : 'text-white'
                        }`}
                      >
                        {isCredit ? `+ ₹ ${p.amount.toLocaleString()}` : `- ₹ ${Math.abs(p.amount).toLocaleString()}`}
                      </span>
                      <span className="text-[10px] text-emerald-500 font-bold flex items-center justify-end gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> {p.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
