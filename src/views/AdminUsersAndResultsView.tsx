import React, { useState } from 'react';
import { HeaderBanner } from '../components/HeaderBanner';
import { useApp } from '../context/AppContext';
import { Building2, Calendar, Users, ChevronDown, ChevronUp, Search, UserCheck } from 'lucide-react';

export const AdminUsersAndResultsView: React.FC = () => {
  const { registeredUsers, deleteUser } = useApp();
  const [filterMode, setFilterMode] = useState<'ALL' | 'TODAY' | 'PREVIOUS' | 'CUSTOM_DATE'>('ALL');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expandedUserBank, setExpandedUserBank] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Counts calculations
  const totalUsersCount = registeredUsers.length;
  const todayUsers = registeredUsers.filter((u) => u.createdAt === todayStr);
  const todayUsersCount = todayUsers.length;
  const previousUsers = registeredUsers.filter((u) => u.createdAt !== todayStr);

  // Custom date filtered users
  const customDateUsers = registeredUsers.filter((u) => u.createdAt === customDate);

  // Users displayed based on active filter mode
  const displayedUsers = (() => {
    switch (filterMode) {
      case 'TODAY':
        return todayUsers;
      case 'PREVIOUS':
        return previousUsers;
      case 'CUSTOM_DATE':
        return customDateUsers;
      case 'ALL':
      default:
        return registeredUsers;
    }
  })();

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-16 select-none">
      {/* Gold Header */}
      <HeaderBanner title="Users List" />

      <div className="px-4 sm:px-6 py-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* Total Counts Header Cards (2 Clean Cards: Total Users & Today Registered) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-neutral-900 border border-gold/40 p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-md">
            <span className="text-neutral-400 text-xs font-extrabold uppercase tracking-wider block flex items-center justify-center gap-1.5 mb-1">
              <Users className="w-4 h-4 text-gold" /> Total Users
            </span>
            <span className="text-gold font-black text-2xl sm:text-3xl font-mono">{totalUsersCount}</span>
          </div>

          <div className="bg-neutral-900 border border-emerald-500/40 p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-md">
            <span className="text-emerald-400 text-xs font-extrabold uppercase tracking-wider block flex items-center justify-center gap-1.5 mb-1">
              <UserCheck className="w-4 h-4 text-emerald-400" /> Today Registered
            </span>
            <span className="text-emerald-300 font-black text-2xl sm:text-3xl font-mono">{todayUsersCount}</span>
          </div>
        </div>

        {/* Clean Date Filter Selector */}
        <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl space-y-2 shadow-md">
          <label className="text-xs font-bold text-neutral-400 flex items-center gap-1.5">
            <Search className="w-4 h-4 text-gold" /> Check Registrations by Date:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setFilterMode('CUSTOM_DATE');
              }}
              className="flex-1 bg-black border border-neutral-700 text-white font-mono text-xs px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-gold"
            />
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-4 py-2.5 text-xs font-extrabold rounded-lg uppercase cursor-pointer transition-all ${
                filterMode === 'ALL'
                  ? 'bg-gold-metallic text-black shadow-md'
                  : 'bg-neutral-900 text-neutral-300 border border-neutral-800 hover:border-gold/40'
              }`}
            >
              Show All ({totalUsersCount})
            </button>
          </div>
          {filterMode === 'CUSTOM_DATE' && (
            <span className="text-xs text-gold font-mono font-bold block pt-1">
              ({customDateUsers.length} user{customDateUsers.length === 1 ? '' : 's'} registered on {customDate})
            </span>
          )}
        </div>

        {/* Registered Users List (Non-overlapping spacious cards layout) */}
        <div className="space-y-3">
          <h2 className="text-base font-extrabold text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gold" />
              <span>Users List ({displayedUsers.length})</span>
            </span>
          </h2>

          {displayedUsers.length === 0 ? (
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-8 text-center text-neutral-500 italic text-xs">
              No users found for the selected registration date filter.
            </div>
          ) : (
            displayedUsers.map((u) => (
              <div
                key={u.id}
                className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3 hover:border-gold/30 transition-colors shadow-md"
              >
                {/* Header Row: User Name, Registration Date & Delete Button */}
                <div className="flex items-center justify-between border-b border-neutral-900 pb-2.5">
                  <div>
                    <span className="font-extrabold text-white text-base block">{u.name}</span>
                    <span className="text-neutral-400 text-xs font-mono flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-gold shrink-0" /> Reg. Date: {u.createdAt}
                    </span>
                  </div>

                  <button
                    onClick={() => deleteUser(u.id)}
                    className="px-2.5 py-1.5 bg-rose-950/50 hover:bg-rose-900/80 border border-rose-500/60 text-rose-300 rounded-lg text-xs font-extrabold transition-all inline-flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
                    title={`Delete ${u.name}`}
                  >
                    <svg
                      className="w-3.5 h-3.5 text-rose-400 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                    <span>Delete</span>
                  </button>
                </div>

                {/* Info Row: Email & Bank Details Toggle Button */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-neutral-300 font-mono">
                    <span className="text-neutral-500 font-sans font-bold block text-[10px] uppercase">
                      Email / Username
                    </span>
                    <span className="text-white text-xs">{u.email}</span>
                  </div>

                  <button
                    onClick={() => setExpandedUserBank(expandedUserBank === u.id ? null : u.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold border transition-colors cursor-pointer shrink-0 ${
                      u.bankDetails
                        ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{u.bankDetails ? 'Bank Details' : 'No Bank Details'}</span>
                    {expandedUserBank === u.id ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Expandable Bank Account Details Drawer */}
                {expandedUserBank === u.id && (
                  <div className="mt-3 p-4 bg-neutral-900 rounded-xl border border-gold/40 text-xs space-y-2 font-mono shadow-inner">
                    <div className="text-gold font-extrabold flex items-center gap-1.5 text-xs border-b border-neutral-800 pb-2">
                      <Building2 className="w-4 h-4 text-gold" /> Bank Account Details ({u.name})
                    </div>
                    {u.bankDetails ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-neutral-300 pt-1">
                        <div className="bg-black p-2.5 rounded-lg border border-neutral-800">
                          <span className="text-neutral-500 block text-[10px] uppercase font-sans font-bold">
                            Account Holder:
                          </span>
                          <span className="font-bold text-white text-xs">{u.bankDetails.accountHolderName}</span>
                        </div>
                        <div className="bg-black p-2.5 rounded-lg border border-neutral-800">
                          <span className="text-neutral-500 block text-[10px] uppercase font-sans font-bold">
                            Bank Name:
                          </span>
                          <span className="font-bold text-white text-xs">{u.bankDetails.bankName}</span>
                        </div>
                        <div className="bg-black p-2.5 rounded-lg border border-neutral-800">
                          <span className="text-neutral-500 block text-[10px] uppercase font-sans font-bold">
                            Account Number:
                          </span>
                          <span className="font-bold text-gold text-xs">{u.bankDetails.accountNo}</span>
                        </div>
                        <div className="bg-black p-2.5 rounded-lg border border-neutral-800">
                          <span className="text-neutral-500 block text-[10px] uppercase font-sans font-bold">
                            IFSC / Branch:
                          </span>
                          <span className="font-bold text-white text-xs">
                            {u.bankDetails.ifsc} ({u.bankDetails.branchName})
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-neutral-500 italic block text-xs">
                        User has not updated bank account details yet.
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
