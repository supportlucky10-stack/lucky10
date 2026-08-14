import React, { useState } from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';
import { useApp } from '../../context/AppContext';
import { Calendar, CheckCircle2, ChevronDown } from 'lucide-react';
import type { GameSlot } from '../../types';

export const TodaysResultView: React.FC = () => {
  const { gameResults } = useApp();
  const [activeGameSlot, setActiveGameSlot] = useState<GameSlot>('1 PM Game');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isGameDropdownOpen, setIsGameDropdownOpen] = useState(false);

  const games: GameSlot[] = ['1 PM Game', '3 PM Game', '6 PM Game', '8 PM Game'];

  // Game slot specific color themes
  const slotThemeStyles: Record<GameSlot, { pillActive: string; cardBorder: string; badgeActive: string; textActive: string }> = {
    '1 PM Game': {
      pillActive: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white border-2 border-sky-300 shadow-[0_0_12px_rgba(59,130,246,0.5)]',
      cardBorder: 'border-2 border-sky-400/90 shadow-[0_0_15px_rgba(59,130,246,0.25)]',
      badgeActive: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-sky-300',
      textActive: 'text-sky-300',
    },
    '3 PM Game': {
      pillActive: 'bg-gold-metallic text-black border-2 border-gold-dark shadow-[0_0_12px_rgba(184,137,40,0.5)]',
      cardBorder: 'border-2 border-gold/90 shadow-[0_0_15px_rgba(184,137,40,0.25)]',
      badgeActive: 'bg-gold-metallic text-black border-black',
      textActive: 'text-gold',
    },
    '6 PM Game': {
      pillActive: 'bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 text-white border-2 border-fuchsia-300 shadow-[0_0_12px_rgba(217,70,239,0.5)]',
      cardBorder: 'border-2 border-fuchsia-400/90 shadow-[0_0_15px_rgba(217,70,239,0.25)]',
      badgeActive: 'bg-gradient-to-r from-fuchsia-500 to-rose-600 text-white border-fuchsia-300',
      textActive: 'text-fuchsia-300',
    },
    '8 PM Game': {
      pillActive: 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600 text-black border-2 border-teal-300 shadow-[0_0_12px_rgba(20,184,166,0.5)]',
      cardBorder: 'border-2 border-teal-400/90 shadow-[0_0_15px_rgba(20,184,166,0.25)]',
      badgeActive: 'bg-gradient-to-r from-emerald-400 to-teal-500 text-black border-black',
      textActive: 'text-teal-300',
    },
  };

  const getResultForSlotAndDate = (slot: GameSlot, dateStr: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateStr === todayStr && gameResults[slot]) {
      return gameResults[slot];
    }

    const p1 = String((dateStr.charCodeAt(8) * 11 + slot.charCodeAt(0) * 7) % 900 + 100);
    const p2 = String((dateStr.charCodeAt(9) * 13 + slot.charCodeAt(0) * 9) % 900 + 100);
    const p3 = String((dateStr.charCodeAt(7) * 17 + slot.charCodeAt(1) * 5) % 900 + 100);
    const p4 = String((dateStr.charCodeAt(6) * 19 + slot.charCodeAt(2) * 3) % 900 + 100);

    const compliments = [
      [String(Number(p1) + 1), String(Number(p1) - 1), String(Number(p1) + 2), String(Number(p1) - 2), String(Number(p1) + 3)],
      [String(Number(p2) + 1), String(Number(p2) - 1), String(Number(p2) + 2), String(Number(p2) - 2), String(Number(p2) + 3)],
      [String(Number(p3) + 1), String(Number(p3) - 1), String(Number(p3) + 2), String(Number(p3) - 2), String(Number(p3) + 3)],
      [String(Number(p4) + 1), String(Number(p4) - 1), String(Number(p4) + 2), String(Number(p4) - 2), String(Number(p4) + 3)],
      ['529', '631', '412', '908', '216'],
      ['111', '222', '333', '444', '555'],
    ];

    return {
      id: `res-${dateStr}-${slot}`,
      date: dateStr,
      gameSlot: slot,
      prize1: p1,
      prize2: p2,
      prize3: p3,
      prize4: p4,
      prize5: '408',
      compliments: compliments,
      publishedAt: '1:00 PM',
    };
  };

  const activeDate = selectedDate;
  const currentResult = getResultForSlotAndDate(activeGameSlot, activeDate);
  const currentTheme = slotThemeStyles[activeGameSlot];

  // Format active date as DD-MM-YYYY for clear display
  const dateParts = activeDate.split('-');
  const displayDateFormatted = dateParts.length === 3
    ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
    : activeDate;

  // Header Title shows Result only per user request
  const slotTitle = 'Result';

  const handleShareToWhatsApp = () => {
    const formattedDate = displayDateFormatted;

    const slotTimeMap: Record<string, string> = {
      '1 PM Game': '01:00 PM',
      '3 PM Game': '03:00 PM',
      '6 PM Game': '06:00 PM',
      '8 PM Game': '08:00 PM',
    };
    const formattedTime = slotTimeMap[activeGameSlot] || activeGameSlot.replace(' Game', '');

    const rawList = currentResult.compliments ? currentResult.compliments.flat() : [];
    const fallbackList = [
      '007', '026', '050', '122', '155', '187',
      '192', '217', '237', '285', '339', '349',
      '360', '390', '488', '525', '534', '543',
      '597', '608', '621', '624', '682', '723',
      '803', '839', '862', '886', '915', '941'
    ];
    const compliments30 = Array.from({ length: 30 }, (_, index) => {
      const val = rawList[index] || fallbackList[index];
      return String(val).padStart(3, '0');
    });

    const complimentRows: string[] = [];
    for (let i = 0; i < 30; i += 6) {
      const row = compliments30.slice(i, i + 6).join(' | ') + ' |';
      complimentRows.push(row);
    }
    const formattedCompliments = complimentRows.join('\n');

    const text = `${formattedDate}\n${formattedTime}\n\n1 - ${currentResult.prize1 || '---'}\n2 - ${currentResult.prize2 || '---'}\n3 - ${currentResult.prize3 || '---'}\n4 - ${currentResult.prize4 || '---'}\n5 - ${currentResult.prize5 || '408'}\n\nOthers:-\n${formattedCompliments}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-28 sm:pb-36 antialiased select-none">
      {/* Gold Header Banner with exact Date + Slot Time for Crystal-Clear Screenshots */}
      <HeaderBanner title={slotTitle} />

      <div className="max-w-xl mx-auto w-full px-3.5 sm:px-6 py-4 space-y-4">
        
        {/* Integrated Single-View Date Control (Active Date Pill + Integrated Calendar Selector) */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-950 rounded-xl border border-neutral-800 text-xs sm:text-sm font-extrabold shadow">
          {/* Active Selected Date Display Pill */}
          <button
            onClick={() => {
              setSelectedDate(new Date().toISOString().split('T')[0]);
              window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            }}
            className="py-2.5 px-3 bg-gold-metallic text-black rounded-lg transition-all flex items-center justify-center text-center cursor-pointer shadow hover:brightness-110 active:scale-98"
            title="Click to reset to Today"
          >
            <span className="font-black text-sm sm:text-base tracking-wide">{displayDateFormatted}</span>
          </button>

          {/* Direct Calendar Date Picker (Opens Calendar directly) */}
          <div
            onClick={(e) => {
              const input = e.currentTarget.querySelector('input');
              input?.showPicker?.();
            }}
            className="py-2.5 px-3 bg-neutral-900 text-neutral-300 hover:text-white rounded-lg transition-all flex items-center justify-center gap-2 text-center cursor-pointer relative group border border-neutral-800 hover:border-gold/50"
          >
            <Calendar className="w-4 h-4 text-gold group-hover:scale-110 transition-transform shrink-0" />
            <span className="truncate font-black">Change date</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(e.target.value);
                  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>
        </div>

        {/* Game Slot Selector Dropdown Option (Click to expand game options) */}
        <div className="w-full relative">
          <button
            onClick={() => setIsGameDropdownOpen(!isGameDropdownOpen)}
            className={`w-full py-2.5 sm:py-3 px-4 rounded-xl font-black text-xs sm:text-sm uppercase flex items-center justify-between transition-all cursor-pointer shadow-md border ${currentTheme.pillActive}`}
          >
            <div className="flex items-center gap-2">
              <span className="opacity-80 text-[10px] sm:text-xs tracking-wider uppercase">TIME:</span>
              <span className="font-black tracking-wider text-xs sm:text-sm">{activeGameSlot.replace(' Game', '')}</span>
            </div>
            <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${isGameDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isGameDropdownOpen && (
            <div className="mt-2 p-2 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5 shadow-2xl animate-drop-in z-20 relative">
              {games.map((slot) => {
                const theme = slotThemeStyles[slot];
                const isSelected = slot === activeGameSlot;
                return (
                  <button
                    key={slot}
                    onClick={() => {
                      setActiveGameSlot(slot);
                      setIsGameDropdownOpen(false);
                      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                    }}
                    className={`w-full py-2.5 px-4 rounded-lg font-black text-xs sm:text-sm uppercase tracking-wide flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? theme.pillActive
                        : 'bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <span>{slot.replace(' Game', '')}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 5 Winning Number Cards (1st Prize featured slightly larger, 2nd-5th compact) */}
        <div className="space-y-1.5">
          {[
            { id: 1, val: currentResult.prize1, delay: '0ms', isFirst: true },
            { id: 2, val: currentResult.prize2, delay: '120ms', isFirst: false },
            { id: 3, val: currentResult.prize3, delay: '240ms', isFirst: false },
            { id: 4, val: currentResult.prize4, delay: '360ms', isFirst: false },
            { id: 5, val: currentResult.prize5 || '408', delay: '480ms', isFirst: false },
          ].map((item) => (
            <div
              key={`prize-${item.id}-${activeDate}-${activeGameSlot}`}
              style={{ animationDelay: item.delay }}
              className={`flex items-center justify-start rounded-xl bg-neutral-950 ${currentTheme.cardBorder} animate-drop-in transition-all ${
                item.isFirst
                  ? 'py-2.5 px-3.5 sm:py-3 sm:px-4 shadow-md border-2'
                  : 'py-1.5 px-3 sm:py-2 sm:px-3.5 shadow-sm border'
              }`}
            >
              <div className="flex items-center gap-3 w-full">
                <div
                  className={`flex items-center justify-center rounded-lg border shrink-0 font-black aspect-square ${currentTheme.badgeActive} ${
                    item.isFirst
                      ? 'w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 min-w-[34px] min-h-[34px] max-w-[34px] max-h-[34px] sm:min-w-[38px] sm:min-h-[38px] text-sm sm:text-base'
                      : 'w-6.5 h-6.5 sm:w-7 sm:h-7 min-w-[26px] min-h-[26px] max-w-[26px] max-h-[26px] sm:min-w-[28px] sm:min-h-[28px] text-xs sm:text-xs'
                  }`}
                >
                  {item.id}
                </div>
                <div className="flex items-center flex-1">
                  <span
                    className={`font-black font-sans tracking-widest block text-white ${
                      item.isFirst
                        ? 'text-lg sm:text-xl font-black'
                        : 'text-sm sm:text-base font-bold'
                    }`}
                  >
                    {item.val || '---'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Compliments Matrix Table (30 total boxes: 5 columns x 6 rows) */}
        {(() => {
          const rawList = currentResult.compliments ? currentResult.compliments.flat() : [];
          const fallbackList = [
            '007', '026', '050', '122', '155', '187',
            '192', '217', '237', '285', '339', '349',
            '360', '390', '488', '525', '534', '543',
            '597', '608', '621', '624', '682', '723',
            '803', '839', '862', '886', '915', '941'
          ];
          const compliments30 = Array.from({ length: 30 }, (_, index) => {
            return rawList[index] || fallbackList[index];
          });

          return (
            <div
              key={`compliments-${activeDate}-${activeGameSlot}`}
              style={{ animationDelay: '600ms' }}
              className="bg-neutral-950 text-white rounded-xl p-3 sm:p-4 shadow-lg border border-neutral-800 space-y-2 animate-drop-in hover:border-gold/40 transition-all"
            >
              <h3 className="font-black text-sm sm:text-base text-gold text-center border-b border-neutral-800 pb-1.5 uppercase tracking-wider">
                Compliments
              </h3>

              <div className="grid grid-cols-5 gap-px bg-neutral-800 border border-neutral-800 rounded-lg overflow-hidden">
                {compliments30.map((val, idx) => (
                  <div
                    key={idx}
                    className="bg-black py-2 sm:py-2.5 text-center text-sm sm:text-base font-sans font-black text-neutral-100 tracking-wider"
                  >
                    {val}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Full-width WhatsApp Share Action Button */}
        <div className="pt-3 pb-4 w-full flex justify-center">
          <button
            onClick={handleShareToWhatsApp}
            className="w-full py-3 sm:py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:brightness-110 active:scale-[0.98] text-white font-black text-xs sm:text-sm tracking-wider uppercase rounded-xl shadow-[0_4px_15px_rgba(16,185,129,0.3)] border border-emerald-400 flex items-center justify-center gap-2.5 transition-all cursor-pointer group"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 fill-white shrink-0 group-hover:rotate-6 transition-transform"
              viewBox="0 0 24 24"
            >
              <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.93 9.93 0 0 0 1.371 5.034l-1.458 5.328 5.461-1.431a9.92 9.92 0 0 0 4.614 1.155h.004c5.505 0 9.988-4.478 9.99-9.984 0-2.668-1.039-5.176-2.927-7.062a9.92 9.92 0 0 0-7.065-2.924zm5.72 12.721c-.25.705-1.246 1.346-1.74 1.399-.445.048-1.025.074-1.656-.128-.386-.123-.882-.284-1.528-.563-2.696-1.164-4.448-3.902-4.584-4.084-.135-.182-1.107-1.474-1.107-2.81 0-1.336.7-1.993.951-2.259.251-.266.548-.333.73-.333.183 0 .365.002.525.01.171.008.401-.065.626.476.233.56.79 1.93.858 2.07.069.14.115.305.023.488-.092.183-.138.297-.274.457-.137.16-.288.358-.411.48-.137.137-.28.286-.12.56.16.274.71 1.171 1.524 1.895 1.047.93 1.931 1.22 2.205 1.357.274.137.434.114.594-.069.16-.183.685-.798.868-1.072.183-.274.365-.228.616-.137.251.091 1.598.753 1.872.89.274.137.457.205.525.32.069.114.069.662-.181 1.367z" />
            </svg>
            <span>SHARE RESULT TO WHATSAPP</span>
          </button>
        </div>

      </div>
    </div>
  );
};
