import React, { useState } from 'react';
import { HeaderBanner } from '../components/HeaderBanner';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Search, Filter } from 'lucide-react';

export const AdminTransactionLogsView: React.FC = () => {
  const { payoutLogs, placedTickets, registeredUsers } = useApp();
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'TODAY' | 'PREVIOUS'>('TODAY');

  const todayStr = new Date().toISOString().split('T')[0];

  // Derive real transactions dynamically from AppContext
  const dynamicTransactions = [
    ...payoutLogs.map((log) => ({
      id: log.id,
      user: log.userName,
      type: 'Bank Transfer (Payout)',
      amount: `₹ ${log.amount.toLocaleString()}`,
      account: log.bankAccount,
      status: log.status,
      date: log.date,
      timestamp: `${log.date}`,
    })),
    ...placedTickets.map((tkt) => {
      const u = registeredUsers.find((user) => user.id === tkt.userId);
      const dateOnly = tkt.placedAt ? tkt.placedAt.split('T')[0] : todayStr;
      return {
        id: tkt.id,
        user: u?.name || 'Player',
        type: 'Ticket Purchase',
        amount: `₹ ${tkt.totalAmount.toLocaleString()}`,
        account: 'Wallet Deposit',
        status: 'SUCCESS',
        date: dateOnly,
        timestamp: tkt.placedAt ? tkt.placedAt.replace('T', ' ').substring(0, 16) : todayStr,
      };
    }),
  ];

  const displayedTxns = dynamicTransactions.filter((tx) => {
    if (activeTab === 'PREVIOUS') return tx.date !== todayStr;
    return tx.date === todayStr;
  });

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-16 select-none">
      {/* Gold Header */}
      <HeaderBanner title="Transactions Logs" />

      <div className="px-4 sm:px-6 py-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* Navigation Switcher (2 Tabs Only: Today & Previous) */}
        <div className="flex bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs sm:text-sm font-extrabold">
          <button
            onClick={() => setActiveTab('TODAY')}
            className={`flex-1 py-2.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'TODAY' ? 'bg-gold-metallic text-black shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setActiveTab('PREVIOUS')}
            className={`flex-1 py-2.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'PREVIOUS' ? 'bg-gold-metallic text-black shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Previous
          </button>
        </div>

        {/* Date Filter Bar (Only show for PREVIOUS or ALL dates lookup) */}
        {activeTab !== 'TODAY' && (
          <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl space-y-2">
            <label className="text-xs text-neutral-400 font-bold block flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-gold" /> Filter Transaction History by Date:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="flex-1 bg-black border border-neutral-700 text-white font-mono text-xs px-3.5 py-2.5 rounded-lg"
              />
              <button className="px-5 py-2.5 bg-gold-metallic text-black text-xs font-extrabold rounded-lg uppercase cursor-pointer">
                SEARCH
              </button>
            </div>
          </div>
        )}

        {/* Transaction History List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h2 className="text-base font-black text-white tracking-wide flex items-center gap-2">
              <Filter className="w-4 h-4 text-gold" />
              <span>Payment Transaction History ({displayedTxns.length})</span>
            </h2>
            <span className="text-xs text-neutral-400 italic">
              {activeTab === 'TODAY' ? `Today's Date: ${todayStr}` : '(Today & Previous)'}
            </span>
          </div>

          <div className="space-y-3">
            {displayedTxns.length === 0 ? (
              <div className="py-8 text-center text-neutral-500 italic text-xs bg-neutral-950 rounded-xl border border-neutral-800">
                No transactions found for the selected filter.
              </div>
            ) : (
              displayedTxns.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl text-xs space-y-2 hover:border-gold/30 transition-colors shadow-md"
                >
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-white text-sm">{tx.user}</span>
                    <span className="font-mono text-gold text-base font-black">{tx.amount}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-neutral-400">
                    <span className="font-semibold text-neutral-300">{tx.type}</span>
                    <span className="font-mono text-neutral-500 text-[11px]">{tx.timestamp}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-2 border-t border-neutral-900">
                    <span className="font-mono text-neutral-400">{tx.account}</span>
                    <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> {tx.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
