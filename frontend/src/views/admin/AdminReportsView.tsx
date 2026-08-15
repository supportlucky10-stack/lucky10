import React, { useState, useMemo, useRef } from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';
import { useApp } from '../../context/AppContext';
import type { GameSlot, PlacedTicket, UserAccount } from '../../types';
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

const formatCustomerName = (name?: string): string => {
  if (!name || name.trim().toLowerCase() === 'customer') return '';
  return name.trim();
};

const getDisplayNumber = (item: { number?: string; type?: string }): string => {
  const num = item.number || '';
  if (num.includes(':')) {
    return num.split(':')[1];
  }
  return num;
};

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return dateStr;
};

const formatRupees = (amount: number): string => {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  if (abs >= 100000) {
    const inLakhs = abs / 100000;
    const formatted = parseFloat(inLakhs.toFixed(2));
    return `${isNegative ? '-' : ''}₹ ${formatted}Lk`;
  }
  return `${isNegative ? '-' : ''}₹ ${abs.toLocaleString()}`;
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
  const [selectedUserId] = useState<string>('ALL');

  // Filter States
  const [fromDate, setFromDate] = useState<string>(todayStr);
  const [toDate, setToDate] = useState<string>(todayStr);
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [copiedBillId, setCopiedBillId] = useState<string | null>(null);

  // Selected User for Detailed Sales Report Sub-view
  const [selectedReportUser, setSelectedReportUser] = useState<UserAccount | null>(null);
  const [reportFilterSearch, setReportFilterSearch] = useState<string>('');

  // Selected User for User Wise Performance Sub-view
  const [selectedPerformanceUser, setSelectedPerformanceUser] = useState<UserAccount | null>(null);

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

  // Filter tickets by selected user and date range
  const userFilteredTickets = useMemo(() => {
    return placedTickets.filter((t) => {
      if (selectedUserId !== 'ALL') {
        const matchesUser =
          (t.userId && (t.userId === selectedUserId || (selectedUser && t.userId === selectedUser.id))) ||
          ((t as any).agencyName && selectedUser && (t as any).agencyName === selectedUser.username) ||
          ((t as any).userName && selectedUser && (t as any).userName === selectedUser.name);
        if (!matchesUser) return false;
      }
      const tDate = t.placedAt ? t.placedAt.split('T')[0].split(' ')[0] : todayStr;
      if (fromDate && tDate < fromDate) return false;
      if (toDate && tDate > toDate) return false;
      return true;
    });
  }, [placedTickets, selectedUserId, selectedUser, fromDate, toDate, todayStr]);

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

      // Commission calculation based on user's mode/rate
      let commissionPercent = 0;
      const userMode = user.mode || '';
      if (userMode.includes('30%')) {
        commissionPercent = 0.30;
      } else if (userMode.includes('With Commission') || userMode.includes('20%')) {
        commissionPercent = 0.20;
      } else if (userMode === 'Without Commission') {
        commissionPercent = 0;
      } else if (userMode) {
        commissionPercent = 0.20;
      }

      const totalCommission = Math.round(totalGross * commissionPercent);
      const net = totalGross - userPayouts - totalCommission;

      return {
        user,
        totalBills,
        totalGross,
        totalPayouts: userPayouts,
        totalCommission,
        net,
      };
    });
  }, [registeredUsers, userSearchQuery, placedTickets, payoutLogs, fromDate, toDate, todayStr]);

  // Detailed tickets for selectedReportUser filtered by date range
  const selectedUserTickets = useMemo(() => {
    if (!selectedReportUser) return [];
    return placedTickets.filter((t) => {
      const matchesUser =
        t.userId === selectedReportUser.id ||
        (t as any).agencyName === selectedReportUser.username ||
        (t as any).userName === selectedReportUser.name;
      if (!matchesUser) return false;

      const tDate = t.placedAt ? t.placedAt.split('T')[0].split(' ')[0] : todayStr;
      if (fromDate && tDate < fromDate) return false;
      if (toDate && tDate > toDate) return false;
      return true;
    });
  }, [selectedReportUser, placedTickets, fromDate, toDate, todayStr]);

  const selectedUserTotalGross = useMemo(() => {
    return selectedUserTickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  }, [selectedUserTickets]);

  const selectedUserTotalPayouts = useMemo(() => {
    if (!selectedReportUser) return 0;
    return payoutLogs
      .filter((p) => {
        const matchesUser = p.userId === selectedReportUser.id || p.userName === selectedReportUser.name;
        if (!matchesUser) return false;
        const pDate = p.date ? p.date.split('T')[0].split(' ')[0] : todayStr;
        if (fromDate && pDate < fromDate) return false;
        if (toDate && pDate > toDate) return false;
        return true;
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [selectedReportUser, payoutLogs, fromDate, toDate, todayStr]);

  const selectedUserCommission = useMemo(() => {
    if (!selectedReportUser) return 0;
    let commissionPercent = 0;
    const userMode = selectedReportUser.mode || '';
    if (userMode.includes('30%')) {
      commissionPercent = 0.30;
    } else if (userMode.includes('With Commission') || userMode.includes('20%')) {
      commissionPercent = 0.20;
    } else if (userMode === 'Without Commission') {
      commissionPercent = 0;
    } else if (userMode) {
      commissionPercent = 0.20;
    }
    return Math.round(selectedUserTotalGross * commissionPercent);
  }, [selectedReportUser, selectedUserTotalGross]);

  const selectedUserNet = selectedUserTotalGross - selectedUserTotalPayouts - selectedUserCommission;

  // Filtered by internal search within user's report
  const filteredUserTickets = useMemo(() => {
    if (!reportFilterSearch.trim()) return selectedUserTickets;
    const q = reportFilterSearch.trim().toLowerCase();
    return selectedUserTickets.filter((t) => {
      const idMatch = t.id.toLowerCase().includes(q) || (t.ticketId && t.ticketId.toLowerCase().includes(q));
      const cMatch = t.customerName && t.customerName.toLowerCase().includes(q);
      const numMatch = t.items.some((it) => it.number && it.number.toLowerCase().includes(q));
      const slotMatch = t.gameSlot.toLowerCase().includes(q);
      return idMatch || cMatch || numMatch || slotMatch;
    });
  }, [selectedUserTickets, reportFilterSearch]);

  // Performance data for selectedPerformanceUser
  const selectedUserPerf = useMemo(() => {
    if (!selectedPerformanceUser) return null;
    const userTkts = placedTickets.filter((t) => {
      const matches =
        t.userId === selectedPerformanceUser.id ||
        (t as any).userName === selectedPerformanceUser.name ||
        (t as any).agencyName === selectedPerformanceUser.username;
      if (!matches) return false;
      const tDate = t.placedAt ? t.placedAt.split('T')[0].split(' ')[0] : todayStr;
      if (fromDate && tDate < fromDate) return false;
      if (toDate && tDate > toDate) return false;
      return true;
    });

    const userPays = payoutLogs.filter((p) => {
      const matches = p.userId === selectedPerformanceUser.id || p.userName === selectedPerformanceUser.name;
      if (!matches) return false;
      const pDate = p.date ? p.date.split('T')[0].split(' ')[0] : todayStr;
      if (fromDate && pDate < fromDate) return false;
      if (toDate && pDate > toDate) return false;
      return true;
    });

    const totalGross = userTkts.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const totalPayouts = userPays.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalBills = userTkts.length;

    let commissionPercent = 0;
    const userMode = selectedPerformanceUser.mode || '';
    if (userMode.includes('30%')) {
      commissionPercent = 0.30;
    } else if (userMode.includes('With Commission') || userMode.includes('20%')) {
      commissionPercent = 0.20;
    }
    const totalCommission = Math.round(totalGross * commissionPercent);
    const net = totalGross - totalPayouts - totalCommission;

    // Slot breakdown
    const slotBreakdown = (['1 PM Game', '3 PM Game', '6 PM Game', '8 PM Game'] as GameSlot[]).map((slot) => {
      const slotTkts = userTkts.filter((t) => t.gameSlot === slot);
      const slotGross = slotTkts.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      const slotBills = slotTkts.length;
      const slotComm = Math.round(slotGross * commissionPercent);
      const slotPayouts = userPays
        .filter((p) => (p as any).gameSlot === slot)
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const slotNet = slotGross - slotPayouts - slotComm;
      return {
        slot,
        bills: slotBills,
        gross: slotGross,
        payouts: slotPayouts,
        commission: slotComm,
        net: slotNet,
      };
    });

    return {
      user: selectedPerformanceUser,
      totalBills,
      totalGross,
      totalPayouts,
      totalCommission,
      net,
      slotBreakdown,
    };
  }, [selectedPerformanceUser, placedTickets, payoutLogs, fromDate, toDate, todayStr]);

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

  // Overall Global System Metrics for all users in the selected date range
  const globalTotalGross = useMemo(() => {
    return userPerformanceList.reduce((sum, item) => sum + item.totalGross, 0);
  }, [userPerformanceList]);

  const globalTotalPayouts = useMemo(() => {
    return userPerformanceList.reduce((sum, item) => sum + item.totalPayouts, 0);
  }, [userPerformanceList]);

  const globalNet = useMemo(() => {
    return userPerformanceList.reduce((sum, item) => sum + item.net, 0);
  }, [userPerformanceList]);

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
            <span className="truncate">1. Performance Report</span>
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
            <span className="truncate">3. Winning Report</span>
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
            <span className="truncate">4. Daily Report</span>
          </button>
        </div>

        {/* TAB 1: USERS LIST & REPORT PERFORMANCE TABLE */}
        {activeTab === 'USERS' && (
          <div className="space-y-3 animate-drop-in">
            {/* Metric Cards in a SINGLE ROW */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-neutral-950 border border-neutral-800 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-center space-y-0.5 shadow-sm">
                <span className="text-neutral-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block truncate">
                  Gross Sales
                </span>
                <span className="text-white font-black text-sm sm:text-xl font-mono block">
                  {formatRupees(globalTotalGross)}
                </span>
              </div>

              <div className="bg-neutral-950 border border-rose-500/40 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-center space-y-0.5 shadow-sm">
                <span className="text-rose-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block truncate">
                  Payouts
                </span>
                <span className="text-rose-300 font-black text-sm sm:text-xl font-mono block">
                  {formatRupees(globalTotalPayouts)}
                </span>
              </div>

              <div className="bg-neutral-950 border border-gold/60 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-center space-y-0.5 shadow-sm">
                <span className="text-gold text-[10px] sm:text-xs font-black uppercase tracking-wider block truncate">
                  Net Revenue
                </span>
                <span className="text-gold font-black text-sm sm:text-xl font-mono block">
                  {formatRupees(globalNet)}
                </span>
              </div>
            </div>
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
                        <th className="py-2.5 px-2 text-right">COMM</th>
                        <th className="py-2.5 px-2 text-right">Net</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900">
                      {userPerformanceList.map(({ user, totalBills, totalGross, totalPayouts, totalCommission, net }) => (
                        <tr
                          key={user.id}
                          onClick={() => setSelectedPerformanceUser(user)}
                          className="transition-colors cursor-pointer hover:bg-neutral-900/80 active:scale-[0.99]"
                        >
                          <td className="py-2.5 px-3">
                            <div className="font-black text-white text-xs hover:text-gold transition-colors">{user.name}</div>
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono font-bold text-neutral-300">
                            {totalBills}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-black text-white whitespace-nowrap">
                            {formatRupees(totalGross)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-rose-400 whitespace-nowrap">
                            {formatRupees(totalPayouts)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-rose-400 whitespace-nowrap">
                            {formatRupees(totalCommission)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-black text-gold whitespace-nowrap">
                            {formatRupees(net)}
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

        {/* TAB 2: SALES REPORT (Matching Image 2) */}
        {activeTab === 'SALES' && (
          <div className="space-y-3 animate-drop-in">
            {/* Single-Line FROM DATE & TO DATE Row + Search */}
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

            {/* Sales Report Table Card */}
            <div className="bg-neutral-950 border border-gold/40 rounded-xl overflow-hidden shadow-md">
              <div className="p-3 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-black text-xs sm:text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-gold" />
                  <span>User Wise Sales Report ({userPerformanceList.length})</span>
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
                        <th className="py-2.5 px-4">User / Agency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900">
                      {userPerformanceList.map(({ user }) => (
                        <tr
                          key={user.id}
                          onClick={() => setSelectedReportUser(user)}
                          className="transition-colors cursor-pointer hover:bg-neutral-900/80 active:scale-[0.99]"
                        >
                          <td className="py-3 px-4">
                            <div className="font-black text-white text-xs hover:text-gold transition-colors">{user.name}</div>
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

        {/* TAB 3: WINNING REPORT */}
        {activeTab === 'WINNING' && (
          <div className="space-y-3 animate-drop-in">
            {/* Single-Line FROM DATE & TO DATE Row */}
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
            </div>

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
            {/* Single-Line FROM DATE & TO DATE Row */}
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
            </div>

            <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-gold" />
                  <span>Daily Breakdown ({fromDate === toDate ? formatDateDisplay(fromDate) : `${formatDateDisplay(fromDate)} to ${formatDateDisplay(toDate)}`})</span>
                </h3>
                <span className="text-[11px] text-gold font-mono font-bold">
                  {selectedUser ? selectedUser.name : 'All Users'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {gameSlotsList.map((slot) => {
                  const slotTkts = userFilteredTickets.filter((t) => t.gameSlot === slot);

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

      {/* ================= DEDICATED USER SALES REPORT FULL-SCREEN OVERLAY ================= */}
      {selectedReportUser && (
        <div className="fixed inset-0 bg-black text-white z-50 flex flex-col justify-start overflow-y-auto animate-drop-in font-sans">
          {/* Header Banner */}
          <HeaderBanner
            title="USER SALES REPORT"
            showBack={true}
            onBackClick={() => {
              setSelectedReportUser(null);
              setReportFilterSearch('');
            }}
          />

          <div className="max-w-xl mx-auto w-full px-4 sm:px-6 py-6 space-y-4">
            {/* Gold Sub-header Metric Banner */}
            <div className="bg-gold-metallic p-4 rounded-2xl text-black shadow-xl border-2 border-gold-dark space-y-2.5 font-mono">
              <div className="flex items-center justify-between font-black text-base sm:text-lg uppercase tracking-wider">
                <span className="truncate">{selectedReportUser.name}</span>
              </div>
              <div className="text-xs font-bold text-neutral-900 font-mono">
                DATE: {fromDate === toDate ? formatDateDisplay(fromDate) : `${formatDateDisplay(fromDate)} to ${formatDateDisplay(toDate)}`}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/30 text-xs sm:text-sm font-black text-center">
                <div className="bg-black/10 p-2 rounded-lg">
                  <span className="text-[10px] text-neutral-800 uppercase block font-bold">Total Bills</span>
                  <span>{selectedUserTickets.length}</span>
                </div>
                <div className="bg-black/10 p-2 rounded-lg">
                  <span className="text-[10px] text-neutral-800 uppercase block font-bold">Gross Sales</span>
                  <span>{formatRupees(selectedUserTotalGross)}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-xs sm:text-sm font-black text-center">
                <div className="bg-black/10 p-2 rounded-lg">
                  <span className="text-[10px] text-rose-950 uppercase block font-bold">Price (Payouts)</span>
                  <span className="text-rose-950">{formatRupees(selectedUserTotalPayouts)}</span>
                </div>
                <div className="bg-black/10 p-2 rounded-lg">
                  <span className="text-[10px] text-rose-950 uppercase block font-bold">COMM</span>
                  <span className="text-rose-950">{formatRupees(selectedUserCommission)}</span>
                </div>
                <div className="bg-black/10 p-2 rounded-lg">
                  <span className="text-[10px] text-emerald-950 uppercase block font-bold">Net Revenue</span>
                  <span>{formatRupees(selectedUserNet)}</span>
                </div>
              </div>
            </div>

            {/* Filter / Search within user report */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by Bill ID, Number, Customer, Slot..."
                value={reportFilterSearch}
                onChange={(e) => setReportFilterSearch(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 text-white text-xs pl-8 pr-3 py-2 rounded-xl focus:border-gold outline-none placeholder-neutral-500 font-sans"
              />
            </div>

            {/* List of Bills matching User Sales Report in customer app */}
            <div className="space-y-3">
              {filteredUserTickets.length === 0 ? (
                <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 text-center font-mono text-xs font-bold text-neutral-400">
                  No bills found for {selectedReportUser.name} on the selected date.
                </div>
              ) : (
                filteredUserTickets.map((tkt) => (
                  <div
                    key={tkt.id}
                    className="bg-neutral-950 rounded-2xl overflow-hidden shadow-xl border-2 border-white/90 font-mono space-y-0"
                  >
                    {/* Card Top Header */}
                    <div className="bg-[#1e1e1e] p-3 text-xs border-b border-neutral-800 space-y-1">
                      <div className="flex items-center justify-between font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-white text-sm">
                            BILL ID: <strong className="text-gold font-bold">{tkt.ticketId || tkt.id}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyBillId(tkt.ticketId || tkt.id, e)}
                            className="text-gold hover:text-white cursor-pointer"
                            title="Copy Bill ID"
                          >
                            {copiedBillId === (tkt.ticketId || tkt.id) ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-black rounded bg-blue-950 text-sky-300 border border-sky-800">
                          {tkt.gameSlot}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                        <span>COUNT: <strong className="text-white font-bold">{tkt.items.reduce((s, it) => s + (it.count || 1), 0)}</strong></span>
                        <span>{formatPlacedAtDate(tkt.placedAt || tkt.createdAt)}</span>
                      </div>
                      {formatCustomerName(tkt.customerName) && (
                        <div className="text-[11px] text-neutral-400 font-mono flex items-center justify-between pt-0.5">
                          <span>CUSTOMER: <strong className="text-neutral-200">{tkt.customerName}</strong></span>
                          <span className="font-black text-gold text-sm">TOTAL: <strong className="text-gold">{formatRupees(tkt.totalAmount)}</strong></span>
                        </div>
                      )}
                      {!formatCustomerName(tkt.customerName) && (
                        <div className="text-[11px] text-neutral-400 font-mono flex items-center justify-end pt-0.5">
                          <span className="font-black text-gold text-sm">TOTAL: <strong className="text-gold">{formatRupees(tkt.totalAmount)}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Table Header Row */}
                    <div className="bg-neutral-900 text-gold font-black text-xs px-4 py-2 flex items-center justify-between shadow-md border-b border-neutral-800">
                      <div className="flex items-center gap-7 font-mono">
                        <span>GAME</span>
                        <span>NUM</span>
                        <span>CNT</span>
                      </div>
                      <span className="font-mono">T.AMT</span>
                    </div>

                    {/* Card Items Table */}
                    <div className="bg-white text-black font-extrabold text-xs divide-y divide-neutral-200">
                      {tkt.items.map((item: any, idx: number) => {
                        const numStr = getDisplayNumber(item);
                        const isMatch = reportFilterSearch.trim() && numStr.includes(reportFilterSearch.trim());
                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-between px-4 py-2.5 transition-colors ${
                              isMatch
                                ? 'bg-amber-200 text-black border-l-4 border-amber-600 font-black'
                                : idx % 2 === 1
                                ? 'bg-fuchsia-50/80'
                                : 'bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-7 font-mono">
                              <span className="font-black uppercase w-12 text-neutral-900">{getDisplayGame(item)}</span>
                              <span className={`font-black tracking-wider w-10 ${isMatch ? 'text-amber-950 underline font-extrabold scale-105' : 'text-neutral-900'}`}>{numStr}</span>
                              <span className="font-black text-neutral-800">{item.count || 1}</span>
                            </div>
                            <span className="font-black text-neutral-900 font-mono">₹{item.totalAmount ?? item.amount ?? 0}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= DEDICATED USER WISE PERFORMANCE FULL-SCREEN PAGE ================= */}
      {selectedPerformanceUser && selectedUserPerf && (
        <div className="fixed inset-0 bg-black text-white z-50 flex flex-col justify-start overflow-y-auto animate-drop-in font-sans">
          {/* Header Banner */}
          <HeaderBanner
            title="USER WISE PERFORMANCE"
            showBack={true}
            onBackClick={() => setSelectedPerformanceUser(null)}
          />

          <div className="max-w-xl mx-auto w-full px-4 sm:px-6 py-4 space-y-4">
            {/* Performance Card exactly like the image */}
            <div className="bg-neutral-950 border border-gold/40 rounded-xl overflow-hidden shadow-md">
              <div className="p-3 border-b border-neutral-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gold" />
                <h3 className="font-black text-xs sm:text-sm text-white uppercase tracking-wider">
                  User Performance
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-neutral-900/90 text-neutral-400 border-b border-neutral-800 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">User / Agency</th>
                      <th className="py-2.5 px-2 text-center">Bills</th>
                      <th className="py-2.5 px-2 text-right">Sales</th>
                      <th className="py-2.5 px-2 text-right">Price</th>
                      <th className="py-2.5 px-2 text-right">COMM</th>
                      <th className="py-2.5 px-2 text-right">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-neutral-900/40">
                      <td className="py-2.5 px-3">
                        <div className="font-black text-white text-xs">{selectedPerformanceUser.name}</div>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-neutral-300">
                        {selectedUserPerf.totalBills}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-black text-white whitespace-nowrap">
                        {formatRupees(selectedUserPerf.totalGross)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-rose-400 whitespace-nowrap">
                        {formatRupees(selectedUserPerf.totalPayouts)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-rose-400 whitespace-nowrap">
                        {formatRupees(selectedUserPerf.totalCommission)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-black text-gold whitespace-nowrap">
                        {formatRupees(selectedUserPerf.net)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Slot-wise Breakdown Table Card */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-md">
              <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
                <h3 className="font-black text-xs sm:text-sm text-white uppercase tracking-wider">
                  Slot Wise Performance
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-neutral-900/90 text-neutral-400 border-b border-neutral-800 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Slot</th>
                      <th className="py-2.5 px-2 text-center">Bills</th>
                      <th className="py-2.5 px-2 text-right">Sales</th>
                      <th className="py-2.5 px-2 text-right">Price</th>
                      <th className="py-2.5 px-2 text-right">COMM</th>
                      <th className="py-2.5 px-2 text-right">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {selectedUserPerf.slotBreakdown.map((s) => (
                      <tr key={s.slot} className="hover:bg-neutral-900/50 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-white text-xs">{s.slot}</td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-neutral-300">{s.bills}</td>
                        <td className="py-2.5 px-2 text-right font-mono font-black text-white whitespace-nowrap">{formatRupees(s.gross)}</td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-rose-400 whitespace-nowrap">{formatRupees(s.payouts)}</td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-rose-400 whitespace-nowrap">{formatRupees(s.commission)}</td>
                        <td className="py-2.5 px-2 text-right font-mono font-black text-gold whitespace-nowrap">{formatRupees(s.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-neutral-900/90 border-t border-neutral-800 font-bold">
                      <td className="py-2.5 px-3 text-gold uppercase text-[10px] tracking-wider">Total</td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-white">{selectedUserPerf.totalBills}</td>
                      <td className="py-2.5 px-2 text-right font-mono font-black text-white whitespace-nowrap">{formatRupees(selectedUserPerf.totalGross)}</td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-rose-400 whitespace-nowrap">{formatRupees(selectedUserPerf.totalPayouts)}</td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-rose-400 whitespace-nowrap">{formatRupees(selectedUserPerf.totalCommission)}</td>
                      <td className="py-2.5 px-2 text-right font-mono font-black text-gold whitespace-nowrap">{formatRupees(selectedUserPerf.net)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
