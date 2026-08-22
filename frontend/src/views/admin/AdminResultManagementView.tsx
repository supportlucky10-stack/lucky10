import React, { useState, useRef, useEffect } from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';
import { useApp } from '../../context/AppContext';
import type { GameSlot } from '../../types';
import { CheckCircle2, ChevronDown, Calendar, AlertTriangle, Pencil } from 'lucide-react';
import { getLocalDateStr } from '../../utils/dateUtils';

const slotThemes: Record<string, {
  name: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  buttonGradient: string;
  buttonText: string;
  pillActive: string;
  cardBorder: string;
  badgeActive: string;
}> = {
  '1 PM Game': {
    name: '1 PM Game',
    badgeBg: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500',
    badgeText: 'text-white',
    badgeBorder: 'border-sky-300',
    buttonGradient: 'bg-gradient-to-b from-blue-500 via-blue-600 to-indigo-700',
    buttonText: 'text-white',
    pillActive: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white border-2 border-sky-300 shadow-[0_0_12px_rgba(59,130,246,0.5)]',
    cardBorder: 'border border-sky-400/90 shadow-[0_0_10px_rgba(59,130,246,0.2)]',
    badgeActive: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-sky-300',
  },
  '3 PM Game': {
    name: '3 PM Game',
    badgeBg: 'bg-gradient-to-r from-[#9a3412] via-[#7c2d12] to-[#5a1e06]',
    badgeText: 'text-white',
    badgeBorder: 'border-orange-400/60',
    buttonGradient: 'bg-gradient-to-b from-[#9a3412] via-[#7c2d12] to-[#431407]',
    buttonText: 'text-white',
    pillActive: 'bg-gradient-to-r from-[#9a3412] via-[#7c2d12] to-[#5a1e06] text-white border-2 border-orange-400/60 shadow-[0_0_12px_rgba(154,52,18,0.4)]',
    cardBorder: 'border border-orange-500/50 shadow-[0_0_10px_rgba(154,52,18,0.2)]',
    badgeActive: 'bg-gradient-to-r from-[#9a3412] to-[#7c2d12] text-white border-orange-400/60',
  },
  '6 PM Game': {
    name: '6 PM Game',
    badgeBg: 'bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600',
    badgeText: 'text-white',
    badgeBorder: 'border-fuchsia-300',
    buttonGradient: 'bg-gradient-to-b from-fuchsia-500 via-pink-600 to-rose-700',
    buttonText: 'text-white',
    pillActive: 'bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 text-white border-2 border-fuchsia-300 shadow-[0_0_12px_rgba(217,70,239,0.5)]',
    cardBorder: 'border border-fuchsia-400/90 shadow-[0_0_10px_rgba(217,70,239,0.2)]',
    badgeActive: 'bg-gradient-to-r from-fuchsia-500 to-rose-600 text-white border-fuchsia-300',
  },
  '8 PM Game': {
    name: '8 PM Game',
    badgeBg: 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600',
    badgeText: 'text-black',
    badgeBorder: 'border-teal-300',
    buttonGradient: 'bg-gradient-to-b from-emerald-400 via-teal-500 to-cyan-700',
    buttonText: 'text-black',
    pillActive: 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600 text-black border-2 border-teal-300 shadow-[0_0_12px_rgba(20,184,166,0.5)]',
    cardBorder: 'border border-teal-400/90 shadow-[0_0_10px_rgba(20,184,166,0.2)]',
    badgeActive: 'bg-gradient-to-r from-emerald-400 to-teal-500 text-black border-black',
  },
};

export const AdminResultManagementView: React.FC = () => {
  const { publishGameResult, getResultForSlotAndDate } = useApp();

  const todayStr = getLocalDateStr();

  const [selectedSlot, setSelectedSlot] = useState<GameSlot>('1 PM Game');
  const [isSlotDropdownOpen, setIsSlotDropdownOpen] = useState(false);

  const existingInitial = getResultForSlotAndDate('1 PM Game', todayStr);
  const [prize1, setPrize1] = useState(existingInitial?.prize1 || '');
  const [prize2, setPrize2] = useState(existingInitial?.prize2 || '');
  const [prize3, setPrize3] = useState(existingInitial?.prize3 || '');
  const [prize4, setPrize4] = useState(existingInitial?.prize4 || '');
  const [prize5, setPrize5] = useState(existingInitial?.prize5 || '');

  const [complimentBoxes, setComplimentBoxes] = useState<string[]>(() => {
    const comps = existingInitial?.compliments ? existingInitial.compliments.flat() : [];
    return Array.from({ length: 30 }, (_, i) => comps[i] || '');
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const currentSlotResult = getResultForSlotAndDate(selectedSlot, todayStr);
  const is1stPrizePublished = Boolean(currentSlotResult && currentSlotResult.prize1 && currentSlotResult.prize1.trim().length > 0);
  const [is1stPrizeEditing, setIs1stPrizeEditing] = useState(false);

  const isOtherPrizesPublished = Boolean(currentSlotResult && currentSlotResult.prize2 && currentSlotResult.prize2.trim().length > 0);
  const [isOtherPrizesEditing, setIsOtherPrizesEditing] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const existing = getResultForSlotAndDate(selectedSlot, todayStr);
    if (existing && existing.prize1) {
      if (!is1stPrizeEditing) {
        setPrize1(existing.prize1);
      }
      if (!isOtherPrizesEditing) {
        setPrize2(existing.prize2 || '');
        setPrize3(existing.prize3 || '');
        setPrize4(existing.prize4 || '');
        setPrize5(existing.prize5 || '');
        const comps = existing.compliments ? existing.compliments.flat() : [];
        setComplimentBoxes(Array.from({ length: 30 }, (_, i) => comps[i] || ''));
      }
    } else {
      setPrize1('');
      setPrize2('');
      setPrize3('');
      setPrize4('');
      setPrize5('');
      setComplimentBoxes(Array(30).fill(''));
    }
  }, [selectedSlot, todayStr]);

  const handleSelectSlot = (slot: GameSlot) => {
    setSelectedSlot(slot);
    setIsSlotDropdownOpen(false);
    setIs1stPrizeEditing(false);
    setIsOtherPrizesEditing(false);

    const existing = getResultForSlotAndDate(slot, todayStr);
    if (existing && existing.prize1) {
      setPrize1(existing.prize1);
      setPrize2(existing.prize2 || '');
      setPrize3(existing.prize3 || '');
      setPrize4(existing.prize4 || '');
      setPrize5(existing.prize5 || '');

      const comps = existing.compliments ? existing.compliments.flat() : [];
      setComplimentBoxes(Array.from({ length: 30 }, (_, i) => comps[i] || ''));
    } else {
      setPrize1('');
      setPrize2('');
      setPrize3('');
      setPrize4('');
      setPrize5('');
      setComplimentBoxes(Array(30).fill(''));
    }
  };

  const handleInputChange = (index: number, rawVal: string) => {
    const val = rawVal.replace(/\D/g, '').slice(0, 3);
    if (index === 0) {
      setPrize1(val);
    } else if (index === 1) {
      setPrize2(val);
    } else if (index === 2) {
      setPrize3(val);
    } else if (index === 3) {
      setPrize4(val);
    } else if (index === 4) {
      setPrize5(val);
    } else if (index >= 5 && index <= 34) {
      const compIdx = index - 5;
      const upd = [...complimentBoxes];
      upd[compIdx] = val;
      setComplimentBoxes(upd);
    }

    if (val.length === 3 && index < 34) {
      const nextInput = inputRefs.current[index + 1];
      if (nextInput && !nextInput.disabled && !nextInput.readOnly) {
        nextInput.focus();
        nextInput.select?.();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const target = e.currentTarget;
      if (target.value === '' && index > 0) {
        const prevInput = inputRefs.current[index - 1];
        if (prevInput && !prevInput.disabled && !prevInput.readOnly) {
          prevInput.focus();
        }
      }
    }
  };

  const handlePublish1stPrize = async () => {
    const p1 = prize1.trim();
    const existing = getResultForSlotAndDate(selectedSlot, todayStr);
    // Top button publishes or clears 1st Prize.
    const p2 = existing?.prize2 || '';
    const p3 = existing?.prize3 || '';
    const p4 = existing?.prize4 || '';
    const p5 = existing?.prize5 || '';

    let complimentSets: string[][] = [];
    if (existing && existing.compliments && existing.compliments.flat().length > 0) {
      complimentSets = existing.compliments;
    }

    await publishGameResult(selectedSlot, p1, p2, p3, p4, complimentSets, p5, todayStr);
    setIs1stPrizeEditing(false);
    setPreviewSlot(selectedSlot);
    setPreviewDate(todayStr);
    if (!p1) {
      setSuccessMessage(`1st Prize Number for ${selectedSlot} has been cleared and reset successfully!`);
    } else {
      setSuccessMessage(`1st Prize Number (${p1}) for ${selectedSlot} has been published successfully!`);
    }
    setShowSuccessModal(true);
  };

  const handlePublishOtherPrizesAndCompliments = async () => {
    const existing = getResultForSlotAndDate(selectedSlot, todayStr);
    const p1 = prize1.trim() || existing?.prize1 || '';
    const p2 = prize2.trim();
    const p3 = prize3.trim();
    const p4 = prize4.trim();
    const p5 = prize5.trim();
    const allCompsEmpty = complimentBoxes.every((n) => !n || !n.trim());
    const isClearing = !p2 && !p3 && !p4 && !p5 && allCompsEmpty;

    if (isClearing) {
      await publishGameResult(selectedSlot, p1, '', '', '', [], '', todayStr);
      setIsOtherPrizesEditing(false);
      setPreviewSlot(selectedSlot);
      setPreviewDate(todayStr);
      setSuccessMessage(`Other Prizes & Compliments for ${selectedSlot} have been cleared and reset successfully!`);
      setShowSuccessModal(true);
      return;
    }

    if (!p1) {
      setErrorMessage('Please publish 1st Prize Number first before publishing other prizes.');
      setShowErrorModal(true);
      return;
    }

    if (!p2 || !p3 || !p4 || !p5) {
      setErrorMessage('Please fill 2nd, 3rd, 4th, and 5th prize numbers before publishing (or clear all to reset).');
      setShowErrorModal(true);
      return;
    }

    const emptyCount = complimentBoxes.filter((n) => !n || !n.trim()).length;
    if (emptyCount > 0) {
      setErrorMessage('Please fill all 30 compliment number boxes before publishing (or clear all to reset).');
      setShowErrorModal(true);
      return;
    }

    const complimentSets: string[][] = [];
    for (let i = 0; i < complimentBoxes.length; i += 5) {
      complimentSets.push(complimentBoxes.slice(i, i + 5).map((n) => n.trim()));
    }

    await publishGameResult(selectedSlot, p1, p2, p3, p4, complimentSets, p5, todayStr);
    setIsOtherPrizesEditing(false);
    setPreviewSlot(selectedSlot);
    setPreviewDate(todayStr);
    setSuccessMessage(`2nd, 3rd, 4th, 5th Prizes & Compliments for ${selectedSlot} published successfully!`);
    setShowSuccessModal(true);
  };

  const gameSlots: GameSlot[] = ['1 PM Game', '3 PM Game', '6 PM Game', '8 PM Game'];
  const activeSlotTheme = slotThemes[selectedSlot] || slotThemes['1 PM Game'];
  const shortSlot = selectedSlot.replace(' Game', '').replace(' ', '');
  const isOtherDisabled = isOtherPrizesPublished && !isOtherPrizesEditing;
  const isAllOtherEmpty = !prize2.trim() && !prize3.trim() && !prize4.trim() && !prize5.trim() && complimentBoxes.every((n) => !n || !n.trim());

  const [activeTab, setActiveTab] = useState<'publish' | 'preview'>('publish');
  const [previewDate, setPreviewDate] = useState<string>(todayStr);
  const [previewSlot, setPreviewSlot] = useState<GameSlot>('1 PM Game');
  const [isPreviewSlotOpen, setIsPreviewSlotOpen] = useState(false);
  const previewDateRef = useRef<HTMLInputElement>(null);
  const previewSlotTheme = slotThemes[previewSlot] || slotThemes['1 PM Game'];

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-16 select-none font-sans relative">
      <HeaderBanner title="Result Management" />

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-950 border-2 border-gold rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-gold/20 border border-gold flex items-center justify-center mx-auto text-gold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
              Published Successfully!
            </h3>
            <p className="text-xs text-neutral-300">
              {successMessage || 'Result has been published successfully.'}
            </p>
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-2.5 bg-gold-metallic text-black font-black text-xs sm:text-sm rounded-xl uppercase shadow-md hover:opacity-95 cursor-pointer transition-all active:scale-95 tracking-wider"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-950 border-2 border-amber-500/80 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center mx-auto text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
              Incomplete Information
            </h3>
            <p className="text-xs text-neutral-300">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={() => setShowErrorModal(false)}
              className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-black text-xs sm:text-sm rounded-xl uppercase border border-neutral-700 cursor-pointer transition-all active:scale-95 tracking-wider"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div className="px-4 sm:px-6 py-5 space-y-4 max-w-4xl mx-auto w-full">
        <div className="bg-neutral-950 border border-gold/40 p-1.5 rounded-2xl grid grid-cols-2 gap-2 shadow-md">
          <button
            type="button"
            onClick={() => setActiveTab('publish')}
            className={`py-3 px-2 sm:px-4 rounded-xl font-black text-xs uppercase tracking-wider text-center cursor-pointer transition-all ${activeTab === 'publish' ? 'bg-gold-metallic text-black shadow-lg' : 'bg-transparent text-neutral-400 hover:text-white'}`}
          >
            1. PUBLISH RESULT
          </button>
          <button
            type="button"
            onClick={() => { setPreviewSlot(selectedSlot); setPreviewDate(todayStr); setActiveTab('preview'); }}
            className={`py-3 px-2 sm:px-4 rounded-xl font-black text-xs uppercase tracking-wider text-center cursor-pointer transition-all ${activeTab === 'preview' ? 'bg-gold-metallic text-black shadow-lg' : 'bg-transparent text-neutral-400 hover:text-white'}`}
          >
            2. RESULT PREVIEW
          </button>
        </div>

        {activeTab === 'publish' && (
          <div className="bg-neutral-950 border border-gold/40 p-5 rounded-2xl space-y-5 shadow-md overflow-visible relative">
            <div className="relative z-30">
              <button type="button" onClick={() => setIsSlotDropdownOpen(!isSlotDropdownOpen)} className={`w-full py-2.5 px-4 ${activeSlotTheme.badgeBg} ${activeSlotTheme.badgeText} font-black text-xs sm:text-sm rounded-xl border ${activeSlotTheme.badgeBorder} shadow-lg flex items-center justify-between gap-3 cursor-pointer transition-all`}>
                <div className="flex items-center gap-2"><span className="opacity-80 text-[10px] tracking-wider uppercase">SLOT:</span><span>{selectedSlot}</span></div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSlotDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isSlotDropdownOpen && (
                <div className="absolute left-0 right-0 top-12 p-1.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1 shadow-2xl z-50">
                  {gameSlots.map((slot) => (
                    <button key={slot} type="button" onClick={() => handleSelectSlot(slot)} className={`w-full py-2 px-3 rounded-lg font-black text-xs uppercase tracking-wide flex items-center justify-between ${slot === selectedSlot ? `${slotThemes[slot].badgeBg} text-white` : 'bg-neutral-900 text-neutral-300'}`}>
                      <span>{slot}</span>
                      {slot === selectedSlot && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 1st Prize Number with Dedicated Publish Button and Small Edit Icon Button */}
            <div className="bg-neutral-900/60 p-3.5 rounded-2xl border border-gold/30 space-y-3 shadow-inner">
              <div className="text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-neutral-400 font-bold">1st Prize Number</span>
                </div>
                <input
                  ref={(el) => { inputRefs.current[0] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  placeholder="000"
                  value={prize1}
                  disabled={is1stPrizePublished && !is1stPrizeEditing}
                  readOnly={is1stPrizePublished && !is1stPrizeEditing}
                  onChange={(e) => handleInputChange(0, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(0, e)}
                  className={`w-full px-3 py-2.5 font-mono font-black text-lg rounded-xl border-2 text-center shadow-inner focus:outline-none transition-all ${
                    is1stPrizePublished && !is1stPrizeEditing
                      ? 'bg-neutral-800/90 text-neutral-400 border-neutral-700 cursor-not-allowed opacity-75'
                      : 'bg-white text-black border-gold'
                  }`}
                />
              </div>
              <div className="flex items-center justify-center gap-2 pt-0.5">
                <button
                  type="button"
                  disabled={is1stPrizePublished && !is1stPrizeEditing}
                  onClick={handlePublish1stPrize}
                  className={`px-6 py-2 font-black text-xs sm:text-sm rounded-full uppercase shadow-md transition-all tracking-wider border ${
                    is1stPrizePublished && !is1stPrizeEditing
                      ? 'bg-neutral-800 text-neutral-500 border-neutral-700 cursor-not-allowed opacity-60'
                      : is1stPrizeEditing && !prize1.trim()
                      ? 'bg-rose-700 hover:bg-rose-600 text-white border-rose-500 cursor-pointer active:scale-95'
                      : 'bg-gold-metallic text-black border-gold-dark hover:opacity-95 cursor-pointer active:scale-95'
                  }`}
                >
                  {is1stPrizePublished && !is1stPrizeEditing
                    ? 'PUBLISHED'
                    : is1stPrizeEditing && !prize1.trim()
                    ? `CLEAR (${shortSlot})`
                    : `PUBLISH (${shortSlot})`}
                </button>

                {is1stPrizePublished && (
                  <button
                    type="button"
                    onClick={() => setIs1stPrizeEditing(!is1stPrizeEditing)}
                    className={`p-2 rounded-full transition-all cursor-pointer border shadow-md active:scale-90 ${
                      is1stPrizeEditing
                        ? 'bg-gold text-black border-gold'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-gold border-gold/40'
                    }`}
                    title="Edit 1st Prize Number"
                  >
                    <Pencil className="w-4 h-4 stroke-[2.5]" />
                  </button>
                )}
              </div>
            </div>

            {/* Other Prizes (2nd to 5th) and Compliments with Dedicated Publish Button */}
            <div className="space-y-4 pt-1">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <span className="text-neutral-400 font-bold block mb-1">2nd Prize Number</span>
                    <input
                      ref={(el) => { inputRefs.current[1] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={3}
                      placeholder="000"
                      value={prize2}
                      disabled={isOtherDisabled}
                      readOnly={isOtherDisabled}
                      onChange={(e) => handleInputChange(1, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(1, e)}
                      className={`w-full px-3 py-2 font-mono font-black text-base rounded-md border-2 text-center shadow-inner focus:outline-none transition-all ${
                        isOtherDisabled
                          ? 'bg-neutral-800/90 text-neutral-400 border-neutral-700 cursor-not-allowed opacity-75'
                          : 'bg-white text-black border-gold'
                      }`}
                    />
                  </div>
                  <div>
                    <span className="text-neutral-400 font-bold block mb-1">3rd Prize Number</span>
                    <input
                      ref={(el) => { inputRefs.current[2] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={3}
                      placeholder="000"
                      value={prize3}
                      disabled={isOtherDisabled}
                      readOnly={isOtherDisabled}
                      onChange={(e) => handleInputChange(2, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(2, e)}
                      className={`w-full px-3 py-2 font-mono font-black text-base rounded-md border-2 text-center shadow-inner focus:outline-none transition-all ${
                        isOtherDisabled
                          ? 'bg-neutral-800/90 text-neutral-400 border-neutral-700 cursor-not-allowed opacity-75'
                          : 'bg-white text-black border-gold'
                      }`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <span className="text-neutral-400 font-bold block mb-1">4th Prize Number</span>
                    <input
                      ref={(el) => { inputRefs.current[3] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={3}
                      placeholder="000"
                      value={prize4}
                      disabled={isOtherDisabled}
                      readOnly={isOtherDisabled}
                      onChange={(e) => handleInputChange(3, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(3, e)}
                      className={`w-full px-3 py-2 font-mono font-black text-base rounded-md border-2 text-center shadow-inner focus:outline-none transition-all ${
                        isOtherDisabled
                          ? 'bg-neutral-800/90 text-neutral-400 border-neutral-700 cursor-not-allowed opacity-75'
                          : 'bg-white text-black border-gold'
                      }`}
                    />
                  </div>
                  <div>
                    <span className="text-neutral-400 font-bold block mb-1">5th Prize Number</span>
                    <input
                      ref={(el) => { inputRefs.current[4] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={3}
                      placeholder="000"
                      value={prize5}
                      disabled={isOtherDisabled}
                      readOnly={isOtherDisabled}
                      onChange={(e) => handleInputChange(4, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(4, e)}
                      className={`w-full px-3 py-2 font-mono font-black text-base rounded-md border-2 text-center shadow-inner focus:outline-none transition-all ${
                        isOtherDisabled
                          ? 'bg-neutral-800/90 text-neutral-400 border-neutral-700 cursor-not-allowed opacity-75'
                          : 'bg-white text-black border-gold'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Compliments 30 Grid */}
              <div className="space-y-3 pt-2 border-t border-neutral-800">
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                  {complimentBoxes.map((num, idx) => {
                    const inputIdx = 5 + idx;
                    return (
                      <div key={idx} className="bg-neutral-900/90 p-2 rounded-xl border border-neutral-800 focus-within:border-gold/60 transition-all">
                        <span className="text-[10px] text-neutral-400 font-bold font-mono">#{idx + 1}</span>
                        <input
                          ref={(el) => { inputRefs.current[inputIdx] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={3}
                          placeholder="000"
                          value={num}
                          disabled={isOtherDisabled}
                          readOnly={isOtherDisabled}
                          onChange={(e) => handleInputChange(inputIdx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(inputIdx, e)}
                          className={`w-full px-2 py-1.5 font-mono font-black text-sm rounded-lg border-2 text-center focus:outline-none transition-all ${
                            isOtherDisabled
                              ? 'bg-neutral-800/90 text-neutral-400 border-neutral-700 cursor-not-allowed opacity-75'
                              : 'bg-white text-black border-gold'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Publish Other Prizes & Compliments Button with Edit Pencil Icon Button */}
                <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                  <button
                    type="button"
                    disabled={isOtherDisabled}
                    onClick={handlePublishOtherPrizesAndCompliments}
                    className={`px-6 py-2 font-black text-xs sm:text-sm rounded-full uppercase shadow-md transition-all tracking-wider border ${
                      isOtherDisabled
                        ? 'bg-neutral-800 text-neutral-500 border-neutral-700 cursor-not-allowed opacity-60'
                        : isOtherPrizesEditing && isAllOtherEmpty
                        ? 'bg-rose-700 hover:bg-rose-600 text-white border-rose-500 cursor-pointer active:scale-95'
                        : 'bg-gold-metallic text-black border-gold-dark hover:opacity-95 cursor-pointer active:scale-95'
                    }`}
                  >
                    {isOtherDisabled
                      ? 'PUBLISHED'
                      : isOtherPrizesEditing && isAllOtherEmpty
                      ? `CLEAR OTHER RESULTS (${shortSlot})`
                      : `PUBLISH OTHER RESULTS (${shortSlot})`}
                  </button>

                  {isOtherPrizesEditing && !isAllOtherEmpty && (
                    <button
                      type="button"
                      onClick={() => {
                        setPrize2('');
                        setPrize3('');
                        setPrize4('');
                        setPrize5('');
                        setComplimentBoxes(Array(30).fill(''));
                      }}
                      className="px-3 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-full text-xs font-bold font-mono uppercase cursor-pointer active:scale-95 transition-all shadow"
                      title="Clear all fields"
                    >
                      Clear All
                    </button>
                  )}

                  {isOtherPrizesPublished && (
                    <button
                      type="button"
                      onClick={() => setIsOtherPrizesEditing(!isOtherPrizesEditing)}
                      className={`p-2 rounded-full transition-all cursor-pointer border shadow-md active:scale-90 ${
                        isOtherPrizesEditing
                          ? 'bg-gold text-black border-gold'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-gold border-gold/40'
                      }`}
                      title="Edit Other Prizes & Compliments"
                    >
                      <Pencil className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="bg-neutral-950 border border-gold/40 p-4 sm:p-5 rounded-2xl space-y-3.5 shadow-md">
            {/* Date & Change Date Row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gold-metallic text-black rounded-xl px-3 py-2 flex items-center justify-center font-black text-xs font-mono select-none shadow-sm">
                {previewDate.split('-').reverse().join('-')}
              </div>
              <div
                onClick={() => previewDateRef.current?.showPicker?.()}
                className="relative bg-neutral-900 border border-neutral-700 hover:border-neutral-500 text-neutral-200 rounded-xl px-3 py-2 flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <Calendar className="w-4 h-4 text-gold shrink-0 pointer-events-none" />
                <span className="font-bold text-xs pointer-events-none">Change date</span>
                <input
                  ref={previewDateRef}
                  type="date"
                  value={previewDate}
                  onChange={(e) => e.target.value && setPreviewDate(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
              </div>
            </div>

            {/* Slot Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsPreviewSlotOpen(!isPreviewSlotOpen)}
                className={`w-full h-[46px] px-4 rounded-xl font-black text-sm uppercase flex items-center justify-between transition-all cursor-pointer shadow border ${previewSlotTheme.pillActive}`}
              >
                <div className="flex items-center gap-2">
                  <span className="opacity-85 text-xs font-bold tracking-wider uppercase">TIME:</span>
                  <span className="font-black tracking-wider text-sm sm:text-base">{previewSlot.replace(' Game', '')}</span>
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isPreviewSlotOpen ? 'rotate-180' : ''}`} />
              </button>
              {isPreviewSlotOpen && (
                <div className="absolute left-0 right-0 top-13 p-1.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1 shadow-2xl z-40">
                  {gameSlots.map((slot) => {
                    const theme = slotThemes[slot];
                    const isSel = slot === previewSlot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => {
                          setPreviewSlot(slot);
                          setIsPreviewSlotOpen(false);
                        }}
                        className={`w-full py-2 px-3.5 rounded-lg font-black text-xs sm:text-sm uppercase flex items-center justify-between cursor-pointer transition-all ${
                          isSel
                            ? theme.pillActive
                            : 'bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <span>{slot.replace(' Game', '')}</span>
                        {isSel && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 6 Prize Cards & Compliments */}
            {(() => {
              const res = getResultForSlotAndDate(previewSlot, previewDate);
              const prizes = [
                { id: 1, label: '1', val: res?.prize1 || '—' },
                { id: 2, label: '2', val: res?.prize2 || '—' },
                { id: 3, label: '3', val: res?.prize3 || '—' },
                { id: 4, label: '4', val: res?.prize4 || '—' },
                { id: 5, label: '5', val: res?.prize5 || '—' },
              ];
              const comps = res?.compliments ? res.compliments.flat() : [];
              const display30 = Array.from({ length: 30 }, (_, i) => comps[i] || '—');
              return (
                <>
                  <div className="space-y-1.5">
                    {prizes.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center rounded-xl bg-neutral-950 ${previewSlotTheme.cardBorder} transition-all py-1.5 sm:py-2 px-3.5 shadow-sm`}
                      >
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border shrink-0 font-black text-xs sm:text-sm flex items-center justify-center mr-3 ${previewSlotTheme.badgeActive}`}
                        >
                          {item.label}
                        </div>
                        <span className="font-black font-mono tracking-widest text-white text-lg sm:text-xl">
                          {item.val}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Compliments Grid */}
                  <div className="bg-neutral-950 rounded-xl border border-neutral-800 p-2 space-y-1">
                    <h4 className="font-black text-xs text-gold text-center border-b border-neutral-800 pb-1 uppercase tracking-wider">
                      Compliments
                    </h4>
                    <div className="grid grid-cols-5 gap-px bg-neutral-800 border border-neutral-800 rounded-lg overflow-hidden font-mono">
                      {display30.map((val, idx) => (
                        <div
                          key={idx}
                          className="bg-black text-center text-xs font-black text-neutral-100 tracking-wider flex items-center justify-center py-1.5"
                        >
                          {val}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* WhatsApp Share */}
                  <button
                    type="button"
                    onClick={() => {
                      const slotTimeMap: Record<string, string> = {
                        '1 PM Game': '01:00 PM',
                        '3 PM Game': '03:00 PM',
                        '6 PM Game': '06:00 PM',
                        '8 PM Game': '08:00 PM',
                      };
                      const dateStr = previewDate.split('-').reverse().join('-');
                      const rows: string[] = [];
                      for (let i = 0; i < 30; i += 5) {
                        rows.push(display30.slice(i, i + 5).join(' | ') + ' |');
                      }
                      const text = `${dateStr}\n${slotTimeMap[previewSlot] || previewSlot}\n\n1 - ${prizes[0].val}\n2 - ${prizes[1].val}\n3 - ${prizes[2].val}\n4 - ${prizes[3].val}\n5 - ${prizes[4].val}\n6 - ${prizes[5].val}\n\nOthers:-\n${rows.join('\n')}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="w-full py-2.5 sm:py-3 px-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:brightness-110 active:scale-[0.98] text-white font-black text-xs sm:text-sm tracking-wider uppercase rounded-xl shadow-[0_4px_15px_rgba(16,185,129,0.3)] border border-emerald-400 flex items-center justify-center gap-2 transition-all cursor-pointer group"
                  >
                    <svg
                      className="w-4 h-4 fill-white shrink-0 group-hover:rotate-6 transition-transform"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.93 9.93 0 0 0 1.371 5.034l-1.458 5.328 5.461-1.431a9.92 9.92 0 0 0 4.614 1.155h.004c5.505 0 9.988-4.478 9.99-9.984 0-2.668-1.039-5.176-2.927-7.062a9.92 9.92 0 0 0-7.065-2.924zm5.72 12.721c-.25.705-1.246 1.346-1.74 1.399-.445.048-1.025.074-1.656-.128-.386-.123-.882-.284-1.528-.563-2.696-1.164-4.448-3.902-4.584-4.084-.135-.182-1.107-1.474-1.107-2.81 0-1.336.7-1.993.951-2.259.251-.266.548-.333.73-.333.183 0 .365.002.525.01.171.008.401-.065.626.476.233.56.79 1.93.858 2.07.069.14.115.305.023.488-.092.183-.138.297-.274.457-.137.16-.288.358-.411.48-.137.137-.28.286-.12.56.16.274.71 1.171 1.524 1.895 1.047.93 1.931 1.22 2.205 1.357.274.137.434.114.594-.069.16-.183.685-.798.868-1.072.183-.274.365-.228.616-.137.251.091 1.598.753 1.872.89.274.137.457.205.525.32.069.114.069.662-.181 1.367z" />
                    </svg>
                    <span>SHARE RESULT TO WHATSAPP</span>
                  </button>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
