import React, { useState } from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';
import { useApp } from '../../context/AppContext';
import {
  ClipboardList,
  Trophy,
  BarChart3,
  Calendar,
  ChevronRight,
  Trash2,
} from 'lucide-react';

type ReportSection = 'HUB' | 'SALES' | 'WINNING' | 'OVER_COUNT' | 'DAILY';

export const MyPlayReportView: React.FC = () => {
  const { userTickets, currentUser } = useApp();
  const [activeSection, setActiveSection] = useState<ReportSection>('HUB');

  // Dates & Form State for Sales Report Form
  const todayStr = new Date().toISOString().split('T')[0];

  const [fromDate, setFromDate] = useState<string>(todayStr);
  const [toDate, setToDate] = useState<string>(todayStr);
  const [isFullView, setIsFullView] = useState<boolean>(false);
  const [slotFilter, setSlotFilter] = useState<'ALL' | '1 PM' | '3 PM' | '6 PM' | '8 PM'>('ALL');
  
  // Sales Report Filters
  const [digitFilter, setDigitFilter] = useState<'ALL' | 'NONE' | '1' | '2' | '3'>('NONE');
  const [subOptionFilter, setSubOptionFilter] = useState<string>('NONE');
  const [searchNumber, setSearchNumber] = useState<string>('');

  // Detailed Sales Report Overlay State
  const [showSalesDetails, setShowSalesDetails] = useState<boolean>(false);
  const [selectedSingleTicket, setSelectedSingleTicket] = useState<any | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletedTicketIds, setDeletedTicketIds] = useState<string[]>([]);
  const longPressTimerRef = React.useRef<any>(null);

  // Dates & Form State for Winning Report Form (matching Image 1)
  const [winningFromDate, setWinningFromDate] = useState<string>(todayStr);
  const [winningToDate, setWinningToDate] = useState<string>(todayStr);
  const [isWinningFullView, setIsWinningFullView] = useState<boolean>(false);
  const [winningSlotFilter, setWinningSlotFilter] = useState<'ALL' | '1 PM' | '3 PM' | '6 PM' | '8 PM'>('ALL');
  const [winningDigitFilter, setWinningDigitFilter] = useState<'ALL' | 'NONE' | '1' | '2' | '3'>('NONE');
  const [winningSubOptionFilter, setWinningSubOptionFilter] = useState<string>('NONE');
  const [winningSearchNumber, setWinningSearchNumber] = useState<string>('');
  
  // Detailed Winning Report Overlay State (matching Image 2)
  const [showWinningDetails, setShowWinningDetails] = useState<boolean>(false);
  const [selectedWinningCardId, setSelectedWinningCardId] = useState<string | null>(null);

  // Dates & Form State for Daily Report Form (matching Image 1)
  const [dailyFromDate, setDailyFromDate] = useState<string>(todayStr);
  const [dailyToDate, setDailyToDate] = useState<string>(todayStr);
  const [dailySlotFilter, setDailySlotFilter] = useState<'ALL' | '1 PM' | '3 PM' | '6 PM' | '8 PM'>('ALL');

  // Dates & Form State for Over Count Report (matching original Count Report view)
  const [countTab, setCountTab] = useState<'TODAY' | 'PREVIOUS'>('TODAY');
  const [overCountDate, setOverCountDate] = useState<string>(todayStr);
  const [overCountToDate, setOverCountToDate] = useState<string>(todayStr);
  const [overCountSlot, setOverCountSlot] = useState<'ALL' | '1 PM' | '3 PM' | '6 PM' | '8 PM'>('ALL');

  const salesFromRef = React.useRef<HTMLInputElement>(null);
  const salesToRef = React.useRef<HTMLInputElement>(null);
  const winFromRef = React.useRef<HTMLInputElement>(null);
  const winToRef = React.useRef<HTMLInputElement>(null);
  const dailyFromRef = React.useRef<HTMLInputElement>(null);
  const dailyToRef = React.useRef<HTMLInputElement>(null);
  const countFromRef = React.useRef<HTMLInputElement>(null);
  const countToRef = React.useRef<HTMLInputElement>(null);

  const triggerDatePicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    if (ref.current) {
      if ('showPicker' in ref.current && typeof (ref.current as any).showPicker === 'function') {
        try {
          (ref.current as any).showPicker();
        } catch (err) {
          ref.current.click();
        }
      } else {
        ref.current.click();
      }
    }
  };

  const resetDatesToCurrent = () => {
    const currentToday = new Date().toISOString().split('T')[0];
    setFromDate(currentToday);
    setToDate(currentToday);
    setWinningFromDate(currentToday);
    setWinningToDate(currentToday);
    setDailyFromDate(currentToday);
    setDailyToDate(currentToday);
    setOverCountDate(currentToday);
    setOverCountToDate(currentToday);
    setCountTab('TODAY');
  };

  const { countReportRows, countReportTotalCount, countReportTotalCash } = React.useMemo(() => {
    const targetFrom = countTab === 'TODAY' ? todayStr : overCountDate;
    const targetTo = countTab === 'TODAY' ? todayStr : overCountToDate;

    const filtered = userTickets.filter((tkt) => {
      if (overCountSlot !== 'ALL') {
        const slotPrefix = overCountSlot.split(' ')[0];
        if (!tkt.gameSlot.startsWith(slotPrefix) && !tkt.gameSlot.includes(overCountSlot)) {
          return false;
        }
      }
      const tktDate = tkt.placedAt?.split(' ')[0] || todayStr;
      if (tktDate < targetFrom || tktDate > targetTo) {
        return false;
      }
      return true;
    });

    let superCount = 0, superCash = 0;
    let boxCount = 0, boxCash = 0;
    let pairCount = 0, pairCash = 0;
    let singleCount = 0, singleCash = 0;

    filtered.forEach((tkt) => {
      tkt.items.forEach((item: any) => {
        const type = (item.type || '').toUpperCase();
        const cnt = Number(item.count || 0);
        const amt = Number(item.totalAmount || 0);

        if (type === 'SUPER' || type === 'DIRECT') {
          superCount += cnt;
          superCash += amt;
        } else if (type === 'BOX' || type === 'SHUFFLE') {
          boxCount += cnt;
          boxCash += amt;
        } else if (['AB', 'BC', 'AC', 'PAIR'].includes(type)) {
          pairCount += cnt;
          pairCash += amt;
        } else if (['A', 'B', 'C', 'POSITION'].includes(type)) {
          singleCount += cnt;
          singleCash += amt;
        }
      });
    });

    const rows = [
      {
        name: 'SUPER',
        count: superCount,
        rate: superCount > 0 ? (superCash / superCount).toFixed(1) : '-',
        cash: superCash,
      },
      {
        name: 'BOX',
        count: boxCount,
        rate: boxCount > 0 ? (boxCash / boxCount).toFixed(1) : '-',
        cash: boxCash,
      },
      {
        name: 'AB/BC/AC',
        count: pairCount,
        rate: pairCount > 0 ? (pairCash / pairCount).toFixed(1) : '-',
        cash: pairCash,
      },
      {
        name: 'A/B/C',
        count: singleCount,
        rate: singleCount > 0 ? (singleCash / singleCount).toFixed(1) : '-',
        cash: singleCash,
      },
    ];

    const totalCount = superCount + boxCount + pairCount + singleCount;
    const totalCash = superCash + boxCash + pairCash + singleCash;

    return { countReportRows: rows, countReportTotalCount: totalCount, countReportTotalCash: totalCash };
  }, [userTickets, overCountDate, overCountToDate, overCountSlot, todayStr, countTab]);

  const [isDayDetail, setIsDayDetail] = useState<boolean>(true);
  const [isGameDetail, setIsGameDetail] = useState<boolean>(false);
  const [showDailyReportOverlay, setShowDailyReportOverlay] = useState<boolean>(false);
  const [activeDailyOverlayTab, setActiveDailyOverlayTab] = useState<'DAY' | 'GAME'>('DAY');

  // Sample Realistic Day-wise dataset matching Image 2
  const sampleDailyRows = [
    { date: '01-08-2026', sale: 2840, prize: 0 },
    { date: '02-08-2026', sale: 2620, prize: 1100 },
    { date: '03-08-2026', sale: 3220, prize: 540 },
    { date: '04-08-2026', sale: 5150, prize: 1280 },
    { date: '05-08-2026', sale: 4120, prize: 190 },
    { date: '06-08-2026', sale: 3400, prize: 130 },
    { date: '07-08-2026', sale: 3880, prize: 700 },
    { date: '08-08-2026', sale: 5290, prize: 120 },
    { date: '09-08-2026', sale: 4300, prize: 180 },
    { date: '10-08-2026', sale: 4230, prize: 1560 },
    { date: '11-08-2026', sale: 12990, prize: 5060 },
    { date: '12-08-2026', sale: 7260, prize: 5040 },
    { date: '13-08-2026', sale: 12600, prize: 22500 },
    { date: '14-08-2026', sale: 440, prize: 0 },
  ];

  // Helper to format YYYY-MM-DD -> DD-MM-YYYY
  const formatDateDisplay = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  // Convert DD-MM-YYYY to YYYY-MM-DD for comparison
  const parseDDMMYYYYtoYYYYMMDD = (dStr: string) => {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dStr;
  };

  // Dynamically filter daily rows between dailyFromDate and dailyToDate (inclusive)
  const filteredDailyRows = React.useMemo(() => {
    const dateMap = new Map<string, { date: string; sale: number; prize: number }>();
    
    // 1. Process sample baseline data within selected range
    sampleDailyRows.forEach((r) => {
      const isoDate = parseDDMMYYYYtoYYYYMMDD(r.date);
      if (isoDate >= dailyFromDate && isoDate <= dailyToDate) {
        const slotScale = dailySlotFilter === 'ALL' ? 1 : 0.25;
        dateMap.set(isoDate, {
          date: r.date,
          sale: Math.round(r.sale * slotScale),
          prize: Math.round(r.prize * slotScale),
        });
      }
    });

    // 2. Incorporate actual tickets placed by the user
    userTickets.forEach((t) => {
      const tDate = t.placedAt ? t.placedAt.split('T')[0] : todayStr;
      if (tDate >= dailyFromDate && tDate <= dailyToDate) {
        if (dailySlotFilter === 'ALL' || t.gameSlot.toUpperCase().startsWith(dailySlotFilter.toUpperCase())) {
          const displayD = formatDateDisplay(tDate);
          const existing = dateMap.get(tDate) || { date: displayD, sale: 0, prize: 0 };
          existing.sale += t.totalAmount;
          if (t.status === 'WON') {
            existing.prize += t.winAmount || 0;
          }
          dateMap.set(tDate, existing);
        }
      }
    });

    // If no records in range, create at least selected fromDate entry
    if (dateMap.size === 0 && dailyFromDate && dailyToDate) {
      dateMap.set(dailyFromDate, {
        date: formatDateDisplay(dailyFromDate),
        sale: 0,
        prize: 0,
      });
    }

    return Array.from(dateMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([_, val]) => val);
  }, [dailyFromDate, dailyToDate, dailySlotFilter, userTickets]);

  // Aggregate dynamically calculated daily totals based on selected dates and filter
  const currentDailyTotalSale = filteredDailyRows.reduce((acc, r) => acc + r.sale, 0);
  const currentDailyTotalPrize = filteredDailyRows.reduce((acc, r) => acc + r.prize, 0);
  const currentDailyNetTotal = currentDailyTotalSale - currentDailyTotalPrize;

  // Game slot rows dynamically reflecting the selected date range & user tickets
  const dynamicGameRows = React.useMemo(() => {
    const daysCount = Math.max(1, filteredDailyRows.length);
    const dayRatio = daysCount / 14;

    const baseSlots = [
      { slotName: '1 PM', baseSale: 16840, basePrize: 21800, slotKey: '1 PM Game' },
      { slotName: '3 PM', baseSale: 15360, basePrize: 3100, slotKey: '3 PM Game' },
      { slotName: '6 PM', baseSale: 15980, basePrize: 7740, slotKey: '6 PM Game' },
      { slotName: '8 PM', baseSale: 24160, basePrize: 5760, slotKey: '8 PM Game' },
    ];

    return baseSlots.map((slot) => {
      const slotTickets = userTickets.filter((t) => {
        const tDate = t.placedAt ? t.placedAt.split('T')[0] : todayStr;
        return (
          tDate >= dailyFromDate &&
          tDate <= dailyToDate &&
          t.gameSlot === slot.slotKey
        );
      });
      const userSale = slotTickets.reduce((acc, t) => acc + t.totalAmount, 0);
      const userPrize = slotTickets
        .filter((t) => t.status === 'WON')
        .reduce((acc, t) => acc + (t.winAmount || 0), 0);

      const computedSale = Math.round(slot.baseSale * dayRatio) + userSale;
      const computedPrize = Math.round(slot.basePrize * dayRatio) + userPrize;

      return {
        slotName: slot.slotName,
        sale: computedSale,
        prize: computedPrize,
      };
    });
  }, [filteredDailyRows, dailyFromDate, dailyToDate, userTickets]);

  const filteredGameRows = dailySlotFilter === 'ALL'
    ? dynamicGameRows
    : dynamicGameRows.filter((r) => r.slotName === dailySlotFilter);

  // Increased long press hold duration threshold to 750ms
  const startLongPress = (tkt: any) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      setSelectedSingleTicket(tkt);
    }, 750);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Mock Realistic Ticket Data matching user's reference screenshots
  const sampleTickets = [
    {
      id: '8127716',
      gameSlot: '3 PM Game',
      customerName: 'Demo Customer',
      placedAt: '14-08-2026 02:41:04 PM',
      totalAmount: 110,
      items: [
        { type: 'SUPER', number: '053', count: 5, totalAmount: 50 },
        { type: 'BOX', number: '748', count: 6, totalAmount: 60 },
      ],
    },
    {
      id: '8127579',
      gameSlot: '3 PM Game',
      customerName: 'Demo Customer',
      placedAt: '14-08-2026 02:22:15 PM',
      totalAmount: 70,
      items: [
        { type: 'A', number: '8', count: 7, totalAmount: 70 },
      ],
    },
    {
      id: '8124807',
      gameSlot: '1 PM Game',
      customerName: 'Demo Customer',
      placedAt: '14-08-2026 11:41:04 AM',
      totalAmount: 20,
      items: [
        { type: 'SUPER', number: '053', count: 2, totalAmount: 20 },
      ],
    },
    {
      id: '8124430',
      gameSlot: '1 PM Game',
      customerName: 'Demo Customer',
      placedAt: '14-08-2026 11:03:51 AM',
      totalAmount: 20,
      items: [
        { type: 'BOX', number: '748', count: 2, totalAmount: 20 },
      ],
    },
    {
      id: '8124250',
      gameSlot: '1 PM Game',
      customerName: 'Demo Customer',
      placedAt: '14-08-2026 10:38:18 AM',
      totalAmount: 60,
      items: [
        { type: 'SUPER', number: '282', count: 1, totalAmount: 10 },
        { type: 'BOX', number: '282', count: 1, totalAmount: 10 },
        { type: 'SUPER', number: '262', count: 1, totalAmount: 10 },
        { type: 'BOX', number: '262', count: 1, totalAmount: 10 },
        { type: 'SUPER', number: '590', count: 1, totalAmount: 10 },
        { type: 'BOX', number: '590', count: 1, totalAmount: 10 },
      ],
    },
    {
      id: '8124215',
      gameSlot: '1 PM Game',
      customerName: 'Demo Customer',
      placedAt: '14-08-2026 10:29:32 AM',
      totalAmount: 20,
      items: [
        { type: 'SUPER', number: '568', count: 1, totalAmount: 10 },
        { type: 'SUPER', number: '567', count: 1, totalAmount: 10 },
      ],
    },
    {
      id: '8113930',
      gameSlot: '1 PM Game',
      customerName: 'Demo Customer',
      placedAt: '13-08-2026 12:57:46 PM',
      totalAmount: 60,
      items: [
        { type: 'SUPER', number: '786', count: 2, totalAmount: 20 },
        { type: 'SUPER', number: '286', count: 2, totalAmount: 20 },
        { type: 'SUPER', number: '886', count: 2, totalAmount: 20 },
      ],
    },
  ];

  const allTickets = userTickets.length > 0 ? userTickets : sampleTickets;

  // Filter items matching digitFilter & subOptionFilter
  const isItemMatch = (item: any, digitF: string, subF: string) => {
    const itemType = (item.type || '').toUpperCase();
    const numStr = (item.number || '').toString().trim();
    const numLength = numStr.replace(/\D/g, '').length;

    // 1. Digit Filter
    if (digitF === '1') {
      const isOneDigit = numLength === 1 || ['A', 'B', 'C'].includes(itemType);
      if (!isOneDigit) return false;
    } else if (digitF === '2') {
      const isTwoDigit = numLength === 2 || ['AB', 'BC', 'AC'].includes(itemType);
      if (!isTwoDigit) return false;
    } else if (digitF === '3') {
      const isThreeDigit = numLength === 3 || ['SUPER', 'BOX', 'DIRECT', 'SHUFFLE'].includes(itemType);
      if (!isThreeDigit) return false;
    }

    // 2. Sub Option Filter
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

  // Filter tickets for Sales Report
  const displayTickets = allTickets
    .map((tkt) => {
      if (deletedTicketIds.includes(tkt.id)) return null;
      if (slotFilter !== 'ALL' && !tkt.gameSlot.startsWith(slotFilter)) return null;

      const matchingItems = tkt.items.filter((item: any) => {
        if (searchNumber.trim() && !item.number.includes(searchNumber.trim())) {
          return false;
        }
        if (isFullView) {
          return isItemMatch(item, digitFilter, subOptionFilter);
        }
        return true;
      });

      if (matchingItems.length === 0) return null;

      return {
        ...tkt,
        displayItems: matchingItems,
        filteredTotalCount: matchingItems.reduce((acc, i) => acc + i.count, 0),
        filteredTotalAmount: matchingItems.reduce((acc, i) => acc + i.totalAmount, 0),
      };
    })
    .filter(Boolean) as any[];

  const totalDetailCount = displayTickets.reduce(
    (acc, tkt) => acc + tkt.filteredTotalCount,
    0
  );
  const grandDetailTotal = displayTickets.reduce((acc, tkt) => acc + tkt.filteredTotalAmount, 0);

  // Realistic Winning Report Data matching Image 2
  const sampleWinningCategories = [
    {
      category: 'BOX',
      cards: [
        {
          id: 'w1',
          prize: '1ST PRIZE',
          number: '386',
          count: 1,
          total: 3000,
          theme: 'bg-[#cbe6d4] text-[#134927]', // Light green header
          slot: '3 PM Game',
          type: 'BOX',
        },
        {
          id: 'w2',
          prize: '2ND PRIZE',
          number: '638',
          count: 1,
          total: 800,
          theme: 'bg-[#dcd0f0] text-[#3c1e6e]', // Light purple header
          slot: '3 PM Game',
          type: 'BOX',
        },
      ],
    },
    {
      category: 'SUPER',
      cards: [
        {
          id: 'w3',
          prize: '1ST PRIZE',
          number: '386',
          count: 2,
          total: 10000,
          theme: 'bg-[#cbe6d4] text-[#134927]', // Light green header
          slot: '3 PM Game',
          type: 'SUPER',
        },
        {
          id: 'w4',
          prize: '5TH PRIZE',
          number: '805',
          count: 2,
          total: 100,
          theme: 'bg-[#e5d9cc] text-[#4a341e]', // Light warm taupe header
          slot: '1 PM Game',
          type: 'SUPER',
        },
        {
          id: 'w5',
          prize: '6TH PRIZE',
          number: '184',
          count: 5,
          total: 250,
          theme: 'bg-[#cfdff6] text-[#17335c]', // Light blue header
          slot: '1 PM Game',
          type: 'SUPER',
        },
      ],
    },
  ];

  const getWinnerCardTheme = (prize: string) => {
    if (prize.includes('1ST')) {
      return {
        cardBorder: 'border-emerald-500/70 shadow-[0_0_20px_rgba(16,185,129,0.25)]',
        cardBg: 'bg-gradient-to-br from-[#0c2e1b] via-neutral-950 to-black',
        headerBg: 'bg-gradient-to-r from-emerald-950 via-emerald-900/60 to-neutral-950 border-b border-emerald-500/40',
        badge: 'bg-emerald-500/30 border border-emerald-400 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.4)]',
        totalText: 'text-emerald-400',
        numberText: 'text-emerald-300',
      };
    }
    if (prize.includes('2ND')) {
      return {
        cardBorder: 'border-purple-500/70 shadow-[0_0_20px_rgba(168,85,247,0.25)]',
        cardBg: 'bg-gradient-to-br from-[#2a1347] via-neutral-950 to-black',
        headerBg: 'bg-gradient-to-r from-purple-950 via-purple-900/60 to-neutral-950 border-b border-purple-500/40',
        badge: 'bg-purple-500/30 border border-purple-400 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.4)]',
        totalText: 'text-purple-400',
        numberText: 'text-purple-300',
      };
    }
    if (prize.includes('3RD')) {
      return {
        cardBorder: 'border-amber-500/70 shadow-[0_0_20px_rgba(245,158,11,0.25)]',
        cardBg: 'bg-gradient-to-br from-[#3b2a07] via-neutral-950 to-black',
        headerBg: 'bg-gradient-to-r from-amber-950 via-amber-900/60 to-neutral-950 border-b border-amber-500/40',
        badge: 'bg-amber-500/30 border border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.4)]',
        totalText: 'text-amber-400',
        numberText: 'text-amber-300',
      };
    }
    if (prize.includes('4TH') || prize.includes('5TH')) {
      return {
        cardBorder: 'border-orange-500/70 shadow-[0_0_20px_rgba(249,115,22,0.25)]',
        cardBg: 'bg-gradient-to-br from-[#331c10] via-neutral-950 to-black',
        headerBg: 'bg-gradient-to-r from-orange-950 via-orange-900/60 to-neutral-950 border-b border-orange-500/40',
        badge: 'bg-orange-500/30 border border-orange-400 text-orange-200 shadow-[0_0_10px_rgba(249,115,22,0.4)]',
        totalText: 'text-orange-400',
        numberText: 'text-orange-300',
      };
    }
    if (prize.includes('6TH')) {
      return {
        cardBorder: 'border-sky-500/70 shadow-[0_0_20px_rgba(14,165,233,0.25)]',
        cardBg: 'bg-gradient-to-br from-[#0c2547] via-neutral-950 to-black',
        headerBg: 'bg-gradient-to-r from-sky-950 via-sky-900/60 to-neutral-950 border-b border-sky-500/40',
        badge: 'bg-sky-500/30 border border-sky-400 text-sky-200 shadow-[0_0_10px_rgba(14,165,233,0.4)]',
        totalText: 'text-sky-400',
        numberText: 'text-sky-300',
      };
    }
    return {
      cardBorder: 'border-rose-500/70 shadow-[0_0_20px_rgba(244,63,94,0.25)]',
      cardBg: 'bg-gradient-to-br from-[#2e1320] via-neutral-950 to-black',
      headerBg: 'bg-gradient-to-r from-rose-950 via-rose-900/60 to-neutral-950 border-b border-rose-500/40',
      badge: 'bg-rose-500/30 border border-rose-400 text-rose-200 shadow-[0_0_10px_rgba(244,63,94,0.4)]',
      totalText: 'text-rose-400',
      numberText: 'text-rose-300',
    };
  };

  // Filter winning categories based on winningSlotFilter, winningDigitFilter, winningSubOptionFilter & winningSearchNumber
  const displayWinningCategories = sampleWinningCategories
    .map((cat) => {
      const matchingCards = cat.cards.filter((card) => {
        if (winningSlotFilter !== 'ALL' && !card.slot.startsWith(winningSlotFilter)) {
          return false;
        }
        if (winningSearchNumber.trim() && !card.number.includes(winningSearchNumber.trim())) {
          return false;
        }
        if (isWinningFullView) {
          return isItemMatch(card, winningDigitFilter, winningSubOptionFilter);
        }
        return true;
      });

      if (matchingCards.length === 0) return null;
      return {
        ...cat,
        cards: matchingCards,
      };
    })
    .filter(Boolean) as any[];

  const winningTotalCount = displayWinningCategories.reduce(
    (acc, cat) => acc + cat.cards.reduce((cAcc: number, c: any) => cAcc + c.count, 0),
    0
  );
  const winningGrandTotal = displayWinningCategories.reduce(
    (acc, cat) => acc + cat.cards.reduce((cAcc: number, c: any) => cAcc + c.total, 0),
    0
  );

  const reportItems = [
    {
      id: 'SALES',
      title: 'SALES REPORT',
      icon: ClipboardList,
      description: 'View sales breakdown by game slot and date range',
      action: () => {
        resetDatesToCurrent();
        setActiveSection('SALES');
      },
    },
    {
      id: 'WINNING',
      title: 'WINNING REPORT',
      icon: Trophy,
      description: 'View winning tickets and total payout amounts',
      action: () => {
        resetDatesToCurrent();
        setActiveSection('WINNING');
      },
    },
    {
      id: 'OVER_COUNT',
      title: 'COUNT REPORT',
      icon: BarChart3,
      description: 'View total count matrix for games (Super, Box, Pair)',
      action: () => {
        resetDatesToCurrent();
        setActiveSection('OVER_COUNT');
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      },
    },
    {
      id: 'DAILY',
      title: 'DAILY REPORT',
      icon: Calendar,
      description: 'View daily opening balance, total sales, and net summary',
      action: () => {
        resetDatesToCurrent();
        setActiveSection('DAILY');
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      },
    },
  ];

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-28 sm:pb-36 antialiased select-none font-sans">
      {/* Header Banner */}
      <HeaderBanner
        title={
          activeSection === 'HUB'
            ? 'Report'
            : activeSection === 'SALES'
            ? 'SALES REPORT'
            : activeSection === 'WINNING'
            ? 'Winning Report'
            : activeSection === 'OVER_COUNT'
            ? 'COUNT REPORT'
            : 'DAILY REPORT'
        }
        showBack={true}
        onBackClick={
          activeSection !== 'HUB'
            ? () => {
                resetDatesToCurrent();
                setActiveSection('HUB');
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              }
            : undefined
        }
      />

      <div className="max-w-md mx-auto w-full px-6 sm:px-8 py-5 space-y-4.5">
        
        {/* ================= 1. MAIN REPORT HUB MENU ================= */}
        {activeSection === 'HUB' && (
          <div className="space-y-3.5 animate-drop-in">
            {reportItems.map((item) => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  className="w-full bg-neutral-950 p-4 sm:p-4.5 rounded-2xl border border-neutral-800 flex items-center justify-between shadow-md [@media(hover:hover)]:hover:border-gold/60 [@media(hover:hover)]:hover:bg-neutral-900/80 active:scale-[0.98] active:border-gold/60 transition-all cursor-pointer group focus:outline-none select-none outline-none [-webkit-tap-highlight-color:transparent]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gold-metallic text-black rounded-xl border border-black flex items-center justify-center shrink-0 shadow-md [@media(hover:hover)]:group-hover:scale-105 transition-transform">
                      <IconComp className="w-5 h-5 stroke-[2.5]" />
                    </div>

                    <div className="text-left">
                      <span className="text-sm sm:text-base font-black text-gold tracking-wide uppercase block">
                        {item.title}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-neutral-500 [@media(hover:hover)]:group-hover:text-gold [@media(hover:hover)]:group-hover:translate-x-1 transition-all shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {/* ================= 2. SALES REPORT SUB-VIEW ================= */}
        {activeSection === 'SALES' && (
          <div className="space-y-5 animate-drop-in">
            
            {/* Sales Report Input Form Box */}
            <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-2xl shadow-xl space-y-5">
              
              {/* From Date Input Row */}
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => triggerDatePicker(salesFromRef)}
                    className="relative flex-1 bg-black border border-neutral-700 [@media(hover:hover)]:hover:border-gold/60 rounded-xl px-4 py-2.5 cursor-pointer group transition-all block overflow-hidden shadow-inner"
                  >
                    <span className="text-[10px] sm:text-xs font-black text-neutral-400 uppercase tracking-wider block pointer-events-none">
                      From date
                    </span>
                    <span className="text-white font-black text-sm sm:text-base tracking-wide block mt-0.5 font-mono pointer-events-none">
                      {formatDateDisplay(fromDate)}
                    </span>
                    <input
                      ref={salesFromRef}
                      type="date"
                      value={fromDate}
                      onChange={(e) => e.target.value && setFromDate(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 full-date-input"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => triggerDatePicker(salesFromRef)}
                    className="relative bg-neutral-900 border border-neutral-700 [@media(hover:hover)]:hover:border-gold/80 px-4 py-3.5 rounded-xl text-xs font-black uppercase text-white tracking-wider hover:bg-neutral-800 transition-all shrink-0 active:scale-95 shadow flex items-center justify-center select-none overflow-hidden cursor-pointer"
                  >
                    <span>CHANGE</span>
                  </button>
                </div>
              </div>

              {/* To Date Input Row */}
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => triggerDatePicker(salesToRef)}
                    className="relative flex-1 bg-black border border-neutral-700 [@media(hover:hover)]:hover:border-gold/60 rounded-xl px-4 py-2.5 cursor-pointer group transition-all block overflow-hidden shadow-inner"
                  >
                    <span className="text-[10px] sm:text-xs font-black text-neutral-400 uppercase tracking-wider block pointer-events-none">
                      To date
                    </span>
                    <span className="text-white font-black text-sm sm:text-base tracking-wide block mt-0.5 font-mono pointer-events-none">
                      {formatDateDisplay(toDate)}
                    </span>
                    <input
                      ref={salesToRef}
                      type="date"
                      value={toDate}
                      onChange={(e) => e.target.value && setToDate(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 full-date-input"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => triggerDatePicker(salesToRef)}
                    className="relative bg-neutral-900 border border-neutral-700 [@media(hover:hover)]:hover:border-gold/80 px-4 py-3.5 rounded-xl text-xs font-black uppercase text-white tracking-wider hover:bg-neutral-800 transition-all shrink-0 active:scale-95 shadow flex items-center justify-center select-none overflow-hidden cursor-pointer"
                  >
                    <span>CHANGE</span>
                  </button>
                </div>
              </div>

              {/* Full View Toggle Switch */}
              <div className="flex items-center justify-between pt-1 pb-1">
                <span className="text-xs sm:text-sm font-black text-neutral-300 tracking-wide">
                  Full View
                </span>
                <button
                  onClick={() => setIsFullView(!isFullView)}
                  className={`w-12 h-6 rounded-full transition-colors p-0.5 relative cursor-pointer ${
                    isFullView ? 'bg-gold-metallic' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-black shadow-md transition-transform ${
                      isFullView ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Slot Filter Radio Options (All, 1pm, 3pm, 6pm, 8pm) */}
              <div className="pt-2 border-t border-neutral-900 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {[
                    { id: 'ALL', label: 'All' },
                    { id: '1 PM', label: '1 PM' },
                    { id: '3 PM', label: '3 PM' },
                    { id: '6 PM', label: '6 PM' },
                    { id: '8 PM', label: '8 PM' },
                  ].map((opt) => {
                    const isChecked = slotFilter === opt.id;
                    return (
                      <label
                        key={opt.id}
                        onClick={() => setSlotFilter(opt.id as any)}
                        className="flex items-center gap-1.5 cursor-pointer group py-1 px-1 rounded-lg transition-all"
                      >
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                            isChecked
                              ? 'border-gold bg-black'
                              : 'border-neutral-600 bg-black group-hover:border-neutral-400'
                          }`}
                        >
                          {isChecked && <div className="w-2 h-2 rounded-full bg-gold-metallic" />}
                        </div>
                        <span
                          className={`text-xs font-black tracking-wide ${
                            isChecked ? 'text-gold' : 'text-neutral-300'
                          }`}
                        >
                          {opt.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* FULL VIEW EXTRA OPTIONS (Digit selector, Sub-options, and Number Check Box) */}
              {isFullView && (
                <div className="pt-3 border-t border-neutral-900 space-y-3.5 animate-drop-in">
                  
                  {/* Row 1: Digit Count Selector (*, 1, 2, 3) */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                      SELECT DIGIT TYPE
                    </span>
                    <div className="flex items-center justify-center gap-3">
                      {[
                        { id: 'ALL', label: '★' },
                        { id: '1', label: '1' },
                        { id: '2', label: '2' },
                        { id: '3', label: '3' },
                      ].map((item) => {
                        const isSelected =
                          digitFilter === 'ALL'
                            ? true
                            : digitFilter !== 'NONE' && digitFilter === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              if (item.id === 'ALL') {
                                if (digitFilter === 'ALL') {
                                  setDigitFilter('NONE');
                                  setSubOptionFilter('NONE');
                                } else {
                                  setDigitFilter('ALL');
                                  setSubOptionFilter('NONE');
                                }
                              } else {
                                if (digitFilter === item.id) {
                                  setDigitFilter('NONE');
                                  setSubOptionFilter('NONE');
                                } else {
                                  setDigitFilter(item.id as any);
                                  setSubOptionFilter('NONE');
                                }
                              }
                            }}
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full font-black text-sm flex items-center justify-center transition-all cursor-pointer shadow border ${
                              isSelected
                                ? 'bg-neutral-800 text-white border-2 border-white scale-105 shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                                : 'bg-black text-neutral-300 border-neutral-700 hover:border-neutral-500'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Row 2: Sub-options (Uniform white border styling) */}
                  <div className="flex items-center justify-center gap-2 pt-1">
                    {digitFilter === '1' && (
                      [
                        { id: 'ALL', label: '★' },
                        { id: 'A', label: 'A' },
                        { id: 'B', label: 'B' },
                        { id: 'C', label: 'C' },
                      ].map((opt) => {
                        const isSelected =
                          subOptionFilter === 'ALL'
                            ? true
                            : subOptionFilter !== 'NONE' && subOptionFilter === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => {
                              if (opt.id === 'ALL') {
                                setSubOptionFilter(subOptionFilter === 'ALL' ? 'NONE' : 'ALL');
                              } else {
                                setSubOptionFilter(subOptionFilter === opt.id ? 'NONE' : opt.id);
                              }
                            }}
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full font-black text-xs flex items-center justify-center border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-neutral-800 text-white border-2 border-white scale-105 shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                                : 'bg-black border-neutral-700 text-neutral-300 hover:border-neutral-500'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })
                    )}

                    {digitFilter === '2' && (
                      [
                        { id: 'ALL', label: '★' },
                        { id: 'AB', label: 'AB' },
                        { id: 'BC', label: 'BC' },
                        { id: 'AC', label: 'AC' },
                      ].map((opt) => {
                        const isSelected =
                          subOptionFilter === 'ALL'
                            ? true
                            : subOptionFilter !== 'NONE' && subOptionFilter === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => {
                              if (opt.id === 'ALL') {
                                setSubOptionFilter(subOptionFilter === 'ALL' ? 'NONE' : 'ALL');
                              } else {
                                setSubOptionFilter(subOptionFilter === opt.id ? 'NONE' : opt.id);
                              }
                            }}
                            className={`px-3.5 py-1.5 rounded-full font-black text-xs flex items-center justify-center border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-neutral-800 text-white border-2 border-white scale-105 shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                                : 'bg-black text-neutral-300 border-neutral-700 hover:border-neutral-500'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })
                    )}

                    {digitFilter === '3' && (
                      [
                        { id: 'ALL', label: '★' },
                        { id: 'SUPER', label: 'SUPER' },
                        { id: 'BOX', label: 'BOX' },
                      ].map((opt) => {
                        const isSelected =
                          subOptionFilter === 'ALL'
                            ? true
                            : subOptionFilter !== 'NONE' && subOptionFilter === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => {
                              if (opt.id === 'ALL') {
                                setSubOptionFilter(subOptionFilter === 'ALL' ? 'NONE' : 'ALL');
                              } else {
                                setSubOptionFilter(subOptionFilter === opt.id ? 'NONE' : opt.id);
                              }
                            }}
                            className={`px-3.5 py-1.5 rounded-full font-black text-xs uppercase flex items-center justify-center border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-neutral-800 text-white border-2 border-white scale-105 shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                                : 'bg-black text-neutral-300 border-neutral-700 hover:border-neutral-500'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })
                    )}

                    {(digitFilter === 'ALL' || digitFilter === 'NONE') && (
                      [
                        { id: 'ALL', label: '★' },
                      ].map((opt) => {
                        const isSelected = subOptionFilter === 'ALL';
                        return (
                          <button
                            key={opt.id}
                            onClick={() => setSubOptionFilter(subOptionFilter === 'ALL' ? 'NONE' : 'ALL')}
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full font-black text-xs flex items-center justify-center border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-neutral-800 text-white border-2 border-white shadow-[0_0_10px_rgba(255,255,255,0.3)] scale-105'
                                : 'bg-black text-neutral-300 border-neutral-700 hover:border-neutral-500'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Row 3: Number Search Box (Crisp White Border) */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                      SEARCH BY NUMBER
                    </span>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={3}
                        value={searchNumber}
                        onChange={(e) => setSearchNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="Number"
                        className="w-full bg-black border-2 border-white/90 focus:border-gold text-white font-mono font-black text-sm px-4 py-2.5 rounded-xl placeholder:text-neutral-400 outline-none transition-all shadow-inner"
                      />
                      {searchNumber && (
                        <button
                          onClick={() => setSearchNumber('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs font-bold"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* SHOW REPORT Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => setShowSalesDetails(true)}
                  className="w-full py-3.5 px-4 bg-gold-metallic hover:brightness-110 active:scale-[0.98] text-black font-black text-sm tracking-wider uppercase rounded-xl shadow-lg border border-gold-dark flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>SHOW REPORT</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ================= 3. WINNING REPORT SUB-VIEW (matching Image 1) ================= */}
        {activeSection === 'WINNING' && (
          <div className="space-y-5 animate-drop-in">
            
            {/* Winning Report Input Form Box */}
            <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-2xl shadow-xl space-y-5">
              
              {/* From Date Input Row */}
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => triggerDatePicker(winFromRef)}
                    className="relative flex-1 bg-black border border-neutral-700 [@media(hover:hover)]:hover:border-gold/60 rounded-xl px-4 py-2.5 cursor-pointer group transition-all block overflow-hidden shadow-inner"
                  >
                    <span className="text-[10px] sm:text-xs font-black text-neutral-400 uppercase tracking-wider block pointer-events-none">
                      From date
                    </span>
                    <span className="text-white font-black text-sm sm:text-base tracking-wide block mt-0.5 font-mono pointer-events-none">
                      {formatDateDisplay(winningFromDate)}
                    </span>
                    <input
                      ref={winFromRef}
                      type="date"
                      value={winningFromDate}
                      onChange={(e) => e.target.value && setWinningFromDate(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 full-date-input"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => triggerDatePicker(winFromRef)}
                    className="relative bg-neutral-900 border border-neutral-700 [@media(hover:hover)]:hover:border-gold/80 px-4 py-3.5 rounded-xl text-xs font-black uppercase text-white tracking-wider hover:bg-neutral-800 transition-all shrink-0 active:scale-95 shadow flex items-center justify-center select-none overflow-hidden cursor-pointer"
                  >
                    <span>CHANGE</span>
                  </button>
                </div>
              </div>

              {/* To Date Input Row */}
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => triggerDatePicker(winToRef)}
                    className="relative flex-1 bg-black border border-neutral-700 [@media(hover:hover)]:hover:border-gold/60 rounded-xl px-4 py-2.5 cursor-pointer group transition-all block overflow-hidden shadow-inner"
                  >
                    <span className="text-[10px] sm:text-xs font-black text-neutral-400 uppercase tracking-wider block pointer-events-none">
                      To date
                    </span>
                    <span className="text-white font-black text-sm sm:text-base tracking-wide block mt-0.5 font-mono pointer-events-none">
                      {formatDateDisplay(winningToDate)}
                    </span>
                    <input
                      ref={winToRef}
                      type="date"
                      value={winningToDate}
                      onChange={(e) => e.target.value && setWinningToDate(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 full-date-input"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => triggerDatePicker(winToRef)}
                    className="relative bg-neutral-900 border border-neutral-700 [@media(hover:hover)]:hover:border-gold/80 px-4 py-3.5 rounded-xl text-xs font-black uppercase text-white tracking-wider hover:bg-neutral-800 transition-all shrink-0 active:scale-95 shadow flex items-center justify-center select-none overflow-hidden cursor-pointer"
                  >
                    <span>CHANGE</span>
                  </button>
                </div>
              </div>

              {/* Full View Toggle Switch */}
              <div className="flex items-center justify-between pt-1 pb-1">
                <span className="text-xs sm:text-sm font-black text-neutral-300 tracking-wide">
                  Full View
                </span>
                <button
                  type="button"
                  onClick={() => setIsWinningFullView(!isWinningFullView)}
                  className={`w-12 h-6 rounded-full transition-colors p-0.5 relative cursor-pointer ${
                    isWinningFullView ? 'bg-gold-metallic' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-black shadow-md transition-transform ${
                      isWinningFullView ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Slot Filter Radio Options (All, 1pm, 3pm, 6pm, 8pm) */}
              <div className="pt-2 border-t border-neutral-900 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {[
                    { id: 'ALL', label: 'All' },
                    { id: '1 PM', label: '1 PM' },
                    { id: '3 PM', label: '3 PM' },
                    { id: '6 PM', label: '6 PM' },
                    { id: '8 PM', label: '8 PM' },
                  ].map((opt) => {
                    const isChecked = winningSlotFilter === opt.id;
                    return (
                      <label
                        key={opt.id}
                        onClick={() => setWinningSlotFilter(opt.id as any)}
                        className="flex items-center gap-1.5 cursor-pointer group py-1 px-1 rounded-lg transition-all"
                      >
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                            isChecked
                              ? 'border-gold bg-black'
                              : 'border-neutral-600 bg-black group-hover:border-neutral-400'
                          }`}
                        >
                          {isChecked && <div className="w-2 h-2 rounded-full bg-gold-metallic" />}
                        </div>
                        <span
                          className={`text-xs font-black tracking-wide ${
                            isChecked ? 'text-gold' : 'text-neutral-300'
                          }`}
                        >
                          {opt.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* FULL VIEW EXTRA OPTIONS FOR WINNING REPORT */}
              {isWinningFullView && (
                <div className="pt-3 border-t border-neutral-900 space-y-3.5 animate-drop-in">
                  
                  {/* Row 1: Digit Count Selector (*, 1, 2, 3) */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                      SELECT DIGIT TYPE
                    </span>
                    <div className="flex items-center justify-center gap-3">
                      {[
                        { id: 'ALL', label: '★' },
                        { id: '1', label: '1' },
                        { id: '2', label: '2' },
                        { id: '3', label: '3' },
                      ].map((item) => {
                        const isSelected =
                          winningDigitFilter === 'ALL'
                            ? true
                            : winningDigitFilter !== 'NONE' && winningDigitFilter === item.id;
                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => {
                              if (item.id === 'ALL') {
                                if (winningDigitFilter === 'ALL') {
                                  setWinningDigitFilter('NONE');
                                  setWinningSubOptionFilter('NONE');
                                } else {
                                  setWinningDigitFilter('ALL');
                                  setWinningSubOptionFilter('NONE');
                                }
                              } else {
                                if (winningDigitFilter === item.id) {
                                  setWinningDigitFilter('NONE');
                                  setWinningSubOptionFilter('NONE');
                                } else {
                                  setWinningDigitFilter(item.id as any);
                                  setWinningSubOptionFilter('NONE');
                                }
                              }
                            }}
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full font-black text-sm flex items-center justify-center transition-all cursor-pointer shadow border ${
                              isSelected
                                ? 'bg-neutral-800 text-white border-2 border-white scale-105 shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                                : 'bg-black text-neutral-300 border-neutral-700 hover:border-neutral-500'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Row 2: Sub-options (Uniform white border styling) */}
                  <div className="flex items-center justify-center gap-2 pt-1">
                    {winningDigitFilter === '1' && (
                      [
                        { id: 'ALL', label: '★' },
                        { id: 'A', label: 'A' },
                        { id: 'B', label: 'B' },
                        { id: 'C', label: 'C' },
                      ].map((opt) => {
                        const isSelected =
                          winningSubOptionFilter === 'ALL'
                            ? true
                            : winningSubOptionFilter !== 'NONE' && winningSubOptionFilter === opt.id;
                        return (
                          <button
                            type="button"
                            key={opt.id}
                            onClick={() => {
                              if (opt.id === 'ALL') {
                                setWinningSubOptionFilter(winningSubOptionFilter === 'ALL' ? 'NONE' : 'ALL');
                              } else {
                                setWinningSubOptionFilter(winningSubOptionFilter === opt.id ? 'NONE' : opt.id);
                              }
                            }}
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full font-black text-xs flex items-center justify-center border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-neutral-800 text-white border-2 border-white scale-105 shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                                : 'bg-black border-neutral-700 text-neutral-300 hover:border-neutral-500'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })
                    )}

                    {winningDigitFilter === '2' && (
                      [
                        { id: 'ALL', label: '★' },
                        { id: 'AB', label: 'AB' },
                        { id: 'BC', label: 'BC' },
                        { id: 'AC', label: 'AC' },
                      ].map((opt) => {
                        const isSelected =
                          winningSubOptionFilter === 'ALL'
                            ? true
                            : winningSubOptionFilter !== 'NONE' && winningSubOptionFilter === opt.id;
                        return (
                          <button
                            type="button"
                            key={opt.id}
                            onClick={() => {
                              if (opt.id === 'ALL') {
                                setWinningSubOptionFilter(winningSubOptionFilter === 'ALL' ? 'NONE' : 'ALL');
                              } else {
                                setWinningSubOptionFilter(winningSubOptionFilter === opt.id ? 'NONE' : opt.id);
                              }
                            }}
                            className={`px-3.5 py-1.5 rounded-full font-black text-xs flex items-center justify-center border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-neutral-800 text-white border-2 border-white scale-105 shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                                : 'bg-black text-neutral-300 border-neutral-700 hover:border-neutral-500'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })
                    )}

                    {winningDigitFilter === '3' && (
                      [
                        { id: 'ALL', label: '★' },
                        { id: 'SUPER', label: 'SUPER' },
                        { id: 'BOX', label: 'BOX' },
                      ].map((opt) => {
                        const isSelected =
                          winningSubOptionFilter === 'ALL'
                            ? true
                            : winningSubOptionFilter !== 'NONE' && winningSubOptionFilter === opt.id;
                        return (
                          <button
                            type="button"
                            key={opt.id}
                            onClick={() => {
                              if (opt.id === 'ALL') {
                                setWinningSubOptionFilter(winningSubOptionFilter === 'ALL' ? 'NONE' : 'ALL');
                              } else {
                                setWinningSubOptionFilter(winningSubOptionFilter === opt.id ? 'NONE' : opt.id);
                              }
                            }}
                            className={`px-3.5 py-1.5 rounded-full font-black text-xs uppercase flex items-center justify-center border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-neutral-800 text-white border-2 border-white scale-105 shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                                : 'bg-black text-neutral-300 border-neutral-700 hover:border-neutral-500'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })
                    )}

                    {(winningDigitFilter === 'ALL' || winningDigitFilter === 'NONE') && (
                      [
                        { id: 'ALL', label: '★' },
                      ].map((opt) => {
                        const isSelected = winningSubOptionFilter === 'ALL';
                        return (
                          <button
                            type="button"
                            key={opt.id}
                            onClick={() => setWinningSubOptionFilter(winningSubOptionFilter === 'ALL' ? 'NONE' : 'ALL')}
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full font-black text-xs flex items-center justify-center border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-neutral-800 text-white border-2 border-white shadow-[0_0_10px_rgba(255,255,255,0.3)] scale-105'
                                : 'bg-black text-neutral-300 border-neutral-700 hover:border-neutral-500'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Row 3: Number Search Box (Crisp White Border) */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                      SEARCH BY NUMBER
                    </span>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={3}
                        value={winningSearchNumber}
                        onChange={(e) => setWinningSearchNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="Number"
                        className="w-full bg-black border-2 border-white/90 focus:border-gold text-white font-mono font-black text-sm px-4 py-2.5 rounded-xl placeholder:text-neutral-400 outline-none transition-all shadow-inner"
                      />
                      {winningSearchNumber && (
                        <button
                          type="button"
                          onClick={() => setWinningSearchNumber('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs font-bold"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* SHOW REPORT Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => setShowWinningDetails(true)}
                  className="w-full py-3.5 px-4 bg-gold-metallic hover:brightness-110 active:scale-[0.98] text-black font-black text-sm tracking-wider uppercase rounded-xl shadow-lg border border-gold-dark flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>SHOW REPORT</span>
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ================= 4. DAILY REPORT SUB-VIEW (matching Image 1) ================= */}
        {activeSection === 'DAILY' && (
          <div className="space-y-5 animate-drop-in">
            {/* Daily Report Input Form Box */}
            <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-2xl shadow-xl space-y-5 font-sans">
                     {/* From Date Input Row */}
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => triggerDatePicker(dailyFromRef)}
                    className="relative flex-1 bg-black border border-neutral-700 [@media(hover:hover)]:hover:border-gold/60 rounded-xl px-4 py-2.5 cursor-pointer group transition-all block overflow-hidden shadow-inner"
                  >
                    <span className="text-[10px] sm:text-xs font-black text-neutral-400 uppercase tracking-wider block pointer-events-none">
                      FROM DATE
                    </span>
                    <span className="text-white font-black text-sm sm:text-base tracking-wide block mt-0.5 font-mono pointer-events-none">
                      {formatDateDisplay(dailyFromDate)}
                    </span>
                    <input
                      ref={dailyFromRef}
                      type="date"
                      value={dailyFromDate}
                      onChange={(e) => e.target.value && setDailyFromDate(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 full-date-input"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => triggerDatePicker(dailyFromRef)}
                    className="relative bg-neutral-900 border border-neutral-700 [@media(hover:hover)]:hover:border-gold/80 px-4 py-3.5 rounded-xl text-xs font-black uppercase text-white tracking-wider hover:bg-neutral-800 transition-all shrink-0 active:scale-95 shadow flex items-center justify-center select-none overflow-hidden cursor-pointer"
                  >
                    <span>CHANGE</span>
                  </button>
                </div>
              </div>

              {/* To Date Input Row */}
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => triggerDatePicker(dailyToRef)}
                    className="relative flex-1 bg-black border border-neutral-700 [@media(hover:hover)]:hover:border-gold/60 rounded-xl px-4 py-2.5 cursor-pointer group transition-all block overflow-hidden shadow-inner"
                  >
                    <span className="text-[10px] sm:text-xs font-black text-neutral-400 uppercase tracking-wider block pointer-events-none">
                      TO DATE
                    </span>
                    <span className="text-white font-black text-sm sm:text-base tracking-wide block mt-0.5 font-mono pointer-events-none">
                      {formatDateDisplay(dailyToDate)}
                    </span>
                    <input
                      ref={dailyToRef}
                      type="date"
                      value={dailyToDate}
                      onChange={(e) => e.target.value && setDailyToDate(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 full-date-input"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => triggerDatePicker(dailyToRef)}
                    className="relative bg-neutral-900 border border-neutral-700 [@media(hover:hover)]:hover:border-gold/80 px-4 py-3.5 rounded-xl text-xs font-black uppercase text-white tracking-wider hover:bg-neutral-800 transition-all shrink-0 active:scale-95 shadow flex items-center justify-center select-none overflow-hidden cursor-pointer"
                  >
                    <span>CHANGE</span>
                  </button>
                </div>
              </div>

              {/* Day Detail & Game Detail Checkbox Options (Mutually Exclusive) */}
              <div className="pt-2 border-t border-neutral-900 flex items-center justify-start gap-8">
                {/* Day Detail Checkbox */}
                <label
                  onClick={() => {
                    setIsDayDetail(true);
                    setIsGameDetail(false);
                    setActiveDailyOverlayTab('DAY');
                  }}
                  className="flex items-center gap-2.5 cursor-pointer group select-none"
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      isDayDetail
                        ? 'border-gold bg-gold text-black shadow-[0_0_10px_rgba(212,175,55,0.4)]'
                        : 'border-neutral-600 bg-black group-hover:border-neutral-400'
                    }`}
                  >
                    {isDayDetail && (
                      <svg className="w-3.5 h-3.5 fill-current stroke-current stroke-2" viewBox="0 0 24 24">
                        <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-xs sm:text-sm font-black tracking-wide ${isDayDetail ? 'text-gold' : 'text-neutral-300'}`}>
                    Day Detail
                  </span>
                </label>

                {/* Game Detail Checkbox */}
                <label
                  onClick={() => {
                    setIsGameDetail(true);
                    setIsDayDetail(false);
                    setActiveDailyOverlayTab('GAME');
                  }}
                  className="flex items-center gap-2.5 cursor-pointer group select-none"
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      isGameDetail
                        ? 'border-gold bg-gold text-black shadow-[0_0_10px_rgba(212,175,55,0.4)]'
                        : 'border-neutral-600 bg-black group-hover:border-neutral-400'
                    }`}
                  >
                    {isGameDetail && (
                      <svg className="w-3.5 h-3.5 fill-current stroke-current stroke-2" viewBox="0 0 24 24">
                        <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-xs sm:text-sm font-black tracking-wide ${isGameDetail ? 'text-gold' : 'text-neutral-300'}`}>
                    Game Detail
                  </span>
                </label>
              </div>

              {/* Slot Filter Radio Options (All, 1 PM, 3 PM, 6 PM, 8 PM) */}
              <div className="pt-2 border-t border-neutral-900 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {[
                    { id: 'ALL', label: 'All' },
                    { id: '1 PM', label: '1 PM' },
                    { id: '3 PM', label: '3 PM' },
                    { id: '6 PM', label: '6 PM' },
                    { id: '8 PM', label: '8 PM' },
                  ].map((opt) => {
                    const isChecked = dailySlotFilter === opt.id;
                    return (
                      <label
                        key={opt.id}
                        onClick={() => setDailySlotFilter(opt.id as any)}
                        className="flex items-center gap-1.5 cursor-pointer group py-1 px-1 rounded-lg transition-all"
                      >
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                            isChecked
                              ? 'border-gold bg-black'
                              : 'border-neutral-600 bg-black group-hover:border-neutral-400'
                          }`}
                        >
                          {isChecked && <div className="w-2 h-2 rounded-full bg-gold-metallic" />}
                        </div>
                        <span
                          className={`text-xs font-black tracking-wide ${
                            isChecked ? 'text-gold' : 'text-neutral-300'
                          }`}
                        >
                          {opt.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* SHOW REPORT Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!isDayDetail && !isGameDetail) {
                      setIsDayDetail(true);
                      setActiveDailyOverlayTab('DAY');
                    } else if (isGameDetail && !isDayDetail) {
                      setActiveDailyOverlayTab('GAME');
                    } else {
                      setActiveDailyOverlayTab('DAY');
                    }
                    setShowDailyReportOverlay(true);
                  }}
                  className="w-full py-3.5 px-4 bg-gold-metallic hover:brightness-110 active:scale-[0.98] text-black font-black text-sm tracking-wider uppercase rounded-xl shadow-lg border border-gold-dark flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>SHOW REPORT</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ================= DEDICATED FULL-SCREEN OVERLAY PAGE FOR SALES REPORT OUTPUT ================= */}
      {showSalesDetails && (
        <div className="fixed inset-0 bg-black text-white z-50 flex flex-col justify-start overflow-y-auto animate-drop-in font-sans">
          
          {/* Header Banner matching App Theme */}
          <HeaderBanner
            title="SALES REPORT"
            showBack={true}
            onBackClick={() => {
              resetDatesToCurrent();
              setShowSalesDetails(false);
            }}
          />

          <div className="max-w-md mx-auto w-full px-4 sm:px-6 py-6 space-y-4">
            
            {/* Gold Sub-header Metric Banner matching App Theme with bold text, larger size, and no space before colon */}
            <div className="bg-gold-metallic p-4 rounded-xl text-black shadow-lg border border-gold-dark space-y-2.5 font-mono">
              <div className="flex items-center justify-between font-black text-lg sm:text-xl uppercase tracking-wider">
                <span>SALES REPORT &nbsp;( {slotFilter === 'ALL' ? 'ALL' : slotFilter} )</span>
              </div>
              <div className="flex items-center justify-between text-base sm:text-lg font-black pt-2 border-t border-black/30">
                <span>Total Count: {totalDetailCount}</span>
                <span>Grand Total: {grandDetailTotal}</span>
              </div>
            </div>

            {/* Number Search Indicator */}
            {searchNumber.trim() && (
              <div className="bg-neutral-900 border border-gold/60 p-3 rounded-xl flex items-center justify-between text-xs font-mono shadow-md">
                <span className="text-neutral-300">
                  SEARCHING NUMBER: <strong className="text-gold font-bold text-sm">"{searchNumber}"</strong>
                </span>
                <span className="text-emerald-400 font-extrabold">
                  {displayTickets.length} Bill(s) Matched
                </span>
              </div>
            )}

            {/* 1. WHEN FULL VIEW IS NOT ENABLED (Default White Border, Gold Border when Clicked) */}
            {!isFullView && (
              <div className="space-y-3">
                {displayTickets.length === 0 ? (
                  <div className="bg-neutral-950 p-6 rounded-2xl border-2 border-white/90 text-center font-mono text-xs font-bold text-neutral-400">
                    No bills found for the selected filter.
                  </div>
                ) : (
                  displayTickets.map((tkt) => {
                    const isSelected = selectedCardId === tkt.id;
                    return (
                      <div
                        key={tkt.id}
                        onClick={() => setSelectedCardId(isSelected ? null : tkt.id)}
                        onMouseDown={() => startLongPress(tkt)}
                        onMouseUp={cancelLongPress}
                        onMouseLeave={cancelLongPress}
                        onTouchStart={() => startLongPress(tkt)}
                        onTouchEnd={cancelLongPress}
                        className={`bg-neutral-950 text-white rounded-2xl p-4 shadow-xl border-2 transition-all cursor-pointer active:scale-[0.99] space-y-2 font-mono ${
                          isSelected
                            ? 'border-gold shadow-[0_0_15px_rgba(212,175,55,0.5)]'
                            : 'border-white/90 hover:border-gold'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-gold text-sm">BILL ID: <strong className="text-white font-mono">{tkt.id}</strong></span>
                          <span className="text-gold text-sm font-black font-mono">TOTAL: <strong className="text-amber-400 font-mono text-base">{tkt.filteredTotalAmount}</strong></span>
                        </div>

                        <div className="text-xs font-bold text-neutral-300">
                          <span>COUNT: <strong className="text-white font-mono text-sm">{tkt.filteredTotalCount}</strong></span>
                        </div>

                        <div className="text-[11px] text-neutral-400 font-semibold pt-1 border-t border-neutral-850 flex items-center justify-between">
                          <span>CUSTOMER: <strong className="text-neutral-200 font-bold">{(tkt as any).customerName || 'Customer'}</strong></span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* 2. WHEN FULL VIEW IS ENABLED (Default White Border, Gold Border when Clicked) */}
            {isFullView && (
              <div className="space-y-3">
                {/* Table Header Row */}
                <div className="bg-neutral-900 text-gold font-black text-xs px-4 py-2.5 rounded-xl flex items-center justify-between shadow-md border border-neutral-800">
                  <div className="flex items-center gap-7 font-mono">
                    <span>GAME</span>
                    <span>NUM</span>
                    <span>CNT</span>
                  </div>
                  <span className="font-mono">T.AMT</span>
                </div>

                {displayTickets.length === 0 ? (
                  <div className="bg-neutral-950 p-6 rounded-2xl border-2 border-white/90 text-center font-mono text-xs font-bold text-neutral-400">
                    No bills found matching selected digit/sub-option filter.
                  </div>
                ) : (
                  displayTickets.map((tkt) => {
                    const isSelected = selectedCardId === tkt.id;
                    return (
                      <div
                        key={tkt.id}
                        onClick={() => setSelectedCardId(isSelected ? null : tkt.id)}
                        onMouseDown={() => startLongPress(tkt)}
                        onMouseUp={cancelLongPress}
                        onMouseLeave={cancelLongPress}
                        onTouchStart={() => startLongPress(tkt)}
                        onTouchEnd={cancelLongPress}
                        className={`bg-neutral-950 rounded-2xl overflow-hidden shadow-xl border-2 transition-all cursor-pointer group active:scale-[0.99] ${
                          isSelected
                            ? 'border-gold shadow-[0_0_15px_rgba(212,175,55,0.5)]'
                            : 'border-white/90 hover:border-gold'
                        }`}
                      >
                        {/* Card Top Header */}
                        <div className="bg-[#1e1e1e] p-3 text-xs border-b border-neutral-800 space-y-1">
                          <div className="flex items-center justify-between font-mono">
                            <span className="font-black text-white text-sm">BILL ID: <strong className="text-gold font-bold">{tkt.id}</strong></span>
                            <span className="font-black text-white">TOTAL: <strong className="text-gold text-sm font-mono">{tkt.filteredTotalAmount}</strong></span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                            <span>COUNT: <strong className="text-white font-bold">{tkt.filteredTotalCount}</strong></span>
                            <span>{tkt.placedAt}</span>
                          </div>
                          <div className="text-[11px] text-neutral-400 font-mono flex items-center justify-between pt-0.5">
                            <span>CUSTOMER: <strong className="text-neutral-200">{(tkt as any).customerName || 'Customer'}</strong></span>
                          </div>
                        </div>

                        {/* Card Items Table */}
                        <div className="bg-white text-black font-extrabold text-xs divide-y divide-neutral-200">
                          {tkt.displayItems.map((item: any, idx: number) => {
                            const isMatch = searchNumber.trim() && item.number.includes(searchNumber.trim());
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
                                  <span className="font-black uppercase w-12 text-neutral-900">{item.type}</span>
                                  <span className={`font-black tracking-wider w-10 ${isMatch ? 'text-amber-950 underline font-extrabold scale-105' : 'text-neutral-900'}`}>{item.number}</span>
                                  <span className="font-black text-neutral-800">{item.count}</span>
                                </div>
                                <span className="font-black text-neutral-900 font-mono">{item.totalAmount}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* ================= DEDICATED FULL-SCREEN OVERLAY PAGE FOR WINNING REPORT OUTPUT (matching Image 2) ================= */}
      {showWinningDetails && (
        <div className="fixed inset-0 bg-black text-white z-50 flex flex-col justify-start overflow-y-auto animate-drop-in font-sans">
          
          {/* Header Banner matching App Theme */}
          <HeaderBanner
            title="WINNING REPORT"
            showBack={true}
            onBackClick={() => {
              resetDatesToCurrent();
              setShowWinningDetails(false);
            }}
          />

          <div className="max-w-md mx-auto w-full px-4 sm:px-6 py-6 space-y-4">
            
            {/* Gold Sub-header Metric Banner matching Image 2 */}
            <div className="bg-gold-metallic p-4 rounded-xl text-black shadow-lg border border-gold-dark space-y-2.5 font-mono">
              <div className="flex items-center justify-between font-black text-lg sm:text-xl uppercase tracking-wider">
                <span>WINNING REPORT &nbsp;( {winningSlotFilter === 'ALL' ? 'ALL' : winningSlotFilter} )</span>
              </div>
              <div className="flex items-center justify-between text-base sm:text-lg font-black pt-2 border-t border-black/30">
                <span>Total Count: {winningTotalCount}</span>
                <span>Total: {winningGrandTotal}</span>
              </div>
            </div>

            {/* Number Search Indicator */}
            {winningSearchNumber.trim() && (
              <div className="bg-neutral-900 border border-gold/60 p-3 rounded-xl flex items-center justify-between text-xs font-mono shadow-md">
                <span className="text-neutral-300">
                  SEARCHING NUMBER: <strong className="text-gold font-bold text-sm">"{winningSearchNumber}"</strong>
                </span>
                <span className="text-emerald-400 font-extrabold">
                  {displayWinningCategories.length} Category(s) Matched
                </span>
              </div>
            )}


            {/* Grouped Category Winning Breakdown (matching Image 2 with Color Boxes) */}
            {displayWinningCategories.length === 0 ? (
              <div className="bg-neutral-950 p-6 rounded-2xl border-2 border-white/90 text-center font-mono text-xs font-bold text-neutral-400">
                No winning tickets found for the selected filter.
              </div>
            ) : (
              displayWinningCategories.map((group) => (
                <div key={group.category} className="space-y-3">
                  
                  {/* Category Dark Section Header Bar */}
                  <div className="bg-gradient-to-r from-neutral-900 via-[#3a2a07] to-neutral-900 border border-gold/40 text-gold font-black text-sm tracking-widest uppercase py-2.5 px-4 rounded-xl text-center shadow-[0_0_15px_rgba(212,175,55,0.15)] font-mono">
                    {group.category}
                  </div>

                  {/* Category Cards List (Color-styled boxes for each winner tier) */}
                  <div className="space-y-3">
                    {group.cards.map((card: any) => {
                      const isSelected = selectedWinningCardId === card.id;
                      const theme = getWinnerCardTheme(card.prize);
                      return (
                        <div
                          key={card.id}
                          onClick={() => setSelectedWinningCardId(isSelected ? null : card.id)}
                          className={`${theme.cardBg} rounded-2xl overflow-hidden shadow-xl border-2 transition-all cursor-pointer font-mono active:scale-[0.99] ${
                            isSelected
                              ? 'border-gold shadow-[0_0_20px_rgba(212,175,55,0.6)] scale-[1.01]'
                              : `${theme.cardBorder} hover:scale-[1.005]`
                          }`}
                        >
                          {/* Card Prize Header Bar with distinct color header */}
                          <div className={`${theme.headerBg} px-4 py-3 font-mono flex items-center justify-between`}>
                            <span className={`px-2.5 py-1 rounded-lg font-black text-xs uppercase tracking-wider ${theme.badge}`}>
                              {card.prize}
                            </span>
                            <div className="text-right">
                              <span className="text-neutral-300 text-xs font-bold uppercase">NUMBER:</span>
                              <span className={`font-black text-base font-mono tracking-wider ml-1.5 ${theme.numberText}`}>{card.number}</span>
                            </div>
                          </div>

                          {/* Card Bottom Row with distinct text colors */}
                          <div className="bg-black/90 px-4 py-3 flex items-center justify-between font-mono text-xs border-t border-white/5">
                            <span className="text-neutral-300">
                              COUNT: <strong className="text-white font-black text-sm ml-1 font-mono">{card.count}</strong>
                            </span>
                            <span className="text-gold font-bold">
                              TOTAL: <strong className={`font-black text-base ml-1 font-mono ${theme.totalText}`}>₹{card.total}</strong>
                            </span>
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

      {/* ================= EDIT, DELETE BILL SINGLE VIEW (In Signature Dark Gold Web Theme) ================= */}
      {selectedSingleTicket && (
        <div className="fixed inset-0 bg-black text-white z-50 flex flex-col justify-start overflow-y-auto animate-drop-in font-sans">
          
          {/* Header Banner matching App Theme */}
          <HeaderBanner
            title="DELETE BILL"
            showBack={true}
            onBackClick={() => setSelectedSingleTicket(null)}
          />

          <div className="max-w-md mx-auto w-full px-4 sm:px-6 py-6 space-y-4">
            
            {/* Bill Card Container in Dark Luxury Gold Theme */}
            <div className="bg-neutral-950 border border-gold/40 rounded-2xl overflow-hidden shadow-2xl space-y-0">
              
              {/* Bill ID Header Bar (Clean layout without top delete button) */}
              <div className="bg-neutral-900 border-b border-neutral-800 p-3.5 flex items-center justify-between font-mono">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-bold">BILL ID</span>
                  <span className="text-gold font-black text-base">#{selectedSingleTicket.id}</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-bold">DATE &amp; TIME</span>
                  <span className="text-white font-extrabold text-xs">{selectedSingleTicket.placedAt}</span>
                </div>
              </div>

              {/* Customer & Slot Info Bar */}
              <div className="bg-black/60 px-4 py-2.5 border-b border-neutral-850 flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-300">Slot <strong className="text-gold font-bold">{selectedSingleTicket.gameSlot}</strong></span>
                <span className="text-neutral-300">Customer <strong className="text-white font-bold">{(selectedSingleTicket as any).customerName || 'Customer'}</strong></span>
              </div>

              {/* Table Column Headers Bar */}
              <div className="bg-neutral-900/90 text-gold font-mono text-xs font-black px-4 py-2.5 flex items-center justify-between border-b border-neutral-800 uppercase">
                <div className="flex items-center gap-10">
                  <span className="w-16">GAME</span>
                  <span className="w-16">NUM</span>
                  <span>COUNT</span>
                </div>
                <span>AMOUNT</span>
              </div>

              {/* Table Rows in Dark Theme */}
              <div className="divide-y divide-neutral-850 font-mono text-xs font-bold">
                {selectedSingleTicket.items.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between px-4 py-3.5 ${
                      idx % 2 === 1 ? 'bg-neutral-900/40' : 'bg-black'
                    }`}
                  >
                    <div className="flex items-center gap-10">
                      <span className="w-16 uppercase text-gold font-black">{item.type}</span>
                      <span className="w-16 text-white font-black tracking-wider text-sm">{item.number}</span>
                      <span className="text-rose-400 font-black text-sm">{item.count}</span>
                    </div>
                    <span className="text-white font-mono font-bold">₹{item.totalAmount}</span>
                  </div>
                ))}
              </div>

              {/* Bill Total Footer Bar with ONLY Bottom DELETE Button */}
              <div className="bg-neutral-900 border-t border-neutral-800 p-3.5 flex items-center justify-between font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 uppercase font-black">TOTAL AMOUNT</span>
                  <span className="text-gold font-black text-base">₹{selectedSingleTicket.totalAmount}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(selectedSingleTicket.id)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer shadow border border-rose-500"
                >
                  <Trash2 className="w-4 h-4 stroke-[2.5]" />
                  <span>DELETE</span>
                </button>
              </div>

            </div>

          </div>

          {/* DELETE PERMISSION CONFIRMATION DIALOG MODAL */}
          {confirmDeleteId && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-neutral-950 border-2 border-rose-600 rounded-2xl max-w-xs w-full p-5 shadow-2xl space-y-4 text-center animate-drop-in">
                <div className="w-12 h-12 rounded-full bg-rose-950 text-rose-500 border border-rose-800 flex items-center justify-center mx-auto shadow-inner">
                  <Trash2 className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-black text-white text-base uppercase">DELETE BILL PERMISSION</h4>
                  <p className="text-xs text-neutral-400 mt-1 font-mono">
                    Are you sure you want to delete Bill ID <strong className="text-gold">#{confirmDeleteId}</strong> completely?
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="flex-1 py-2.5 bg-neutral-900 text-neutral-300 font-bold text-xs rounded-xl border border-neutral-700 hover:text-white cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={() => {
                      setDeletedTicketIds((prev) => [...prev, confirmDeleteId]);
                      setConfirmDeleteId(null);
                      setSelectedSingleTicket(null);
                    }}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase rounded-xl shadow cursor-pointer active:scale-95 transition-all"
                  >
                    YES, DELETE
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= DEDICATED FULL-SCREEN OVERLAY PAGE FOR DAILY REPORT (matching Image 3 & Image 4) ================= */}
      {showDailyReportOverlay && (
        <div className="fixed inset-0 bg-black text-white z-50 flex flex-col justify-start overflow-y-auto animate-drop-in font-sans">
          {/* Header Banner matching App Theme */}
          <HeaderBanner
            title="DAILY REPORT"
            showBack={true}
            onBackClick={() => {
              resetDatesToCurrent();
              setShowDailyReportOverlay(false);
            }}
          />

          <div className="max-w-md mx-auto w-full px-3 sm:px-4 py-4 space-y-4">
            
            {/* If both Day Detail & Game Detail are selected, show a tab switcher */}
            {isDayDetail && isGameDetail && (
              <div className="flex bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs font-black">
                <button
                  onClick={() => setActiveDailyOverlayTab('DAY')}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                    activeDailyOverlayTab === 'DAY'
                      ? 'bg-gold-metallic text-black shadow font-black'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Day Detail
                </button>
                <button
                  onClick={() => setActiveDailyOverlayTab('GAME')}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                    activeDailyOverlayTab === 'GAME'
                      ? 'bg-gold-metallic text-black shadow font-black'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Game Detail
                </button>
              </div>
            )}

            {/* Dark Gold Header Metric Card matching App Design */}
            <div className="bg-gradient-to-b from-neutral-900 via-neutral-950 to-black border-2 border-gold/60 rounded-2xl p-4 text-white shadow-[0_0_20px_rgba(212,175,55,0.15)] space-y-2.5 font-mono">
              <div className="font-black text-base sm:text-lg uppercase tracking-wider text-gold flex items-center justify-between">
                <span>DAILY REPORT &nbsp; ( {dailySlotFilter} )</span>
              </div>
              <div className="text-xs sm:text-sm font-bold text-neutral-300 flex items-center gap-3">
                <span className="text-gold font-black">DATE</span>
                <span className="font-mono tracking-wide text-white">
                  {formatDateDisplay(dailyFromDate)} &nbsp;&nbsp; to &nbsp;&nbsp; {formatDateDisplay(dailyToDate)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm font-black pt-2 border-t border-neutral-800">
                <div className="flex items-center gap-6">
                  <span>
                    Total:{' '}
                    <strong className="font-mono text-gold text-sm sm:text-base">
                      {currentDailyNetTotal}
                    </strong>
                  </span>
                  <span>
                    Sale:{' '}
                    <strong className="font-mono text-white text-sm sm:text-base">
                      {currentDailyTotalSale}
                    </strong>
                  </span>
                </div>
                <div>
                  <span>
                    Prize:{' '}
                    <strong className="font-mono text-rose-400 text-sm sm:text-base">
                      {currentDailyTotalPrize}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* 1. DAY DETAIL TABLE (Our Signature Dark Gold Theme) */}
            {activeDailyOverlayTab === 'DAY' && (
              <div className="w-full border-2 border-gold/60 rounded-2xl overflow-hidden bg-neutral-950 text-white shadow-[0_0_25px_rgba(212,175,55,0.12)] font-mono">
                {/* Table Header Bar */}
                <div className="grid grid-cols-4 bg-gradient-to-r from-neutral-900 via-[#3a2a07] to-neutral-900 border-b border-gold/40 font-black py-3 px-2 text-center uppercase tracking-wider text-gold text-xs sm:text-sm shadow-inner">
                  <span className="text-center">NAME</span>
                  <span className="text-center">SALE</span>
                  <span className="text-center">PRIZE</span>
                  <span className="text-center">TOTAL</span>
                </div>

                {/* Table Rows dynamically filtered by Date */}
                <div className="divide-y divide-neutral-850 font-mono">
                  {filteredDailyRows.map((row, idx) => {
                    const rowTotal = row.sale - row.prize;
                    const customerDisplayName = currentUser?.name || currentUser?.username || 'DEMO PLAYER';
                    const isNegative = rowTotal < 0;
                    return (
                      <div
                        key={idx}
                        className="grid grid-cols-4 items-center px-2 py-3 text-center even:bg-neutral-900/40 odd:bg-black hover:bg-neutral-850/80 transition-colors"
                      >
                        {/* NAME Column: Date on top, Customer name below */}
                        <div className="flex flex-col items-center justify-center text-[10px] sm:text-xs leading-tight">
                          <span className="text-white font-bold">{row.date}</span>
                          <span className="font-black uppercase tracking-wider text-gold text-[10px] sm:text-[11px] mt-0.5">
                            {customerDisplayName}
                          </span>
                        </div>

                        {/* SALE Column (Bold white font) */}
                        <div className="text-xs sm:text-sm font-black text-neutral-100 font-mono flex items-center justify-center">
                          {row.sale}
                        </div>

                        {/* PRIZE Column (Rose / Coral font) */}
                        <div className="text-xs sm:text-sm font-black text-rose-400 font-mono flex items-center justify-center">
                          {row.prize}
                        </div>

                        {/* TOTAL Column (Sky Blue or Rose if negative) */}
                        <div className={`text-xs sm:text-sm font-black font-mono flex items-center justify-center ${isNegative ? 'text-rose-400' : 'text-sky-400'}`}>
                          {rowTotal}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. GAME DETAIL TABLE (Our Signature Dark Gold Theme) */}
            {activeDailyOverlayTab === 'GAME' && (
              <div className="w-full border-2 border-gold/60 rounded-2xl overflow-hidden bg-neutral-950 text-white shadow-[0_0_25px_rgba(212,175,55,0.12)] font-mono">
                {/* Table Header Bar */}
                <div className="grid grid-cols-4 bg-gradient-to-r from-neutral-900 via-[#3a2a07] to-neutral-900 border-b border-gold/40 font-black py-3 px-2 text-center uppercase tracking-wider text-gold text-xs sm:text-sm shadow-inner">
                  <span className="text-center">NAME</span>
                  <span className="text-center">SALE</span>
                  <span className="text-center">PRIZE</span>
                  <span className="text-center">TOTAL</span>
                </div>

                {/* Table Rows for 1 PM, 3 PM, 6 PM, 8 PM (Filtered by selected slot) */}
                <div className="divide-y divide-neutral-850 font-mono">
                  {filteredGameRows.map((row, idx) => {
                    const rowTotal = row.sale - row.prize;
                    const isNegative = rowTotal < 0;
                    return (
                      <div
                        key={idx}
                        className="grid grid-cols-4 items-center px-2 py-3.5 text-center even:bg-neutral-900/40 odd:bg-black hover:bg-neutral-850/80 transition-colors"
                      >
                        {/* NAME Column: Clean gold slot text */}
                        <div className="text-gold font-black text-xs sm:text-sm flex items-center justify-center uppercase tracking-wider">
                          {row.slotName}
                        </div>

                        {/* SALE Column (Bold white font) */}
                        <div className="text-xs sm:text-sm font-black text-neutral-100 font-mono flex items-center justify-center">
                          {row.sale}
                        </div>

                        {/* PRIZE Column (Rose / Coral font) */}
                        <div className="text-xs sm:text-sm font-black text-rose-400 font-mono flex items-center justify-center">
                          {row.prize}
                        </div>

                        {/* TOTAL Column (Sky Blue or Rose if negative) */}
                        <div className={`text-xs sm:text-sm font-black font-mono flex items-center justify-center ${isNegative ? 'text-rose-400' : 'text-sky-400'}`}>
                          {rowTotal}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

        {/* ================= 4. COUNT REPORT SUB-VIEW (Original View) ================= */}
        {activeSection === 'OVER_COUNT' && (
          <div className="space-y-4 pt-1 animate-drop-in">
            
            {/* Top Tab Bar: Today's Report vs Previous History */}
            <div className="bg-neutral-950 border border-neutral-800 p-1.5 rounded-2xl flex items-center gap-1.5 font-sans shadow-xl">
              <button
                type="button"
                onClick={() => setCountTab('TODAY')}
                className={`flex-1 py-2.5 px-2 sm:px-3 rounded-xl font-black text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  countTab === 'TODAY'
                    ? 'bg-gold-metallic text-black shadow-md border border-gold-dark'
                    : 'bg-black/40 text-neutral-300 border border-neutral-800/80 hover:text-white hover:border-neutral-700'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Today's Report</span>
              </button>

              <button
                type="button"
                onClick={() => setCountTab('PREVIOUS')}
                className={`flex-1 py-2.5 px-2 sm:px-3 rounded-xl font-black text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  countTab === 'PREVIOUS'
                    ? 'bg-gold-metallic text-black shadow-md border border-gold-dark'
                    : 'bg-black/40 text-neutral-300 border border-neutral-800/80 hover:text-white hover:border-neutral-700'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Previous History</span>
              </button>
            </div>

            {/* Input Form Box (Shown ONLY when Previous History tab is selected) */}
            {countTab === 'PREVIOUS' && (
              <div className="bg-[#0c0c0c] border border-neutral-800 p-3.5 sm:p-4 rounded-2xl shadow-xl space-y-3.5 font-sans animate-drop-in">
                {/* FROM DATE Input Row */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div
                      onClick={() => triggerDatePicker(countFromRef)}
                      className="relative flex-1 bg-black border border-neutral-700 [@media(hover:hover)]:hover:border-gold/60 rounded-xl px-3.5 py-2 cursor-pointer group transition-all block overflow-hidden shadow-inner"
                    >
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block pointer-events-none">
                        FROM DATE
                      </span>
                      <span className="text-white font-black text-xs sm:text-sm tracking-wide block mt-0.5 font-mono pointer-events-none">
                        {formatDateDisplay(overCountDate)}
                      </span>
                      <input
                        ref={countFromRef}
                        type="date"
                        value={overCountDate}
                        onChange={(e) => e.target.value && setOverCountDate(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 full-date-input"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => triggerDatePicker(countFromRef)}
                      className="relative bg-neutral-900 border border-neutral-700 [@media(hover:hover)]:hover:border-gold/80 px-3.5 py-3 rounded-xl text-[11px] sm:text-xs font-black uppercase text-white tracking-wider hover:bg-neutral-800 transition-all shrink-0 active:scale-95 shadow flex items-center justify-center select-none overflow-hidden cursor-pointer"
                    >
                      <span>CHANGE</span>
                    </button>
                  </div>
                </div>

                {/* TO DATE Input Row */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div
                      onClick={() => triggerDatePicker(countToRef)}
                      className="relative flex-1 bg-black border border-neutral-700 [@media(hover:hover)]:hover:border-gold/60 rounded-xl px-3.5 py-2 cursor-pointer group transition-all block overflow-hidden shadow-inner"
                    >
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block pointer-events-none">
                        TO DATE
                      </span>
                      <span className="text-white font-black text-xs sm:text-sm tracking-wide block mt-0.5 font-mono pointer-events-none">
                        {formatDateDisplay(overCountToDate)}
                      </span>
                      <input
                        ref={countToRef}
                        type="date"
                        value={overCountToDate}
                        onChange={(e) => e.target.value && setOverCountToDate(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 full-date-input"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => triggerDatePicker(countToRef)}
                      className="relative bg-neutral-900 border border-neutral-700 [@media(hover:hover)]:hover:border-gold/80 px-3.5 py-3 rounded-xl text-[11px] sm:text-xs font-black uppercase text-white tracking-wider hover:bg-neutral-800 transition-all shrink-0 active:scale-95 shadow flex items-center justify-center select-none overflow-hidden cursor-pointer"
                    >
                      <span>CHANGE</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Slot Selection Pills (ALL, 1 PM, 3 PM, 6 PM, 8 PM) */}
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2 w-full pt-0.5 px-0.5">
              {(['ALL', '1 PM', '3 PM', '6 PM', '8 PM'] as const).map((opt) => {
                const isSelected = overCountSlot === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setOverCountSlot(opt)}
                    className={`py-2 px-1 text-[11px] sm:text-xs font-black uppercase text-center rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gold-metallic text-black border-gold-dark shadow-md scale-[1.02]'
                        : 'bg-[#0c0c0c] text-white border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* SHOW REPORT Banner Button */}
            <div className="w-full flex justify-center py-1.5">
              <button
                type="button"
                onClick={() => {}}
                className="px-9 py-2.5 bg-gradient-to-b from-[#edd177] via-[#c89825] to-[#996e19] text-black font-black text-xs sm:text-sm tracking-wider uppercase rounded-xl shadow-xl cursor-pointer hover:brightness-110 active:scale-95 transition-all border border-gold-dark"
              >
                SHOW REPORT
              </button>
            </div>

            {/* Summary Table */}
            <div className="w-full border-2 border-gold/70 rounded-2xl overflow-hidden bg-[#0c0c0c] text-white text-xs sm:text-sm font-bold shadow-[0_0_25px_rgba(184,137,40,0.15)] animate-drop-in font-mono">
              {/* Header Row */}
              <div className="grid grid-cols-4 bg-gradient-to-r from-neutral-900 via-[#3a2a07] to-neutral-900 border-b border-neutral-800 font-extrabold py-3 px-2 sm:px-3 text-center uppercase tracking-wider text-gold text-[11px] sm:text-xs shadow-inner">
                <span className="text-left pl-2">GAME</span>
                <span>COUNT</span>
                <span>RATE</span>
                <span>CASH</span>
              </div>

              {/* Data Rows */}
              <div className="divide-y divide-neutral-850">
                {countReportRows.map((row) => (
                  <div key={row.name} className="grid grid-cols-4 py-3 px-2 sm:px-3 items-center text-center font-bold hover:bg-neutral-900/60 transition-colors">
                    <span className="text-left font-black text-gold pl-2 tracking-wide text-xs">{row.name}</span>
                    <span className="font-mono text-neutral-200 text-xs sm:text-sm">{row.count > 0 ? row.count : '-'}</span>
                    <span className="font-mono text-neutral-200 text-xs sm:text-sm">{row.count > 0 ? (typeof row.rate === 'number' ? `₹${row.rate}` : row.rate) : '-'}</span>
                    <span className="font-mono text-neutral-200 text-xs sm:text-sm">{row.cash > 0 ? `₹${row.cash.toFixed(0)}` : '-'}</span>
                  </div>
                ))}
              </div>

              {/* Total Row */}
              <div className="grid grid-cols-4 py-3 px-2 sm:px-3 items-center text-center border-t-2 border-gold/50 bg-black font-black text-xs sm:text-sm">
                <span className="text-left pl-2 uppercase font-black text-rose-400">TOTAL</span>
                <span className="font-mono text-gold text-xs sm:text-sm">{countReportTotalCount > 0 ? countReportTotalCount : '-'}</span>
                <span className="font-mono text-neutral-500">-</span>
                <span className="font-mono text-gold text-xs sm:text-sm">{countReportTotalCash > 0 ? `₹${countReportTotalCash.toFixed(0)}` : '-'}</span>
              </div>
            </div>

          </div>
        )}
    </div>
  );
};
