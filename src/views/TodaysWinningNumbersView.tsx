import React, { useState } from 'react';
import { HeaderBanner } from '../components/HeaderBanner';
import { useApp } from '../context/AppContext';
import { Trophy, History, DollarSign } from 'lucide-react';

export const TodaysWinningNumbersView: React.FC = () => {
  const { setCurrentView } = useApp();
  const [activeTab, setActiveTab] = useState<'WINNERS_TODAY' | 'PRICE_TRANSACTIONS' | 'PREVIOUS_HISTORY'>('WINNERS_TODAY');

  // Dummy mock data for demonstration
  const todayWinners = [
    { id: 'W-101', user: 'Rahul S.', slot: '1 PM Game', prize: '1st Prize (Direct 742)', winAmount: '₹5,000', time: '1:05 PM' },
    { id: 'W-102', user: 'Vikram M.', slot: '1 PM Game', prize: '2nd Prize (742)', winAmount: '₹5,000', time: '1:05 PM' },
    { id: 'W-103', user: 'Ankit P.', slot: '4 PM Game', prize: 'Shuffle Winner (427)', winAmount: '₹3,000', time: '4:06 PM' },
    { id: 'W-104', user: 'Priya K.', slot: '6 PM Game', prize: 'Pair Winner (AB:74)', winAmount: '₹500', time: '6:04 PM' },
    { id: 'W-105', user: 'Suresh B.', slot: '8 PM Game', prize: '1st Prize (Direct 819)', winAmount: '₹5,000', time: '8:05 PM' },
  ];

  const priceTransactions = [
    { id: 'TXN-901', user: 'Rahul S.', bank: 'HDFC Bank (•••• 4312)', amount: '₹5,000', status: 'SUCCESS', date: 'Today, 1:20 PM' },
    { id: 'TXN-902', user: 'Vikram M.', bank: 'SBI (•••• 8819)', amount: '₹5,000', status: 'SUCCESS', date: 'Today, 1:25 PM' },
    { id: 'TXN-903', user: 'Ankit P.', bank: 'ICICI (•••• 1029)', amount: '₹3,000', status: 'SUCCESS', date: 'Today, 4:15 PM' },
    { id: 'TXN-904', user: 'Priya K.', bank: 'Axis Bank (•••• 9940)', amount: '₹500', status: 'PROCESSING', date: 'Today, 6:10 PM' },
  ];

  const previousHistory = [
    { date: 'Yesterday', slot: '8 PM Game', number: '742', totalPayout: '₹18,500', winnerCount: 14 },
    { date: 'Yesterday', slot: '6 PM Game', number: '350', totalPayout: '₹12,000', winnerCount: 9 },
    { date: '10 Aug 2026', slot: '8 PM Game', number: '194', totalPayout: '₹22,000', winnerCount: 18 },
    { date: '10 Aug 2026', slot: '4 PM Game', number: '819', totalPayout: '₹15,500', winnerCount: 11 },
  ];

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-24 sm:pb-32 select-none">
      {/* Header Banner */}
      <HeaderBanner title="Winning Report" />

      <div className="max-w-4xl mx-auto w-full px-3.5 sm:px-6 py-4 space-y-4">
        
        {/* Section Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800 text-xs sm:text-sm font-extrabold">
          <button
            onClick={() => setActiveTab('WINNERS_TODAY')}
            className={`py-2.5 px-2 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-center ${
              activeTab === 'WINNERS_TODAY'
                ? 'bg-gold-metallic text-black shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 shrink-0" />
            <span className="truncate">Winners of the Day</span>
          </button>

          <button
            onClick={() => setActiveTab('PRICE_TRANSACTIONS')}
            className={`py-2.5 px-2 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-center ${
              activeTab === 'PRICE_TRANSACTIONS'
                ? 'bg-gold-metallic text-black shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4 shrink-0" />
            <span className="truncate">Price Transaction</span>
          </button>

          <button
            onClick={() => setActiveTab('PREVIOUS_HISTORY')}
            className={`py-2.5 px-2 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-center ${
              activeTab === 'PREVIOUS_HISTORY'
                ? 'bg-gold-metallic text-black shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4 shrink-0" />
            <span className="truncate">Previous History</span>
          </button>
        </div>

        {/* Tab Content 1: Winners of the Day */}
        {activeTab === 'WINNERS_TODAY' && (
          <div className="space-y-3">
            <h3 className="text-gold font-black text-sm uppercase tracking-wide border-b border-neutral-800 pb-1 flex items-center justify-between">
              <span>Today's Prize Winners</span>
              <span className="text-neutral-400 font-mono text-xs font-normal">Live Feed</span>
            </h3>

            <div className="space-y-2">
              {todayWinners.map((winner) => (
                <div
                  key={winner.id}
                  className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex items-center justify-between shadow-sm"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-extrabold text-sm">{winner.user}</span>
                      <span className="text-[10px] bg-neutral-900 text-gold px-2 py-0.5 rounded font-mono font-bold border border-gold/30">
                        {winner.slot}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 font-medium">{winner.prize}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-gold font-mono font-black text-base block">{winner.winAmount}</span>
                    <span className="text-[10px] text-neutral-500">{winner.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content 2: Price Transaction of the Winners */}
        {activeTab === 'PRICE_TRANSACTIONS' && (
          <div className="space-y-3">
            <h3 className="text-gold font-black text-sm uppercase tracking-wide border-b border-neutral-800 pb-1 flex items-center justify-between">
              <span>Price Payout Transactions</span>
              <span className="text-emerald-400 text-xs font-bold">Instant Credit</span>
            </h3>

            <div className="space-y-2">
              {priceTransactions.map((txn) => (
                <div
                  key={txn.id}
                  className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex items-center justify-between shadow-sm"
                >
                  <div className="space-y-0.5">
                    <span className="text-white font-extrabold text-sm block">{txn.user}</span>
                    <span className="text-xs text-neutral-400">{txn.bank}</span>
                    <span className="text-[10px] text-neutral-500 block">{txn.date}</span>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="text-gold font-mono font-black text-base block">{txn.amount}</span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded inline-block uppercase ${
                        txn.status === 'SUCCESS'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                          : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {txn.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content 3: Previous Winners History */}
        {activeTab === 'PREVIOUS_HISTORY' && (
          <div className="space-y-3">
            <h3 className="text-gold font-black text-sm uppercase tracking-wide border-b border-neutral-800 pb-1 flex items-center justify-between">
              <span>Previous Winners History</span>
              <button
                onClick={() => setCurrentView('PREVIOUS_WINNING_NUMBERS')}
                className="text-xs text-gold hover:underline font-bold"
              >
                View Full Archive →
              </button>
            </h3>

            <div className="space-y-2">
              {previousHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex items-center justify-between shadow-sm"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-xs">{item.date}</span>
                      <span className="text-xs text-neutral-400">• {item.slot}</span>
                    </div>
                    <span className="text-xs text-neutral-400 block">
                      Winning No: <strong className="text-gold font-mono">{item.number}</strong>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-mono font-black text-sm block">{item.totalPayout}</span>
                    <span className="text-[11px] text-neutral-400">{item.winnerCount} Winners</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
