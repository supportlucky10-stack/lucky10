import React, { useState } from 'react';
import { HeaderBanner } from '../components/HeaderBanner';
import { useApp } from '../context/AppContext';
import { Send, CheckCircle2 } from 'lucide-react';

export const AdminPayoutsView: React.FC = () => {
  const { registeredUsers, processPayout, payoutLogs } = useApp();
  const [selectedUser, setSelectedUser] = useState(registeredUsers[0]?.id || '');
  const [amount, setAmount] = useState('5000');
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !amount) return;
    processPayout(selectedUser, parseFloat(amount));
  };

  return (
    <div className="w-full flex-1 bg-black text-white flex flex-col justify-start overflow-y-auto pb-8">
      {/* Gold Header matching Page 16 */}
      <HeaderBanner title="Payouts" />

      <div className="px-6 py-6 space-y-6">
        {/* Transfer Win Amount Section matching Page 16 */}
        <div className="bg-neutral-900 border border-gold/40 p-4 rounded-lg space-y-3">
          <h2 className="text-lg font-black text-white tracking-wide border-b border-neutral-800 pb-2 flex items-center gap-2">
            <Send className="w-4 h-4 text-gold" /> Transfer Win Amount
          </h2>

          <form onSubmit={handleTransfer} className="space-y-3">
            <div>
              <label className="text-xs text-neutral-400 font-bold block mb-1">
                Select Winning Player:
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-neutral-700 text-white text-xs font-semibold rounded"
              >
                {registeredUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-neutral-400 font-bold block mb-1">
                Transfer Amount (₹):
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-white text-black font-mono font-bold text-sm rounded"
              />
            </div>

            <button type="submit" className="w-full py-2.5 btn-gold font-extrabold text-xs">
              INITIATE PAYOUT TRANSFER
            </button>
          </form>
        </div>

        {/* Search Option & Payout History matching Page 16 */}
        <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <h2 className="text-base font-black text-white">Payout History</h2>
            <span className="text-xs text-neutral-400">Search Option (daily & previous dates)</span>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="flex-1 bg-black border border-neutral-700 text-white font-mono text-xs px-3 py-2 rounded"
            />
            <button className="px-4 py-2 btn-gold text-xs font-bold">SEARCH</button>
          </div>

          {/* History List */}
          <div className="space-y-2">
            {payoutLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-neutral-900 rounded border border-neutral-800 flex justify-between items-center text-xs"
              >
                <div>
                  <span className="font-bold text-white block">{log.userName}</span>
                  <span className="text-neutral-400 text-[11px] font-mono">{log.bankAccount}</span>
                  <span className="text-neutral-500 text-[10px] block">{log.date}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-gold text-sm block">₹{log.amount}</span>
                  <span className="text-emerald-400 text-[10px] font-bold flex items-center justify-end gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {log.status}
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
