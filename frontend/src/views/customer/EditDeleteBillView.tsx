import React, { useState } from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';
import { useApp } from '../../context/AppContext';
import { Search, Trash2 } from 'lucide-react';
import type { PlacedTicket } from '../../types';

export const EditDeleteBillView: React.FC = () => {
  const { userTickets } = useApp();
  const [billIdInput, setBillIdInput] = useState('');
  const [searchedBill, setSearchedBill] = useState<PlacedTicket | any | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletedTicketIds, setDeletedTicketIds] = useState<string[]>([]);

  // Realistic sample tickets for demonstration if userTickets is empty
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

  const allTickets = (userTickets && userTickets.length > 0 ? userTickets : sampleTickets).filter(
    (t) => !deletedTicketIds.includes(t.id)
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = billIdInput.trim().toLowerCase();
    setHasSearched(true);

    if (!query) {
      setSearchedBill(null);
      return;
    }

    // Find ticket by exact or partial ID match
    const found = allTickets.find(
      (t) => t.id.toLowerCase() === query || t.id.toLowerCase().includes(query)
    );

    if (found) {
      setSearchedBill(found);
    } else {
      setSearchedBill(null);
    }
  };

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start pb-28 sm:pb-36 antialiased select-none font-sans">
      {/* Gold Header Banner */}
      <HeaderBanner title="DELETE BILL" />

      {/* Main Search & Manage Container */}
      <div className="max-w-md mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        
        {/* Search Input Box */}
        <form onSubmit={handleSearch} className="w-full space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Type Bill Id here.."
              value={billIdInput}
              onChange={(e) => {
                setBillIdInput(e.target.value);
                if (!e.target.value.trim()) {
                  setHasSearched(false);
                  setSearchedBill(null);
                }
              }}
              className="w-full px-4 py-3 bg-white text-black font-extrabold text-sm sm:text-base rounded-xl border border-neutral-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-md font-mono"
            />
            {billIdInput && (
              <button
                type="button"
                onClick={() => {
                  setBillIdInput('');
                  setHasSearched(false);
                  setSearchedBill(null);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black font-bold text-xs"
              >
                Clear
              </button>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gold-metallic text-black font-black text-sm tracking-wider uppercase rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 border border-gold-dark"
          >
            <Search className="w-4 h-4 stroke-[2.5]" />
            <span>FIND BILL</span>
          </button>
        </form>

        {/* Bill Search Results Container (Matching Web App Dark Gold Theme) */}
        {hasSearched && (
          <div className="w-full animate-drop-in">
            {!searchedBill ? (
              <div className="p-6 bg-neutral-950 rounded-2xl border border-neutral-800 text-center space-y-2">
                <p className="text-sm font-bold text-neutral-400 italic font-mono">
                  No bill found for ID: <span className="text-gold font-mono font-black">"{billIdInput}"</span>
                </p>
              </div>
            ) : (
              <div className="bg-neutral-950 border border-gold/40 rounded-2xl overflow-hidden shadow-2xl space-y-0">
                
                {/* Bill ID Header Bar */}
                <div className="bg-neutral-900 border-b border-neutral-800 p-4 flex items-center justify-between font-mono">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-bold">BILL ID</span>
                    <span className="text-gold font-black text-base">#{searchedBill.id}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-bold">DATE &amp; TIME</span>
                    <span className="text-white font-extrabold text-xs">{searchedBill.placedAt}</span>
                  </div>
                </div>

                {/* Customer & Slot Info Bar */}
                <div className="bg-black/60 px-4 py-2.5 border-b border-neutral-850 flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-300">Slot: <strong className="text-gold font-bold">{searchedBill.gameSlot}</strong></span>
                  <span className="text-neutral-300">Customer: <strong className="text-white font-bold">{(searchedBill as any).customerName || 'Customer'}</strong></span>
                </div>

                {/* Table Column Headers Bar (GAME, NUM, COUNT, ACTION) */}
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

                      <button
                        onClick={() => setConfirmDeleteId(searchedBill.id)}
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
                  <span className="text-gold font-black text-base">₹{searchedBill.totalAmount}</span>
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
                  setSearchedBill(null);
                  setHasSearched(false);
                  setBillIdInput('');
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
