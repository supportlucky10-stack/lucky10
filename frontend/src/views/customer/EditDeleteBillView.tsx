import React, { useState } from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';
import { useApp } from '../../context/AppContext';
import { Search, Trash2 } from 'lucide-react';

const formatPlacedAtDate = (str?: string): string => {
  if (!str) return '';
  // SQLite stores datetimes without timezone — force UTC interpretation
  let utcStr = str.trim();
  if (!utcStr.endsWith('Z') && !utcStr.includes('+') && !utcStr.match(/[+-]\d{2}:\d{2}$/)) {
    utcStr = utcStr.replace(' ', 'T') + 'Z';
  }
  const d = new Date(utcStr);
  if (isNaN(d.getTime())) return str;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${dd}/${mm}/${yy} ${hh}:${min}:${ss}`;
};

export const EditDeleteBillView: React.FC = () => {
  const { userTickets, placedTickets } = useApp();
  const [billIdInput, setBillIdInput] = useState('');
  const [searchedBill, setSearchedBill] = useState<any | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [deletedBillIds, setDeletedBillIds] = useState<string[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billIdInput.trim()) return;

    setHasSearched(true);
    const query = billIdInput.trim().replace('#', '');

    // Skip if already deleted
    if (deletedBillIds.includes(query)) {
      setSearchedBill(null);
      return;
    }

    const allBillsPool = placedTickets.length > 0 ? placedTickets : userTickets;
    const found = allBillsPool.find(
      (b: any) => b.id.toLowerCase() === query.toLowerCase()
    );

    setSearchedBill(found || null);
  };

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-28 sm:pb-36 antialiased select-none font-sans">
      {/* Header Banner matching theme */}
      <HeaderBanner title="DELETE BILL" showBack={true} />

      <div className={`max-w-md mx-auto w-full px-4 sm:px-6 py-6 space-y-6 flex-1 flex flex-col justify-center`}>
        
        {/* Search Input Box Card (Centered on Page) */}
        <form
          onSubmit={handleSearch}
          className="bg-neutral-950 border border-neutral-800 p-5 rounded-2xl shadow-xl space-y-4 my-auto"
        >
          <div className="space-y-1.5">
            <label className="text-[10px] sm:text-xs font-black text-gold uppercase tracking-wider block">
              ENTER BILL ID
            </label>
            <div className="relative">
              <input
                type="text"
                value={billIdInput}
                onChange={(e) => {
                  setBillIdInput(e.target.value);
                  setHasSearched(false);
                }}
                placeholder="e.g. 8127716"
                className="w-full bg-black border border-neutral-700 focus:border-gold text-white font-mono font-black text-sm px-4 py-3 rounded-xl placeholder:text-neutral-600 outline-none transition-all shadow-inner"
              />
              {billIdInput && (
                <button
                  type="button"
                  onClick={() => {
                    setBillIdInput('');
                    setSearchedBill(null);
                    setHasSearched(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs font-bold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gold-metallic text-black font-black text-sm tracking-wider uppercase rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 border border-gold-dark"
          >
            <Search className="w-4 h-4 stroke-[2.5]" />
            <span>FIND BILL</span>
          </button>
        </form>

        {/* Bill Search Results Container */}
        {hasSearched && (
          <div className="w-full animate-drop-in pt-2">
            {!searchedBill ? (
              <div className="p-6 bg-neutral-950 rounded-2xl border border-neutral-800 text-center space-y-2">
                <p className="text-sm font-bold text-neutral-400 italic font-mono">
                  No bill found for ID: <span className="text-gold font-mono font-black">"{billIdInput}"</span>
                </p>
              </div>
            ) : (
              <div className="bg-neutral-950 border border-gold/40 rounded-2xl overflow-hidden shadow-2xl space-y-0">
                
                {/* Bill ID Header Bar (Clean layout without top delete button) */}
                <div className="bg-neutral-900 border-b border-neutral-800 p-3.5 flex items-center justify-between font-mono">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-bold">BILL ID</span>
                    <span className="text-gold font-black text-base">#{searchedBill.id}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-bold">DATE &amp; TIME</span>
                    <span className="text-white font-extrabold text-xs">{formatPlacedAtDate(searchedBill.placedAt)}</span>
                  </div>
                </div>

                {/* Customer & Slot Info Bar */}
                <div className="bg-black/60 px-4 py-2.5 border-b border-neutral-850 flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-300">Slot <strong className="text-gold font-bold">{searchedBill.gameSlot}</strong></span>
                  <span className="text-neutral-300">Customer <strong className="text-white font-bold">{(searchedBill as any).customerName || 'Customer'}</strong></span>
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
                  {searchedBill.items.map((item: any, idx: number) => (
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
                    <span className="text-gold font-black text-base">₹{searchedBill.totalAmount}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(searchedBill.id)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer shadow border border-rose-500"
                  >
                    <Trash2 className="w-4 h-4 stroke-[2.5]" />
                    <span>DELETE</span>
                  </button>
                </div>

              </div>
            )}
          </div>
        )}

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
                  setDeletedBillIds((prev) => [...prev, confirmDeleteId]);
                  setSearchedBill(null);
                  setConfirmDeleteId(null);
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
  );
};
