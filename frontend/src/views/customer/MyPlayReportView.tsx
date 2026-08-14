import React, { useState } from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';
import { useApp } from '../../context/AppContext';
import {
  ClipboardList,
  Trophy,
  BarChart3,
  Calendar,
  ChevronRight,
  ArrowLeft,
  Trash2,
} from 'lucide-react';

type ReportSection = 'HUB' | 'SALES' | 'WINNING' | 'DAILY';

export const MyPlayReportView: React.FC = () => {
  const { userTickets, setCurrentView } = useApp();
  const [activeSection, setActiveSection] = useState<ReportSection>('HUB');

  // Dates for Sales Report Form
  const todayStr = new Date().toISOString().split('T')[0];
  const firstOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [fromDate, setFromDate] = useState<string>(firstOfMonthStr);
  const [toDate, setToDate] = useState<string>(todayStr);
  const [isFullView, setIsFullView] = useState<boolean>(false);
  const [slotFilter, setSlotFilter] = useState<'ALL' | '1 PM' | '3 PM' | '6 PM' | '8 PM'>('ALL');
  
  // By default, no digit type or sub-option is selected/starred
  const [digitFilter, setDigitFilter] = useState<'ALL' | 'NONE' | '1' | '2' | '3'>('NONE');
  const [subOptionFilter, setSubOptionFilter] = useState<string>('NONE');
  const [searchNumber, setSearchNumber] = useState<string>('');

  // Detailed Sales Report State
  const [showSalesDetails, setShowSalesDetails] = useState<boolean>(false);
  const [selectedSingleTicket, setSelectedSingleTicket] = useState<any | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletedTicketIds, setDeletedTicketIds] = useState<string[]>([]);
  const longPressTimerRef = React.useRef<any>(null);

  const startLongPress = (tkt: any) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      setSelectedSingleTicket(tkt);
    }, 450);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Helper to format YYYY-MM-DD -> DD-MM-YYYY
  const formatDateDisplay = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  // Aggregate user sales & winning data
  const totalSales = userTickets.reduce((acc, t) => acc + t.totalAmount, 0);
  const totalWinning = userTickets
    .filter((t) => t.status === 'WON')
    .reduce((acc, t) => acc + (t.winAmount || 0), 0);

  // Mock Realistic Ticket Data matching user's reference screenshots
  const sampleTickets = [
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

  // Filter tickets based on search number, slot filter, and deletion
  const displayTickets = allTickets.filter((tkt) => {
    if (deletedTicketIds.includes(tkt.id)) {
      return false;
    }
    if (slotFilter !== 'ALL' && !tkt.gameSlot.startsWith(slotFilter)) {
      return false;
    }
    if (searchNumber) {
      return tkt.items.some((item: any) => item.number.includes(searchNumber));
    }
    return true;
  });

  const totalDetailCount = displayTickets.reduce(
    (acc, tkt) => acc + tkt.items.reduce((sum: number, item: any) => sum + item.count, 0),
    0
  );
  const grandDetailTotal = displayTickets.reduce((acc, tkt) => acc + tkt.totalAmount, 0);

  const reportItems = [
    {
      id: 'SALES',
      title: 'SALES REPORT',
      icon: ClipboardList,
      description: 'View sales breakdown by game slot and date range',
      action: () => setActiveSection('SALES'),
    },
    {
      id: 'WINNING',
      title: 'WINNING REPORT',
      icon: Trophy,
      description: 'View winning tickets and total payout amounts',
      action: () => setActiveSection('WINNING'),
    },
    {
      id: 'COUNT',
      title: 'COUNT REPORT',
      icon: BarChart3,
      description: 'View total count matrix for games (Super, Box, Pair)',
      action: () => setCurrentView('TODAYS_WINNING_NUMBERS'),
    },
    {
      id: 'DAILY',
      title: 'DAILY REPORT',
      icon: Calendar,
      description: 'View daily opening balance, total sales, and net summary',
      action: () => setActiveSection('DAILY'),
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
            : 'Daily Report'
        }
        showBack={true}
        onBackClick={
          activeSection !== 'HUB'
            ? () => setActiveSection('HUB')
            : undefined
        }
      />

      <div className="max-w-md mx-auto w-full px-4 sm:px-6 py-6 space-y-4">
        
        {/* ================= 1. MAIN REPORT HUB MENU ================= */}
        {activeSection === 'HUB' && (
          <div className="space-y-3.5 animate-drop-in">
            {reportItems.map((item) => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full bg-neutral-950 p-4 sm:p-4.5 rounded-2xl border border-neutral-800 flex items-center justify-between shadow-md hover:border-gold/60 hover:bg-neutral-900/80 active:scale-[0.98] transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gold-metallic text-black rounded-xl border border-black flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                      <IconComp className="w-5 h-5 stroke-[2.5]" />
                    </div>

                    <div className="text-left">
                      <span className="text-sm sm:text-base font-black text-gold tracking-wide uppercase block">
                        {item.title}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-gold group-hover:translate-x-1 transition-all shrink-0" />
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
                  <div className="relative flex-1 bg-black border border-neutral-700 hover:border-gold/60 rounded-xl px-4 py-2.5 cursor-pointer group transition-all">
                    <span className="text-[10px] sm:text-xs font-black text-neutral-400 uppercase tracking-wider block">
                      From date
                    </span>
                    <span className="text-white font-black text-sm sm:text-base tracking-wide block mt-0.5">
                      {formatDateDisplay(fromDate)}
                    </span>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => e.target.value && setFromDate(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>

                  <div
                    onClick={(e) => {
                      const input = e.currentTarget.parentElement?.querySelector('input');
                      input?.showPicker?.();
                    }}
                    className="bg-neutral-900 border border-neutral-700 hover:border-gold/80 px-4 py-3.5 rounded-xl cursor-pointer text-xs font-black uppercase text-white tracking-wider hover:bg-neutral-800 transition-all shrink-0 active:scale-95 shadow"
                  >
                    CHANGE
                  </div>
                </div>
              </div>

              {/* To Date Input Row */}
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 bg-black border border-neutral-700 hover:border-gold/60 rounded-xl px-4 py-2.5 cursor-pointer group transition-all">
                    <span className="text-[10px] sm:text-xs font-black text-neutral-400 uppercase tracking-wider block">
                      To date
                    </span>
                    <span className="text-white font-black text-sm sm:text-base tracking-wide block mt-0.5">
                      {formatDateDisplay(toDate)}
                    </span>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => e.target.value && setToDate(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>

                  <div
                    onClick={(e) => {
                      const input = e.currentTarget.parentElement?.querySelector('input');
                      input?.showPicker?.();
                    }}
                    className="bg-neutral-900 border border-neutral-700 hover:border-gold/80 px-4 py-3.5 rounded-xl cursor-pointer text-xs font-black uppercase text-white tracking-wider hover:bg-neutral-800 transition-all shrink-0 active:scale-95 shadow"
                  >
                    CHANGE
                  </div>
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
                    isFullView ? 'bg-gold-metallic' : 'bg-neutral-800'
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
                      SELECT DIGIT TYPE:
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

                  {/* Row 3: Number Search Box */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                      CHECK SPECIFIC NUMBER:
                    </span>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={3}
                        value={searchNumber}
                        onChange={(e) => setSearchNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="Number"
                        className="w-full bg-black border border-neutral-700 focus:border-gold text-white font-mono font-black text-sm px-4 py-2.5 rounded-xl placeholder:text-neutral-500 outline-none transition-all shadow-inner"
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

            {/* ================= SALES DETAIL OUTPUT VIEW (Matching User's Reference Screenshots) ================= */}
            {showSalesDetails && (
              <div className="space-y-4 animate-drop-in pt-2">
                
                {/* Gold Sub-header Banner matching Screenshot */}
                <div className="bg-gold-metallic p-3.5 rounded-xl text-black shadow-lg border border-gold-dark space-y-1.5">
                  <div className="flex items-center justify-between font-black text-sm sm:text-base uppercase tracking-wider">
                    <span>SALES DETAIL &nbsp;( {slotFilter === 'ALL' ? '1 PM' : slotFilter} )</span>
                    <button
                      onClick={() => setShowSalesDetails(false)}
                      className="text-xs font-extrabold bg-black text-white px-3 py-1 rounded-lg hover:bg-neutral-800 cursor-pointer shadow"
                    >
                      Hide Detail
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs font-black pt-1.5 border-t border-black/20 font-mono">
                    <span>TotalCount: {totalDetailCount}</span>
                    <span>GrandTotal: {grandDetailTotal}</span>
                  </div>
                </div>

                {/* Number Search Results Indicator */}
                {searchNumber.trim() && (
                  <div className="bg-neutral-900 border border-gold/60 p-3.5 rounded-xl flex items-center justify-between text-xs font-mono shadow-md">
                    <span className="text-neutral-300">
                      SEARCHING NUMBER: <strong className="text-gold font-bold text-sm">"{searchNumber}"</strong>
                    </span>
                    <span className="text-emerald-400 font-extrabold">
                      {displayTickets.length} Bill(s) Matched
                    </span>
                  </div>
                )}

                {/* Table Header Row */}
                <div className="bg-white text-black font-black text-xs px-4 py-2 rounded-xl flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-7 font-mono">
                    <span>GAME</span>
                    <span>NUM</span>
                    <span>CNT</span>
                  </div>
                  <span className="font-mono">T.AMT</span>
                </div>

                {/* Individual Ticket Card Boxes */}
                {displayTickets.length === 0 ? (
                  <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 text-center font-mono text-xs font-bold text-neutral-400">
                    No bills found matching number <span className="text-gold">"{searchNumber}"</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayTickets.map((tkt) => (
                      <div
                        key={tkt.id}
                        onMouseDown={() => startLongPress(tkt)}
                        onMouseUp={cancelLongPress}
                        onMouseLeave={cancelLongPress}
                        onTouchStart={() => startLongPress(tkt)}
                        onTouchEnd={cancelLongPress}
                        className="bg-neutral-950 border border-neutral-800 hover:border-gold rounded-2xl overflow-hidden shadow-xl transition-all cursor-pointer group active:scale-[0.99]"
                      >
                        {/* Card Top Header */}
                        <div className="bg-[#1e1e1e] p-3 text-xs border-b border-neutral-800 space-y-1">
                          <div className="flex items-center justify-between font-mono">
                            <span className="font-black text-white text-sm">BILL ID: <strong className="text-gold font-bold">{tkt.id}</strong></span>
                            <span className="font-black text-white">TOTAL: <strong className="text-gold text-sm font-mono">{tkt.totalAmount}</strong></span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                            <span>COUNT: <strong className="text-white font-bold">{tkt.items.reduce((sum: number, i: any) => sum + i.count, 0)}</strong></span>
                            <span>{tkt.placedAt}</span>
                          </div>
                          <div className="text-[11px] text-neutral-400 font-mono flex items-center justify-between pt-0.5">
                            <span>CUSTOMER: <strong className="text-neutral-200">{(tkt as any).customerName || 'Customer'}</strong></span>
                          </div>
                        </div>

                        {/* Card Items Table (Light rows with crisp dark text matching screenshot) */}
                        <div className="bg-white text-black font-extrabold text-xs divide-y divide-neutral-200">
                          {tkt.items.map((item: any, idx: number) => {
                            const isMatch = searchNumber.trim() && item.number.includes(searchNumber.trim());
                            return (
                              <div
                                key={idx}
                                className={`flex items-center justify-between px-4 py-2 transition-colors ${
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
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setActiveSection('HUB')}
              className="w-full py-2.5 bg-neutral-900 text-neutral-300 font-bold text-xs rounded-xl border border-neutral-800 hover:text-white flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Reports</span>
            </button>
          </div>
        )}

        {/* ================= 3. WINNING REPORT SUB-VIEW ================= */}
        {activeSection === 'WINNING' && (
          <div className="space-y-4 animate-drop-in">
            <div className="bg-neutral-950 p-4 rounded-2xl border border-gold/60 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="text-xs font-black text-neutral-400 uppercase">TOTAL WINNING PAYOUT</span>
                <span className="text-xl font-black text-gold font-mono">₹{totalWinning}</span>
              </div>

              <p className="text-xs text-neutral-400">
                Winning tickets are credited automatically to your account balance upon draw publication.
              </p>
            </div>

            {/* List of Winning Tickets */}
            <div className="space-y-2">
              {userTickets.filter((t) => t.status === 'WON').length === 0 ? (
                <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-800 text-center text-neutral-400 text-xs font-semibold">
                  No winning tickets found yet.
                </div>
              ) : (
                userTickets
                  .filter((t) => t.status === 'WON')
                  .map((tkt) => (
                    <div
                      key={tkt.id}
                      className="bg-neutral-950 p-3.5 rounded-xl border border-emerald-800/60 flex items-center justify-between shadow"
                    >
                      <div>
                        <span className="text-xs font-black text-white uppercase block">{tkt.gameSlot}</span>
                        <span className="text-[10px] text-neutral-400 font-mono">ID: {tkt.id}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-400 font-black text-sm block font-mono">
                          +₹{tkt.winAmount || 0}
                        </span>
                        <span className="text-[10px] text-emerald-500 font-extrabold uppercase">WON</span>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <button
              onClick={() => setActiveSection('HUB')}
              className="w-full py-2.5 bg-neutral-900 text-neutral-300 font-bold text-xs rounded-xl border border-neutral-800 hover:text-white flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Reports</span>
            </button>
          </div>
        )}

        {/* ================= 4. DAILY REPORT SUB-VIEW ================= */}
        {activeSection === 'DAILY' && (
          <div className="space-y-4 animate-drop-in">
            <div className="bg-neutral-950 p-4 rounded-2xl border border-gold/60 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="text-xs font-black text-gold uppercase">DAILY SUMMARY ({todayStr})</span>
              </div>

              <div className="space-y-2 text-xs font-bold">
                <div className="flex justify-between py-1 border-b border-neutral-850">
                  <span className="text-neutral-400">Total Sales</span>
                  <span className="text-white font-mono">₹{totalSales}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-850">
                  <span className="text-neutral-400">Total Payouts</span>
                  <span className="text-rose-400 font-mono">₹{totalWinning}</span>
                </div>
                <div className="flex justify-between py-1 pt-2 font-black text-sm">
                  <span className="text-gold">NET REVENUE</span>
                  <span className="text-gold font-mono">₹{totalSales - totalWinning}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveSection('HUB')}
              className="w-full py-2.5 bg-neutral-900 text-neutral-300 font-bold text-xs rounded-xl border border-neutral-800 hover:text-white flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Reports</span>
            </button>
          </div>
        )}

      </div>

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
              
              {/* Bill ID Header Bar */}
              <div className="bg-neutral-900 border-b border-neutral-800 p-4 flex items-center justify-between font-mono">
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
                <span className="text-neutral-300">Slot: <strong className="text-gold font-bold">{selectedSingleTicket.gameSlot}</strong></span>
                <span className="text-neutral-300">Customer: <strong className="text-white font-bold">{(selectedSingleTicket as any).customerName || 'Customer'}</strong></span>
              </div>

              {/* Table Column Headers Bar */}
              <div className="bg-neutral-900/90 text-gold font-mono text-xs font-black px-4 py-2.5 flex items-center justify-between border-b border-neutral-800 uppercase">
                <div className="flex items-center gap-10">
                  <span className="w-16">GAME</span>
                  <span className="w-16">NUM</span>
                  <span>COUNT</span>
                </div>
                <span>ACTION</span>
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

                    <button
                      onClick={() => setConfirmDeleteId(selectedSingleTicket.id)}
                      className="w-8 h-8 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-800/80 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                      title="Delete Bill"
                    >
                      <Trash2 className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Bill Total Footer Bar */}
              <div className="bg-neutral-900 border-t border-neutral-800 p-4 flex items-center justify-between font-mono">
                <span className="text-xs text-neutral-400 uppercase font-black">TOTAL AMOUNT</span>
                <span className="text-gold font-black text-base">₹{selectedSingleTicket.totalAmount}</span>
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
                    Are you sure you want to delete Bill ID <strong className="text-gold">#{confirmDeleteId}</strong>?
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
    </div>
  );
};
