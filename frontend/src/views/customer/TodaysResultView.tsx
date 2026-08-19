import React, { useState, useRef } from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, ChevronDown, Calendar } from 'lucide-react';
import type { GameSlot } from '../../types';
import { getLocalDateStr } from '../../utils/dateUtils';
import { captureAndShareElement } from '../../utils/shareUtils';

export const TodaysResultView: React.FC = () => {
  const { getResultForSlotAndDate } = useApp();
  const [activeGameSlot, setActiveGameSlot] = useState<GameSlot>('1 PM Game');
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateStr());
  const [isGameDropdownOpen, setIsGameDropdownOpen] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [, setRefreshTick] = useState(0);

  React.useEffect(() => {
    const handleResultUpdate = () => {
      setRefreshTick((prev) => prev + 1);
    };
    window.addEventListener('lucky10_results_updated', handleResultUpdate);
    return () => {
      window.removeEventListener('lucky10_results_updated', handleResultUpdate);
    };
  }, []);

  const games: GameSlot[] = ['1 PM Game', '3 PM Game', '6 PM Game', '8 PM Game'];

  // Game slot specific color themes
  const slotThemeStyles: Record<GameSlot, { pillActive: string; cardBorder: string; badgeActive: string; textActive: string }> = {
    '1 PM Game': {
      pillActive: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white border-2 border-sky-300 shadow-[0_0_12px_rgba(59,130,246,0.5)]',
      cardBorder: 'border border-sky-400/90 shadow-[0_0_10px_rgba(59,130,246,0.2)]',
      badgeActive: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-sky-300',
      textActive: 'text-sky-300',
    },
    '3 PM Game': {
      pillActive: 'bg-gradient-to-r from-[#9a3412] via-[#7c2d12] to-[#5a1e06] text-white border-2 border-orange-400/60 shadow-[0_0_12px_rgba(154,52,18,0.4)]',
      cardBorder: 'border border-orange-500/50 shadow-[0_0_10px_rgba(154,52,18,0.2)]',
      badgeActive: 'bg-gradient-to-r from-[#9a3412] to-[#7c2d12] text-white border-orange-400/60',
      textActive: 'text-orange-200',
    },
    '6 PM Game': {
      pillActive: 'bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 text-white border-2 border-fuchsia-300 shadow-[0_0_12px_rgba(217,70,239,0.5)]',
      cardBorder: 'border border-fuchsia-400/90 shadow-[0_0_10px_rgba(217,70,239,0.2)]',
      badgeActive: 'bg-gradient-to-r from-fuchsia-500 to-rose-600 text-white border-fuchsia-300',
      textActive: 'text-fuchsia-300',
    },
    '8 PM Game': {
      pillActive: 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600 text-black border-2 border-teal-300 shadow-[0_0_12px_rgba(20,184,166,0.5)]',
      cardBorder: 'border border-teal-400/90 shadow-[0_0_10px_rgba(20,184,166,0.2)]',
      badgeActive: 'bg-gradient-to-r from-emerald-400 to-teal-500 text-black border-black',
      textActive: 'text-teal-300',
    },
  };

  const triggerDatePicker = () => {
    if (dateInputRef.current) {
      if ('showPicker' in dateInputRef.current && typeof (dateInputRef.current as any).showPicker === 'function') {
        try {
          (dateInputRef.current as any).showPicker();
        } catch (err) {
          dateInputRef.current.click();
        }
      } else {
        dateInputRef.current.click();
      }
    }
  };

  const activeDate = selectedDate;
  const currentResult = getResultForSlotAndDate(activeGameSlot, activeDate);

  const currentTheme = slotThemeStyles[activeGameSlot];

  // Format active date as DD-MM-YYYY for clear display
  const dateParts = activeDate.split('-');
  const displayDateFormatted = dateParts.length === 3
    ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
    : activeDate;

  const handleShareToWhatsApp = () => {
    const formattedDate = displayDateFormatted;
    captureAndShareElement({
      elementId: 'result-view-container',
      fileName: `result_${activeGameSlot.replace(/\s+/g, '_')}_${formattedDate}.jpg`,
      title: `Result - ${activeGameSlot}`,
      textSummary: '',
    });
  };

  return (
    <div className="w-full min-h-[100dvh] min-h-screen bg-black text-white flex flex-col justify-between overflow-y-auto antialiased select-none font-sans pb-4">
      {/* Header Banner with WhatsApp Share Button on Right */}
      <HeaderBanner
        title="RESULT"
        showHome={false}
        rightElement={
          <button
            type="button"
            onClick={handleShareToWhatsApp}
            className="px-3 sm:px-3.5 py-1.5 bg-[#075e54] hover:bg-[#128c7e] active:scale-90 text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer border border-[#25d366]/40"
            title="Share to WhatsApp"
          >
            <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
              <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.93 9.93 0 0 0 1.371 5.034l-1.458 5.328 5.461-1.431a9.92 9.92 0 0 0 4.614 1.155h.004c5.505 0 9.988-4.478 9.99-9.984 0-2.668-1.039-5.176-2.927-7.062a9.92 9.92 0 0 0-7.065-2.924zm5.72 12.721c-.25.705-1.246 1.346-1.74 1.399-.445.048-1.025.074-1.656-.128-.386-.123-.882-.284-1.528-.563-2.696-1.164-4.448-3.902-4.584-4.084-.135-.182-1.107-1.474-1.107-2.81 0-1.336.7-1.993.951-2.259.251-.266.548-.333.73-.333.183 0 .365.002.525.01.171.008.401-.065.626.476.233.56.79 1.93.858 2.07.069.14.115.305.023.488-.092.183-.138.297-.274.457-.137.16-.288.358-.411.48-.137.137-.28.286-.12.56.16.274.71 1.171 1.524 1.895 1.047.93 1.931 1.22 2.205 1.357.274.137.434.114.594-.069.16-.183.685-.798.868-1.072.183-.274.365-.228.616-.137.251.091 1.598.753 1.872.89.274.137.457.205.525.32.069.114.069.662-.181 1.367z" />
            </svg>
            <span>Share</span>
          </button>
        }
      />

      <div id="result-view-container" className="max-w-md mx-auto w-full px-3.5 sm:px-5 py-3 flex-1 flex flex-col justify-start space-y-3 bg-black">
        
        {/* Top Controls: Row 1 (Date Pill & Change Date Button) & Row 2 (TIME Dropdown) */}
        <div className="space-y-2.5 shrink-0">
          {/* Row 1: Date Pill (Increased Size & Prominence) & Change Date Button */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Left: Date Display Pill */}
            <div
              onClick={triggerDatePicker}
              className="bg-gold-metallic text-black rounded-xl px-4 py-2 cursor-pointer transition-all flex items-center justify-center shadow-lg h-[46px] sm:h-[50px] border-2 border-gold-dark"
            >
              <span className="text-black font-black text-sm sm:text-base md:text-lg tracking-wider font-mono">
                {displayDateFormatted}
              </span>
            </div>

            {/* Right: Change Date Button */}
            <div
              onClick={triggerDatePicker}
              className="relative bg-neutral-900 border border-neutral-700 hover:border-gold/60 text-neutral-200 rounded-xl px-4 py-2 cursor-pointer transition-all flex items-center justify-center gap-2 shadow-md h-[46px] sm:h-[50px]"
            >
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gold shrink-0" />
              <span className="font-bold text-xs sm:text-sm tracking-wide">
                Change date
              </span>
              <input
                ref={dateInputRef}
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 full-date-input"
              />
            </div>
          </div>

          {/* Row 2: TIME Dropdown Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsGameDropdownOpen(!isGameDropdownOpen)}
              className={`w-full h-[46px] sm:h-[48px] px-4 rounded-xl font-black text-sm sm:text-base uppercase flex items-center justify-between transition-all cursor-pointer shadow-md border ${currentTheme.pillActive}`}
            >
              <div className="flex items-center gap-2">
                <span className="opacity-85 text-xs sm:text-sm font-bold tracking-wider uppercase">TIME:</span>
                <span className="font-black tracking-wider text-sm sm:text-base">{activeGameSlot.replace(' Game', '')}</span>
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isGameDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isGameDropdownOpen && (
              <div className="absolute left-0 right-0 top-13 p-1.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1 shadow-2xl animate-drop-in z-30">
                {games.map((slot) => {
                  const theme = slotThemeStyles[slot];
                  const isSelected = slot === activeGameSlot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => {
                        setActiveGameSlot(slot);
                        setIsGameDropdownOpen(false);
                      }}
                      className={`w-full py-2 px-3.5 rounded-lg font-black text-xs sm:text-sm uppercase flex items-center justify-between cursor-pointer transition-all ${
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
        </div>

        {/* 5 Winning Number Cards (1st Prize slightly larger than other prizes) */}
        <div className="space-y-1.5 shrink-0">
          {[
            { id: 1, label: '1', val: currentResult.prize1 || '---' },
            { id: 2, label: '2', val: currentResult.prize2 || '---' },
            { id: 3, label: '3', val: currentResult.prize3 || '---' },
            { id: 4, label: '4', val: currentResult.prize4 || '---' },
            { id: 5, label: '5', val: currentResult.prize5 || '---' },
          ].map((item) => (
            <div
              key={`prize-${item.id}-${activeDate}-${activeGameSlot}`}
              className={`flex items-center justify-start rounded-xl bg-neutral-950 ${currentTheme.cardBorder} transition-all ${
                item.id === 1 ? 'py-2 sm:py-2.5 px-3.5 shadow-md border-opacity-100' : 'py-1.5 sm:py-2 px-3.5 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3.5 w-full">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border shrink-0 font-black text-xs sm:text-sm flex items-center justify-center ${currentTheme.badgeActive}`}
                >
                  {item.label}
                </div>
                <div className="flex items-center flex-1">
                  <span
                    className={`font-black font-mono tracking-widest block text-white ${
                      item.id === 1 ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'
                    }`}
                  >
                    {item.val}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* COMPLIMENTS Matrix Table */}
        {(() => {
          const rawList = currentResult.compliments ? currentResult.compliments.flat() : [];
          const compliments30 = Array.from({ length: 30 }, (_, index) => {
            return rawList[index] ? String(rawList[index]).padStart(3, '0') : '---';
          });

          return (
            <div
              key={`compliments-${activeDate}-${activeGameSlot}`}
              className="bg-neutral-950 text-white rounded-2xl p-2.5 sm:p-3.5 shadow-2xl border border-neutral-800 space-y-1.5 shrink-0 my-0.5"
            >
              <h3 className="font-black text-xs sm:text-sm text-gold text-center border-b border-neutral-800 pb-1 uppercase tracking-widest shrink-0">
                COMPLIMENTS
              </h3>

              <div className="grid grid-cols-5 gap-1 bg-neutral-900 border border-neutral-800 p-1 rounded-xl overflow-hidden font-mono">
                {compliments30.map((val, idx) => (
                  <div
                    key={idx}
                    className="bg-black text-center text-xs sm:text-sm font-black text-neutral-100 tracking-wider flex items-center justify-center py-1.5 sm:py-2 rounded-lg border border-neutral-850 shadow-inner"
                  >
                    {val}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
};
