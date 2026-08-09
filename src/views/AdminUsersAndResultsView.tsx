import React, { useState } from 'react';
import { HeaderBanner } from '../components/HeaderBanner';
import { useApp } from '../context/AppContext';
import type { GameSlot } from '../types';
import { Trash2, UserX } from 'lucide-react';

export const AdminUsersAndResultsView: React.FC = () => {
  const { registeredUsers, publishGameResult, deleteUser, clearAllUsers, addToast } = useApp();
  const [selectedSlot, setSelectedSlot] = useState<GameSlot>('1 PM Game');

  const [prize1, setPrize1] = useState('742');
  const [prize2, setPrize2] = useState('819');
  const [prize3, setPrize3] = useState('350');
  const [prize4, setPrize4] = useState('194');

  const [searchDate, setSearchDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prize1 || !prize2 || !prize3 || !prize4) {
      addToast('Please fill all 4 winning prize numbers', 'error');
      return;
    }

    const mockCompliments = [
      [(parseInt(prize1) + 1).toString(), (parseInt(prize1) - 1).toString(), '744', '740'],
      [(parseInt(prize2) + 1).toString(), (parseInt(prize2) - 1).toString(), '821', '817'],
      [(parseInt(prize3) + 1).toString(), (parseInt(prize3) - 1).toString(), '352', '348'],
      [(parseInt(prize4) + 1).toString(), (parseInt(prize4) - 1).toString(), '196', '192'],
      ['529', '631', '412', '908'],
      ['111', '222', '333', '444'],
    ];

    publishGameResult(selectedSlot, prize1, prize2, prize3, prize4, mockCompliments);
  };

  return (
    <div className="w-full flex-1 bg-black text-white flex flex-col justify-start overflow-y-auto pb-32 sm:pb-36">
      {/* Gold Header matching Page 14 */}
      <HeaderBanner title="Users List" />

      <div className="px-6 py-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* Result Publish Section matching Page 14 */}
        <div className="bg-neutral-900 border border-gold/30 p-5 rounded-xl space-y-3">
          <h2 className="text-lg font-black text-white tracking-wide border-b border-neutral-800 pb-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-black p-1 flex items-center justify-center shrink-0 border border-gold/80 shadow">
              <img src="/assets/gold-calendar.png" alt="Calendar" className="w-full h-full object-contain filter drop-shadow" />
            </div>
            <span>Result Publish</span>
          </h2>

          <form onSubmit={handlePublish} className="space-y-3">
            <div>
              <label className="text-xs text-neutral-400 font-bold block mb-1">
                Select Game Slot:
              </label>
              <select
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value as GameSlot)}
                className="w-full px-3 py-2 bg-black border border-neutral-700 text-gold font-bold text-sm rounded-md"
              >
                <option value="1 PM Game">1 PM Game</option>
                <option value="4 PM Game">4 PM Game</option>
                <option value="6 PM Game">6 PM Game</option>
                <option value="8 PM Game">8 PM Game</option>
              </select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-neutral-400 font-bold block mb-1">1st Prize</span>
                <input
                  type="text"
                  maxLength={3}
                  value={prize1}
                  onChange={(e) => setPrize1(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black font-mono font-bold text-sm rounded-md"
                />
              </div>

              <div>
                <span className="text-neutral-400 font-bold block mb-1">2nd Prize</span>
                <input
                  type="text"
                  maxLength={3}
                  value={prize2}
                  onChange={(e) => setPrize2(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black font-mono font-bold text-sm rounded-md"
                />
              </div>

              <div>
                <span className="text-neutral-400 font-bold block mb-1">3rd Prize</span>
                <input
                  type="text"
                  maxLength={3}
                  value={prize3}
                  onChange={(e) => setPrize3(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black font-mono font-bold text-sm rounded-md"
                />
              </div>

              <div>
                <span className="text-neutral-400 font-bold block mb-1">4th Prize</span>
                <input
                  type="text"
                  maxLength={3}
                  value={prize4}
                  onChange={(e) => setPrize4(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black font-mono font-bold text-sm rounded-md"
                />
              </div>
            </div>

            <button type="submit" className="w-full py-3 bg-gold-metallic text-black font-extrabold text-sm rounded-md uppercase">
              PUBLISH RESULT
            </button>
          </form>
        </div>

        {/* Results History Search Option matching Page 14 */}
        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-black p-1 flex items-center justify-center shrink-0 border border-gold/70 shadow">
                <img src="/assets/gold-trophy.png" alt="Trophy" className="w-full h-full object-contain filter drop-shadow" />
              </div>
              <span>Results History</span>
            </h2>
            <span className="text-xs text-neutral-400">Search Option (daily &amp; previous dates)</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="flex-1 bg-black border border-neutral-700 text-white font-mono text-xs px-3 py-2.5 rounded-md"
            />
            <button className="px-5 py-2.5 bg-gold-metallic text-black text-xs font-bold rounded-md">SEARCH</button>
          </div>
        </div>

        {/* Registered Users Table with Delete All & Individual Delete */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-black p-1 flex items-center justify-center shrink-0 border border-gold/80 shadow">
                <img src="/assets/gold-ticket.png" alt="Users" className="w-full h-full object-contain filter drop-shadow" />
              </div>
              <span>Registered Users ({registeredUsers.length})</span>
            </h2>
            
            {registeredUsers.length > 0 && (
              <button
                onClick={clearAllUsers}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 rounded-md text-xs font-bold transition-colors"
                title="Delete all registered user accounts"
              >
                <UserX className="w-4 h-4" /> Delete All Users
              </button>
            )}
          </div>

          <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950 shadow-md">
            <div className="grid grid-cols-12 bg-neutral-900 text-gold text-xs font-bold py-2.5 px-4">
              <span className="col-span-3">User</span>
              <span className="col-span-5">Email</span>
              <span className="col-span-2 text-right">Balance</span>
              <span className="col-span-2 text-center">Action</span>
            </div>

            <div className="divide-y divide-neutral-900 text-xs">
              {registeredUsers.length === 0 ? (
                <div className="py-8 text-center text-neutral-500 italic">
                  No registered users found.
                </div>
              ) : (
                registeredUsers.map((u) => (
                  <div key={u.id} className="grid grid-cols-12 py-3 px-4 items-center">
                    <span className="col-span-3 font-bold text-white truncate">{u.name}</span>
                    <span className="col-span-5 text-neutral-400 text-xs truncate">{u.email}</span>
                    <span className="col-span-2 text-right font-mono font-bold text-gold">
                      ₹{u.balance}
                    </span>
                    <div className="col-span-2 flex justify-center">
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="p-1 text-rose-400 hover:text-rose-200 hover:bg-rose-950/50 rounded transition-colors"
                        title={`Delete ${u.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
