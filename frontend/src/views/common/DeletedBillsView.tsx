import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';
import { useApp } from '../../context/AppContext';
import { adminService } from '../../services/adminService';
import type { DeletedTicket, UserAccount } from '../../types';
import { getBusinessDateIST, formatDisplayDate } from '../../utils/dateUtils';
import {
  Search,
  Calendar,
  Trash2,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';

interface DeletedBillsViewProps {
  isAdmin?: boolean;
}

const formatDateTime = (str?: string): string => {
  if (!str) return '—';
  const clean = str.trim();
  const match = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (match) {
    const [, yyyy, mmStr, ddStr, hStr, mStr, sStr] = match;
    const dd = ddStr.padStart(2, '0');
    const mm = mmStr.padStart(2, '0');
    const rawH = parseInt(hStr, 10);
    const ampm = rawH >= 12 ? 'PM' : 'AM';
    const hh = String(rawH % 12 || 12).padStart(2, '0');
    const min = mStr || '00';
    const ss = sStr || '00';
    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss} ${ampm}`;
  }
  const dmyMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})[T\s]?(\d{2})?:?(\d{2})?:?(\d{2})?\s*(AM|PM)?/i);
  if (dmyMatch) {
    const [, ddStr, mmStr, yyStr, hStr, mStr, sStr, ampmStr] = dmyMatch;
    const dd = ddStr.padStart(2, '0');
    const mm = mmStr.padStart(2, '0');
    const yyyy = yyStr.length === 2 ? `20${yyStr}` : yyStr;
    const rawH = hStr ? parseInt(hStr, 10) : 0;
    const ampm = ampmStr ? ampmStr.toUpperCase() : (rawH >= 12 ? 'PM' : 'AM');
    const hh = String(rawH % 12 || (rawH === 0 ? 12 : rawH)).padStart(2, '0');
    const min = mStr || '00';
    const ss = sStr || '00';
    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss} ${ampm}`;
  }
  const d = new Date(clean);
  if (isNaN(d.getTime())) return str;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  const rawH = d.getHours();
  const ampm = rawH >= 12 ? 'PM' : 'AM';
  const hh = String(rawH % 12 || 12).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss} ${ampm}`;
};

const getDisplayGame = (item: { number?: string; type?: string }): string => {
  const num = (item.number || '').trim();
  if (num.includes(':')) {
    return num.split(':')[0].trim().toUpperCase();
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
  const num = (item.number || '').trim();
  if (num.includes(':')) {
    return num.split(':')[1];
  }
  return num;
};

export const DeletedBillsView: React.FC<DeletedBillsViewProps> = ({ isAdmin = true }) => {
  const { setCurrentView, addToast } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>(getBusinessDateIST());
  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('ALL');
  const [selectedSlot, setSelectedSlot] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deletedTickets, setDeletedTickets] = useState<DeletedTicket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const dateInputRef = useRef<HTMLInputElement>(null);

  // Fetch admin user accounts if admin
  useEffect(() => {
    if (isAdmin) {
      adminService
        .getAllUsers()
        .then((users) => setUsersList(users))
        .catch(() => {});
    }
  }, [isAdmin]);

  // Load deleted tickets based on filters
  const loadDeletedTickets = async () => {
    setIsLoading(true);
    try {
      const uId = selectedUserId !== 'ALL' ? selectedUserId : undefined;
      const gSlot = selectedSlot !== 'ALL' ? selectedSlot : undefined;
      const tickets = await adminService.getDeletedTickets(selectedDate, uId, gSlot);
      setDeletedTickets(tickets || []);
    } catch (err: any) {
      addToast(err?.message || 'Failed to load deleted bills', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeletedTickets();
  }, [isAdmin, selectedDate, selectedUserId, selectedSlot]);

  // Filter by search query (Bill ID, Customer Name, or Number)
  const filteredTickets = useMemo(() => {
    if (!searchQuery.trim()) return deletedTickets;
    const q = searchQuery.trim().toLowerCase().replace('#', '');
    return deletedTickets.filter((t) => {
      const matchId = (t.ticketId || t.id || '').toLowerCase().includes(q);
      const matchCust = (t.customerName || '').toLowerCase().includes(q);
      const matchAgency = (t.agencyName || t.userName || '').toLowerCase().includes(q);
      const matchItemNum = (t.items || []).some((item) => (item.number || '').toLowerCase().includes(q));
      return matchId || matchCust || matchAgency || matchItemNum;
    });
  }, [deletedTickets, searchQuery]);

  // Summary Metrics
  const summary = useMemo(() => {
    let totalBills = filteredTickets.length;
    let totalAmount = 0;
    let totalItems = 0;
    let totalCount = 0;

    for (const t of filteredTickets) {
      totalAmount += t.totalAmount || 0;
      const items = t.items || [];
      totalItems += items.length;
      for (const item of items) {
        totalCount += item.count || 0;
      }
    }

    return { totalBills, totalAmount, totalItems, totalCount };
  }, [filteredTickets]);

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id], // Default is open
    }));
  };

  const isCardExpanded = (id: string) => {
    return expandedCards[id] !== false; // Default expanded for fast scanning
  };

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start pb-20 select-none font-sans overflow-x-hidden">
      {/* Header Banner with Back navigation */}
      <HeaderBanner
        title="DELETED BILLS"
        onBackClick={() => setCurrentView('ADMIN_DRAWER')}
      />

      <div className="w-full max-w-md sm:max-w-xl mx-auto px-3 sm:px-5 py-3 space-y-3">
        {/* Filter Controls Card */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3 sm:p-4 shadow-xl space-y-3">
          {/* Date Picker Row */}
          <div className="grid grid-cols-2 gap-2 items-center">
            {/* Date Display Pill */}
            <div className="relative bg-gold-metallic text-black rounded-xl px-3 py-2 cursor-pointer flex items-center justify-center shadow-md border border-gold-dark overflow-hidden">
              <span className="text-black font-black text-xs sm:text-sm font-mono whitespace-nowrap">
                {formatDisplayDate(selectedDate)}
              </span>
              <input
                ref={dateInputRef}
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              />
            </div>

            {/* Change Date Action Button */}
            <div className="relative bg-neutral-900 border border-neutral-700 hover:border-gold/60 text-neutral-200 rounded-xl px-3 py-2 cursor-pointer flex items-center justify-center gap-1.5 shadow-md overflow-hidden">
              <Calendar className="w-4 h-4 text-gold shrink-0 pointer-events-none" />
              <span className="font-bold text-xs sm:text-sm whitespace-nowrap pointer-events-none">
                Change Date
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              />
            </div>
          </div>

          {/* Admin Filters: User/Agency & Game Slot */}
          {isAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-neutral-800/80">
              {/* Agency / User Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">
                  Agency / User
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-gold transition-colors cursor-pointer"
                >
                  <option value="ALL">All Agencies &amp; Users</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.agencyName ? `${u.agencyName} (${u.name || u.username})` : u.name || u.username}
                    </option>
                  ))}
                </select>
              </div>

              {/* Game Slot Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">
                  Game Slot
                </label>
                <select
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-gold transition-colors cursor-pointer"
                >
                  <option value="ALL">All Game Slots</option>
                  <option value="1 PM Game">1 PM Game</option>
                  <option value="3 PM Game">3 PM Game</option>
                  <option value="6 PM Game">6 PM Game</option>
                  <option value="8 PM Game">8 PM Game</option>
                </select>
              </div>
            </div>
          )}

          {/* Search Bar & Refresh Button */}
          <div className="flex items-center gap-2 pt-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search Bill ID, Customer, Number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-gold transition-colors"
              />
            </div>

            <button
              type="button"
              onClick={loadDeletedTickets}
              disabled={isLoading}
              title="Refresh"
              className="p-2 bg-neutral-900 border border-neutral-700 hover:border-gold/60 text-gold rounded-xl hover:bg-neutral-800 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-3 gap-2">
          {/* Card 1: Deleted Bills Count */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-center shadow-sm">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block font-bold">
              Deleted Bills
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-rose-500">
              {summary.totalBills}
            </span>
          </div>

          {/* Card 2: Total Items / Count */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-center shadow-sm">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block font-bold">
              Total Counts
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-white">
              {summary.totalCount}
            </span>
          </div>

          {/* Card 3: Total Amount Deleted */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-center shadow-sm">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block font-bold">
              Total Amount
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-gold">
              ₹{summary.totalAmount}
            </span>
          </div>
        </div>

        {/* Tickets List Area */}
        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
              Loading deleted bills archive...
            </p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6 stroke-[1.75]" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm uppercase font-mono">
                No Deleted Bills Found
              </h4>
              <p className="text-xs text-neutral-400 font-mono mt-1">
                No bills were deleted on {formatDisplayDate(selectedDate)}.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => {
              const expanded = isCardExpanded(ticket.id);
              return (
                <div
                  key={ticket.id}
                  className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl transition-all"
                >
                  {/* Top Header Bar: Bill ID, Status Badge & Expand Toggle */}
                  <div
                    onClick={() => toggleExpand(ticket.id)}
                    className="bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 px-3 sm:px-4 py-2.5 border-b border-neutral-800 flex items-center justify-between cursor-pointer hover:bg-neutral-900/80 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-wider">
                        BILL
                      </span>
                      <span className="text-gold font-black text-sm sm:text-base font-mono">
                        #{ticket.ticketId || ticket.id}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black font-mono tracking-wider bg-rose-950 text-rose-400 border border-rose-800">
                        DELETED
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-gold font-black text-sm sm:text-base font-mono">
                        ₹{ticket.totalAmount}
                      </span>
                      {expanded ? (
                        <ChevronUp className="w-4 h-4 text-neutral-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-neutral-400" />
                      )}
                    </div>
                  </div>

                  {/* Deletion Audit Timestamp Bar */}
                  <div className="bg-rose-950/30 border-b border-rose-900/40 px-3 sm:px-4 py-2 text-xs font-mono">
                    <div className="flex items-center justify-between text-rose-300">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        Deleted On:
                      </span>
                      <span className="font-extrabold text-white">
                        {formatDateTime(ticket.deletedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Agency, Customer & Game Slot Info Bar */}
                  <div className="bg-white px-3 sm:px-4 py-2 border-b border-neutral-200 grid grid-cols-3 gap-2 text-xs font-mono text-neutral-800 items-center">
                    <div className="text-left truncate">
                      Agency:{' '}
                      <strong className="text-black font-bold ml-1">
                        {ticket.agencyName || ticket.userName || 'Agency'}
                      </strong>
                    </div>
                    <div className="text-center truncate">
                      {ticket.customerName ? (
                        <>
                          Customer:{' '}
                          <strong className="text-black font-bold ml-1">
                            {ticket.customerName}
                          </strong>
                        </>
                      ) : (
                        <span className="text-neutral-400 italic">No Cust Name</span>
                      )}
                    </div>
                    <div className="text-right truncate">
                      Slot:{' '}
                      <strong className="text-black font-bold ml-1">
                        {(ticket.gameSlot || '').replace(/\s*Game$/i, '')}
                      </strong>
                    </div>
                  </div>

                  {/* Original Placement Date Bar */}
                  <div className="bg-neutral-900/60 px-3 sm:px-4 py-1.5 border-b border-neutral-800/80 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      Original Placed Date:
                    </span>
                    <span className="font-bold text-neutral-200">
                      {formatDateTime(ticket.placedAt)}
                    </span>
                  </div>

                  {/* Expandable Itemized Table */}
                  {expanded && (
                    <div>
                      {/* Table Column Headers */}
                      <div className="bg-pink-100 text-neutral-900 font-mono text-xs font-black px-3 sm:px-4 py-1.5 grid grid-cols-4 items-center text-center border-b border-neutral-200 uppercase tracking-wider">
                        <span className="text-left">GAME</span>
                        <span>NUM</span>
                        <span>COUNT</span>
                        <span className="text-right">AMOUNT</span>
                      </div>

                      {/* Items Rows */}
                      <div className="divide-y divide-neutral-200 font-mono text-xs font-bold bg-white text-black">
                        {(ticket.items || []).map((item, idx) => (
                          <div
                            key={idx}
                            className="grid grid-cols-4 px-3 sm:px-4 py-1.5 bg-white text-center items-center font-mono hover:bg-neutral-50 transition-colors"
                          >
                            <span className="text-left uppercase text-black font-black">
                              {getDisplayGame(item)}
                            </span>
                            <span className="text-black font-black tracking-wider text-xs sm:text-sm">
                              {getDisplayNumber(item)}
                            </span>
                            <span className="text-black font-black text-xs sm:text-sm">
                              {item.count}
                            </span>
                            <span className="text-right text-black font-mono font-bold">
                              ₹{item.totalAmount}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Card Footer Bar */}
                      <div className="bg-neutral-900 border-t border-neutral-800 px-3 sm:px-4 py-2 flex items-center justify-between font-mono text-xs">
                        <span className="text-neutral-400 font-bold uppercase tracking-wider">
                          TOTAL BILL AMOUNT
                        </span>
                        <span className="text-white font-black text-sm sm:text-base">
                          ₹{ticket.totalAmount}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
