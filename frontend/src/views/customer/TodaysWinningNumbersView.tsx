import React, { useState, useMemo } from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';
import { useApp } from '../../context/AppContext';
import { History, Calendar } from 'lucide-react';
import type { GameSlot } from '../../types';
import { evaluateBetItem } from '../../utils/gameRulesEngine';

export const TodaysWinningNumbersView: React.FC = () => {
  const { goBack, placedTickets, userTickets, getResultForSlotAndDate } = useApp();
  const [activeTab, setActiveTab] = useState<'TODAYS_WINNERS' | 'PREVIOUS_HISTORY'>('TODAYS_WINNERS');
  const [selectedSlot, setSelectedSlot] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date(Date.now() - 86400000).toISOString().split('T')[0]
  );

  const games: GameSlot[] = ['1 PM Game', '3 PM Game', '6 PM Game', '8 PM Game'];
  const slotOptions = ['ALL', ...games];

  const todayStr = new Date().toISOString().split('T')[0];
  const ticketSource = placedTickets.length > 0 ? placedTickets : userTickets;

  // Dynamic Today's Winners calculation based on gameRulesEngine
  const todayWinners = useMemo(() => {
    const winnersList: Array<{
      id: string;
      user: string;
      slot: GameSlot;
      prize: string;
      winAmount: string;
      time: string;
    }> = [];

    games.forEach((slot) => {
      const res = getResultForSlotAndDate(slot, todayStr);
      const slotTickets = ticketSource.filter((t) => {
        const tDate = t.placedAt ? t.placedAt.split('T')[0].split(' ')[0] : todayStr;
        return t.gameSlot === slot && tDate === todayStr;
      });

      slotTickets.forEach((tkt) => {
        tkt.items.forEach((item) => {
          const evalRes = evaluateBetItem(item, res);
          if (evalRes.isWinner) {
            winnersList.push({
              id: `TW-${tkt.id}-${item.id || item.number}`,
              user: (tkt as any).customerName || (tkt as any).userName || (tkt as any).agencyName || 'Player',
              slot: slot,
              prize: `${evalRes.prizeTitle} (${evalRes.matchedNumber})`,
              winAmount: `₹${evalRes.winAmount.toLocaleString()}`,
              time: tkt.placedAt ? tkt.placedAt.split(' ')[1]?.slice(0, 5) || '1:05 PM' : '1:05 PM',
            });
          }
        });
      });
    });

    // Fallback demonstration entries if no tickets are placed yet
    if (winnersList.length === 0) {
      return [
        { id: 'W-101', user: 'Rahul S.', slot: '1 PM Game' as GameSlot, prize: '1st Prize (742)', winAmount: '₹5,000', time: '1:05 PM' },
        { id: 'W-102', user: 'Vikram M.', slot: '1 PM Game' as GameSlot, prize: '2nd Prize (819)', winAmount: '₹500', time: '1:05 PM' },
        { id: 'W-103', user: 'Ankit P.', slot: '3 PM Game' as GameSlot, prize: 'Box Winner (215)', winAmount: '₹800', time: '3:06 PM' },
        { id: 'W-104', user: 'Priya K.', slot: '6 PM Game' as GameSlot, prize: 'Pair Winner (AB:38)', winAmount: '₹700', time: '6:04 PM' },
        { id: 'W-105', user: 'Suresh B.', slot: '8 PM Game' as GameSlot, prize: '1st Prize (624)', winAmount: '₹5,000', time: '8:05 PM' },
      ];
    }

    return winnersList;
  }, [ticketSource, todayStr, getResultForSlotAndDate]);

  const filteredTodayWinners = selectedSlot === 'ALL'
    ? todayWinners
    : todayWinners.filter((w) => w.slot === selectedSlot);

  // Dynamic Previous Winners calculation based on selectedDate and slotFilter
  const previousWinners = useMemo(() => {
    const winnersList: Array<{
      id: string;
      user: string;
      date: string;
      slot: GameSlot;
      prize: string;
      winAmount: string;
      number: string;
      time: string;
    }> = [];

    games.forEach((slot) => {
      const res = getResultForSlotAndDate(slot, selectedDate);
      const slotTickets = ticketSource.filter((t) => {
        const tDate = t.placedAt ? t.placedAt.split('T')[0].split(' ')[0] : '';
        return t.gameSlot === slot && tDate === selectedDate;
      });

      slotTickets.forEach((tkt) => {
        tkt.items.forEach((item) => {
          const evalRes = evaluateBetItem(item, res);
          if (evalRes.isWinner) {
            winnersList.push({
              id: `PW-${tkt.id}-${item.id || item.number}`,
              user: (tkt as any).customerName || (tkt as any).userName || (tkt as any).agencyName || 'Player',
              date: selectedDate,
              slot: slot,
              prize: evalRes.prizeTitle,
              winAmount: `₹${evalRes.winAmount.toLocaleString()}`,
              number: evalRes.matchedNumber,
              time: tkt.placedAt ? tkt.placedAt.split(' ')[1]?.slice(0, 5) || '1:05 PM' : '1:05 PM',
            });
          }
        });
      });
    });

    if (winnersList.length === 0) {
      return [
        { id: 'PW-201', user: 'Adithyan P.', date: selectedDate, slot: '1 PM Game' as GameSlot, prize: '1st Prize', winAmount: '₹5,000', number: '418', time: '1:05 PM' },
        { id: 'PW-202', user: 'Jerin V.', date: selectedDate, slot: '1 PM Game' as GameSlot, prize: '2nd Prize', winAmount: '₹500', number: '725', time: '1:06 PM' },
        { id: 'PW-203', user: 'Rahul S.', date: selectedDate, slot: '3 PM Game' as GameSlot, prize: '3rd Prize', winAmount: '₹250', number: '291', time: '3:05 PM' },
        { id: 'PW-204', user: 'Vikram M.', date: selectedDate, slot: '3 PM Game' as GameSlot, prize: 'Box Straight', winAmount: '₹3,000', number: '418', time: '3:07 PM' },
        { id: 'PW-205', user: 'Ankit P.', date: selectedDate, slot: '6 PM Game' as GameSlot, prize: '4th Prize', winAmount: '₹100', number: '634', time: '6:04 PM' },
        { id: 'PW-206', user: 'Priya K.', date: selectedDate, slot: '6 PM Game' as GameSlot, prize: 'Pair Winner (AB)', winAmount: '₹700', number: 'AB:41', time: '6:06 PM' },
        { id: 'PW-207', user: 'Suresh B.', date: selectedDate, slot: '8 PM Game' as GameSlot, prize: '1st Prize', winAmount: '₹5,000', number: '624', time: '8:05 PM' },
        { id: 'PW-208', user: 'Deepak K.', date: selectedDate, slot: '8 PM Game' as GameSlot, prize: 'Compliment Winner', winAmount: '₹20', number: '153', time: '8:08 PM' },
      ];
    }

    return winnersList;
  }, [ticketSource, selectedDate, getResultForSlotAndDate]);

  const filteredPreviousWinners = selectedSlot === 'ALL'
    ? previousWinners
    : previousWinners.filter((w) => w.slot === selectedSlot);

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-28 sm:pb-36 antialiased select-none font-sans">
      {/* Header Banner */}
      <HeaderBanner
        title="Today's Winning Numbers"
        showBack={true}
        onBackClick={() => goBack()}
      />

      <div className="max-w-xl mx-auto w-full px-3.5 sm:px-6 py-4 space-y-4">
        
        {/* Section Navigation Tabs: 2 Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-950 rounded-xl border border-neutral-800 text-xs sm:text-sm font-extrabold shadow">
          <button
            onClick={() => {
              setActiveTab('TODAYS_WINNERS');
              window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            }}
            className={`py-2.5 px-3 rounded-lg transition-all flex items-center justify-center gap-2 text-center cursor-pointer ${
              activeTab === 'TODAYS_WINNERS'
                ? 'bg-gold-metallic text-black shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <svg
              className={`w-4 h-4 shrink-0 transition-colors ${
                activeTab === 'TODAYS_WINNERS' ? 'fill-black' : 'fill-neutral-400'
              }`}
              viewBox="0 0 24 24"
            >
              <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V18H8v2h8v-2h-3v-2.1a5.01 5.01 0 0 0 3.61-3.04C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
            </svg>
            <span>Today's Winners</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('PREVIOUS_HISTORY');
              window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            }}
            className={`py-2.5 px-3 rounded-lg transition-all flex items-center justify-center gap-2 text-center cursor-pointer ${
              activeTab === 'PREVIOUS_HISTORY'
                ? 'bg-gold-metallic text-black shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4 shrink-0" />
            <span>Previous History</span>
          </button>
        </div>

        {/* Date Selector for Previous History Tab */}
        {activeTab === 'PREVIOUS_HISTORY' && (
          <div className="bg-neutral-950 border border-gold/40 p-3 rounded-xl flex items-center justify-between text-xs text-neutral-300 shadow">
            <span className="flex items-center gap-2 font-black text-gold uppercase tracking-wider text-xs">
              <Calendar className="w-4 h-4 text-gold shrink-0" /> Select Date:
            </span>
            <div
              onClick={(e) => {
                const input = e.currentTarget.querySelector('input');
                input?.showPicker?.();
              }}
              className="flex items-center gap-2 bg-black border border-neutral-700 hover:border-gold/80 px-3 py-1.5 rounded-lg cursor-pointer transition-all shadow-inner group"
            >
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer"
              />
              <Calendar className="w-4 h-4 text-gold group-hover:scale-110 transition-transform cursor-pointer shrink-0" />
            </div>
          </div>
        )}

        {/* Slot Selection Pills (ALL, 1 PM, 3 PM, 6 PM, 8 PM) */}
        <div className="grid grid-cols-5 gap-1 sm:gap-1.5 w-full">
          {slotOptions.map((opt) => {
            const isSelected = selectedSlot === opt;
            const label = opt === 'ALL' ? 'ALL' : opt.replace(' Game', '');
            return (
              <button
                key={opt}
                onClick={() => {
                  setSelectedSlot(opt);
                  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                }}
                className={`py-2 px-1 text-[10px] sm:text-xs font-black uppercase text-center rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gold-banner text-black border-gold shadow-md'
                    : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-gold/40'
                }`}
              >
                <span className="truncate block">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Today's Winners Feed */}
        {activeTab === 'TODAYS_WINNERS' && (
          <div className="space-y-3">
            <h3 className="text-gold font-black text-xs sm:text-sm uppercase tracking-wide border-b border-neutral-800 pb-1 flex items-center justify-between">
              <span>Winners</span>
            </h3>

            {filteredTodayWinners.length === 0 ? (
              <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-800 text-center text-neutral-400 text-xs font-semibold">
                No winners published yet for {selectedSlot} today.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTodayWinners.map((winner) => (
                  <div
                    key={winner.id}
                    className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex items-center justify-between shadow-sm hover:border-gold/30 transition-colors"
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Previous History Winners */}
        {activeTab === 'PREVIOUS_HISTORY' && (
          <div className="space-y-3">
            <h3 className="text-gold font-black text-xs sm:text-sm uppercase tracking-wide border-b border-neutral-800 pb-1 flex items-center justify-between">
              <span>Winners ({selectedDate})</span>
            </h3>

            {filteredPreviousWinners.length === 0 ? (
              <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-800 text-center text-neutral-400 text-xs font-semibold">
                No winners recorded for {selectedSlot} on {selectedDate}.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPreviousWinners.map((winner) => (
                  <div
                    key={winner.id}
                    className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex items-center justify-between shadow-sm hover:border-gold/30 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-extrabold text-sm">{winner.user}</span>
                        <span className="text-[10px] bg-neutral-900 text-gold px-2 py-0.5 rounded font-mono font-bold border border-gold/30">
                          {winner.slot}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 font-medium">
                        {winner.prize} • Winning No: <strong className="text-gold font-mono">{winner.number}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-gold font-mono font-black text-base block">{winner.winAmount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
