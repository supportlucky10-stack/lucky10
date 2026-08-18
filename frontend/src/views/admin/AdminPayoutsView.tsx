import React, { useState, useMemo } from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';
import { useApp } from '../../context/AppContext';
import type { GameSlot } from '../../types';
import { evaluateBetItem } from '../../utils/gameRulesEngine';
import {
  Send,
  CheckCircle2,
  PlusCircle,
  Calendar,
  Building2,
  Trophy,
  Sparkles,
  Search,
  Download,
  Zap,
  Bell,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface WinnerRecord {
  id: string;
  userId: string;
  ticketNo: string;
  winAmount: number;
  ticketType: string;
  isComplimentary?: boolean;
  complimentNumber?: string;
}

export const AdminPayoutsView: React.FC = () => {
  const { registeredUsers, processPayout, payoutLogs, addToast, placedTickets, getResultForSlotAndDate } = useApp();
  const [activeTab, setActiveTab] = useState<'ADD' | 'DAILY' | 'PREVIOUS'>('ADD');
  const [selectedGameSlot, setSelectedGameSlot] = useState<GameSlot>('1 PM Game');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);

  // Pagination for winner lookup engine
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const todayStr = new Date().toISOString().split('T')[0];
  const gameSlots: GameSlot[] = ['1 PM Game', '3 PM Game', '6 PM Game', '8 PM Game'];

  // Winners data per game slot computed dynamically from placedTickets & results
  const slotWinnersMap: Record<GameSlot, WinnerRecord[]> = useMemo(() => {
    const map: Record<GameSlot, WinnerRecord[]> = {
      '1 PM Game': [],
      '3 PM Game': [],
      '6 PM Game': [],
      '8 PM Game': [],
    };

    gameSlots.forEach((slot) => {
      const res = getResultForSlotAndDate(slot, todayStr);
      const slotTkts = placedTickets.filter((t) => t.gameSlot === slot);

      slotTkts.forEach((tkt) => {
        tkt.items.forEach((item: any) => {
          const num = item.number ? (item.number.includes(':') ? item.number.split(':')[1] : item.number) : '';
          const count = item.count || 1;
          const evalRes = evaluateBetItem(item, res);
          let prizeTitle = evalRes.isWinner ? evalRes.prizeTitle : '';
          let winAmt = evalRes.winAmount;

          if (!prizeTitle && tkt.status === 'WON' && (tkt.winAmount || 0) > 0) {
            prizeTitle = `Winning Bet (${num})`;
            winAmt = tkt.winAmount || (count * 500);
          }

          if (prizeTitle && winAmt > 0) {
            const custLabel = tkt.customerName ? ` • Cust: ${tkt.customerName}` : '';
            map[slot].push({
              id: `WIN-${tkt.id}-${item.id || num}`,
              userId: tkt.userId,
              ticketNo: `${tkt.id}${custLabel}`,
              winAmount: winAmt,
              ticketType: prizeTitle,
            });
          }
        });
      });
    });

    return map;
  }, [placedTickets, registeredUsers, getResultForSlotAndDate, todayStr]);

  const currentSlotAllWinners = slotWinnersMap[selectedGameSlot] || [];

  // Filtered winners list by search query
  const filteredWinners = useMemo(() => {
    return currentSlotAllWinners.map((w) => {
      const userObj = registeredUsers.find((u) => u.id === w.userId);
      const isTransferred = payoutLogs.some((l) => l.userName === userObj?.name && l.amount === w.winAmount);
      return { ...w, userObj, isTransferred };
    }).filter((w) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const name = w.userObj?.name.toLowerCase() || '';
      const email = w.userObj?.email.toLowerCase() || '';
      const ticket = w.ticketNo.toLowerCase();
      const comp = w.complimentNumber?.toLowerCase() || '';
      return name.includes(q) || email.includes(q) || ticket.includes(q) || comp.includes(q);
    });
  }, [currentSlotAllWinners, registeredUsers, payoutLogs, searchQuery]);

  // Readiness breakdown
  const readyWinners = useMemo(() => filteredWinners.filter((w) => w.userObj?.bankDetails && !w.isTransferred), [filteredWinners]);
  const pendingBankWinners = useMemo(() => filteredWinners.filter((w) => !w.userObj?.bankDetails), [filteredWinners]);

  // Paginated slice
  const totalPages = Math.ceil(filteredWinners.length / pageSize) || 1;
  const paginatedWinners = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredWinners.slice(start, start + pageSize);
  }, [filteredWinners, currentPage, pageSize]);

  // 1. Instant Auto-Disburse Ready Payouts
  const handleAutoDisburseReady = () => {
    if (readyWinners.length === 0) {
      addToast(`No ready bank-verified payouts to disburse for ${selectedGameSlot}`, 'info');
      return;
    }

    readyWinners.forEach((w) => {
      if (w.userObj) {
        processPayout(w.userId, w.winAmount);
      }
    });

    addToast(`Automated disburse initiated for ${readyWinners.length} ready winner(s) in ${selectedGameSlot}!`, 'success');
  };

  // 2. Export Bank Bulk Payout Sheet (CSV)
  const handleExportBulkCSV = () => {
    const headers = 'Winner Name,Email,Account Holder,Bank Name,Account Number,IFSC,Win Amount (INR),Ticket No,Slot,Status\n';
    const rows = filteredWinners
      .map((w) => {
        const u = w.userObj;
        const b = u?.bankDetails;
        const statusStr = b ? (w.isTransferred ? 'Transferred' : 'Ready') : 'Bank Pending';
        return `"${u?.name || 'Pending'}","${u?.email || 'N/A'}","${b?.accountHolderName || 'N/A'}","${b?.bankName || 'N/A'}","'${b?.accountNo || 'N/A'}","${b?.ifsc || 'N/A'}",${w.winAmount},"${w.ticketNo}","${selectedGameSlot}","${statusStr}"`;
      })
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bank_payout_batch_${selectedGameSlot.replace(/\s+/g, '_')}_${todayStr}.csv`;
    a.click();
    addToast(`Exported Bank Bulk Payout Sheet for ${selectedGameSlot}!`, 'success');
  };

  // 3. Send Bulk Bank Reminders
  const handleSendBankReminders = () => {
    if (pendingBankWinners.length === 0) {
      addToast(`All winners in ${selectedGameSlot} have linked bank details!`, 'success');
      return;
    }
    addToast(`Sent bulk bank update reminders to ${pendingBankWinners.length} winner(s)!`, 'info');
  };

  // Single Winner Transfer
  const handleSingleTransfer = (userId: string, amount: number, winnerName: string) => {
    const user = registeredUsers.find((u) => u.id === userId);
    if (!user?.bankDetails) {
      addToast(`Cannot transfer: ${winnerName} has not updated bank details yet`, 'error');
      return;
    }
    processPayout(userId, amount);
    addToast(`Payout transfer of ₹${amount.toLocaleString()} completed for ${winnerName}!`, 'success');
  };

  const dailyPayouts = payoutLogs.filter((p) => p.date === todayStr);
  const previousPayouts = payoutLogs.filter((p) => p.date !== todayStr);
  const displayedPayouts = activeTab === 'DAILY' ? dailyPayouts : activeTab === 'PREVIOUS' ? previousPayouts : payoutLogs;
  const totalPayoutAmount = payoutLogs.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-16 select-none">
      {/* Gold Header */}
      <HeaderBanner title="Payouts Management" />

      <div className="px-4 sm:px-6 py-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* Top Navigation Switcher */}
        <div className="grid grid-cols-3 gap-1.5 bg-neutral-900 p-1.5 rounded-xl border border-neutral-800">
          <button
            onClick={() => setActiveTab('ADD')}
            className={`py-2.5 px-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${
              activeTab === 'ADD'
                ? 'bg-gold-metallic text-black shadow-md'
                : 'text-neutral-400 hover:text-white bg-black/40'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Batch Payout Terminal</span>
          </button>

          <button
            onClick={() => setActiveTab('DAILY')}
            className={`py-2.5 px-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${
              activeTab === 'DAILY'
                ? 'bg-gold-metallic text-black shadow-md'
                : 'text-neutral-400 hover:text-white bg-black/40'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Daily ({dailyPayouts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('PREVIOUS')}
            className={`py-2.5 px-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${
              activeTab === 'PREVIOUS'
                ? 'bg-gold-metallic text-black shadow-md'
                : 'text-neutral-400 hover:text-white bg-black/40'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Previous ({previousPayouts.length})</span>
          </button>
        </div>

        {/* Concept 1: Automated Payout Batch Terminal & Bank Dispatcher */}
        {activeTab === 'ADD' && (
          <div className="space-y-6">
            {/* Game Slot Selector Options (1 PM, 3 PM, 6 PM, 8 PM) */}
            <div className="bg-neutral-950 border border-gold/40 p-5 rounded-xl space-y-5 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-gold" /> Payout Batch Terminal &amp; Dispatcher
                </h2>
                <span className="text-xs text-gold font-mono font-bold">{selectedGameSlot}</span>
              </div>

              {/* Game Slot Selector Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {gameSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => {
                      setSelectedGameSlot(slot);
                      setCurrentPage(1);
                    }}
                    className={`py-2.5 px-3 rounded-lg text-xs font-black transition-all text-center border cursor-pointer truncate ${
                      selectedGameSlot === slot
                        ? 'bg-gold-metallic text-black border-gold shadow-md'
                        : 'bg-black text-neutral-300 border-neutral-800 hover:border-gold/50'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>

              {/* Terminal Summary Cards for Selected Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Total Winners */}
                <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-xl text-center">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-0.5">Total Slot Winners</span>
                  <span className="text-white font-mono font-black text-xl">{currentSlotAllWinners.length} Winners</span>
                </div>

                {/* Ready to Disburse */}
                <div className="bg-neutral-900 border border-emerald-500/40 p-3.5 rounded-xl text-center">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-0.5">Ready for Transfer</span>
                  <span className="text-emerald-300 font-mono font-black text-xl">{readyWinners.length} Bank Verified</span>
                </div>

                {/* Bank Pending */}
                <div className="bg-neutral-900 border border-rose-500/40 p-3.5 rounded-xl text-center">
                  <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block mb-0.5">Bank Details Pending</span>
                  <span className="text-rose-300 font-mono font-black text-xl">{pendingBankWinners.length} Winners</span>
                </div>
              </div>

              {/* 3 Automated One-Click Terminal Action Controls */}
              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl space-y-3">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
                  Batch Dispatcher Actions ({selectedGameSlot}):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Action 1: Instant Auto-Disburse */}
                  <button
                    onClick={handleAutoDisburseReady}
                    className="py-3 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <Zap className="w-4 h-4 shrink-0" />
                    <span>Auto-Disburse Ready ({readyWinners.length})</span>
                  </button>

                  {/* Action 2: Export Bank CSV */}
                  <button
                    onClick={handleExportBulkCSV}
                    className="py-3 px-3 bg-neutral-800 hover:bg-neutral-700 text-gold border border-gold/40 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <Download className="w-4 h-4 shrink-0 text-gold" />
                    <span>Export Bank Bulk CSV</span>
                  </button>

                  {/* Action 3: Send Bank Reminders */}
                  <button
                    onClick={handleSendBankReminders}
                    className="py-3 px-3 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <Bell className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>Send Bank Reminders ({pendingBankWinners.length})</span>
                  </button>
                </div>
              </div>

              {/* Individual Winner Search & Inspection Engine */}
              <div className="space-y-3 pt-2 border-t border-neutral-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-neutral-400 flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-gold" /> Winner Inspection &amp; Direct Transfer:
                  </span>
                  <span className="text-xs text-gold font-mono font-bold">({filteredWinners.length} Winners)</span>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-gold absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search winner by name, email, ticket number, or compliment code..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-2.5 bg-black border border-neutral-700 text-white font-mono text-xs rounded-lg focus:outline-none focus:border-gold"
                  />
                </div>

                {/* Paginated Winners Cards */}
                <div className="space-y-3 pt-1">
                  {paginatedWinners.length === 0 ? (
                    <div className="py-8 text-center text-neutral-500 italic text-xs bg-neutral-900 rounded-xl border border-neutral-800">
                      No matching winners found for {selectedGameSlot}.
                    </div>
                  ) : (
                    paginatedWinners.map((winner) => {
                      const u = winner.userObj;
                      const b = u?.bankDetails;

                      return (
                        <div
                          key={winner.id}
                          className={`bg-neutral-900 border p-4 rounded-xl space-y-3 shadow-md transition-colors ${
                            winner.isComplimentary ? 'border-amber-500/40 hover:border-amber-400' : 'border-neutral-800 hover:border-gold/40'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-2.5">
                            <div>
                              <span className="font-extrabold text-white text-base block flex items-center gap-1.5">
                                {u ? u.name : 'Winner (Awaiting Bank Details)'}
                                {winner.isComplimentary && (
                                  <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded border border-amber-500/40 font-mono flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> Compliment #{winner.complimentNumber}
                                  </span>
                                )}
                              </span>
                              <span className="text-neutral-400 text-xs font-mono">
                                {u ? u.email : 'Unlinked profile'} • Ticket: <span className="text-gold">{winner.ticketNo}</span> ({winner.ticketType})
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-gold font-mono font-black text-sm bg-black px-3 py-1 rounded-lg border border-gold/40 block">
                                Win: ₹{winner.winAmount.toLocaleString()}
                              </span>
                              {winner.isTransferred && (
                                <span className="text-[10px] text-emerald-400 font-mono font-bold block pt-1 flex items-center justify-end gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Transferred
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Bank Details Display */}
                          <div className="bg-black p-3 rounded-lg border border-neutral-800 space-y-1 text-xs font-mono">
                            <div className="text-gold font-extrabold flex items-center justify-between text-xs mb-1">
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5 text-gold" /> Bank Account Details:
                              </span>
                              {b ? (
                                <span className="text-emerald-400 text-[10px] uppercase font-sans font-bold flex items-center gap-1">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Bank Verified
                                </span>
                              ) : (
                                <span className="text-rose-400 text-[10px] uppercase font-sans font-bold flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Bank Pending
                                </span>
                              )}
                            </div>

                            {b ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-300 text-xs pt-1">
                                <div>
                                  <span className="text-neutral-500 block text-[10px] uppercase font-sans">Account Holder:</span>
                                  <span className="font-bold text-white">{b.accountHolderName}</span>
                                </div>
                                <div>
                                  <span className="text-neutral-500 block text-[10px] uppercase font-sans">Bank Name:</span>
                                  <span className="font-bold text-white">{b.bankName}</span>
                                </div>
                                <div>
                                  <span className="text-neutral-500 block text-[10px] uppercase font-sans">Account Number:</span>
                                  <span className="font-bold text-gold">{b.accountNo}</span>
                                </div>
                                <div>
                                  <span className="text-neutral-500 block text-[10px] uppercase font-sans">IFSC / Branch:</span>
                                  <span className="font-bold text-white">{b.ifsc}</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-neutral-500 italic block text-xs">
                                Winner has not added bank details yet. Money cannot be transferred until bank details are updated in user app.
                              </span>
                            )}
                          </div>

                          {/* Direct Transfer Button */}
                          <div className="pt-1">
                            {b ? (
                              <button
                                onClick={() => handleSingleTransfer(winner.userId, winner.winAmount, u ? u.name : 'Winner')}
                                className="w-full py-2.5 bg-gold-metallic text-black font-black text-xs sm:text-sm rounded-lg uppercase shadow hover:opacity-95 cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Send className="w-4 h-4" /> TRANSFER ₹{winner.winAmount.toLocaleString()} TO {u ? u.name : 'WINNER'} NOW
                              </button>
                            ) : (
                              <button
                                disabled
                                className="w-full py-2.5 bg-neutral-900 text-neutral-600 font-bold text-xs rounded-lg uppercase border border-neutral-800 cursor-not-allowed"
                              >
                                AWAITING BANK DETAILS BEFORE TRANSFER
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-800 pt-3 text-xs">
                  <div className="text-neutral-400 font-mono">
                    Page <span className="text-gold font-bold">{currentPage}</span> of{' '}
                    <span className="text-white font-bold">{totalPages}</span> ({filteredWinners.length} winners listed)
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-black border border-neutral-700 text-white font-mono text-xs px-2 py-1 rounded"
                    >
                      <option value={10}>10 / Page</option>
                      <option value={25}>25 / Page</option>
                      <option value={50}>50 / Page</option>
                    </select>

                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 bg-neutral-900 border border-neutral-800 rounded disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4 text-gold" />
                    </button>
                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="p-1.5 bg-neutral-900 border border-neutral-800 rounded disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4 text-gold" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 2 & 3: Payout Logs & History */}
        <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-xl space-y-4 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
            <h2 className="text-base font-black text-white">
              {activeTab === 'DAILY' ? 'Daily Payouts (Today)' : activeTab === 'PREVIOUS' ? 'Previous Payouts History' : 'All Payouts Record'}
            </h2>
            <span className="text-xs text-gold font-mono font-bold">Total Transferred: ₹{totalPayoutAmount.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="flex-1 bg-black border border-neutral-700 text-white font-mono text-xs px-3 py-2.5 rounded-lg"
            />
            <button className="px-5 py-2.5 bg-gold-metallic text-black text-xs font-extrabold rounded-lg uppercase cursor-pointer">
              FILTER DATE
            </button>
          </div>

          {/* History List */}
          <div className="space-y-3 pt-1">
            {displayedPayouts.length === 0 ? (
              <div className="py-8 text-center text-neutral-500 italic text-xs">
                No payouts found for this category.
              </div>
            ) : (
              displayedPayouts.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 flex justify-between items-center text-xs hover:border-gold/30 transition-colors"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-white text-sm block">{log.userName}</span>
                    <span className="text-neutral-400 text-xs font-mono block">{log.bankAccount}</span>
                    <span className="text-neutral-500 text-[11px] block font-mono">{log.date}</span>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="font-mono font-black text-gold text-base block">₹{log.amount.toLocaleString()}</span>
                    <span className="text-emerald-400 text-xs font-extrabold flex items-center justify-end gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {log.status}
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
