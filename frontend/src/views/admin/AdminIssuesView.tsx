import React, { useState } from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, CheckCircle, Clock, FileText, Filter, User } from 'lucide-react';

interface IssueTicket {
  id: string;
  userName: string;
  userEmail: string;
  category: 'Payment Issues' | 'Game Related' | 'Account Issues' | 'Other Queries';
  description: string;
  attachment?: string;
  date: string;
  status: 'PENDING' | 'RESOLVED';
}

export const AdminIssuesView: React.FC = () => {
  const { addToast } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('ALL');

  const [issuesList, setIssuesList] = useState<IssueTicket[]>([]);

  const toggleStatus = (id: string) => {
    setIssuesList((prev) =>
      prev.map((iss) => {
        if (iss.id === id) {
          const nextStatus = iss.status === 'PENDING' ? 'RESOLVED' : 'PENDING';
          addToast(`Issue ${id} marked as ${nextStatus}!`, 'success');
          return { ...iss, status: nextStatus };
        }
        return iss;
      })
    );
  };

  const categories = ['All', 'Payment Issues', 'Game Related', 'Account Issues', 'Other Queries'];

  const filteredIssues = issuesList.filter((iss) => {
    const matchesCat = selectedCategory === 'All' || iss.category === selectedCategory;
    const matchesStatus = statusFilter === 'ALL' || iss.status === statusFilter;
    return matchesCat && matchesStatus;
  });

  const totalCount = issuesList.length;
  const pendingCount = issuesList.filter((i) => i.status === 'PENDING').length;
  const resolvedCount = issuesList.filter((i) => i.status === 'RESOLVED').length;

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-16 select-none">
      {/* Gold Header */}
      <HeaderBanner title="Issues Management" />

      <div className="px-4 sm:px-6 py-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* Total Counts Header Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-xl flex flex-col items-center justify-center text-center">
            <span className="text-neutral-400 text-xs font-bold uppercase tracking-wider mb-1">Total Issues</span>
            <span className="text-white font-extrabold text-xl sm:text-2xl font-mono">{totalCount}</span>
          </div>

          <div className="bg-neutral-900 border border-rose-500/40 p-3.5 rounded-xl flex flex-col items-center justify-center text-center">
            <span className="text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">Pending</span>
            <span className="text-rose-300 font-extrabold text-xl sm:text-2xl font-mono">{pendingCount}</span>
          </div>

          <div className="bg-neutral-900 border border-emerald-500/40 p-3.5 rounded-xl flex flex-col items-center justify-center text-center">
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">Resolved</span>
            <span className="text-emerald-300 font-extrabold text-xl sm:text-2xl font-mono">{resolvedCount}</span>
          </div>
        </div>

        {/* Category Filters */}
        <div className="bg-neutral-950 border border-gold/30 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <h3 className="text-sm font-black text-gold uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-gold" /> Filter By Issue Category
            </h3>
            
            <div className="flex gap-1 text-[11px] font-bold">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded transition-colors ${statusFilter === 'ALL' ? 'bg-gold text-black' : 'text-neutral-400 hover:text-white'}`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-2.5 py-1 rounded transition-colors ${statusFilter === 'PENDING' ? 'bg-rose-500 text-white' : 'text-neutral-400 hover:text-white'}`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('RESOLVED')}
                className={`px-2.5 py-1 rounded transition-colors ${statusFilter === 'RESOLVED' ? 'bg-emerald-500 text-white' : 'text-neutral-400 hover:text-white'}`}
              >
                Resolved
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 pt-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-gold-metallic text-black shadow-md'
                    : 'bg-neutral-900 text-neutral-300 border border-neutral-800 hover:border-gold/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Issues List Cards */}
        <div className="space-y-3">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-gold" />
            <span>Reported User Issues ({filteredIssues.length})</span>
          </h2>

          {filteredIssues.length === 0 ? (
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-8 text-center text-neutral-500 italic text-xs">
              No issue tickets found for the selected category filter.
            </div>
          ) : (
            filteredIssues.map((iss) => (
              <div
                key={iss.id}
                className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3 hover:border-gold/30 transition-colors shadow-md"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-900 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-neutral-900 p-1 flex items-center justify-center text-gold border border-gold/40">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white text-sm block">{iss.userName}</span>
                      <span className="text-neutral-400 text-xs font-mono">{iss.userEmail}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-gold/10 border border-gold/40 text-gold font-bold text-[11px] rounded-md">
                      {iss.category}
                    </span>

                    <span
                      className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md flex items-center gap-1 ${
                        iss.status === 'RESOLVED'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {iss.status === 'RESOLVED' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {iss.status}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                  {iss.description}
                </p>

                {/* Footer details & Action */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-900 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-500 text-[11px] font-mono">{iss.date}</span>
                    {iss.attachment && (
                      <span className="text-gold font-mono text-[11px] flex items-center gap-1 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                        <FileText className="w-3 h-3 text-gold" /> {iss.attachment}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStatus(iss.id)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                        iss.status === 'PENDING'
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                      }`}
                    >
                      {iss.status === 'PENDING' ? 'Mark Resolved' : 'Reopen Issue'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
