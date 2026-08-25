import React, { useState } from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';
import { useApp } from '../../context/AppContext';
import { Search, Trash2, Copy, Check, CheckCircle2 } from 'lucide-react';
import { captureAndShareElement } from '../../utils/shareUtils';

const formatPlacedAtDate = (str?: string): string => {
  if (!str) return '';
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

const getDisplayNumber = (item: { number?: string; type?: string }): string => {
  const num = item.number || '';
  if (num.includes(':')) {
    return num.split(':')[1];
  }
  return num;
};

const formatCustomerName = (name?: string): string => {
  if (!name || name.trim().toLowerCase() === 'customer') return '';
  return name.trim();
};

export const EditDeleteBillView: React.FC = () => {
  const { userTickets, deleteTicket, addToast } = useApp();
  const [billIdInput, setBillIdInput] = useState('');
  const [searchedBill, setSearchedBill] = useState<any | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [deletedBillIds, setDeletedBillIds] = useState<string[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletedSuccessBillId, setDeletedSuccessBillId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedBillId, setCopiedBillId] = useState<string | null>(null);

  const handleCopyBillId = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedBillId(id);
    addToast(`Copied Bill ID ${id}`, 'success');
    setTimeout(() => {
      setCopiedBillId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

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

    const allBillsPool = userTickets;
    const found = allBillsPool.find(
      (b: any) => b.id.toLowerCase() === query.toLowerCase()
    );

    setSearchedBill(found || null);
  };

  const handleShareBillToWhatsApp = () => {
    if (!searchedBill) return;
    const ticketId = searchedBill.id;
    captureAndShareElement({
      elementId: 'edit-bill-card-container',
      fileName: `bill_${ticketId}.jpg`,
      title: `Bill Details - ${ticketId}`,
      textSummary: '',
    });
  };

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-28 sm:pb-36 antialiased select-none font-sans">
      {/* Header Banner matching theme */}
      <HeaderBanner
        title="DELETE BILL"
        showBack={true}
        rightElement={
          searchedBill ? (
            <button
              type="button"
              onClick={handleShareBillToWhatsApp}
              className="px-3 sm:px-3.5 py-1.5 bg-[#075e54] hover:bg-[#128c7e] active:scale-90 text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer border border-[#25d366]/40"
              title="Share to WhatsApp"
            >
              <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.93 9.93 0 0 0 1.371 5.034l-1.458 5.328 5.461-1.431a9.92 9.92 0 0 0 4.614 1.155h.004c5.505 0 9.988-4.478 9.99-9.984 0-2.668-1.039-5.176-2.927-7.062a9.92 9.92 0 0 0-7.065-2.924zm5.72 12.721c-.25.705-1.246 1.346-1.74 1.399-.445.048-1.025.074-1.656-.128-.386-.123-.882-.284-1.528-.563-2.696-1.164-4.448-3.902-4.584-4.084-.135-.182-1.107-1.474-1.107-2.81 0-1.336.7-1.993.951-2.259.251-.266.548-.333.73-.333.183 0 .365.002.525.01.171.008.401-.065.626.476.233.56.79 1.93.858 2.07.069.14.115.305.023.488-.092.183-.138.297-.274.457-.137.16-.288.358-.411.48-.137.137-.28.286-.12.56.16.274.71 1.171 1.524 1.895 1.047.93 1.931 1.22 2.205 1.357.274.137.434.114.594-.069.16-.183.685-.798.868-1.072.183-.274.365-.228.616-.137.251.091 1.598.753 1.872.89.274.137.457.205.525.32.069.114.069.662-.181 1.367z" />
              </svg>
              <span>Share</span>
            </button>
          ) : undefined
        }
      />

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
                placeholder="e.g. 2243297"
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
              <div id="edit-bill-card-container" className="bg-neutral-950 border border-gold/40 rounded-2xl overflow-hidden shadow-2xl space-y-0">
                
                {/* Bill ID Header Bar (Clean layout without top delete button) */}
                <div className="bg-neutral-900 border-b border-neutral-800 p-3.5 flex items-center justify-between font-mono">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-bold">BILL ID</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gold font-black text-base">{searchedBill.id}</span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyBillId(searchedBill.id, e)}
                        className="p-1 rounded-md bg-neutral-800 hover:bg-neutral-700 active:scale-90 text-neutral-300 hover:text-gold transition-all cursor-pointer inline-flex items-center justify-center border border-neutral-700 hover:border-gold/50"
                        title="Copy Bill ID"
                      >
                        {copiedBillId === searchedBill.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-right shrink-0 whitespace-nowrap">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-bold">DATE &amp; TIME</span>
                    <span className="text-white font-extrabold text-xs whitespace-nowrap font-mono">{formatPlacedAtDate(searchedBill.placedAt)}</span>
                  </div>
                </div>

                {/* Agency, Customer & Slot Info Bar */}
                <div className="bg-white px-4 py-2.5 border-b border-neutral-200 grid grid-cols-3 gap-2 text-xs font-mono text-neutral-800 items-center">
                  <div className="text-left">Agency: <strong className="text-black font-bold ml-1">{(searchedBill as any).agencyName || (searchedBill as any).userName || 'Agency'}</strong></div>
                  <div className="text-center">{formatCustomerName((searchedBill as any).customerName) ? <>Customer: <strong className="text-black font-bold ml-1">{formatCustomerName((searchedBill as any).customerName)}</strong></> : null}</div>
                  <div className="text-right">Slot: <strong className="text-black font-bold ml-1">{(searchedBill.gameSlot || '').replace(/\s*Game$/i, '')}</strong></div>
                </div>

                {/* Table Column Headers Bar */}
                <div className="bg-pink-100 text-neutral-900 font-mono text-xs font-black px-4 py-2.5 grid grid-cols-4 items-center text-center border-b border-neutral-200 uppercase tracking-wider">
                  <span className="text-left">GAME</span>
                  <span>NUM</span>
                  <span>COUNT</span>
                  <span className="text-right">AMOUNT</span>
                </div>

                {/* Table Rows in White Theme */}
                <div className="divide-y divide-neutral-200 font-mono text-xs font-bold bg-white text-black">
                  {searchedBill.items.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="grid grid-cols-4 px-4 py-3 bg-white text-center items-center font-mono"
                    >
                      <span className="text-left uppercase text-black font-black">{getDisplayGame(item)}</span>
                      <span className="text-black font-black tracking-wider text-sm">{getDisplayNumber(item)}</span>
                      <span className="text-black font-black text-sm">{item.count}</span>
                      <span className="text-right text-black font-mono font-bold">₹{item.totalAmount}</span>
                    </div>
                  ))}
                </div>

                {/* Bill Total Footer Bar with ONLY Bottom DELETE Button */}
                <div className="bg-neutral-900 border-t border-neutral-800 px-4 py-3.5 flex items-center justify-between font-mono gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-white uppercase font-black tracking-wider whitespace-nowrap">TOTAL AMOUNT</span>
                    <span className="text-white font-black text-lg whitespace-nowrap">₹{searchedBill.totalAmount}</span>
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
                Are you sure you want to delete Bill ID <strong className="text-gold">{confirmDeleteId}</strong> completely?
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 bg-neutral-900 text-neutral-300 font-bold text-xs rounded-xl border border-neutral-700 hover:text-white cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  if (!confirmDeleteId || isDeleting) return;
                  const targetId = confirmDeleteId;
                  setIsDeleting(true);
                  try {
                    await deleteTicket(targetId);
                    setDeletedBillIds((prev) => [...prev, targetId]);
                    setSearchedBill(null);
                    setConfirmDeleteId(null);
                    setDeletedSuccessBillId(targetId);
                  } catch (err: any) {
                    addToast(err?.message || 'Failed to delete bill', 'error');
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className={`flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase rounded-xl shadow cursor-pointer active:scale-95 transition-all ${
                  isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isDeleting ? 'DELETING...' : 'YES, DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BILL DELETED SUCCESS MODAL */}
      {deletedSuccessBillId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-drop-in select-none">
          <div className="bg-neutral-950 border-2 border-emerald-500 rounded-2xl max-w-xs w-full p-5 shadow-[0_0_40px_rgba(16,185,129,0.35)] space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div className="space-y-1 font-mono">
              <h4 className="font-black text-white text-base uppercase tracking-wide">
                BILL DELETED!
              </h4>
              <p className="text-sm font-bold text-emerald-400">
                Bill #{deletedSuccessBillId}
              </p>
              <p className="text-xs text-neutral-400">
                Permanently removed from all records and reports.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDeletedSuccessBillId(null)}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow cursor-pointer transition-all border border-emerald-400 font-mono"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
