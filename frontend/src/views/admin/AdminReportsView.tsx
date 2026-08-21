import React, { useState, useMemo, useRef } from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';
import { useApp } from '../../context/AppContext';
import type { GameSlot, PlacedTicket, UserAccount } from '../../types';
import { evaluateBetItem } from '../../utils/gameRulesEngine';
import { getLocalDateStr, extractDateStr } from '../../utils/dateUtils';
import {
  Users,
  Calendar,
  Search,
  Check,
  Copy,
  Trophy,
  ClipboardList,
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────
const getDisplayGame = (item: { number?: string; type?: string }): string => {
  const num = (item.number || '').trim();
  if (num.includes(':')) return num.split(':')[0].trim().toUpperCase();
  const typeStr = (item.type || '').toUpperCase();
  if (typeStr === 'DIRECT' || typeStr === 'SUPER') return 'SUPER';
  if (typeStr === 'SHUFFLE' || typeStr === 'BOX') return 'BOX';
  if (['AB', 'BC', 'AC', 'A', 'B', 'C'].includes(typeStr)) return typeStr;
  if (num.length === 1) return 'A';
  if (num.length === 2) return 'AB';
  return 'SUPER';
};

const getDisplayPlayMode = (item: { playMode?: string; type?: string; number?: string }): string => {
  if (item.playMode) return item.playMode.toUpperCase();
  const typeStr = (item.type || '').toUpperCase();
  if (typeStr.includes('SET')) return 'SET';
  if (typeStr.includes('R') || typeStr.includes('RANGE')) return 'R';
  return 'DIRECT';
};

const getPrizePositionDisplay = (card: any): string => {
  const p = (card.prize || '').toUpperCase();
  if (p.includes('1ST') || p.includes('1 DIGIT') || p.includes('2 DIGIT') || p.includes('BOX')) return '1ST PRIZE';
  if (p.includes('2ND')) return '2ND PRIZE';
  if (p.includes('3RD')) return '3RD PRIZE';
  if (p.includes('4TH')) return '4TH PRIZE';
  if (p.includes('5TH')) return '5TH PRIZE';
  if (p.includes('COMPLIMENT')) return 'COMPLIMENT';
  return '1ST PRIZE';
};

const getDisplayNumber = (item: { number?: string; type?: string }): string => {
  const num = item.number || '';
  if (num.includes(':')) return num.split(':')[1];
  return num;
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
    return `${isNegative ? '-' : ''}₹ ${parseFloat(inLakhs.toFixed(2))}Lk`;
  }
  return `${isNegative ? '-' : ''}₹ ${abs.toLocaleString()}`;
};

const isItemMatch = (item: any, digitF: string, subF: string) => {
  const itemType = (item.type || '').toUpperCase();
  const numStr = (item.number || '').toString().trim();
  const numLength = numStr.replace(/\D/g, '').length;

  if (digitF === '1') {
    if (numLength !== 1 && !['A', 'B', 'C'].includes(itemType)) return false;
  } else if (digitF === '2') {
    if (numLength !== 2 && !['AB', 'BC', 'AC'].includes(itemType)) return false;
  } else if (digitF === '3') {
    if (numLength !== 3 && !['SUPER', 'BOX', 'DIRECT', 'SHUFFLE'].includes(itemType)) return false;
  }

  if (subF !== 'ALL' && subF !== 'NONE') {
    const sub = subF.toUpperCase();
    if (sub === 'SUPER' || sub === 'DIRECT') {
      if (itemType !== 'SUPER' && itemType !== 'DIRECT') return false;
    } else if (sub === 'BOX' || sub === 'SHUFFLE') {
      if (itemType !== 'BOX' && itemType !== 'SHUFFLE') return false;
    } else {
      if (itemType !== sub) return false;
    }
  }

  return true;
};

const getWinnerCardTheme = (_prize?: string) => {
  return {
    cardBorder: 'border-white shadow-[0_0_15px_rgba(255,255,255,0.25)]',
    cardBg: 'bg-neutral-950',
    headerBg: 'bg-gold-metallic border-b border-black/30',
    badge: 'border-2 border-black text-black bg-black/10 shadow-sm',
    totalText: 'text-gold',
    numberText: 'text-black',
  };
};

const getCategoryHeaderTheme = (category: string) => {
  const catUpper = category.toUpperCase();
  if (catUpper.includes('1 PM') || catUpper.includes('1PM')) {
    return 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white border-2 border-sky-300 shadow-[0_0_15px_rgba(59,130,246,0.4)]';
  }
  if (catUpper.includes('3 PM') || catUpper.includes('3PM')) {
    return 'bg-gradient-to-r from-[#9a3412] via-[#7c2d12] to-[#5a1e06] text-white border-2 border-orange-400/60 shadow-[0_0_12px_rgba(154,52,18,0.3)]';
  }
  if (catUpper.includes('6 PM') || catUpper.includes('6PM')) {
    return 'bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 text-white border-2 border-fuchsia-300 shadow-[0_0_15px_rgba(217,70,239,0.4)]';
  }
  return 'bg-gradient-to-r from-neutral-900 via-[#3a2a07] to-neutral-900 text-white border-gold/50 shadow-[0_0_15px_rgba(212,175,55,0.2)] font-black';
};

type ReportTab = 'USERS' | 'SALES' | 'WINNING' | 'DAILY';

export const AdminReportsView: React.FC = () => {
  const { registeredUsers, placedTickets, getResultForSlotAndDate, payoutLogs } = useApp();
  const todayStr = getLocalDateStr();

  const triggerDatePicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    if (ref.current) {
      if (typeof ref.current.showPicker === 'function') {
        ref.current.showPicker();
      } else {
        ref.current.focus();
      }
    }
  };

  // Main Active Tab
  const [activeTab, setActiveTab] = useState<ReportTab>('USERS');

  // Shared Date Filters & Search
  const userFromRef = useRef<HTMLInputElement>(null);
  const userToRef = useRef<HTMLInputElement>(null);
  const [fromDate, setFromDate] = useState<string>(todayStr);
  const [toDate, setToDate] = useState<string>(todayStr);
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [copiedBillId, setCopiedBillId] = useState<string | null>(null);

  // Tab 1 & Tab 2 Overlays
  const [selectedReportUser, setSelectedReportUser] = useState<UserAccount | null>(null);
  const [reportFilterSearch, setReportFilterSearch] = useState<string>('');
  const [selectedPerformanceUser, setSelectedPerformanceUser] = useState<UserAccount | null>(null);

  // ── WINNING REPORT STATES ──────────────────────────────────────────────────
  const [winningSubTab, setWinningSubTab] = useState<'TOTAL' | 'USER_WISE'>('TOTAL');
  const winFromRef = useRef<HTMLInputElement>(null);
  const winToRef = useRef<HTMLInputElement>(null);
  const [winningFromDate, setWinningFromDate] = useState<string>(todayStr);
  const [winningToDate, setWinningToDate] = useState<string>(todayStr);
  const [winningSlotFilter, setWinningSlotFilter] = useState<'ALL' | '1 PM' | '3 PM' | '6 PM' | '8 PM'>('ALL');
  const [isWinningFullView, setIsWinningFullView] = useState<boolean>(false);
  const [winningDigitFilter, setWinningDigitFilter] = useState<'ALL' | 'NONE' | '1' | '2' | '3'>('NONE');
  const [winningSubOptionFilter, setWinningSubOptionFilter] = useState<string>('NONE');
  const [winningSearchNumber, setWinningSearchNumber] = useState<string>('');
  const [showWinningDetails, setShowWinningDetails] = useState<boolean>(false);
  const [selectedWinningCardId, setSelectedWinningCardId] = useState<string | null>(null);

  // User Wise Winning States
  const [winningUserSearch, setWinningUserSearch] = useState<string>('');
  const [selectedWinningUser, setSelectedWinningUser] = useState<UserAccount | null>(null);
  const userWinFromRef = useRef<HTMLInputElement>(null);
  const userWinToRef = useRef<HTMLInputElement>(null);
  const [userWinFromDate, setUserWinFromDate] = useState<string>(todayStr);
  const [userWinToDate, setUserWinToDate] = useState<string>(todayStr);
  const [userWinSlotFilter, setUserWinSlotFilter] = useState<'ALL' | '1 PM' | '3 PM' | '6 PM' | '8 PM'>('ALL');
  const [isUserWinFullView, setIsUserWinFullView] = useState<boolean>(false);
  const [userWinDigitFilter, setUserWinDigitFilter] = useState<'ALL' | 'NONE' | '1' | '2' | '3'>('NONE');
  const [userWinSubOptionFilter, setUserWinSubOptionFilter] = useState<string>('NONE');
  const [userWinSearchNumber, setUserWinSearchNumber] = useState<string>('');
  const [showUserWinningDetails, setShowUserWinningDetails] = useState<boolean>(false);
  const [selectedUserWinCardId, setSelectedUserWinCardId] = useState<string | null>(null);

  // ── DAILY REPORT STATES ────────────────────────────────────────────────────
  const [dailySubTab, setDailySubTab] = useState<'ALL_USERS' | 'USER_WISE'>('ALL_USERS');
  const dailyFromRef = useRef<HTMLInputElement>(null);
  const dailyToRef = useRef<HTMLInputElement>(null);
  const [dailyFromDate, setDailyFromDate] = useState<string>(todayStr);
  const [dailyToDate, setDailyToDate] = useState<string>(todayStr);
  const [isDayDetail, setIsDayDetail] = useState<boolean>(true);
  const [isGameDetail, setIsGameDetail] = useState<boolean>(false);
  const [dailySlotFilter, setDailySlotFilter] = useState<'ALL' | '1 PM' | '3 PM' | '6 PM' | '8 PM'>('ALL');
  const [showDailyReportOverlay, setShowDailyReportOverlay] = useState<boolean>(false);
  const [activeDailyOverlayTab, setActiveDailyOverlayTab] = useState<'DAY' | 'GAME'>('DAY');

  // User Wise Daily States
  const [dailyUserSearch, setDailyUserSearch] = useState<string>('');
  const [selectedDailyUser, setSelectedDailyUser] = useState<UserAccount | null>(null);
  const userDailyFromRef = useRef<HTMLInputElement>(null);
  const userDailyToRef = useRef<HTMLInputElement>(null);
  const [userDailyFromDate, setUserDailyFromDate] = useState<string>(todayStr);
  const [userDailyToDate, setUserDailyToDate] = useState<string>(todayStr);
  const [userIsDayDetail, setUserIsDayDetail] = useState<boolean>(true);
  const [userIsGameDetail, setUserIsGameDetail] = useState<boolean>(false);
  const [userDailySlotFilter, setUserDailySlotFilter] = useState<'ALL' | '1 PM' | '3 PM' | '6 PM' | '8 PM'>('ALL');
  const [showUserDailyOverlay, setShowUserDailyOverlay] = useState<boolean>(false);
  const [activeUserDailyOverlayTab, setActiveUserDailyOverlayTab] = useState<'DAY' | 'GAME'>('DAY');

  const handleCopyBillId = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedBillId(id);
    setTimeout(() => setCopiedBillId((prev) => (prev === id ? null : prev)), 2000);
  };

  // ── Tab 1: Performance Calculations ─────────────────────────────────────────
  const userPerformanceList = useMemo(() => {
    let users = registeredUsers;
    if (userSearchQuery.trim()) {
      const q = userSearchQuery.trim().toLowerCase();
      users = registeredUsers.filter((u) => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q));
    }

    return users.map((user) => {
      const userTkts = placedTickets.filter((t) => {
        const matchesUser = t.userId === user.id || (t as any).agencyName === user.username || (t as any).userName === user.name;
        if (!matchesUser) return false;
        const tDate = t.placedAt ? t.placedAt.split('T')[0].split(' ')[0] : todayStr;
        if (fromDate && tDate < fromDate) return false;
        if (toDate && tDate > toDate) return false;
        return true;
      });

      const totalBills = userTkts.length;
      const totalGross = userTkts.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

      // Automatically compute winning prizes won by this user's tickets against published results
      let userWinningPrizes = 0;
      userTkts.forEach((t) => {
        const tDate = t.placedAt ? t.placedAt.split('T')[0].split(' ')[0] : todayStr;
        const res = getResultForSlotAndDate(t.gameSlot, tDate);
        if (res) {
          t.items.forEach((item: any) => {
            const evalRes = evaluateBetItem(item, res);
            if (evalRes.isWinner) {
              userWinningPrizes += evalRes.winAmount;
            }
          });
        }
      });

      const manualPayouts = payoutLogs
        .filter((p) => {
          const matchesUser = p.userId === user.id || p.userName === user.name;
          if (!matchesUser) return false;
          const pDate = p.date ? p.date.split('T')[0].split(' ')[0] : todayStr;
          if (fromDate && pDate < fromDate) return false;
          if (toDate && pDate > toDate) return false;
          return true;
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const userPayouts = userWinningPrizes + manualPayouts;

      let commissionPercent = 0.20;
      const userMode = user.mode || '';
      if (userMode.includes('30%')) commissionPercent = 0.30;
      else if (userMode === 'Without Commission') commissionPercent = 0;

      const totalCommission = Math.round(totalGross * commissionPercent);
      const net = totalGross - userPayouts - totalCommission;

      return { user, totalBills, totalGross, totalPayouts: userPayouts, totalCommission, net };
    });
  }, [registeredUsers, userSearchQuery, placedTickets, payoutLogs, fromDate, toDate, todayStr, getResultForSlotAndDate]);

  const selectedUserTickets = useMemo(() => {
    if (!selectedReportUser) return [];
    return placedTickets.filter((t) => {
      const matchesUser = t.userId === selectedReportUser.id || (t as any).agencyName === selectedReportUser.username || (t as any).userName === selectedReportUser.name;
      if (!matchesUser) return false;
      const tDate = t.placedAt ? t.placedAt.split('T')[0].split(' ')[0] : todayStr;
      if (fromDate && tDate < fromDate) return false;
      if (toDate && tDate > toDate) return false;
      return true;
    });
  }, [selectedReportUser, placedTickets, fromDate, toDate, todayStr]);

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

  const selectedUserPerf = useMemo(() => {
    if (!selectedPerformanceUser) return null;
    const userTkts = placedTickets.filter((t) => {
      const matches = t.userId === selectedPerformanceUser.id || (t as any).userName === selectedPerformanceUser.name || (t as any).agencyName === selectedPerformanceUser.username;
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

    let userWinningPrizes = 0;
    userTkts.forEach((t) => {
      const tDate = t.placedAt ? t.placedAt.split('T')[0].split(' ')[0] : todayStr;
      const res = getResultForSlotAndDate(t.gameSlot, tDate);
      if (res) {
        t.items.forEach((item: any) => {
          const evalRes = evaluateBetItem(item, res);
          if (evalRes.isWinner) {
            userWinningPrizes += evalRes.winAmount;
          }
        });
      }
    });

    const manualPayouts = userPays.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPayouts = userWinningPrizes + manualPayouts;
    const totalGross = userTkts.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const totalBills = userTkts.length;

    let commissionPercent = 0.20;
    const userMode = selectedPerformanceUser.mode || '';
    if (userMode.includes('30%')) commissionPercent = 0.30;
    else if (userMode === 'Without Commission') commissionPercent = 0;

    const totalCommission = Math.round(totalGross * commissionPercent);
    const net = totalGross - totalPayouts - totalCommission;

    const slotBreakdown = (['1 PM Game', '3 PM Game', '6 PM Game', '8 PM Game'] as GameSlot[]).map((slot) => {
      const slotTkts = userTkts.filter((t) => t.gameSlot === slot);
      const slotGross = slotTkts.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      const slotBills = slotTkts.length;
      const slotComm = Math.round(slotGross * commissionPercent);
      
      let slotWinningPrizes = 0;
      slotTkts.forEach((t) => {
        const tDate = t.placedAt ? t.placedAt.split('T')[0].split(' ')[0] : todayStr;
        const res = getResultForSlotAndDate(t.gameSlot, tDate);
        if (res) {
          t.items.forEach((item: any) => {
            const evalRes = evaluateBetItem(item, res);
            if (evalRes.isWinner) {
              slotWinningPrizes += evalRes.winAmount;
            }
          });
        }
      });

      const slotManualPays = userPays.filter((p) => (p as any).gameSlot === slot).reduce((sum, p) => sum + (p.amount || 0), 0);
      const slotPayouts = slotWinningPrizes + slotManualPays;
      const slotNet = slotGross - slotPayouts - slotComm;
      return { slot, bills: slotBills, gross: slotGross, payouts: slotPayouts, commission: slotComm, net: slotNet };
    });

    return { user: selectedPerformanceUser, totalBills, totalGross, totalPayouts, totalCommission, net, slotBreakdown };
  }, [selectedPerformanceUser, placedTickets, payoutLogs, fromDate, toDate, todayStr, getResultForSlotAndDate]);

  const globalTotalGross = useMemo(() => userPerformanceList.reduce((sum, item) => sum + item.totalGross, 0), [userPerformanceList]);
  const globalTotalCommission = useMemo(() => userPerformanceList.reduce((sum, item) => sum + item.totalCommission, 0), [userPerformanceList]);
  const globalTotalPrizes = useMemo(() => userPerformanceList.reduce((sum, item) => sum + item.totalPayouts, 0), [userPerformanceList]);
  const globalTotalPayouts = useMemo(() => globalTotalPrizes + globalTotalCommission, [globalTotalPrizes, globalTotalCommission]);
  const globalNet = useMemo(() => userPerformanceList.reduce((sum, item) => sum + item.net, 0), [userPerformanceList]);

  // ── WINNING REPORT COMPUTATIONS ─────────────────────────────────────────────
  const computeWinningCategories = (
    tickets: PlacedTicket[],
    slotF: string,
    fromDateStr: string,
    toDateStr: string,
    searchNum: string,
    isFullV: boolean,
    digitF: string,
    subF: string
  ) => {
    const catMap = new Map<string, any[]>();

    tickets.forEach((ticket) => {
      const tDate = extractDateStr(ticket.placedAt);
      if (fromDateStr && tDate < fromDateStr) return;
      if (toDateStr && tDate > toDateStr) return;
      if (slotF !== 'ALL' && !ticket.gameSlot.toUpperCase().startsWith(slotF.toUpperCase())) return;

      const res = getResultForSlotAndDate(ticket.gameSlot, tDate);

      ticket.items.forEach((item: any) => {
        const num = getDisplayNumber(item);
        const count = item.count || 1;

        if (searchNum.trim() && !num.includes(searchNum.trim())) return;
        if (isFullV && !isItemMatch(item, digitF, subF)) return;

        const evalRes = evaluateBetItem(item, res);
        if (!evalRes.isWinner) return;

        const winAmt = evalRes.winAmount;
        const prizeTitle = evalRes.prizeTitle;

        if (winAmt > 0) {
          const gameTitle = getDisplayGame(item);
          const playModeTitle = getDisplayPlayMode(item);
          const catName = gameTitle;
          const existing = catMap.get(catName) || [];
          existing.push({
            id: item.id || `w_${ticket.id}_${num}_${Math.random()}`,
            ticketId: ticket.ticketId || ticket.id,
            userName: (ticket as any).userName || (ticket as any).agencyName || ticket.userId,
            agencyName: (ticket as any).agencyName || (ticket as any).userName || 'Agency',
            customerName: formatCustomerName((ticket as any).customerName),
            prize: prizeTitle,
            number: num,
            count: count,
            total: winAmt,
            slot: ticket.gameSlot,
            type: gameTitle,
            gameMode: gameTitle,
            playMode: playModeTitle,
            placedAt: ticket.placedAt,
          });
          catMap.set(catName, existing);
        }
      });
    });

    return Array.from(catMap.entries()).map(([category, cards]) => ({ category, cards }));
  };

  const totalWinningCategories = useMemo(() => {
    return computeWinningCategories(
      placedTickets,
      winningSlotFilter,
      winningFromDate,
      winningToDate,
      winningSearchNumber,
      isWinningFullView,
      winningDigitFilter,
      winningSubOptionFilter
    );
  }, [placedTickets, winningSlotFilter, winningFromDate, winningToDate, winningSearchNumber, isWinningFullView, winningDigitFilter, winningSubOptionFilter, getResultForSlotAndDate, todayStr]);

  const totalWinningCount = totalWinningCategories.reduce((acc, cat) => acc + cat.cards.reduce((cAcc: number, c: any) => cAcc + c.count, 0), 0);
  const totalWinningGrandTotal = totalWinningCategories.reduce((acc, cat) => acc + cat.cards.reduce((cAcc: number, c: any) => cAcc + c.total, 0), 0);

  const userWiseWinningUsers = useMemo(() => {
    let users = registeredUsers;
    if (winningUserSearch.trim()) {
      const q = winningUserSearch.trim().toLowerCase();
      users = registeredUsers.filter((u) => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q));
    }
    return users;
  }, [registeredUsers, winningUserSearch]);

  const userWinningCategories = useMemo(() => {
    if (!selectedWinningUser) return [];
    const userTkts = placedTickets.filter(
      (t) => t.userId === selectedWinningUser.id || (t as any).agencyName === selectedWinningUser.username || (t as any).userName === selectedWinningUser.name
    );

    return computeWinningCategories(
      userTkts,
      userWinSlotFilter,
      userWinFromDate,
      userWinToDate,
      userWinSearchNumber,
      isUserWinFullView,
      userWinDigitFilter,
      userWinSubOptionFilter
    );
  }, [selectedWinningUser, placedTickets, userWinSlotFilter, userWinFromDate, userWinToDate, userWinSearchNumber, isUserWinFullView, userWinDigitFilter, userWinSubOptionFilter, getResultForSlotAndDate, todayStr]);

  const userWinningCount = userWinningCategories.reduce((acc, cat) => acc + cat.cards.reduce((cAcc: number, c: any) => cAcc + c.count, 0), 0);
  const userWinningGrandTotal = userWinningCategories.reduce((acc, cat) => acc + cat.cards.reduce((cAcc: number, c: any) => cAcc + c.total, 0), 0);

  // ── DAILY REPORT COMPUTATIONS ──────────────────────────────────────────────
  const computeDailyReportData = (tickets: PlacedTicket[], fromDateStr: string, toDateStr: string, slotF: string, userDisplayName?: string) => {
    const dateMap = new Map<string, { date: string; sale: number; prize: number; userDisplayName: string }>();

    tickets.forEach((t) => {
      const tDate = t.placedAt ? t.placedAt.split('T')[0].split(' ')[0] : todayStr;
      if (fromDateStr && tDate < fromDateStr) return;
      if (toDateStr && tDate > toDateStr) return;

      if (slotF === 'ALL' || t.gameSlot.toUpperCase().startsWith(slotF.toUpperCase())) {
        const displayD = formatDateDisplay(tDate);
        const uName = userDisplayName || (t as any).userName || (t as any).agencyName || 'ALL USERS';
        const existing = dateMap.get(tDate) || { date: displayD, sale: 0, prize: 0, userDisplayName: uName };
        existing.sale += t.totalAmount || 0;

        const res = getResultForSlotAndDate(t.gameSlot, tDate);
        if (res) {
          t.items.forEach((item: any) => {
            const evalRes = evaluateBetItem(item, res);
            if (evalRes.isWinner) {
              existing.prize += evalRes.winAmount;
            }
          });
        }
        dateMap.set(tDate, existing);
      }
    });

    if (dateMap.size === 0 && fromDateStr && toDateStr) {
      dateMap.set(fromDateStr, {
        date: formatDateDisplay(fromDateStr),
        sale: 0,
        prize: 0,
        userDisplayName: userDisplayName || 'ALL USERS',
      });
    }

    const rows = Array.from(dateMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([_, val]) => {
      let commPct = 0.20;
      if (val.userDisplayName) {
        const matched = registeredUsers.find(
          (u) => u.name.toLowerCase() === val.userDisplayName.toLowerCase() || u.username.toLowerCase() === val.userDisplayName.toLowerCase()
        );
        if (matched?.mode?.includes('30%')) commPct = 0.30;
        else if (matched?.mode === 'Without Commission') commPct = 0;
      }
      const comm = Math.round(val.sale * commPct);
      return { ...val, comm };
    });
    const totalSale = rows.reduce((acc, r) => acc + r.sale, 0);
    const totalPrize = rows.reduce((acc, r) => acc + r.prize, 0);
    const totalComm = rows.reduce((acc, r) => acc + (r.comm || 0), 0);
    const netTotal = totalSale - totalPrize - totalComm;

    const baseSlots = [
      { slotName: '1 PM', slotKey: '1 PM Game' },
      { slotName: '3 PM', slotKey: '3 PM Game' },
      { slotName: '6 PM', slotKey: '6 PM Game' },
      { slotName: '8 PM', slotKey: '8 PM Game' },
    ];

    const gameRows = baseSlots.map((slot) => {
      const slotTickets = tickets.filter((t) => {
        const tDate = t.placedAt ? t.placedAt.split('T')[0].split(' ')[0] : todayStr;
        return (!fromDateStr || tDate >= fromDateStr) && (!toDateStr || tDate <= toDateStr) && t.gameSlot === slot.slotKey;
      });

      const userSale = slotTickets.reduce((acc, t) => acc + (t.totalAmount || 0), 0);
      let userPrize = 0;

      slotTickets.forEach((t) => {
        const tDate = t.placedAt ? t.placedAt.split('T')[0].split(' ')[0] : todayStr;
        const res = getResultForSlotAndDate(t.gameSlot, tDate);
        if (res) {
          const p1 = res.prize1;
          const p2 = res.prize2;
          const p3 = res.prize3;
          const p4 = res.prize4;
          const p5 = res.prize5;
          const comps = res.compliments ? res.compliments.flat() : [];

          t.items.forEach((item: any) => {
            const num = getDisplayNumber(item);
            const count = item.count || 1;
            if (num === p1) userPrize += count * 500;
            else if (num === p2) userPrize += count * 250;
            else if (num === p3) userPrize += count * 100;
            else if (num === p4) userPrize += count * 50;
            else if (num === p5) userPrize += count * 30;
            else if (comps.includes(num)) userPrize += count * 10;
          });
        }
      });

      let commPct = 0.20;
      if (userDisplayName) {
        const matched = registeredUsers.find(
          (u) => u.name.toLowerCase() === userDisplayName.toLowerCase() || u.username.toLowerCase() === userDisplayName.toLowerCase()
        );
        if (matched?.mode?.includes('30%')) commPct = 0.30;
        else if (matched?.mode === 'Without Commission') commPct = 0;
      }
      const userComm = Math.round(userSale * commPct);

      return { slotName: slot.slotName, sale: userSale, prize: userPrize, comm: userComm };
    });

    const filteredGameRows = slotF === 'ALL' ? gameRows : gameRows.filter((r) => r.slotName === slotF);

    return { rows, totalSale, totalPrize, totalComm, netTotal, filteredGameRows };
  };

  const allUsersDailyData = useMemo(() => {
    return computeDailyReportData(placedTickets, dailyFromDate, dailyToDate, dailySlotFilter, 'ALL USERS');
  }, [placedTickets, dailyFromDate, dailyToDate, dailySlotFilter, getResultForSlotAndDate, todayStr]);

  const userWiseDailyUsers = useMemo(() => {
    let users = registeredUsers;
    if (dailyUserSearch.trim()) {
      const q = dailyUserSearch.trim().toLowerCase();
      users = registeredUsers.filter((u) => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q));
    }
    return users;
  }, [registeredUsers, dailyUserSearch]);

  const userDailyData = useMemo(() => {
    if (!selectedDailyUser) return { rows: [], totalSale: 0, totalPrize: 0, totalComm: 0, netTotal: 0, filteredGameRows: [] };
    const userTkts = placedTickets.filter(
      (t) => t.userId === selectedDailyUser.id || (t as any).agencyName === selectedDailyUser.username || (t as any).userName === selectedDailyUser.name
    );

    return computeDailyReportData(userTkts, userDailyFromDate, userDailyToDate, userDailySlotFilter, selectedDailyUser.name);
  }, [selectedDailyUser, placedTickets, userDailyFromDate, userDailyToDate, userDailySlotFilter, getResultForSlotAndDate, todayStr]);

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-16 select-none font-sans">
      <HeaderBanner title="Reports" />

      <div className="px-4 sm:px-6 py-4 space-y-4 max-w-5xl mx-auto w-full">
        {/* Top 4 Section Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-neutral-950 rounded-xl sm:rounded-2xl border border-gold/40 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('USERS')}
            className={`py-2 px-2 rounded-lg sm:rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'USERS' ? 'bg-gold-metallic text-black shadow' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">1. Performance Report</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SALES')}
            className={`py-2 px-2 rounded-lg sm:rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'SALES' ? 'bg-gold-metallic text-black shadow' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">2. Sales Report</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('WINNING')}
            className={`py-2 px-2 rounded-lg sm:rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'WINNING' ? 'bg-gold-metallic text-black shadow' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">3. Winning Report</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DAILY')}
            className={`py-2 px-2 rounded-lg sm:rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'DAILY' ? 'bg-gold-metallic text-black shadow' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">4. Daily Report</span>
          </button>
        </div>

        {/* ================= TAB 1: USERS LIST & REPORT PERFORMANCE TABLE ================= */}
        {activeTab === 'USERS' && (
          <div className="space-y-3 animate-drop-in">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-neutral-950 border border-neutral-800 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-center space-y-0.5 shadow-sm">
                <span className="text-neutral-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block truncate">Gross Sales</span>
                <span className="text-white font-black text-sm sm:text-xl font-mono block">{formatRupees(globalTotalGross)}</span>
              </div>
              <div className="bg-neutral-950 border border-rose-500/40 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-center space-y-0.5 shadow-sm">
                <span className="text-rose-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block truncate">Payouts</span>
                <span className="text-rose-300 font-black text-sm sm:text-xl font-mono block">{formatRupees(globalTotalPayouts)}</span>
              </div>
              <div className="bg-neutral-950 border border-gold/60 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-center space-y-0.5 shadow-sm">
                <span className="text-gold text-[10px] sm:text-xs font-black uppercase tracking-wider block truncate">Net Revenue</span>
                <span className="text-gold font-black text-sm sm:text-xl font-mono block">{formatRupees(globalNet)}</span>
              </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 p-3 sm:p-4 rounded-2xl shadow-md space-y-3">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div onClick={() => userFromRef.current?.showPicker?.()} className="relative flex-1 bg-black border border-neutral-700 rounded-xl px-3 sm:px-4 py-2 cursor-pointer group transition-all block overflow-hidden shadow-inner h-[44px] flex flex-col justify-center">
                  <span className="text-[9px] sm:text-[10px] font-black text-neutral-400 uppercase tracking-wider block pointer-events-none leading-none">From date</span>
                  <span className="text-white font-black text-xs sm:text-sm tracking-wide block mt-0.5 font-mono pointer-events-none truncate">{formatDateDisplay(fromDate)}</span>
                  <input ref={userFromRef} type="date" value={fromDate} onChange={(e) => e.target.value && setFromDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 full-date-input" />
                </div>
                <div onClick={() => userToRef.current?.showPicker?.()} className="relative flex-1 bg-black border border-neutral-700 rounded-xl px-3 sm:px-4 py-2 cursor-pointer group transition-all block overflow-hidden shadow-inner h-[44px] flex flex-col justify-center">
                  <span className="text-[9px] sm:text-[10px] font-black text-neutral-400 uppercase tracking-wider block pointer-events-none leading-none">To date</span>
                  <span className="text-white font-black text-xs sm:text-sm tracking-wide block mt-0.5 font-mono pointer-events-none truncate">{formatDateDisplay(toDate)}</span>
                  <input ref={userToRef} type="date" value={toDate} onChange={(e) => e.target.value && setToDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 full-date-input" />
                </div>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input type="text" placeholder="Search user by name or username..." value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} className="w-full bg-black border border-neutral-700 text-white text-xs pl-8 pr-3 py-2 rounded-xl focus:border-gold outline-none placeholder-neutral-500 font-sans" />
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
                <div className="p-8 text-center text-neutral-500 text-sm">No users registered yet.</div>
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
                        <tr key={user.id} onClick={() => setSelectedPerformanceUser(user)} className="transition-colors cursor-pointer hover:bg-neutral-900/80 active:scale-[0.99]">
                          <td className="py-2.5 px-3"><div className="font-black text-white text-xs hover:text-gold transition-colors">{user.name}</div></td>
                          <td className="py-2.5 px-2 text-center font-mono font-bold text-neutral-300">{totalBills}</td>
                          <td className="py-2.5 px-2 text-right font-mono font-black text-white whitespace-nowrap">{formatRupees(totalGross)}</td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-rose-400 whitespace-nowrap">{formatRupees(totalPayouts)}</td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-rose-400 whitespace-nowrap">{formatRupees(totalCommission)}</td>
                          <td className="py-2.5 px-2 text-right font-mono font-black text-gold whitespace-nowrap">{formatRupees(net)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: SALES REPORT ================= */}
        {activeTab === 'SALES' && (
          <div className="space-y-3 animate-drop-in">
            <div className="bg-neutral-950 border border-neutral-800 p-3 sm:p-4 rounded-2xl shadow-md space-y-3">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div onClick={() => userFromRef.current?.showPicker?.()} className="relative flex-1 bg-black border border-neutral-700 rounded-xl px-3 sm:px-4 py-2 cursor-pointer group transition-all block overflow-hidden shadow-inner h-[44px] flex flex-col justify-center">
                  <span className="text-[9px] sm:text-[10px] font-black text-neutral-400 uppercase tracking-wider block pointer-events-none leading-none">From date</span>
                  <span className="text-white font-black text-xs sm:text-sm tracking-wide block mt-0.5 font-mono pointer-events-none truncate">{formatDateDisplay(fromDate)}</span>
                  <input ref={userFromRef} type="date" value={fromDate} onChange={(e) => e.target.value && setFromDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 full-date-input" />
                </div>
                <div onClick={() => userToRef.current?.showPicker?.()} className="relative flex-1 bg-black border border-neutral-700 rounded-xl px-3 sm:px-4 py-2 cursor-pointer group transition-all block overflow-hidden shadow-inner h-[44px] flex flex-col justify-center">
                  <span className="text-[9px] sm:text-[10px] font-black text-neutral-400 uppercase tracking-wider block pointer-events-none leading-none">To date</span>
                  <span className="text-white font-black text-xs sm:text-sm tracking-wide block mt-0.5 font-mono pointer-events-none truncate">{formatDateDisplay(toDate)}</span>
                  <input ref={userToRef} type="date" value={toDate} onChange={(e) => e.target.value && setToDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 full-date-input" />
                </div>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input type="text" placeholder="Search user by name or username..." value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} className="w-full bg-black border border-neutral-700 text-white text-xs pl-8 pr-3 py-2 rounded-xl focus:border-gold outline-none placeholder-neutral-500 font-sans" />
              </div>
            </div>

            <div className="bg-neutral-950 border border-gold/40 rounded-xl overflow-hidden shadow-md">
              <div className="p-3 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-black text-xs sm:text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-gold" />
                  <span>User Wise Sales Report ({userPerformanceList.length})</span>
                </h3>
              </div>

              {registeredUsers.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 text-sm">No users registered yet.</div>
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
                        <tr key={user.id} onClick={() => setSelectedReportUser(user)} className="transition-colors cursor-pointer hover:bg-neutral-900/80 active:scale-[0.99]">
                          <td className="py-3 px-4"><div className="font-black text-white text-xs hover:text-gold transition-colors">{user.name}</div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: WINNING REPORT ================= */}
        {activeTab === 'WINNING' && (
          <div className="space-y-4 animate-drop-in">
            {/* Sub-tab Switcher */}
            <div className="bg-neutral-950 border border-gold/40 p-1.5 rounded-2xl grid grid-cols-2 gap-2 shadow-md">
              <button
                type="button"
                onClick={() => setWinningSubTab('TOTAL')}
                className={`py-2.5 px-2 sm:px-4 rounded-xl font-black text-xs uppercase tracking-wider text-center cursor-pointer transition-all ${
                  winningSubTab === 'TOTAL' ? 'bg-gold-metallic text-black shadow-lg' : 'bg-transparent text-neutral-400 hover:text-white'
                }`}
              >
                1. TOTAL WINNING LIST
              </button>
              <button
                type="button"
                onClick={() => setWinningSubTab('USER_WISE')}
                className={`py-2.5 px-2 sm:px-4 rounded-xl font-black text-xs uppercase tracking-wider text-center cursor-pointer transition-all ${
                  winningSubTab === 'USER_WISE' ? 'bg-gold-metallic text-black shadow-lg' : 'bg-transparent text-neutral-400 hover:text-white'
                }`}
              >
                2. USER WISE WINNING LIST
              </button>
            </div>

            {/* OPTION 1: TOTAL WINNING LIST (Exact Customer Winning Report Form & Output) */}
            {winningSubTab === 'TOTAL' && (
              <div className="space-y-4 animate-drop-in">
                <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-2xl shadow-xl space-y-5">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div onClick={() => triggerDatePicker(winFromRef)} className="relative flex-1 bg-black border border-neutral-700 rounded-xl px-3 sm:px-4 py-2 cursor-pointer group transition-all block overflow-hidden shadow-inner h-[44px] flex flex-col justify-center">
                      <span className="text-[9px] sm:text-[10px] font-black text-neutral-400 uppercase tracking-wider block pointer-events-none leading-none">From date</span>
                      <span className="text-white font-black text-xs sm:text-sm tracking-wide block mt-0.5 font-mono pointer-events-none truncate">{formatDateDisplay(winningFromDate)}</span>
                      <input ref={winFromRef} type="date" value={winningFromDate} onChange={(e) => e.target.value && setWinningFromDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 full-date-input" />
                    </div>
                    <div onClick={() => triggerDatePicker(winToRef)} className="relative flex-1 bg-black border border-neutral-700 rounded-xl px-3 sm:px-4 py-2 cursor-pointer group transition-all block overflow-hidden shadow-inner h-[44px] flex flex-col justify-center">
                      <span className="text-[9px] sm:text-[10px] font-black text-neutral-400 uppercase tracking-wider block pointer-events-none leading-none">To date</span>
                      <span className="text-white font-black text-xs sm:text-sm tracking-wide block mt-0.5 font-mono pointer-events-none truncate">{formatDateDisplay(winningToDate)}</span>
                      <input ref={winToRef} type="date" value={winningToDate} onChange={(e) => e.target.value && setWinningToDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 full-date-input" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 pb-1">
                    <span className="text-xs sm:text-sm font-black text-neutral-300 tracking-wide">Full View</span>
                    <button type="button" onClick={() => setIsWinningFullView(!isWinningFullView)} className={`w-12 h-6 rounded-full transition-colors p-0.5 relative cursor-pointer ${isWinningFullView ? 'bg-gold-metallic' : 'bg-slate-300'}`}>
                      <div className={`w-5 h-5 rounded-full bg-black shadow-md transition-transform ${isWinningFullView ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="pt-2 border-t border-neutral-900 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {[{ id: 'ALL', label: 'All' }, { id: '1 PM', label: '1 PM' }, { id: '3 PM', label: '3 PM' }, { id: '6 PM', label: '6 PM' }, { id: '8 PM', label: '8 PM' }].map((opt) => {
                        const isChecked = winningSlotFilter === opt.id;
                        return (
                          <label key={opt.id} onClick={() => setWinningSlotFilter(opt.id as any)} className="flex items-center gap-1.5 cursor-pointer group py-1 px-1 rounded-lg transition-all">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${isChecked ? 'border-gold bg-black' : 'border-neutral-600 bg-black group-hover:border-neutral-400'}`}>
                              {isChecked && <div className="w-2 h-2 rounded-full bg-gold-metallic" />}
                            </div>
                            <span className={`text-xs font-black tracking-wide ${isChecked ? 'text-gold' : 'text-neutral-300'}`}>{opt.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {isWinningFullView && (
                    <div className="pt-3 border-t border-neutral-900 space-y-3.5 animate-drop-in">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">SELECT DIGIT TYPE</span>
                        <div className="flex items-center justify-center gap-2.5">
                          {[{ id: 'ALL', label: '★' }, { id: '1', label: '1' }, { id: '2', label: '2' }, { id: '3', label: '3' }].map((item) => {
                            const isSelected = winningDigitFilter === 'ALL' ? item.id === 'ALL' : winningDigitFilter !== 'NONE' && winningDigitFilter === item.id;
                            return (
                              <button key={item.id} type="button" onClick={() => {
                                if (item.id === 'ALL') {
                                  setWinningDigitFilter(winningDigitFilter === 'ALL' ? 'NONE' : 'ALL');
                                  setWinningSubOptionFilter('NONE');
                                } else {
                                  setWinningDigitFilter(winningDigitFilter === item.id ? 'NONE' : item.id as any);
                                  setWinningSubOptionFilter('NONE');
                                }
                              }} className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full font-black text-xs flex items-center justify-center transition-all cursor-pointer shadow border ${isSelected ? 'bg-neutral-800 text-white border-2 border-white scale-105 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'bg-black text-neutral-300 border-neutral-700 hover:border-neutral-500'}`}>
                                <span className={item.label === '★' ? 'text-base sm:text-lg leading-none font-black' : ''}>{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-1.5 pt-0.5 flex-nowrap overflow-x-auto">
                        {winningDigitFilter === '1' && [{ id: 'ALL', label: '★' }, { id: 'A', label: 'A' }, { id: 'B', label: 'B' }, { id: 'C', label: 'C' }].map((opt) => {
                          const isSelected = winningSubOptionFilter === 'ALL' ? true : winningSubOptionFilter !== 'NONE' && winningSubOptionFilter === opt.id;
                          return (
                            <button key={opt.id} type="button" onClick={() => setWinningSubOptionFilter(winningSubOptionFilter === opt.id ? 'NONE' : opt.id)} className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full font-black text-xs flex items-center justify-center border transition-all cursor-pointer ${isSelected ? 'bg-neutral-800 text-white border-2 border-white scale-105 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'bg-black border-neutral-700 text-neutral-300 hover:border-neutral-500'}`}>
                              <span className={opt.label === '★' ? 'text-base sm:text-lg leading-none font-black' : ''}>{opt.label}</span>
                            </button>
                          );
                        })}
                        {winningDigitFilter === '2' && [{ id: 'ALL', label: '★' }, { id: 'AB', label: 'AB' }, { id: 'AC', label: 'AC' }, { id: 'BC', label: 'BC' }].map((opt) => {
                          const isSelected = winningSubOptionFilter === 'ALL' ? true : winningSubOptionFilter !== 'NONE' && winningSubOptionFilter === opt.id;
                          return (
                            <button key={opt.id} type="button" onClick={() => setWinningSubOptionFilter(winningSubOptionFilter === opt.id ? 'NONE' : opt.id)} className={`${opt.id === 'ALL' ? 'w-7 h-7 sm:w-8 sm:h-8 rounded-full' : 'px-2.5 py-1 rounded-full text-[11px]'} font-black flex items-center justify-center border transition-all cursor-pointer ${isSelected ? 'bg-neutral-800 text-white border-2 border-white scale-105 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'bg-black text-neutral-300 border-neutral-700 hover:border-neutral-500'}`}>
                              <span className={opt.label === '★' ? 'text-base sm:text-lg leading-none font-black' : ''}>{opt.label}</span>
                            </button>
                          );
                        })}
                        {winningDigitFilter === '3' && [{ id: 'ALL', label: '★' }, { id: 'SUPER', label: 'SUPER' }, { id: 'BOX', label: 'BOX' }, { id: 'BOTH', label: 'BOTH' }].map((opt) => {
                          const isSelected = winningSubOptionFilter === 'ALL' ? true : winningSubOptionFilter !== 'NONE' && winningSubOptionFilter === opt.id;
                          return (
                            <button key={opt.id} type="button" onClick={() => setWinningSubOptionFilter(winningSubOptionFilter === opt.id ? 'NONE' : opt.id)} className={`${opt.id === 'ALL' ? 'w-7 h-7 sm:w-8 sm:h-8 rounded-full' : 'px-2 py-1 rounded-full text-[10px] uppercase'} font-black flex items-center justify-center border transition-all cursor-pointer ${isSelected ? 'bg-neutral-800 text-white border-2 border-white scale-105 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'bg-black text-neutral-300 border-neutral-700 hover:border-neutral-500'}`}>
                              <span className={opt.label === '★' ? 'text-base sm:text-lg leading-none font-black' : ''}>{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">SEARCH BY NUMBER</span>
                        <div className="relative">
                          <input type="text" maxLength={3} value={winningSearchNumber} onChange={(e) => setWinningSearchNumber(e.target.value.replace(/\D/g, ''))} placeholder="Number" className="w-full bg-black border-2 border-white/90 focus:border-gold text-white font-mono font-black text-sm px-4 py-2.5 rounded-xl placeholder:text-neutral-400 outline-none transition-all shadow-inner" />
                          {winningSearchNumber && (
                            <button type="button" onClick={() => setWinningSearchNumber('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs font-bold">Clear</button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button type="button" onClick={() => setShowWinningDetails(true)} className="w-full py-3.5 px-4 bg-gold-metallic hover:brightness-110 active:scale-[0.98] text-black font-black text-sm tracking-wider uppercase rounded-xl shadow-lg border border-gold-dark flex items-center justify-center gap-2 transition-all cursor-pointer">
                      <span>SHOW REPORT</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* OPTION 2: USER WISE WINNING LIST */}
            {winningSubTab === 'USER_WISE' && (
              <div className="space-y-3 animate-drop-in">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input type="text" placeholder="Search user by name or username..." value={winningUserSearch} onChange={(e) => setWinningUserSearch(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 text-white text-xs pl-8 pr-3 py-2 rounded-xl focus:border-gold outline-none placeholder-neutral-500 font-sans" />
                </div>

                <div className="bg-neutral-950 border border-gold/40 rounded-xl overflow-hidden shadow-md">
                  <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
                    <h3 className="font-black text-xs sm:text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-gold" />
                      <span>User Wise Winning Report ({userWiseWinningUsers.length})</span>
                    </h3>
                  </div>

                  {userWiseWinningUsers.length === 0 ? (
                    <div className="p-8 text-center text-neutral-500 text-sm">No users registered yet.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead>
                          <tr className="bg-neutral-900/90 text-neutral-400 border-b border-neutral-800 font-bold uppercase text-[10px] tracking-wider">
                            <th className="py-2.5 px-4">User / Agency</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900">
                          {userWiseWinningUsers.map((user) => (
                            <tr key={user.id} onClick={() => { setSelectedWinningUser(user); setUserWinFromDate(winningFromDate); setUserWinToDate(winningToDate); }} className="transition-colors cursor-pointer hover:bg-neutral-900/80 active:scale-[0.99]">
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
          </div>
        )}

        {/* ================= TAB 4: DAILY REPORT ================= */}
        {activeTab === 'DAILY' && (
          <div className="space-y-4 animate-drop-in">
            {/* Sub-tab Switcher */}
            <div className="bg-neutral-950 border border-gold/40 p-1.5 rounded-2xl grid grid-cols-2 gap-2 shadow-md">
              <button
                type="button"
                onClick={() => setDailySubTab('ALL_USERS')}
                className={`py-2.5 px-2 sm:px-4 rounded-xl font-black text-xs uppercase tracking-wider text-center cursor-pointer transition-all ${
                  dailySubTab === 'ALL_USERS' ? 'bg-gold-metallic text-black shadow-lg' : 'bg-transparent text-neutral-400 hover:text-white'
                }`}
              >
                1. DAILY REPORT (All Users)
              </button>
              <button
                type="button"
                onClick={() => setDailySubTab('USER_WISE')}
                className={`py-2.5 px-2 sm:px-4 rounded-xl font-black text-xs uppercase tracking-wider text-center cursor-pointer transition-all ${
                  dailySubTab === 'USER_WISE' ? 'bg-gold-metallic text-black shadow-lg' : 'bg-transparent text-neutral-400 hover:text-white'
                }`}
              >
                2. DAILY REPORT (User Wise)
              </button>
            </div>

            {/* OPTION 1: DAILY REPORT (All Users) */}
            {dailySubTab === 'ALL_USERS' && (
              <div className="space-y-4 animate-drop-in">
                <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-2xl shadow-xl space-y-5 font-sans">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div onClick={() => triggerDatePicker(dailyFromRef)} className="relative flex-1 bg-black border border-neutral-700 rounded-xl px-3 sm:px-4 py-2 cursor-pointer group transition-all block overflow-hidden shadow-inner h-[44px] flex flex-col justify-center">
                      <span className="text-[9px] sm:text-[10px] font-black text-neutral-400 uppercase tracking-wider block pointer-events-none leading-none">FROM DATE</span>
                      <span className="text-white font-black text-xs sm:text-sm tracking-wide block mt-0.5 font-mono pointer-events-none truncate">{formatDateDisplay(dailyFromDate)}</span>
                      <input ref={dailyFromRef} type="date" value={dailyFromDate} onChange={(e) => e.target.value && setDailyFromDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 full-date-input" />
                    </div>
                    <div onClick={() => triggerDatePicker(dailyToRef)} className="relative flex-1 bg-black border border-neutral-700 rounded-xl px-3 sm:px-4 py-2 cursor-pointer group transition-all block overflow-hidden shadow-inner h-[44px] flex flex-col justify-center">
                      <span className="text-[9px] sm:text-[10px] font-black text-neutral-400 uppercase tracking-wider block pointer-events-none leading-none">TO DATE</span>
                      <span className="text-white font-black text-xs sm:text-sm tracking-wide block mt-0.5 font-mono pointer-events-none truncate">{formatDateDisplay(dailyToDate)}</span>
                      <input ref={dailyToRef} type="date" value={dailyToDate} onChange={(e) => e.target.value && setDailyToDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 full-date-input" />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-900 flex items-center justify-start gap-8">
                    <label onClick={() => { setIsDayDetail(true); setIsGameDetail(false); setActiveDailyOverlayTab('DAY'); }} className="flex items-center gap-2.5 cursor-pointer group select-none">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isDayDetail ? 'border-gold bg-gold text-black shadow-[0_0_10px_rgba(212,175,55,0.4)]' : 'border-neutral-600 bg-black group-hover:border-neutral-400'}`}>
                        {isDayDetail && (
                          <svg className="w-3.5 h-3.5 fill-current stroke-current stroke-2" viewBox="0 0 24 24">
                            <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs sm:text-sm font-black tracking-wide ${isDayDetail ? 'text-gold' : 'text-neutral-300'}`}>Day Detail</span>
                    </label>

                    <label onClick={() => { setIsGameDetail(true); setIsDayDetail(false); setActiveDailyOverlayTab('GAME'); }} className="flex items-center gap-2.5 cursor-pointer group select-none">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isGameDetail ? 'border-gold bg-gold text-black shadow-[0_0_10px_rgba(212,175,55,0.4)]' : 'border-neutral-600 bg-black group-hover:border-neutral-400'}`}>
                        {isGameDetail && (
                          <svg className="w-3.5 h-3.5 fill-current stroke-current stroke-2" viewBox="0 0 24 24">
                            <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs sm:text-sm font-black tracking-wide ${isGameDetail ? 'text-gold' : 'text-neutral-300'}`}>Game Detail</span>
                    </label>
                  </div>

                  <div className="pt-2 border-t border-neutral-900 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {[{ id: 'ALL', label: 'All' }, { id: '1 PM', label: '1 PM' }, { id: '3 PM', label: '3 PM' }, { id: '6 PM', label: '6 PM' }, { id: '8 PM', label: '8 PM' }].map((opt) => {
                        const isChecked = dailySlotFilter === opt.id;
                        return (
                          <label key={opt.id} onClick={() => setDailySlotFilter(opt.id as any)} className="flex items-center gap-1.5 cursor-pointer group py-1 px-1 rounded-lg transition-all">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${isChecked ? 'border-gold bg-black' : 'border-neutral-600 bg-black group-hover:border-neutral-400'}`}>
                              {isChecked && <div className="w-2 h-2 rounded-full bg-gold-metallic" />}
                            </div>
                            <span className={`text-xs font-black tracking-wide ${isChecked ? 'text-gold' : 'text-neutral-300'}`}>{opt.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button type="button" onClick={() => setShowDailyReportOverlay(true)} className="w-full py-3.5 px-4 bg-gold-metallic hover:brightness-110 active:scale-[0.98] text-black font-black text-sm tracking-wider uppercase rounded-xl shadow-lg border border-gold-dark flex items-center justify-center gap-2 transition-all cursor-pointer">
                      <span>SHOW REPORT</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* OPTION 2: DAILY REPORT (User Wise) */}
            {dailySubTab === 'USER_WISE' && (
              <div className="space-y-3 animate-drop-in">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input type="text" placeholder="Search user by name or username..." value={dailyUserSearch} onChange={(e) => setDailyUserSearch(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 text-white text-xs pl-8 pr-3 py-2 rounded-xl focus:border-gold outline-none placeholder-neutral-500 font-sans" />
                </div>

                <div className="bg-neutral-950 border border-gold/40 rounded-xl overflow-hidden shadow-md">
                  <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
                    <h3 className="font-black text-xs sm:text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-gold" />
                      <span>User Wise Daily Report ({userWiseDailyUsers.length})</span>
                    </h3>
                  </div>

                  {userWiseDailyUsers.length === 0 ? (
                    <div className="p-8 text-center text-neutral-500 text-sm">No users registered yet.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead>
                          <tr className="bg-neutral-900/90 text-neutral-400 border-b border-neutral-800 font-bold uppercase text-[10px] tracking-wider">
                            <th className="py-2.5 px-4">User / Agency</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900">
                          {userWiseDailyUsers.map((user) => (
                            <tr key={user.id} onClick={() => { setSelectedDailyUser(user); setUserDailyFromDate(dailyFromDate); setUserDailyToDate(dailyToDate); }} className="transition-colors cursor-pointer hover:bg-neutral-900/80 active:scale-[0.99]">
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
          </div>
        )}
      </div>

      {/* ================= DEDICATED USER SALES REPORT FULL-SCREEN OVERLAY ================= */}
      {selectedReportUser && (
        <div className="fixed inset-0 bg-black text-white z-50 flex flex-col justify-start overflow-y-auto animate-drop-in font-sans">
          <HeaderBanner title="USER SALES REPORT" showBack={true} onBackClick={() => { setSelectedReportUser(null); setReportFilterSearch(''); }} />
          <div className="max-w-xl mx-auto w-full px-4 sm:px-6 py-6 space-y-4">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input type="text" placeholder="Search by Bill ID, Number, Customer, Slot..." value={reportFilterSearch} onChange={(e) => setReportFilterSearch(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 text-white text-xs pl-8 pr-3 py-2 rounded-xl focus:border-gold outline-none placeholder-neutral-500 font-sans" />
            </div>

            <div className="space-y-3">
              {filteredUserTickets.length === 0 ? (
                <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 text-center font-mono text-xs font-bold text-neutral-400">
                  No bills found for {selectedReportUser.name} on the selected date.
                </div>
              ) : (
                filteredUserTickets.map((tkt) => (
                  <div key={tkt.id} className="bg-neutral-950 rounded-2xl overflow-hidden shadow-xl border-2 border-white/90 font-mono space-y-0">
                    <div className="bg-[#1e1e1e] p-3 text-xs border-b border-neutral-800 space-y-1">
                      <div className="flex items-center justify-between font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-white text-sm">BILL ID: <strong className="text-gold font-bold">{tkt.ticketId || tkt.id}</strong></span>
                          <button type="button" onClick={(e) => handleCopyBillId(tkt.ticketId || tkt.id, e)} className="text-gold hover:text-white cursor-pointer" title="Copy Bill ID">
                            {copiedBillId === (tkt.ticketId || tkt.id) ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-black rounded bg-blue-950 text-sky-300 border border-sky-800">{tkt.gameSlot}</span>
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

                    <div className="bg-neutral-900 text-gold font-black text-xs px-4 py-2 flex items-center justify-between shadow-md border-b border-neutral-800">
                      <div className="flex items-center gap-7 font-mono">
                        <span>GAME</span>
                        <span>NUM</span>
                        <span>CNT</span>
                      </div>
                      <span className="font-mono">T.AMT</span>
                    </div>

                    <div className="bg-white text-black font-extrabold text-xs divide-y divide-neutral-200">
                      {tkt.items.map((item: any, idx: number) => {
                        const numStr = getDisplayNumber(item);
                        const isMatch = reportFilterSearch.trim() && numStr.includes(reportFilterSearch.trim());
                        return (
                          <div key={idx} className={`flex items-center justify-between px-4 py-2.5 transition-colors ${isMatch ? 'bg-amber-200 text-black border-l-4 border-amber-600 font-black' : idx % 2 === 1 ? 'bg-fuchsia-50/80' : 'bg-white'}`}>
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
          <HeaderBanner title="USER WISE PERFORMANCE" showBack={true} onBackClick={() => setSelectedPerformanceUser(null)} />
          <div className="max-w-xl mx-auto w-full px-4 sm:px-6 py-4 space-y-4">
            <div className="bg-neutral-950 border border-gold/40 rounded-xl overflow-hidden shadow-md">
              <div className="p-3 border-b border-neutral-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gold" />
                <h3 className="font-black text-xs sm:text-sm text-white uppercase tracking-wider">User Performance</h3>
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
                      <td className="py-2.5 px-3"><div className="font-black text-white text-xs">{selectedPerformanceUser.name}</div></td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-neutral-300">{selectedUserPerf.totalBills}</td>
                      <td className="py-2.5 px-2 text-right font-mono font-black text-white whitespace-nowrap">{formatRupees(selectedUserPerf.totalGross)}</td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-rose-400 whitespace-nowrap">{formatRupees(selectedUserPerf.totalPayouts)}</td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-rose-400 whitespace-nowrap">{formatRupees(selectedUserPerf.totalCommission)}</td>
                      <td className="py-2.5 px-2 text-right font-mono font-black text-gold whitespace-nowrap">{formatRupees(selectedUserPerf.net)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-md">
              <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
                <h3 className="font-black text-xs sm:text-sm text-white uppercase tracking-wider">Slot Wise Performance</h3>
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

      {/* ================= ALL USERS WINNING REPORT FULL-SCREEN OUTPUT OVERLAY ================= */}
      {showWinningDetails && (
        <div className="fixed inset-0 bg-black text-white z-50 flex flex-col justify-start overflow-y-auto animate-drop-in font-sans">
          <HeaderBanner title="WINNING REPORT" showBack={true} onBackClick={() => setShowWinningDetails(false)} />
          <div className="max-w-xl mx-auto w-full px-4 sm:px-6 py-6 space-y-4">
            <div className="bg-gold-metallic p-4 rounded-xl text-black shadow-lg border border-gold-dark space-y-2.5 font-mono">
              <div className="flex items-center justify-between font-black text-lg sm:text-xl uppercase tracking-wider">
                <span>WINNING REPORT &nbsp;( {winningSlotFilter === 'ALL' ? 'ALL' : winningSlotFilter} )</span>
              </div>
              <div className="flex items-center justify-between text-base sm:text-lg font-black pt-2 border-t border-black/30">
                <span>Total Count: {totalWinningCount}</span>
                <span>Total: ₹ {totalWinningGrandTotal.toLocaleString()}</span>
              </div>
            </div>

            {winningSearchNumber.trim() && (
              <div className="bg-neutral-900 border border-gold/60 p-3 rounded-xl flex items-center justify-between text-xs font-mono shadow-md">
                <span className="text-neutral-300">SEARCHING NUMBER: <strong className="text-gold font-bold text-sm">"{winningSearchNumber}"</strong></span>
                <span className="text-emerald-400 font-extrabold">{totalWinningCategories.length} Category(s) Matched</span>
              </div>
            )}

            {totalWinningCategories.length === 0 ? (
              <div className="bg-neutral-950 p-6 rounded-2xl border-2 border-white/90 text-center font-mono text-xs font-bold text-neutral-400">
                No winning tickets found for the selected filter.
              </div>
            ) : (
              totalWinningCategories.map((group) => (
                <div key={group.category} className="space-y-3">
                  <div className={`${getCategoryHeaderTheme(group.category)} border text-sm font-black tracking-widest uppercase py-2.5 px-4 rounded-xl text-center font-mono transition-all`}>
                    {group.category}
                  </div>
                  <div className="space-y-3">
                    {group.cards.map((card: any) => {
                      const isSelected = selectedWinningCardId === card.id;
                      const theme = getWinnerCardTheme(card.prize);
                      return (
                        <div key={card.id} onClick={() => setSelectedWinningCardId(isSelected ? null : card.id)} className={`${theme.cardBg} rounded-2xl overflow-hidden shadow-xl border-2 transition-all cursor-pointer font-mono active:scale-[0.99] ${isSelected ? 'border-gold shadow-[0_0_20px_rgba(212,175,55,0.6)] scale-[1.01]' : `${theme.cardBorder} hover:scale-[1.005]`}`}>
                          {/* Prize & Number Header Bar with vivid glowing colors */}
                          <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 px-4 py-2.5 font-mono flex items-center justify-between border-b border-gold/30 shadow-inner">
                            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs px-3 py-1 rounded-lg shadow-[0_0_12px_rgba(16,185,129,0.5)] border border-emerald-300/60 uppercase tracking-widest flex items-center gap-1.5">
                              🏆 {getPrizePositionDisplay(card)}
                            </span>
                            <span className="text-amber-300 font-black text-base font-mono tracking-widest bg-black px-2.5 py-0.5 rounded-lg border border-amber-400/50 shadow-[0_0_10px_rgba(251,191,36,0.35)]">
                              {card.number}
                            </span>
                          </div>
                          
                          {/* Agency & Customer Info Bar */}
                          <div className="bg-black/75 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 text-xs font-mono">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">AGENCY:</span>
                              <span className="text-amber-400 font-extrabold text-xs tracking-wide">{card.agencyName || card.userName}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">CUSTOMER:</span>
                              <span className="text-white font-extrabold text-xs">{formatCustomerName(card.customerName)}</span>
                            </div>
                          </div>

                          {/* Bill ID & Slot Info Bar */}
                          <div className="bg-neutral-950/90 px-4 py-1.5 flex flex-wrap items-center justify-between text-[11px] font-mono border-t border-neutral-900 text-neutral-400 gap-1">
                            <span>Bill: <strong className="text-neutral-300 font-bold">{card.ticketId}</strong></span>
                            <span>Slot: <strong className="text-gold font-bold">{(card.slot || '').replace(/\s*Game$/i, '')}</strong></span>
                          </div>

                          {/* Count & Win Amount Footer */}
                          <div className="bg-black/95 px-4 py-3 flex items-center justify-between font-mono text-xs border-t border-white/5">
                            <span className="text-neutral-300">COUNT: <strong className="text-white font-black text-sm ml-1 font-mono">{card.count}</strong></span>
                            <span className="text-gold font-bold">TOTAL: <strong className={`font-black text-base ml-1 font-mono ${theme.totalText}`}>₹{card.total}</strong></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= DEDICATED USER WINNING REPORT FULL-SCREEN OVERLAY ================= */}
      {selectedWinningUser && (
        <div className="fixed inset-0 bg-black text-white z-50 flex flex-col justify-start overflow-y-auto animate-drop-in font-sans">
          <HeaderBanner
            title={`WINNING REPORT - ${selectedWinningUser.name.toUpperCase()}`}
            showBack={true}
            onBackClick={() => {
              if (showUserWinningDetails) {
                setShowUserWinningDetails(false);
              } else {
                setSelectedWinningUser(null);
                setShowUserWinningDetails(false);
              }
            }}
          />
          <div className="max-w-xl mx-auto w-full px-4 sm:px-6 py-6 space-y-4">
            {!showUserWinningDetails ? (
              /* --- VIEW 1: FILTER SELECTION FORM --- */
              <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-2xl shadow-xl space-y-5 animate-drop-in">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div onClick={() => triggerDatePicker(userWinFromRef)} className="relative flex-1 bg-black border border-neutral-700 rounded-xl px-3 sm:px-4 py-2 cursor-pointer group transition-all block overflow-hidden shadow-inner h-[44px] flex flex-col justify-center">
                    <span className="text-[9px] sm:text-[10px] font-black text-neutral-400 uppercase tracking-wider block pointer-events-none leading-none">From date</span>
                    <span className="text-white font-black text-xs sm:text-sm tracking-wide block mt-0.5 font-mono pointer-events-none truncate">{formatDateDisplay(userWinFromDate)}</span>
                    <input ref={userWinFromRef} type="date" value={userWinFromDate} onChange={(e) => e.target.value && setUserWinFromDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 full-date-input" />
                  </div>
                  <div onClick={() => triggerDatePicker(userWinToRef)} className="relative flex-1 bg-black border border-neutral-700 rounded-xl px-3 sm:px-4 py-2 cursor-pointer group transition-all block overflow-hidden shadow-inner h-[44px] flex flex-col justify-center">
                    <span className="text-[9px] sm:text-[10px] font-black text-neutral-400 uppercase tracking-wider block pointer-events-none leading-none">To date</span>
                    <span className="text-white font-black text-xs sm:text-sm tracking-wide block mt-0.5 font-mono pointer-events-none truncate">{formatDateDisplay(userWinToDate)}</span>
                    <input ref={userWinToRef} type="date" value={userWinToDate} onChange={(e) => e.target.value && setUserWinToDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 full-date-input" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 pb-1">
                  <span className="text-xs sm:text-sm font-black text-neutral-300 tracking-wide">Full View</span>
                  <button type="button" onClick={() => setIsUserWinFullView(!isUserWinFullView)} className={`w-12 h-6 rounded-full transition-colors p-0.5 relative cursor-pointer ${isUserWinFullView ? 'bg-gold-metallic' : 'bg-slate-300'}`}>
                    <div className={`w-5 h-5 rounded-full bg-black shadow-md transition-transform ${isUserWinFullView ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="pt-2 border-t border-neutral-900 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {[{ id: 'ALL', label: 'All' }, { id: '1 PM', label: '1 PM' }, { id: '3 PM', label: '3 PM' }, { id: '6 PM', label: '6 PM' }, { id: '8 PM', label: '8 PM' }].map((opt) => {
                      const isChecked = userWinSlotFilter === opt.id;
                      return (
                        <label key={opt.id} onClick={() => setUserWinSlotFilter(opt.id as any)} className="flex items-center gap-1.5 cursor-pointer group py-1 px-1 rounded-lg transition-all">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${isChecked ? 'border-gold bg-black' : 'border-neutral-600 bg-black group-hover:border-neutral-400'}`}>
                            {isChecked && <div className="w-2 h-2 rounded-full bg-gold-metallic" />}
                          </div>
                          <span className={`text-xs font-black tracking-wide ${isChecked ? 'text-gold' : 'text-neutral-300'}`}>{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {isUserWinFullView && (
                  <div className="pt-3 border-t border-neutral-900 space-y-3.5 animate-drop-in">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">SELECT DIGIT TYPE</span>
                      <div className="flex items-center justify-center gap-2.5">
                        {[{ id: 'ALL', label: '★' }, { id: '1', label: '1' }, { id: '2', label: '2' }, { id: '3', label: '3' }].map((item) => {
                          const isSelected = userWinDigitFilter === 'ALL' ? item.id === 'ALL' : userWinDigitFilter !== 'NONE' && userWinDigitFilter === item.id;
                          return (
                            <button key={item.id} type="button" onClick={() => {
                              if (item.id === 'ALL') {
                                setUserWinDigitFilter(userWinDigitFilter === 'ALL' ? 'NONE' : 'ALL');
                                setUserWinSubOptionFilter('NONE');
                              } else {
                                setUserWinDigitFilter(userWinDigitFilter === item.id ? 'NONE' : item.id as any);
                                setUserWinSubOptionFilter('NONE');
                              }
                            }} className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full font-black text-xs flex items-center justify-center transition-all cursor-pointer shadow border ${isSelected ? 'bg-neutral-800 text-white border-2 border-white scale-105 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'bg-black text-neutral-300 border-neutral-700 hover:border-neutral-500'}`}>
                              <span className={item.label === '★' ? 'text-base sm:text-lg leading-none font-black' : ''}>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 pt-0.5 flex-nowrap overflow-x-auto">
                      {userWinDigitFilter === '1' && [{ id: 'ALL', label: '★' }, { id: 'A', label: 'A' }, { id: 'B', label: 'B' }, { id: 'C', label: 'C' }].map((opt) => {
                        const isSelected = userWinSubOptionFilter === 'ALL' ? true : userWinSubOptionFilter !== 'NONE' && userWinSubOptionFilter === opt.id;
                        return (
                          <button key={opt.id} type="button" onClick={() => setUserWinSubOptionFilter(userWinSubOptionFilter === opt.id ? 'NONE' : opt.id)} className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full font-black text-xs flex items-center justify-center border transition-all cursor-pointer ${isSelected ? 'bg-neutral-800 text-white border-2 border-white scale-105 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'bg-black border-neutral-700 text-neutral-300 hover:border-neutral-500'}`}>
                            <span className={opt.label === '★' ? 'text-base sm:text-lg leading-none font-black' : ''}>{opt.label}</span>
                          </button>
                        );
                      })}
                      {userWinDigitFilter === '2' && [{ id: 'ALL', label: '★' }, { id: 'AB', label: 'AB' }, { id: 'AC', label: 'AC' }, { id: 'BC', label: 'BC' }].map((opt) => {
                        const isSelected = userWinSubOptionFilter === 'ALL' ? true : userWinSubOptionFilter !== 'NONE' && userWinSubOptionFilter === opt.id;
                        return (
                          <button key={opt.id} type="button" onClick={() => setUserWinSubOptionFilter(userWinSubOptionFilter === opt.id ? 'NONE' : opt.id)} className={`${opt.id === 'ALL' ? 'w-7 h-7 sm:w-8 sm:h-8 rounded-full' : 'px-2.5 py-1 rounded-full text-[11px]'} font-black flex items-center justify-center border transition-all cursor-pointer ${isSelected ? 'bg-neutral-800 text-white border-2 border-white scale-105 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'bg-black text-neutral-300 border-neutral-700 hover:border-neutral-500'}`}>
                            <span className={opt.label === '★' ? 'text-base sm:text-lg leading-none font-black' : ''}>{opt.label}</span>
                          </button>
                        );
                      })}
                      {userWinDigitFilter === '3' && [{ id: 'ALL', label: '★' }, { id: 'SUPER', label: 'SUPER' }, { id: 'BOX', label: 'BOX' }, { id: 'BOTH', label: 'BOTH' }].map((opt) => {
                        const isSelected = userWinSubOptionFilter === 'ALL' ? true : userWinSubOptionFilter !== 'NONE' && userWinSubOptionFilter === opt.id;
                        return (
                          <button key={opt.id} type="button" onClick={() => setUserWinSubOptionFilter(userWinSubOptionFilter === opt.id ? 'NONE' : opt.id)} className={`${opt.id === 'ALL' ? 'w-7 h-7 sm:w-8 sm:h-8 rounded-full' : 'px-2 py-1 rounded-full text-[10px] uppercase'} font-black flex items-center justify-center border transition-all cursor-pointer ${isSelected ? 'bg-neutral-800 text-white border-2 border-white scale-105 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'bg-black text-neutral-300 border-neutral-700 hover:border-neutral-500'}`}>
                            <span className={opt.label === '★' ? 'text-base sm:text-lg leading-none font-black' : ''}>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">SEARCH BY NUMBER</span>
                      <div className="relative">
                        <input type="text" maxLength={3} value={userWinSearchNumber} onChange={(e) => setUserWinSearchNumber(e.target.value.replace(/\D/g, ''))} placeholder="Number" className="w-full bg-black border-2 border-white/90 focus:border-gold text-white font-mono font-black text-sm px-4 py-2.5 rounded-xl placeholder:text-neutral-400 outline-none transition-all shadow-inner" />
                        {userWinSearchNumber && (
                          <button type="button" onClick={() => setUserWinSearchNumber('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs font-bold">Clear</button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button type="button" onClick={() => setShowUserWinningDetails(true)} className="w-full py-3.5 px-4 bg-gold-metallic hover:brightness-110 active:scale-[0.98] text-black font-black text-sm tracking-wider uppercase rounded-xl shadow-lg border border-gold-dark flex items-center justify-center gap-2 transition-all cursor-pointer">
                    <span>SHOW REPORT</span>
                  </button>
                </div>
              </div>
            ) : (
              /* --- VIEW 2: DEDICATED REPORT OUTPUT VIEW --- */
              <div className="space-y-4 animate-drop-in">
                <div className="bg-gold-metallic p-4 rounded-xl text-black shadow-lg border border-gold-dark space-y-2.5 font-mono">
                  <div className="flex items-center justify-between font-black text-lg sm:text-xl uppercase tracking-wider">
                    <span>WINNING REPORT &nbsp;( {userWinSlotFilter === 'ALL' ? 'ALL' : userWinSlotFilter} )</span>
                  </div>
                  <div className="flex items-center justify-between text-base sm:text-lg font-black pt-2 border-t border-black/30">
                    <span>Total Count: {userWinningCount}</span>
                    <span>Total: ₹ {userWinningGrandTotal.toLocaleString()}</span>
                  </div>
                </div>

                {userWinSearchNumber.trim() && (
                  <div className="bg-neutral-900 border border-gold/60 p-3 rounded-xl flex items-center justify-between text-xs font-mono shadow-md">
                    <span className="text-neutral-300">SEARCHING NUMBER: <strong className="text-gold font-bold text-sm">"{userWinSearchNumber}"</strong></span>
                    <span className="text-emerald-400 font-extrabold">{userWinningCategories.length} Category(s) Matched</span>
                  </div>
                )}

                {userWinningCategories.length === 0 ? (
                  <div className="bg-neutral-950 p-6 rounded-2xl border-2 border-white/90 text-center font-mono text-xs font-bold text-neutral-400">
                    No winning tickets found for {selectedWinningUser.name} with selected filters.
                  </div>
                ) : (
                  userWinningCategories.map((group) => (
                    <div key={group.category} className="space-y-3">
                      <div className={`${getCategoryHeaderTheme(group.category)} border text-sm font-black tracking-widest uppercase py-2.5 px-4 rounded-xl text-center font-mono transition-all`}>
                        {group.category}
                      </div>

                      <div className="space-y-3">
                        {group.cards.map((card: any) => {
                          const isSelected = selectedUserWinCardId === card.id;
                          const theme = getWinnerCardTheme(card.prize);
                          return (
                            <div key={card.id} onClick={() => setSelectedUserWinCardId(isSelected ? null : card.id)} className={`${theme.cardBg} rounded-2xl overflow-hidden shadow-xl border-2 transition-all cursor-pointer font-mono active:scale-[0.99] ${isSelected ? 'border-gold shadow-[0_0_20px_rgba(212,175,55,0.6)] scale-[1.01]' : `${theme.cardBorder} hover:scale-[1.005]`}`}>
                              {/* Prize & Number Header Bar with vivid glowing colors */}
                              <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 px-4 py-2.5 font-mono flex items-center justify-between border-b border-gold/30 shadow-inner">
                                <span className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs px-3 py-1 rounded-lg shadow-[0_0_12px_rgba(16,185,129,0.5)] border border-emerald-300/60 uppercase tracking-widest flex items-center gap-1.5">
                                  🏆 {getPrizePositionDisplay(card)}
                                </span>
                                <span className="text-amber-300 font-black text-base font-mono tracking-widest bg-black px-2.5 py-0.5 rounded-lg border border-amber-400/50 shadow-[0_0_10px_rgba(251,191,36,0.35)]">
                                  {card.number}
                                </span>
                              </div>

                              {/* Agency & Customer Info Bar */}
                              <div className="bg-black/75 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 text-xs font-mono">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">AGENCY:</span>
                                  <span className="text-amber-400 font-extrabold text-xs tracking-wide">{card.agencyName || card.userName}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">CUSTOMER:</span>
                                  <span className="text-white font-extrabold text-xs">{formatCustomerName(card.customerName)}</span>
                                </div>
                              </div>

                              {/* Bill ID & Slot Info Bar */}
                              <div className="bg-neutral-950/90 px-4 py-1.5 flex flex-wrap items-center justify-between text-[11px] font-mono border-t border-neutral-900 text-neutral-400 gap-1">
                                <span>Bill: <strong className="text-neutral-300 font-bold">{card.ticketId}</strong></span>
                                <span>Slot: <strong className="text-gold font-bold">{(card.slot || '').replace(/\s*Game$/i, '')}</strong></span>
                              </div>

                              {/* Count & Win Amount Footer */}
                              <div className="bg-black/95 px-4 py-3 flex items-center justify-between font-mono text-xs border-t border-white/5">
                                <span className="text-neutral-300">COUNT: <strong className="text-white font-black text-sm ml-1 font-mono">{card.count}</strong></span>
                                <span className="text-gold font-bold">TOTAL: <strong className={`font-black text-base ml-1 font-mono ${theme.totalText}`}>₹{card.total}</strong></span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= ALL USERS DAILY REPORT FULL-SCREEN OVERLAY ================= */}
      {showDailyReportOverlay && (
        <div className="fixed inset-0 bg-black text-white z-50 flex flex-col justify-start overflow-y-auto animate-drop-in font-sans">
          <HeaderBanner title="DAILY REPORT (ALL USERS)" showBack={true} onBackClick={() => setShowDailyReportOverlay(false)} />
          <div className="max-w-md mx-auto w-full px-3 sm:px-4 py-4 space-y-4">
            {isDayDetail && isGameDetail && (
              <div className="flex bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs font-black">
                <button onClick={() => setActiveDailyOverlayTab('DAY')} className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${activeDailyOverlayTab === 'DAY' ? 'bg-gold-metallic text-black shadow font-black' : 'text-neutral-400 hover:text-white'}`}>Day Detail</button>
                <button onClick={() => setActiveDailyOverlayTab('GAME')} className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${activeDailyOverlayTab === 'GAME' ? 'bg-gold-metallic text-black shadow font-black' : 'text-neutral-400 hover:text-white'}`}>Game Detail</button>
              </div>
            )}

            <div className="bg-gradient-to-b from-neutral-900 via-neutral-950 to-black border-2 border-gold/60 rounded-2xl p-4 text-white shadow-[0_0_20px_rgba(212,175,55,0.15)] space-y-2.5 font-mono">
              <div className="font-black text-base sm:text-lg uppercase tracking-wider text-gold flex items-center justify-between">
                <span>DAILY REPORT &nbsp; ( {dailySlotFilter} )</span>
              </div>
              <div className="text-xs sm:text-sm font-bold text-neutral-300 flex items-center gap-3">
                <span className="text-gold font-black">DATE</span>
                <span className="font-mono tracking-wide text-white">{formatDateDisplay(dailyFromDate)} &nbsp;&nbsp; to &nbsp;&nbsp; {formatDateDisplay(dailyToDate)}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm font-black pt-2 border-t border-neutral-800 gap-y-2">
                <div className="flex items-center gap-4 sm:gap-6">
                  <span>Total: <strong className={`font-mono text-sm sm:text-base ${allUsersDailyData.netTotal < 0 ? 'text-rose-400' : 'text-yellow-400'}`}>{allUsersDailyData.netTotal}</strong></span>
                  <span>Sale: <strong className="font-mono text-white text-sm sm:text-base">{allUsersDailyData.totalSale}</strong></span>
                </div>
                <div className="flex items-center gap-4 sm:gap-6">
                  <span>Prize: <strong className="font-mono text-rose-400 text-sm sm:text-base">{allUsersDailyData.totalPrize}</strong></span>
                  <span>Comm: <strong className="font-mono text-sm sm:text-base text-rose-400">{allUsersDailyData.totalComm}</strong></span>
                </div>
              </div>
            </div>

            {activeDailyOverlayTab === 'DAY' && (
              <div className="w-full border-2 border-gold/60 rounded-2xl overflow-hidden bg-neutral-950 text-white shadow-[0_0_25px_rgba(212,175,55,0.12)] font-mono">
                <div className="grid grid-cols-5 bg-gradient-to-r from-neutral-900 via-[#3a2a07] to-neutral-900 border-b border-gold/40 font-black py-3 px-2 text-center uppercase tracking-wider text-gold text-xs sm:text-sm shadow-inner">
                  <span className="text-center">NAME</span>
                  <span className="text-center">SALE</span>
                  <span className="text-center">PRIZE</span>
                  <span className="text-center">COMM</span>
                  <span className="text-center">TOTAL</span>
                </div>
                <div className="divide-y divide-neutral-850 font-mono">
                  {allUsersDailyData.rows.map((row, idx) => {
                    const rowTotal = row.sale - row.prize - (row.comm || 0);
                    const isNegative = rowTotal < 0;
                    return (
                      <div key={idx} className="grid grid-cols-5 items-center px-2 py-3 text-center even:bg-neutral-900/40 odd:bg-black hover:bg-neutral-850/80 transition-colors">
                        <div className="flex items-center justify-center text-[10px] sm:text-xs">
                          <span className="font-black uppercase tracking-wider text-gold text-[10px] sm:text-[11px] truncate max-w-[80px]">{row.userDisplayName}</span>
                        </div>
                        <div className="text-xs sm:text-sm font-black text-neutral-100 font-mono flex items-center justify-center">{row.sale}</div>
                        <div className="text-xs sm:text-sm font-black text-rose-400 font-mono flex items-center justify-center">{row.prize}</div>
                        <div className="text-xs sm:text-sm font-black font-mono flex items-center justify-center text-rose-400">{row.comm || 0}</div>
                        <div className={`text-xs sm:text-sm font-black font-mono flex items-center justify-center ${isNegative ? 'text-rose-400' : 'text-yellow-400'}`}>{rowTotal}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeDailyOverlayTab === 'GAME' && (
              <div className="w-full border-2 border-gold/60 rounded-2xl overflow-hidden bg-neutral-950 text-white shadow-[0_0_25px_rgba(212,175,55,0.12)] font-mono">
                <div className="grid grid-cols-5 bg-gradient-to-r from-neutral-900 via-[#3a2a07] to-neutral-900 border-b border-gold/40 font-black py-3 px-2 text-center uppercase tracking-wider text-gold text-xs sm:text-sm shadow-inner">
                  <span className="text-center">NAME</span>
                  <span className="text-center">SALE</span>
                  <span className="text-center">PRIZE</span>
                  <span className="text-center">COMM</span>
                  <span className="text-center">TOTAL</span>
                </div>
                <div className="divide-y divide-neutral-850 font-mono">
                  {allUsersDailyData.filteredGameRows.map((row, idx) => {
                    const rowTotal = row.sale - row.prize - (row.comm || 0);
                    const isNegative = rowTotal < 0;
                    return (
                      <div key={idx} className="grid grid-cols-5 items-center px-2 py-3.5 text-center even:bg-neutral-900/40 odd:bg-black hover:bg-neutral-850/80 transition-colors">
                        <div className="text-gold font-black text-xs sm:text-sm flex items-center justify-center uppercase tracking-wider">{row.slotName}</div>
                        <div className="text-xs sm:text-sm font-black text-neutral-100 font-mono flex items-center justify-center">{row.sale}</div>
                        <div className="text-xs sm:text-sm font-black text-rose-400 font-mono flex items-center justify-center">{row.prize}</div>
                        <div className="text-xs sm:text-sm font-black font-mono flex items-center justify-center text-rose-400">{row.comm || 0}</div>
                        <div className={`text-xs sm:text-sm font-black font-mono flex items-center justify-center ${isNegative ? 'text-rose-400' : 'text-yellow-400'}`}>{rowTotal}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= DEDICATED USER DAILY REPORT FULL-SCREEN OVERLAY ================= */}
      {selectedDailyUser && (
        <div className="fixed inset-0 bg-black text-white z-50 flex flex-col justify-start overflow-y-auto animate-drop-in font-sans">
          <HeaderBanner
            title={`DAILY REPORT - ${selectedDailyUser.name.toUpperCase()}`}
            showBack={true}
            onBackClick={() => {
              if (showUserDailyOverlay) {
                setShowUserDailyOverlay(false);
              } else {
                setSelectedDailyUser(null);
                setShowUserDailyOverlay(false);
              }
            }}
          />
          <div className="max-w-md mx-auto w-full px-3 sm:px-4 py-4 space-y-4">
            {!showUserDailyOverlay ? (
              /* --- VIEW 1: FILTER SELECTION FORM --- */
              <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-2xl shadow-xl space-y-5 font-sans animate-drop-in">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div onClick={() => triggerDatePicker(userDailyFromRef)} className="relative flex-1 bg-black border border-neutral-700 rounded-xl px-3 sm:px-4 py-2 cursor-pointer group transition-all block overflow-hidden shadow-inner h-[44px] flex flex-col justify-center">
                    <span className="text-[9px] sm:text-[10px] font-black text-neutral-400 uppercase tracking-wider block pointer-events-none leading-none">FROM DATE</span>
                    <span className="text-white font-black text-xs sm:text-sm tracking-wide block mt-0.5 font-mono pointer-events-none truncate">{formatDateDisplay(userDailyFromDate)}</span>
                    <input ref={userDailyFromRef} type="date" value={userDailyFromDate} onChange={(e) => e.target.value && setUserDailyFromDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 full-date-input" />
                  </div>
                  <div onClick={() => triggerDatePicker(userDailyToRef)} className="relative flex-1 bg-black border border-neutral-700 rounded-xl px-3 sm:px-4 py-2 cursor-pointer group transition-all block overflow-hidden shadow-inner h-[44px] flex flex-col justify-center">
                    <span className="text-[9px] sm:text-[10px] font-black text-neutral-400 uppercase tracking-wider block pointer-events-none leading-none">TO DATE</span>
                    <span className="text-white font-black text-xs sm:text-sm tracking-wide block mt-0.5 font-mono pointer-events-none truncate">{formatDateDisplay(userDailyToDate)}</span>
                    <input ref={userDailyToRef} type="date" value={userDailyToDate} onChange={(e) => e.target.value && setUserDailyToDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 full-date-input" />
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-900 flex items-center justify-start gap-8">
                  <label onClick={() => { setUserIsDayDetail(true); setUserIsGameDetail(false); setActiveUserDailyOverlayTab('DAY'); }} className="flex items-center gap-2.5 cursor-pointer group select-none">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${userIsDayDetail ? 'border-gold bg-gold text-black shadow-[0_0_10px_rgba(212,175,55,0.4)]' : 'border-neutral-600 bg-black group-hover:border-neutral-400'}`}>
                      {userIsDayDetail && (
                        <svg className="w-3.5 h-3.5 fill-current stroke-current stroke-2" viewBox="0 0 24 24">
                          <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-xs sm:text-sm font-black tracking-wide ${userIsDayDetail ? 'text-gold' : 'text-neutral-300'}`}>Day Detail</span>
                  </label>

                  <label onClick={() => { setUserIsGameDetail(true); setUserIsDayDetail(false); setActiveUserDailyOverlayTab('GAME'); }} className="flex items-center gap-2.5 cursor-pointer group select-none">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${userIsGameDetail ? 'border-gold bg-gold text-black shadow-[0_0_10px_rgba(212,175,55,0.4)]' : 'border-neutral-600 bg-black group-hover:border-neutral-400'}`}>
                      {userIsGameDetail && (
                        <svg className="w-3.5 h-3.5 fill-current stroke-current stroke-2" viewBox="0 0 24 24">
                          <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-xs sm:text-sm font-black tracking-wide ${userIsGameDetail ? 'text-gold' : 'text-neutral-300'}`}>Game Detail</span>
                  </label>
                </div>

                <div className="pt-2 border-t border-neutral-900 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {[{ id: 'ALL', label: 'All' }, { id: '1 PM', label: '1 PM' }, { id: '3 PM', label: '3 PM' }, { id: '6 PM', label: '6 PM' }, { id: '8 PM', label: '8 PM' }].map((opt) => {
                      const isChecked = userDailySlotFilter === opt.id;
                      return (
                        <label key={opt.id} onClick={() => setUserDailySlotFilter(opt.id as any)} className="flex items-center gap-1.5 cursor-pointer group py-1 px-1 rounded-lg transition-all">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${isChecked ? 'border-gold bg-black' : 'border-neutral-600 bg-black group-hover:border-neutral-400'}`}>
                            {isChecked && <div className="w-2 h-2 rounded-full bg-gold-metallic" />}
                          </div>
                          <span className={`text-xs font-black tracking-wide ${isChecked ? 'text-gold' : 'text-neutral-300'}`}>{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  <button type="button" onClick={() => setShowUserDailyOverlay(true)} className="w-full py-3.5 px-4 bg-gold-metallic hover:brightness-110 active:scale-[0.98] text-black font-black text-sm tracking-wider uppercase rounded-xl shadow-lg border border-gold-dark flex items-center justify-center gap-2 transition-all cursor-pointer">
                    <span>SHOW REPORT</span>
                  </button>
                </div>
              </div>
            ) : (
              /* --- VIEW 2: DEDICATED REPORT OUTPUT VIEW --- */
              <div className="space-y-4 animate-drop-in">
                {userIsDayDetail && userIsGameDetail && (
                  <div className="flex bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs font-black">
                    <button onClick={() => setActiveUserDailyOverlayTab('DAY')} className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${activeUserDailyOverlayTab === 'DAY' ? 'bg-gold-metallic text-black shadow font-black' : 'text-neutral-400 hover:text-white'}`}>Day Detail</button>
                    <button onClick={() => setActiveUserDailyOverlayTab('GAME')} className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${activeUserDailyOverlayTab === 'GAME' ? 'bg-gold-metallic text-black shadow font-black' : 'text-neutral-400 hover:text-white'}`}>Game Detail</button>
                  </div>
                )}

                <div className="bg-gradient-to-b from-neutral-900 via-neutral-950 to-black border-2 border-gold/60 rounded-2xl p-4 text-white shadow-[0_0_20px_rgba(212,175,55,0.15)] space-y-2.5 font-mono">
                  <div className="font-black text-base sm:text-lg uppercase tracking-wider text-gold flex items-center justify-between">
                    <span>DAILY REPORT &nbsp; ( {userDailySlotFilter} )</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-neutral-300 flex items-center gap-3">
                    <span className="text-gold font-black">DATE</span>
                    <span className="font-mono tracking-wide text-white">{formatDateDisplay(userDailyFromDate)} &nbsp;&nbsp; to &nbsp;&nbsp; {formatDateDisplay(userDailyToDate)}</span>
                  </div>
                <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm font-black pt-2 border-t border-neutral-800 gap-y-2">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <span>Total: <strong className={`font-mono text-sm sm:text-base ${userDailyData.netTotal < 0 ? 'text-rose-400' : 'text-yellow-400'}`}>{userDailyData.netTotal}</strong></span>
                    <span>Sale: <strong className="font-mono text-white text-sm sm:text-base">{userDailyData.totalSale}</strong></span>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <span>Prize: <strong className="font-mono text-rose-400 text-sm sm:text-base">{userDailyData.totalPrize}</strong></span>
                    <span>Comm: <strong className="font-mono text-sm sm:text-base text-rose-400">{userDailyData.totalComm}</strong></span>
                  </div>
                </div>
              </div>

              {activeUserDailyOverlayTab === 'DAY' && (
                <div className="w-full border-2 border-gold/60 rounded-2xl overflow-hidden bg-neutral-950 text-white shadow-[0_0_25px_rgba(212,175,55,0.12)] font-mono">
                  <div className="grid grid-cols-5 bg-gradient-to-r from-neutral-900 via-[#3a2a07] to-neutral-900 border-b border-gold/40 font-black py-3 px-2 text-center uppercase tracking-wider text-gold text-xs sm:text-sm shadow-inner">
                    <span className="text-center">NAME</span>
                    <span className="text-center">SALE</span>
                    <span className="text-center">PRIZE</span>
                    <span className="text-center">COMM</span>
                    <span className="text-center">TOTAL</span>
                  </div>
                  <div className="divide-y divide-neutral-850 font-mono">
                    {userDailyData.rows.map((row, idx) => {
                      const rowTotal = row.sale - row.prize - (row.comm || 0);
                      const isNegative = rowTotal < 0;
                      return (
                        <div key={idx} className="grid grid-cols-5 items-center px-2 py-3 text-center even:bg-neutral-900/40 odd:bg-black hover:bg-neutral-850/80 transition-colors">
                          <div className="flex items-center justify-center text-[10px] sm:text-xs">
                            <span className="font-black uppercase tracking-wider text-gold text-[10px] sm:text-[11px] truncate max-w-[80px]">{selectedDailyUser.name}</span>
                          </div>
                          <div className="text-xs sm:text-sm font-black text-neutral-100 font-mono flex items-center justify-center">{row.sale}</div>
                          <div className="text-xs sm:text-sm font-black text-rose-400 font-mono flex items-center justify-center">{row.prize}</div>
                          <div className="text-xs sm:text-sm font-black font-mono flex items-center justify-center text-rose-400">{row.comm || 0}</div>
                          <div className={`text-xs sm:text-sm font-black font-mono flex items-center justify-center ${isNegative ? 'text-rose-400' : 'text-yellow-400'}`}>{rowTotal}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeUserDailyOverlayTab === 'GAME' && (
                <div className="w-full border-2 border-gold/60 rounded-2xl overflow-hidden bg-neutral-950 text-white shadow-[0_0_25px_rgba(212,175,55,0.12)] font-mono">
                  <div className="grid grid-cols-5 bg-gradient-to-r from-neutral-900 via-[#3a2a07] to-neutral-900 border-b border-gold/40 font-black py-3 px-2 text-center uppercase tracking-wider text-gold text-xs sm:text-sm shadow-inner">
                    <span className="text-center">NAME</span>
                    <span className="text-center">SALE</span>
                    <span className="text-center">PRIZE</span>
                    <span className="text-center">COMM</span>
                    <span className="text-center">TOTAL</span>
                  </div>
                  <div className="divide-y divide-neutral-850 font-mono">
                    {userDailyData.filteredGameRows.map((row, idx) => {
                      const rowTotal = row.sale - row.prize - (row.comm || 0);
                      const isNegative = rowTotal < 0;
                      return (
                        <div key={idx} className="grid grid-cols-5 items-center px-2 py-3.5 text-center even:bg-neutral-900/40 odd:bg-black hover:bg-neutral-850/80 transition-colors">
                          <div className="text-gold font-black text-xs sm:text-sm flex items-center justify-center uppercase tracking-wider">{row.slotName}</div>
                          <div className="text-xs sm:text-sm font-black text-neutral-100 font-mono flex items-center justify-center">{row.sale}</div>
                          <div className="text-xs sm:text-sm font-black text-rose-400 font-mono flex items-center justify-center">{row.prize}</div>
                          <div className="text-xs sm:text-sm font-black font-mono flex items-center justify-center text-rose-400">{row.comm || 0}</div>
                          <div className={`text-xs sm:text-sm font-black font-mono flex items-center justify-center ${isNegative ? 'text-rose-400' : 'text-yellow-400'}`}>{rowTotal}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
