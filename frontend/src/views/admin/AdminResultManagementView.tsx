import React, { useState } from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';
import { useApp } from '../../context/AppContext';
import type { GameSlot } from '../../types';
import { Calendar, CheckCircle2, Sparkles, Plus } from 'lucide-react';
import goldCalendar from '../../assets/gold-calendar.png';
import goldTrophy from '../../assets/gold-trophy.png';

export const AdminResultManagementView: React.FC = () => {
  const { publishGameResult, gameResults, addToast } = useApp();

  const [selectedSlot, setSelectedSlot] = useState<GameSlot>('1 PM Game');
  const [prize1, setPrize1] = useState('742');
  const [prize2, setPrize2] = useState('819');
  const [prize3, setPrize3] = useState('350');
  const [prize4, setPrize4] = useState('194');

  // Simple Individual Compliment Number Boxes State
  const [complimentSlot, setComplimentSlot] = useState<GameSlot>('1 PM Game');
  const [complimentBoxes, setComplimentBoxes] = useState<string[]>([
    '743',
    '741',
    '820',
    '818',
    '351',
    '349',
    '195',
    '193',
  ]);

  const [searchDate, setSearchDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prize1 || !prize2 || !prize3 || !prize4) {
      addToast('Please fill all 4 winning prize numbers', 'error');
      return;
    }

    const fallbackCompliments = [
      [(parseInt(prize1) + 1).toString(), (parseInt(prize1) - 1).toString(), '744', '740'],
      [(parseInt(prize2) + 1).toString(), (parseInt(prize2) - 1).toString(), '821', '817'],
      [(parseInt(prize3) + 1).toString(), (parseInt(prize3) - 1).toString(), '352', '348'],
      [(parseInt(prize4) + 1).toString(), (parseInt(prize4) - 1).toString(), '196', '192'],
    ];

    publishGameResult(
      selectedSlot,
      prize1,
      prize2,
      prize3,
      prize4,
      fallbackCompliments
    );
  };

  const handleAddStandaloneCompliments = (e: React.FormEvent) => {
    e.preventDefault();
    const validNumbers = complimentBoxes.map((n) => n.trim()).filter((n) => n.length > 0);
    if (validNumbers.length === 0) {
      addToast('Please fill at least one compliment number box', 'error');
      return;
    }

    const complimentSets: string[][] = [];
    for (let i = 0; i < validNumbers.length; i += 4) {
      complimentSets.push(validNumbers.slice(i, i + 4));
    }

    const currentRes = gameResults[complimentSlot];

    publishGameResult(
      complimentSlot,
      currentRes?.prize1 || prize1,
      currentRes?.prize2 || prize2,
      currentRes?.prize3 || prize3,
      currentRes?.prize4 || prize4,
      complimentSets
    );

    addToast(`Compliments results saved for ${complimentSlot}!`, 'success');
  };

  const gameSlots: GameSlot[] = ['1 PM Game', '3 PM Game', '6 PM Game', '8 PM Game'];

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-16 select-none">
      {/* Gold Header */}
      <HeaderBanner title="Result Management" />

      <div className="px-4 sm:px-6 py-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* Option 1: Result Publish Section */}
        <div className="bg-neutral-950 border border-gold/40 p-5 rounded-xl space-y-4 shadow-md overflow-hidden">
          <h2 className="text-lg font-black text-white tracking-wide border-b border-neutral-800 pb-3 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-black p-1 flex items-center justify-center shrink-0 border border-gold/80 shadow">
              <img src={goldCalendar} alt="Result Publish" className="w-full h-full object-contain filter drop-shadow" />
            </div>
            <span>Result Publish</span>
          </h2>

          <form onSubmit={handlePublish} className="space-y-4">
            <div>
              <label className="text-xs text-neutral-400 font-bold block mb-2">
                Select Game Slot:
              </label>
              
              {/* Responsive Non-Overflowing Game Slot Selector Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {gameSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2.5 px-3 rounded-lg text-xs font-black transition-all text-center border cursor-pointer truncate ${
                      selectedSlot === slot
                        ? 'bg-gold-metallic text-black border-gold shadow-md'
                        : 'bg-black text-neutral-300 border-neutral-800 hover:border-gold/50'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-neutral-400 font-bold block mb-1">1st Prize Number</span>
                <input
                  type="text"
                  maxLength={3}
                  value={prize1}
                  onChange={(e) => setPrize1(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black font-mono font-black text-base rounded-md border-2 border-gold"
                  required
                />
              </div>

              <div>
                <span className="text-neutral-400 font-bold block mb-1">2nd Prize Number</span>
                <input
                  type="text"
                  maxLength={3}
                  value={prize2}
                  onChange={(e) => setPrize2(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black font-mono font-black text-base rounded-md border-2 border-gold"
                  required
                />
              </div>

              <div>
                <span className="text-neutral-400 font-bold block mb-1">3rd Prize Number</span>
                <input
                  type="text"
                  maxLength={3}
                  value={prize3}
                  onChange={(e) => setPrize3(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black font-mono font-black text-base rounded-md border-2 border-gold"
                  required
                />
              </div>

              <div>
                <span className="text-neutral-400 font-bold block mb-1">4th Prize Number</span>
                <input
                  type="text"
                  maxLength={3}
                  value={prize4}
                  onChange={(e) => setPrize4(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black font-mono font-black text-base rounded-md border-2 border-gold"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gold-metallic text-black font-black text-sm rounded-lg uppercase shadow-md hover:opacity-95 cursor-pointer"
            >
              PUBLISH RESULT NOW ({selectedSlot})
            </button>
          </form>
        </div>

        {/* Option 2: Add Compliments Results (Simple Individual 3-Digit Boxes) */}
        <div className="bg-neutral-950 border border-gold/40 p-5 rounded-xl space-y-4 shadow-md overflow-hidden">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h2 className="text-base font-black text-white flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-black p-1 flex items-center justify-center shrink-0 border border-gold/80 shadow">
                <Sparkles className="w-4 h-4 text-gold" />
              </div>
              <span>Add Compliments Results</span>
            </h2>
            <span className="text-xs text-gold font-mono font-bold">Simple 3-Digit Boxes</span>
          </div>

          <form onSubmit={handleAddStandaloneCompliments} className="space-y-4">
            <div>
              <label className="text-xs text-neutral-400 font-bold block mb-2">
                Select Game Slot:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {gameSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setComplimentSlot(slot)}
                    className={`py-2 px-3 rounded-lg text-xs font-black transition-all text-center border cursor-pointer truncate ${
                      complimentSlot === slot
                        ? 'bg-gold-metallic text-black border-gold shadow-md'
                        : 'bg-black text-neutral-300 border-neutral-800 hover:border-gold/50'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-neutral-400 font-bold block mb-2">
                Fill Compliment Winning Numbers:
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {complimentBoxes.map((num, idx) => (
                  <div key={idx} className="relative bg-neutral-900 p-2 rounded-lg border border-neutral-800">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-neutral-400 font-bold uppercase font-sans">
                        Compliment #{idx + 1}
                      </span>
                      {complimentBoxes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setComplimentBoxes(complimentBoxes.filter((_, i) => i !== idx))}
                          className="text-rose-400 hover:text-rose-200 text-xs font-bold px-1"
                          title="Remove box"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      maxLength={3}
                      value={num}
                      onChange={(e) => {
                        const updated = [...complimentBoxes];
                        updated[idx] = e.target.value;
                        setComplimentBoxes(updated);
                      }}
                      placeholder="000"
                      className="w-full px-3 py-1.5 bg-white text-black font-mono font-black text-sm rounded-md border-2 border-gold text-center"
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setComplimentBoxes([...complimentBoxes, ''])}
                className="mt-3 px-3.5 py-2 bg-neutral-900 border border-gold/40 text-gold text-xs font-bold rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Compliment Box
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-gold border border-gold/40 font-extrabold text-xs rounded-lg uppercase shadow transition-all cursor-pointer"
            >
              SAVE COMPLIMENTS RESULTS ({complimentSlot})
            </button>
          </form>
        </div>

        {/* Option 3: Results History Section */}
        <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-xl space-y-4 shadow-md overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
            <h2 className="text-base font-black text-white flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-black p-1 flex items-center justify-center shrink-0 border border-gold/80 shadow">
                <img src={goldTrophy} alt="Results History" className="w-full h-full object-contain filter drop-shadow" />
              </div>
              <span>Results History</span>
            </h2>
            <span className="text-xs text-neutral-400 italic">Daily &amp; Previous Dates Search</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="flex-1 bg-black border border-neutral-700 text-white font-mono text-xs px-3.5 py-2.5 rounded-lg min-w-[160px]"
            />
            <button className="px-5 py-2.5 bg-gold-metallic text-black text-xs font-extrabold rounded-lg uppercase shrink-0">
              SEARCH HISTORY
            </button>
          </div>

          {/* Display Published Slot Results for Selected Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {gameSlots.map((slot) => {
              const res = gameResults[slot];
              return (
                <div key={slot} className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl space-y-3 text-xs">
                  <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                    <span className="font-extrabold text-gold text-sm">{slot}</span>
                    <span className="text-neutral-400 font-mono text-xs flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gold" /> {searchDate}
                    </span>
                  </div>

                  {res ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-4 gap-1.5 text-center font-mono font-bold">
                        <div className="bg-black p-2 rounded-lg border border-gold/40">
                          <span className="text-[9px] text-neutral-400 block uppercase font-sans">1st Prize</span>
                          <span className="text-gold text-sm font-black">{res.prize1}</span>
                        </div>
                        <div className="bg-black p-2 rounded-lg border border-neutral-800">
                          <span className="text-[9px] text-neutral-400 block uppercase font-sans">2nd Prize</span>
                          <span className="text-white text-sm font-black">{res.prize2}</span>
                        </div>
                        <div className="bg-black p-2 rounded-lg border border-neutral-800">
                          <span className="text-[9px] text-neutral-400 block uppercase font-sans">3rd Prize</span>
                          <span className="text-white text-sm font-black">{res.prize3}</span>
                        </div>
                        <div className="bg-black p-2 rounded-lg border border-neutral-800">
                          <span className="text-[9px] text-neutral-400 block uppercase font-sans">4th Prize</span>
                          <span className="text-white text-sm font-black">{res.prize4}</span>
                        </div>
                      </div>

                      {/* Display Compliments Numbers if present */}
                      {res.compliments && res.compliments.length > 0 && (
                        <div className="bg-black/60 p-2 rounded-lg border border-neutral-800 text-[10px] space-y-1">
                          <span className="text-gold font-bold block uppercase font-sans">Compliments Results:</span>
                          <div className="flex flex-wrap gap-1 font-mono text-neutral-300">
                            {res.compliments.flat().map((num, idx) => (
                              <span key={idx} className="bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700 text-gold">
                                {num}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-1 text-[11px] text-emerald-400 font-bold pt-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Published
                      </div>
                    </div>
                  ) : (
                    <span className="text-neutral-500 italic block py-4 text-center text-xs">
                      Result not published yet for {slot}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
