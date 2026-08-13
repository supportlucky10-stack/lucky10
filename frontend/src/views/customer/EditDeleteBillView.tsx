import React, { useState } from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';
import { useApp } from '../../context/AppContext';
import { Search, Trash2, Edit, Check, X } from 'lucide-react';
import type { PlacedTicket } from '../../types';

export const EditDeleteBillView: React.FC = () => {
  const { placedTickets, addToast } = useApp();
  const [billIdInput, setBillIdInput] = useState('');
  const [searchedBill, setSearchedBill] = useState<PlacedTicket | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedItems, setEditedItems] = useState<{ id: string; count: number }[]>([]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = billIdInput.trim().toLowerCase();
    if (!query) {
      addToast('Please enter a Bill ID', 'error');
      return;
    }

    setHasSearched(true);
    // Find ticket by exact or partial ID match
    const found = placedTickets.find(
      (t) => t.id.toLowerCase() === query || t.id.toLowerCase().includes(query)
    );

    if (found) {
      setSearchedBill(found);
      setEditedItems(found.items.map((i) => ({ id: i.id, count: i.count })));
      setIsEditing(false);
      addToast(`Bill found: ${found.id}`, 'success');
    } else {
      setSearchedBill(null);
      addToast(`No bill found for ID: "${billIdInput}"`, 'error');
    }
  };

  const handleDeleteBill = () => {
    if (!searchedBill) return;
    addToast(`Bill ${searchedBill.id} deleted successfully`, 'success');
    setSearchedBill(null);
    setBillIdInput('');
    setHasSearched(false);
  };

  const handleSaveEdits = () => {
    if (!searchedBill) return;
    addToast(`Bill ${searchedBill.id} updated successfully`, 'success');
    setIsEditing(false);
  };

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start pb-24 sm:pb-32 antialiased select-none">
      {/* Gold Header Banner */}
      <HeaderBanner title="Edit, delete Bill" />

      {/* Main Search & Manage Container - Centered on Screen */}
      <div className="max-w-md mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col justify-center items-center my-auto space-y-6">
        
        {/* Search Card matching Image 1 design */}
        <form onSubmit={handleSearch} className="w-full space-y-4">
          <div className="w-full">
            <input
              type="text"
              placeholder="Type Bill Id here.."
              value={billIdInput}
              onChange={(e) => setBillIdInput(e.target.value)}
              className="w-full px-4 py-3 bg-white text-black font-semibold text-sm sm:text-base rounded-xl border border-neutral-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-b from-[#edd177] via-[#c89825] to-[#996e19] text-black font-black text-sm tracking-wider uppercase rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4 stroke-[2.5]" />
            <span>FIND BILL</span>
          </button>
        </form>

        {/* Bill Search Results Details */}
        {hasSearched && (
          <div className="w-full">
            {!searchedBill ? (
              <div className="p-6 bg-neutral-950 rounded-2xl border border-neutral-800 text-center space-y-2">
                <p className="text-sm font-bold text-neutral-400 italic">
                  No bill found with ID: <span className="text-gold font-mono">{billIdInput}</span>
                </p>
              </div>
            ) : (
              <div className="p-4 sm:p-5 bg-neutral-950 rounded-2xl border-2 border-gold/70 shadow-[0_0_15px_rgba(184,137,40,0.15)] space-y-4 animate-drop-in">
                {/* Bill Header */}
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div>
                    <span className="text-xs text-neutral-400 uppercase font-extrabold block">BILL ID</span>
                    <span className="text-base font-black text-gold font-mono">{searchedBill.id}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-neutral-400 uppercase font-extrabold block">GAME SLOT</span>
                    <span className="text-xs font-black text-white bg-neutral-900 px-2.5 py-1 rounded-lg border border-neutral-800 inline-block">
                      {searchedBill.gameSlot}
                    </span>
                  </div>
                </div>

                {/* Items Table */}
                <div className="w-full border border-neutral-800 rounded-xl overflow-hidden bg-white text-black text-xs font-bold">
                  <div className="grid grid-cols-4 bg-gray-100 border-b border-gray-300 font-extrabold py-2 px-2 text-center">
                    <span>Type</span>
                    <span>Number</span>
                    <span>Count</span>
                    <span>Amount</span>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {searchedBill.items.map((item) => {
                      const displayType = item.number.includes(':')
                        ? item.number.split(':')[0]
                        : item.type === 'Direct'
                        ? 'SUPER'
                        : item.type === 'Shuffle'
                        ? 'BOX'
                        : item.type;
                      const displayNumber = item.number.includes(':')
                        ? item.number.split(':')[1]
                        : item.number;

                      const currentCount = isEditing
                        ? editedItems.find((e) => e.id === item.id)?.count || item.count
                        : item.count;

                      return (
                        <div key={item.id} className="grid grid-cols-4 py-2 px-2 items-center text-center">
                          <span className="font-extrabold text-purple-700 uppercase">{displayType}</span>
                          <span className="font-mono text-black">{displayNumber}</span>
                          <div>
                            {isEditing ? (
                              <input
                                type="number"
                                min={1}
                                max={50}
                                value={currentCount}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 1;
                                  setEditedItems((prev) =>
                                    prev.map((pi) => (pi.id === item.id ? { ...pi, count: val } : pi))
                                  );
                                }}
                                className="w-12 px-1 py-0.5 border border-neutral-400 rounded text-center bg-gray-50 text-black font-bold"
                              />
                            ) : (
                              <span className="font-mono text-black">{currentCount}</span>
                            )}
                          </div>
                          <span className="font-mono text-black">₹{currentCount * item.unitPrice}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bill Total */}
                <div className="flex items-center justify-between bg-black px-3.5 py-2.5 rounded-xl border border-neutral-800 text-xs font-black">
                  <span className="text-neutral-300">TOTAL AMOUNT:</span>
                  <span className="text-gold text-sm sm:text-base font-mono">
                    ₹{editedItems.reduce((acc, curr) => acc + curr.count * 10, 0)}
                  </span>
                </div>

                {/* Action Buttons: Edit / Save / Delete */}
                <div className="flex items-center gap-2 pt-1">
                  {!isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex-1 py-2.5 bg-neutral-900 text-gold border border-gold/50 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 hover:border-gold hover:bg-black transition-all cursor-pointer"
                      >
                        <Edit className="w-4 h-4 text-gold" />
                        <span>Edit Bill</span>
                      </button>

                      <button
                        onClick={handleDeleteBill}
                        className="flex-1 py-2.5 bg-red-950/80 text-rose-300 border border-rose-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-red-900 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 text-rose-400" />
                        <span>Delete Bill</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleSaveEdits}
                        className="flex-1 py-2.5 bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-600 transition-all cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Save Changes</span>
                      </button>

                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex-1 py-2.5 bg-neutral-800 text-neutral-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-neutral-700 transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
