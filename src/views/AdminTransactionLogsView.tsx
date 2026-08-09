import React, { useState } from 'react';
import { HeaderBanner } from '../components/HeaderBanner';
import { ShieldCheck, Search } from 'lucide-react';

export const AdminTransactionLogsView: React.FC = () => {
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);

  const mockTransactions = [
    {
      id: 'TXN_99812',
      user: 'Adithyan',
      type: 'Bank Transfer (Payout)',
      amount: '₹ 5,000',
      account: 'SBIN0004321 - 9876****1234',
      status: 'SUCCESS',
      timestamp: '2026-08-07 11:30 AM',
    },
    {
      id: 'TXN_99811',
      user: 'Jerin',
      type: 'Ticket Purchase',
      amount: '₹ 200',
      account: 'Wallet Deposit',
      status: 'SUCCESS',
      timestamp: '2026-08-07 10:15 AM',
    },
    {
      id: 'TXN_99810',
      user: 'Adithyan',
      type: 'Ticket Purchase',
      amount: '₹ 50',
      account: 'Wallet Deposit',
      status: 'SUCCESS',
      timestamp: '2026-08-06 06:45 PM',
    },
    {
      id: 'TXN_99809',
      user: 'Demo Player',
      type: 'Bank Details Update',
      amount: 'N/A',
      account: 'HDFC0009988 - 5544****1122',
      status: 'VERIFIED',
      timestamp: '2026-08-06 02:20 PM',
    },
  ];

  return (
    <div className="w-full flex-1 bg-black text-white flex flex-col justify-start overflow-y-auto pb-32 sm:pb-36">
      {/* Gold Header matching Page 17 */}
      <HeaderBanner title="Transactions Logs" />

      <div className="px-6 py-6 space-y-6">
        {/* Search Option Filter matching Page 17 */}
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg space-y-2">
          <label className="text-xs text-neutral-400 font-bold block flex items-center gap-1">
            <Search className="w-3.5 h-3.5 text-gold" /> Search Option (daily and previous dates):
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="flex-1 bg-black border border-neutral-700 text-white font-mono text-xs px-3 py-2 rounded"
            />
            <button className="px-4 py-2 btn-gold text-xs font-bold">SEARCH</button>
          </div>
        </div>

        {/* Bank Transactions (Transaction Status) matching Page 17 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <h2 className="text-lg font-black text-white tracking-wide">
              Bank Transactions
            </h2>
            <span className="text-xs text-neutral-400 italic">(Transaction Status)</span>
          </div>

          <div className="space-y-2.5">
            {mockTransactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-neutral-950 border border-neutral-800 p-3 rounded-lg text-xs space-y-1 hover:border-gold/30 transition-colors"
              >
                <div className="flex justify-between items-center font-bold">
                  <span className="text-white">{tx.user}</span>
                  <span className="font-mono text-gold">{tx.amount}</span>
                </div>

                <div className="flex justify-between items-center text-[11px] text-neutral-400">
                  <span>{tx.type}</span>
                  <span className="font-mono text-neutral-500">{tx.timestamp}</span>
                </div>

                <div className="flex justify-between items-center text-[10px] pt-1 border-t border-neutral-900">
                  <span className="font-mono text-neutral-400">{tx.account}</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
