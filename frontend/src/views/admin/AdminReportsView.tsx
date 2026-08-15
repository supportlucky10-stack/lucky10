import React, { useState, useMemo, useRef } from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';
import { useApp } from '../../context/AppContext';
import type { GameSlot, PlacedTicket } from '../../types';
import {
  TrendingUp,
  Users,
  Calendar,
  Search,
  Check,
  Copy,
  Trophy,
  ClipboardList,
} from 'lucide-react';
import goldTrophy from '../../assets/gold-trophy.png';

const formatPlacedAtDate = (str?: string): string => {
  if (!str) return '';
  let utcStr = str.trim();
  if (!utcStr.endsWith('Z') && !utcStr.includes('+') && !utcStr.match(/[+-]\d{2}:\d{2}$/)) {
    utcStr = utcStr.replace(' ', 'T') + 'Z';
  }
  const d = new Date(utcStr);
  if (isNaN(d.getTime())) return str;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  const rawH = d.getHours();
  const ampm = rawH >= 12 ? 'PM' : 'AM';
  const hh = String(rawH % 12 || 12).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${dd}/${mm}/${yy} ${hh}:${min}:${ss} ${ampm}`;
};

const getDisplayGame = (item: { number?: string; type?: string }): string => {
  const num = item.number || '';
  if (num.includes(':')) {
    return num.split(':')[0].toUpperCase();
  }
  const typeStr = (item.type || '').toUpperCase();
  if (typeStr === 'DIRECT' || typeStr === 'SUPER') return 'SUPER';
  if (typeStr === 'SHUFFLE' || typeStr === 'BOX') return 'BOX';
  if (['AB', 'BC', 'AC', 'A', 'B', 'C'].includes(typeStr)) return typeStr;
  if (num.length === 1) return 'A';
  if (num.length === 2) return 'AB';
  return item.type || 'SUPER';
};

const getDisplayNumber = (item: { number?: string; type?: string }): string => {
  const num = item.number || '';
  if (num.includes(':')) {
    return num.split(':')[1];
  }
  return num;
};

const formatCustomerName = (name?: string): string => {
  if (!name || name.trim().toLowerCase() === 'customer') return '';
  return name.trim();
};

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return dateStr;
};

type ReportTab = 'USERS' | 'SALES' | 'WINNING' | 'DAILY';

export const AdminReportsView: React.FC = () => {
  const { registeredUsers, placedTickets, getResultForSlotAndDate, payoutLogs } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  const userFromRef = useRef<HTMLInputElement>(null);
  const userToRef = useRef<HTMLInputElement>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<ReportTab>('USERS');

  // Selected User / Agency ('ALL' = Whole System Report, or specific userId / username)
  const [selectedUserId, setSelectedUserId] = useState<string>('ALL');

  // Filter States for Sales & Winning
  const [fromDate, setFromDate] = useState<string>(todayStr);
  const [toDate, setToDate] = useState<string>(todayStr);
  const [slotFilter, setSlotFilter] = useState<'ALL' | GameSlot>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [copiedBillId, setCopiedBillId] = useState<string | null>(null);

  const handleCopyBillId = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedBillId(id);
    setTimeout(() => {
      setCopiedBillId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  // Find currently selected user object if any
  const selectedUser = useMemo(() => {
    if (selectedUserId === 'ALL') return null;
    return (
      registeredUsers.find(
        (u) => u.id === selectedUserId || u.username === selectedUserId || u.name === selectedUserId
      ) || null
    );
  }, [selectedUserId, registeredUsers]);

  // Filter tickets by selected user
  const userFilteredTickets = useMemo(() => {
    if (selectedUserId === 'ALL') return placedTickets;
    return placedTickets.filter((t) => {
      if (t.userId && (t.userId === selectedUserId || (selectedUser && t.userId === selectedUser.id))) {
        return true;
      }
      if ((t as any).agencyName && selectedUser && (t as any).agencyName === selectedUser.username) {
        return true;
      }
      if ((t as any).userName && selectedUser && (t as any).userName === selectedUser.name) {
        return true;
      }
      return false;
    });
  }, [placedTickets, selectedUserId, selectedUser]);

  // Compute User Performance List filtered by fromDate, toDate, and userSearchQuery
  const userPerformanceList = useMemo(() => {
    let users = registeredUsers;
    if (userSearchQuery.trim()) {
      const q = userSearchQuery.trim().toLowerCase();
      users = registeredUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q)
      );
    }

    return users.map((user) => {
      const userTkts = placedTickets.filter((t) => {
        const matchesUser =
          t.userId === user.id ||
          (t as any).agencyName === user.username ||
          (t as any).userName === user.name;
        if (!matchesUser) return false;

        const tDate = t.placedAt ? t.placedAt.split('T')[0].split(' ')[0] : todayStr;
        if (fromDate && tDate < fromDate) return false;
        if (toDate && tDate > toDate) return false;
        return true;
      });

      const totalBills = userTkts.length;
      const totalGross = userTkts.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

      // Payouts for this user filtered by date range
      const userPayouts = payoutLogs
        .filter((p) => {
          const matchesUser = p.userId === user.id || p.userName === user.name;
          if (!matchesUser) return false;
          const pDate = p.date ? p.date.split('T')[0].split(' ')[0] : todayStr;
          if (fromDate && pDate < fromDate) return false;
          if (toDate && pDate > toDate) return false;
          return true;
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const net = totalGross - userPayouts;

      return {
        user,
        totalBills,
        totalGross,
        totalPayouts: userPayouts,
        net,
      };
    });
  }, [registeredUsers, userSearchQuery, placedTickets, payoutLogs, fromDate, toDate, todayStr]);

  // Filtered Tickets for Sales Tab
  const salesFilteredTickets = useMemo(() => {
    return userFilteredTickets.filter((t) => {
      // Date filter
      const tDate = t.placedAt ? t.placedAt.split('T')[0].split(' ')[0] : todayStr;
      if (fromDate && tDate < fromDate) return false;
      if (toDate && tDate > toDate) return false;

      // Slot filter
      if (slotFilter !== 'ALL' && t.gameSlot !== slotFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const idMatch = t.id.toLowerCase().includes(q) || (t.ticketId && t.ticketId.toLowerCase().includes(q));
        const cMatch = t.customerName && t.customerName.toLowerCase().includes(q);
        const userMatch = (t as any).userName && (t as any).userName.toLowerCase().includes(q);
        const numMatch = t.items.some((it) => it.number && it.number.toLowerCase().includes(q));
        if (!idMatch && !cMatch && !userMatch && !numMatch) return false;
      }

      return true;
    });
  }, [userFilteredTickets, fromDate, toDate, slotFilter, searchQuery, todayStr]);

  const totalFilteredSalesAmount = useMemo(() => {
    return salesFilteredTickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  }, [salesFilteredTickets]);

  const totalFilteredItemsCount = useMemo(() => {
    return salesFilteredTickets.reduce(
      (sum, t) => sum + t.items.reduce((s, it) => s + (it.count || 1), 0),
      0
    );
  }, [salesFilteredTickets]);

  // Winning Tickets Computation
  const winningTicketsList = useMemo(() => {
    const wins: {
      ticket: PlacedTicket;
      item: any;
      matchedNumber: string;
      prizeTitle: string;
      wonAmount: number;
    }[] = [];

    userFilteredTickets.forEach((ticket) => {
      const tDate = ticket.placedAt ? ticket.placedAt.split('T')[0].split(' ')[0] : todayStr;
      const res = getResultForSlotAndDate(ticket.gameSlot, tDate);
      if (!res) return;

      const p1 = res.prize1;
      const p2 = res.prize2;
      const p3 = res.prize3;
      const p4 = res.prize4;
      const p5 = res.prize5;
      const comps = res.compliments ? res.compliments.flat() : [];

      ticket.items.forEach((item) => {
        const num = getDisplayNumber(item);
        const count = item.count || 1;

        if (num === p1) {
          wins.push({
            ticket,
            item,
            matchedNumber: num,
            prizeTitle: '1st Prize',
            wonAmount: count * 500,
          });
        } else if (num === p2) {
          wins.push({
            ticket,
            item,
            matchedNumber: num,
            prizeTitle: '2nd Prize',
            wonAmount: count * 250,
          });
        } else if (num === p3) {
          wins.push({
            ticket,
            item,
            matchedNumber: num,
            prizeTitle: '3rd Prize',
            wonAmount: count * 100,
          });
        } else if (num === p4) {
          wins.push({
            ticket,
            item,
            matchedNumber: num,
            prizeTitle: '4th Prize',
            wonAmount: count * 50,
          });
        } else if (num === p5) {
          wins.push({
            ticket,
            item,
            matchedNumber: num,
            prizeTitle: '5th Prize',
            wonAmount: count * 30,
          });
        } else if (comps.includes(num)) {
          wins.push({
            ticket,
            item,
            matchedNumber: num,
            prizeTitle: 'Complimentary Prize',
            wonAmount: count * 10,
          });
        }
      });
    });

    return wins;
  }, [userFilteredTickets, getResultForSlotAndDate, todayStr]);

  const totalWonAmount = useMemo(() => {
    return winningTicketsList.reduce((sum, w) => sum + w.wonAmount, 0);
  }, [winningTicketsList]);

  const gameSlotsList: GameSlot[] = ['1 PM Game', '3 PM Game', '6 PM Game', '8 PM Game'];

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-16 select-none font-sans">
      {/* Gold Header */}
      <HeaderBanner title="Reports" />

      <div className="px-4 sm:px-6 py-4 space-y-4 max-w-5xl mx-auto w-full">
        {/* Top 4 Section Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-neutral-950 rounded-xl sm:rounded-2xl border border-gold/40 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('USERS')}
            className={`py-2 px-2 rounded-lg sm:rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'USERS'
                ? 'bg-gold-metallic text-black shadow'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">1. Users List</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SALES')}
            className={`py-2 px-2 rounded-lg sm:rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'SALES'
                ? 'bg-gold-metallic text-black shadow'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">2. Sales Report</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('WINNING')}
            className={`py-2 px-2 rounded-lg sm:rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'WINNING'
                ? 'bg-gold-metallic text-black shadow'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">3. Winning</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DAILY')}
            className={`py-2 px-2 rounded-lg sm:rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'DAILY'
                ? 'bg-gold-metallic text-black shadow'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">4. Daily</span>
          </button>
        </div>

        {/* TAB 1: USERS LIST & REPORT PERFORMANCE TABLE */}
        {activeTab === 'USERS' && (
          <div className="space-y-3 animate-drop-in">
            {/* Single-Line FROM DATE & TO DATE Row + User Search */}
            <div className="bg-neutral-950 border border-neutral-800 p-3 sm:p-4 rounded-2xl shadow-md space-y-3">
              <div className="flex items-center gap-2.5 sm:gap-3">
                {/* FROM DATE */}
                <div
                  onClick={() => userFromRef.current?.showPicker?.()}
                  className="relative flex-1 bg-black border border-neutral-700 [@media(hover:hover)]:hover:border-gold/60 rounded-xl px-3 sm:px-4 py-2 cursor-pointer group transition-all block overflow-hidden shadow-inner h-[44px] flex flex-col justify-center"
                >
                  <span className="text-[9px] sm:text-[10px] font-black text-neutral-400 uppercase tracking-wider block pointer-events-none leading-none">
                    From date
                  </span>
                  <span className="text-white font-black text-xs sm:text-sm tracking-wide block mt-0.5 font-mono pointer-events-none truncate">
                    {formatDateDisplay(fromDate)}
                  </span>
                  <input
                    ref={userFromRef}
                    type="date"
                    value={fromDate}
                    onChange={(e) => e.target.value && setFromDate(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 full-date-input"
                  />
                </div>

                {/* TO DATE */}
                <div
                  onClick={() => userToRef.current?.showPicker?.()}
                  className="relative flex-1 bg-black border border-neutral-700 [@media(hover:hover)]:hover:border-gold/60 rounded-xl px-3 sm:px-4 py-2 cursor-pointer group transition-all block overflow-hidden shadow-inner h-[44px] flex flex-col justify-center"
                >
                  <span className="text-[9px] sm:text-[10px] font-black text-neutral-400 uppercase tracking-wider block pointer-events-none leading-none">
                    To date
                  </span>
                  <span className="text-white font-black text-xs sm:text-sm tracking-wide block mt-0.5 font-mono pointer-events-none truncate">
                    {formatDateDisplay(toDate)}
                  </span>
                  <input
                    ref={userToRef}
                    type="date"
                    value={toDate}
                    onChange={(e) => e.target.value && setToDate(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 full-date-input"
                  />
                </div>
              </div>

              {/* User Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search user by name or username..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full bg-black border border-neutral-700 text-white text-xs pl-8 pr-3 py-2 rounded-xl focus:border-gold outline-none placeholder-neutral-500 font-sans"
                />
              </div>
            </div>

            <div className="bg-neutral-950 border border-gold/40 rounded-xl overflow-hidden shadow-md">
              <div className="p-3 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-black text-xs sm:text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-gold" />
                  <span>User Wise Performance ({userPerformanceList.length})</span>
                </h3>
              </div>

              {registeredUsers.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 text-sm">
                  No users registered yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-sans">
                    <thead>
                      <tr className="bg-neutral-900/90 text-neutral-400 border-b border-neutral-800 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">User / Agency</th>
                        <th className="py-2.5 px-2 text-center">Bills</th>
                        <th className="py-2.5 px-2 text-right">Sales</th>
                        <th className="py-2.5 px-2 text-right">Price</th>
                        <th className="py-2.5 px-2 text-right">Net</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900">
                      {userPerformanceList.map(({ user, totalBills, totalGross, totalPayouts, net }) => {
                        const isCurrent = selectedUserId === user.id || selectedUserId === user.username;
                        return (
                          <tr
                            key={user.id}
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setActiveTab('SALES');
                            }}
                            className={`transition-colors cursor-pointer hover:bg-neutral-900/70 ${
                              isCurrent ? 'bg-amber-950/30 border-l-4 border-gold' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3">
                              <div className="font-black text-white text-xs">{user.name}</div>
                              <div className="text-[10px] text-neutral-400 font-mono">@{user.username}</div>
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono font-bold text-neutral-300">
                              {totalBills}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono font-black text-white">
                              ₹ {totalGross.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono font-bold text-rose-400">
                              ₹ {totalPayouts.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono font-black text-gold">
                              ₹ {net.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SIMPLIFIED SALES REPORT */}
        {activeTab === 'SALES' && (
          <div className="space-y-3 animate-drop-in">
            {/* Simple Clean Filter Bar */}
            <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl space-y-2.5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* User Dropdown Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 font-bold">User:</span>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="bg-black border border-neutral-700 text-gold font-bold text-xs px-2.5 py-1.5 rounded-lg focus:border-gold outline-none cursor-pointer"
                  >
                    <option value="ALL">⭐ All Users (Whole Report)</option>
                    {registeredUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        👤 {u.name} (@{u.username})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Slot Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 font-bold">Slot:</span>
                  <select
                    value={slotFilter}
                    onChange={(e) => setSlotFilter(e.target.value as any)}
                    className="bg-black border border-neutral-700 text-white text-xs px-2.5 py-1.5 rounded-lg focus:border-gold outline-none cursor-pointer"
                  >
                    <option value="ALL">All Slots</option>
                    {gameSlotsList.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>

                {/* Date Picker */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 font-bold">Date:</span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      setToDate(e.target.value);
                    }}
                    className="bg-black border border-neutral-700 text-white font-mono text-xs px-2.5 py-1 rounded-lg focus:border-gold outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by Bill ID, Customer Name, Number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black border border-neutral-700 text-white text-xs pl-8 pr-3 py-1.5 rounded-lg focus:border-gold outline-none placeholder-neutral-500"
                />
              </div>
            </div>

            {/* 3 Metrics Cards in a Single Row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 text-center">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">Total Bills</span>
                <span className="text-sm sm:text-lg font-black font-mono text-white">
                  {salesFilteredTickets.length}
                </span>
              </div>

              <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 text-center">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">Total Points</span>
                <span className="text-sm sm:text-lg font-black font-mono text-neutral-300">
                  {totalFilteredItemsCount}
                </span>
              </div>

              <div className="bg-neutral-950 p-2.5 rounded-xl border border-gold/50 text-center">
                <span className="text-[10px] text-gold uppercase font-bold block">Total Amount</span>
                <span className="text-sm sm:text-lg font-black font-mono text-gold">
                  ₹ {totalFilteredSalesAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Detailed Bills List */}
            <div className="bg-neutral-950 border border-gold/40 rounded-xl overflow-hidden shadow-md">
              <div className="p-2.5 border-b border-neutral-800 flex items-center justify-between">
                <h3 className="font-black text-xs text-white uppercase tracking-wider">
                  Bills List ({salesFilteredTickets.length})
                </h3>
              </div>

              {salesFilteredTickets.length === 0 ? (
                <div className="p-6 text-center text-neutral-500 text-xs">
                  No bills found for the selected filters.
                </div>
              ) : (
                <div className="divide-y divide-neutral-900">
                  {salesFilteredTickets.map((ticket) => (
                    <div key={ticket.id} className="p-3 hover:bg-neutral-900/50 transition-all space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Bill ID with Copy */}
                          <div className="flex items-center gap-1 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-700">
                            <span className="text-[9px] text-neutral-400 font-bold uppercase">BILL:</span>
                            <span className="font-mono font-black text-xs text-white">
                              {ticket.ticketId || ticket.id}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyBillId(ticket.ticketId || ticket.id, e)}
                              className="ml-1 text-gold hover:text-white cursor-pointer"
                              title="Copy Bill ID"
                            >
                              {copiedBillId === (ticket.ticketId || ticket.id) ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>

                          <span className="px-1.5 py-0.5 text-[9px] font-black rounded bg-blue-950 text-sky-300 border border-sky-800 font-mono">
                            {ticket.gameSlot}
                          </span>

                          {selectedUserId === 'ALL' && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-neutral-900 text-neutral-300 border border-neutral-700">
                              👤 {(ticket as any).userName || (ticket as any).agencyName || ticket.userId}
                            </span>
                          )}

                          {formatCustomerName(ticket.customerName) && (
                            <span className="text-[10px] text-neutral-300 font-bold">
                              Cust: <span className="text-white">{ticket.customerName}</span>
                            </span>
                          )}
                        </div>

                        <div className="font-mono font-black text-xs sm:text-sm text-gold">
                          ₹ {ticket.totalAmount.toLocaleString()}
                        </div>
                      </div>

                      {/* Items Grid */}
                      <div className="bg-black p-2 rounded-lg border border-neutral-800">
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1.5 text-xs">
                          {ticket.items.map((item, idx) => (
                            <div key={idx} className="bg-neutral-900/80 p-1.5 rounded border border-neutral-800 flex items-center justify-between">
                              <div>
                                <span className="text-[9px] text-gold font-black block uppercase">
                                  {getDisplayGame(item)}
                                </span>
                                <span className="font-mono font-black text-xs text-white block">
                                  {getDisplayNumber(item)}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] text-neutral-400 block font-mono">
                                  x{item.count || 1}
                                </span>
                                <span className="text-[10px] font-mono font-bold text-neutral-200 block">
                                  ₹{item.totalAmount ?? item.amount ?? 0}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="text-[9px] text-neutral-500 font-mono text-right">
                        {formatPlacedAtDate(ticket.placedAt || ticket.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: WINNING REPORT */}
        {activeTab === 'WINNING' && (
          <div className="space-y-3 animate-drop-in">
            <div className="bg-neutral-950 border border-gold/60 p-3 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-black p-1.5 flex items-center justify-center border border-gold/80 shrink-0">
                  <img src={goldTrophy} alt="Trophy" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-black text-xs text-white uppercase tracking-wider">
                    Total Winning Payouts
                  </h3>
                  <span className="text-[10px] text-neutral-400">
                    Scope: {selectedUser ? selectedUser.name : 'All Users'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono font-black text-lg text-gold">
                  ₹ {totalWonAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-md">
              <div className="p-2.5 border-b border-neutral-800">
                <h4 className="font-black text-xs text-white uppercase tracking-wider">
                  Winning Tickets ({winningTicketsList.length})
                </h4>
              </div>

              {winningTicketsList.length === 0 ? (
                <div className="p-6 text-center text-neutral-500 text-xs">
                  No winning bets found for current published results.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-sans">
                    <thead>
                      <tr className="bg-neutral-900 text-neutral-400 border-b border-neutral-800 font-bold uppercase text-[9px] tracking-wider">
                        <th className="py-2 px-3">Bill ID</th>
                        <th className="py-2 px-2">User</th>
                        <th className="py-2 px-2">Slot</th>
                        <th className="py-2 px-2">Game</th>
                        <th className="py-2 px-2">Winning No.</th>
                        <th className="py-2 px-2">Tier</th>
                        <th className="py-2 px-3 text-right">Won Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900 font-mono text-xs">
                      {winningTicketsList.map((win, idx) => (
                        <tr key={idx} className="hover:bg-neutral-900/50 transition-colors">
                          <td className="py-2 px-3 font-black text-white">
                            <div className="flex items-center gap-1">
                              <span>{win.ticket.ticketId || win.ticket.id}</span>
                              <button
                                type="button"
                                onClick={(e) => handleCopyBillId(win.ticket.ticketId || win.ticket.id, e)}
                                className="text-gold hover:text-white cursor-pointer"
                              >
                                {copiedBillId === (win.ticket.ticketId || win.ticket.id) ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-2 px-2 text-neutral-300 font-sans font-bold text-[11px]">
                            {(win.ticket as any).userName || (win.ticket as any).agencyName || win.ticket.userId}
                          </td>
                          <td className="py-2 px-2 text-sky-300 text-[11px]">
                            {win.ticket.gameSlot}
                          </td>
                          <td className="py-2 px-2 text-amber-300 font-black text-[11px]">
                            {getDisplayGame(win.item)}
                          </td>
                          <td className="py-2 px-2 font-black text-white">
                            {win.matchedNumber}
                          </td>
                          <td className="py-2 px-2">
                            <span className="px-1.5 py-0.5 text-[9px] rounded bg-amber-950 text-gold border border-gold/40 font-bold">
                              {win.prizeTitle}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-black text-emerald-400">
                            ₹ {win.wonAmount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: DAILY REPORT */}
        {activeTab === 'DAILY' && (
          <div className="space-y-3 animate-drop-in">
            <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-gold" />
                  <span>Daily Breakdown ({fromDate})</span>
                </h3>
                <span className="text-[11px] text-gold font-mono font-bold">
                  {selectedUser ? selectedUser.name : 'All Users'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {gameSlotsList.map((slot) => {
                  const slotTkts = userFilteredTickets.filter((t) => {
                    const tDate = t.placedAt ? t.placedAt.split('T')[0].split(' ')[0] : todayStr;
                    return t.gameSlot === slot && tDate === fromDate;
                  });

                  const gross = slotTkts.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
                  const billsCount = slotTkts.length;

                  return (
                    <div key={slot} className="bg-black p-2.5 rounded-lg border border-neutral-800 space-y-1.5 shadow">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-white">{slot}</span>
                        <span className="text-[9px] text-neutral-400 font-mono">{billsCount} Bills</span>
                      </div>
                      <div className="border-t border-neutral-900 pt-1 flex justify-between text-[11px]">
                        <span className="text-neutral-400">Sales:</span>
                        <span className="font-mono font-bold text-white">₹ {gross.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
