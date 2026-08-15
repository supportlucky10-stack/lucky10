import React, { useState, useRef } from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';
import { useApp } from '../../context/AppContext';
import type { GameSlot } from '../../types';
import { CheckCircle2, Sparkles, ChevronDown, RotateCcw, Calendar } from 'lucide-react';
import goldTrophy from '../../assets/gold-trophy.png';

const slotThemes: Record<string, {
  name: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  buttonGradient: string;
  buttonText: string;
  pillActive: string;
}> = {
  '1 PM Game': {
    name: '1 PM Game',
    badgeBg: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500',
    badgeText: 'text-white',
    badgeBorder: 'border-sky-300',
    buttonGradient: 'bg-gradient-to-b from-blue-500 via-blue-600 to-indigo-700',
    buttonText: 'text-white',
    pillActive: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white border-2 border-sky-300 shadow-[0_0_12px_rgba(59,130,246,0.5)]',
  },
  '3 PM Game': {
    name: '3 PM Game',
    badgeBg: 'bg-gold-metallic',
    badgeText: 'text-black',
    badgeBorder: 'border-gold-dark',
    buttonGradient: 'bg-gradient-to-b from-[#e3bf45] via-[#b88928] to-[#805b11]',
    buttonText: 'text-black',
    pillActive: 'bg-gold-metallic text-black border-2 border-gold-dark shadow-[0_0_12px_rgba(184,137,40,0.5)]',
  },
  '6 PM Game': {
    name: '6 PM Game',
    badgeBg: 'bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600',
    badgeText: 'text-white',
    badgeBorder: 'border-fuchsia-300',
    buttonGradient: 'bg-gradient-to-b from-fuchsia-500 via-pink-600 to-rose-700',
    buttonText: 'text-white',
    pillActive: 'bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 text-white border-2 border-fuchsia-300 shadow-[0_0_12px_rgba(217,70,239,0.5)]',
  },
  '8 PM Game': {
    name: '8 PM Game',
    badgeBg: 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600',
    badgeText: 'text-black',
    badgeBorder: 'border-teal-300',
    buttonGradient: 'bg-gradient-to-b from-emerald-400 via-teal-500 to-cyan-700',
    buttonText: 'text-black',
    pillActive: 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600 text-black border-2 border-teal-300 shadow-[0_0_12px_rgba(20,184,166,0.5)]',
  },
};

const generateDefault30Compliments = (p1: string, p2: string, p3: string, p4: string, p5: string, existing?: string[][]): string[] => {
  if (existing && existing.flat().length > 0) {
    const list = existing.flat();
    const result = [...list];
    while (result.length < 30) {
      result.push('');
    }
    return result.slice(0, 30);
  }

  const n1 = parseInt(p1) || 742;
  const n2 = parseInt(p2) || 819;
  const n3 = parseInt(p3) || 350;
  const n4 = parseInt(p4) || 194;
  const n5 = parseInt(p5) || 408;

  const defaults = [
    String(n1 + 1).padStart(3, '0'), String(n1 - 1).padStart(3, '0'), String(n1 + 2).padStart(3, '0'), String(n1 - 2).padStart(3, '0'), String(n1 + 3).padStart(3, '0'),
    String(n2 + 1).padStart(3, '0'), String(n2 - 1).padStart(3, '0'), String(n2 + 2).padStart(3, '0'), String(n2 - 2).padStart(3, '0'), String(n2 + 3).padStart(3, '0'),
    String(n3 + 1).padStart(3, '0'), String(n3 - 1).padStart(3, '0'), String(n3 + 2).padStart(3, '0'), String(n3 - 2).padStart(3, '0'), String(n3 + 3).padStart(3, '0'),
    String(n4 + 1).padStart(3, '0'), String(n4 - 1).padStart(3, '0'), String(n4 + 2).padStart(3, '0'), String(n4 - 2).padStart(3, '0'), String(n4 + 3).padStart(3, '0'),
    String(n5 + 1).padStart(3, '0'), String(n5 - 1).padStart(3, '0'), String(n5 + 2).padStart(3, '0'), String(n5 - 2).padStart(3, '0'), String(n5 + 3).padStart(3, '0'),
    '529', '631', '412', '908', '216',
  ];

  return defaults.slice(0, 30);
};

export const AdminResultManagementView: React.FC = () => {
  const { publishGameResult, getResultForSlotAndDate, addToast } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedSlot, setSelectedSlot] = useState<GameSlot>('1 PM Game');
  const [isSlotDropdownOpen, setIsSlotDropdownOpen] = useState(false);

  const [prize1, setPrize1] = useState('742');
  const [prize2, setPrize2] = useState('819');
  const [prize3, setPrize3] = useState('350');
  const [prize4, setPrize4] = useState('194');
  const [prize5, setPrize5] = useState('408');

  const [complimentBoxes, setComplimentBoxes] = useState<string[]>(() =>
    generateDefault30Compliments('742', '819', '350', '194', '408')
  );

  const handleSelectSlot = (slot: GameSlot) => {
    setSelectedSlot(slot);
    setIsSlotDropdownOpen(false);

    const existing = getResultForSlotAndDate(slot, todayStr);
    if (existing) {
      const p1 = existing.prize1 || '742';
      const p2 = existing.prize2 || '819';
      const p3 = existing.prize3 || '350';
      const p4 = existing.prize4 || '194';
      const p5 = existing.prize5 || '408';

      setPrize1(p1);
      setPrize2(p2);
      setPrize3(p3);
      setPrize4(p4);
      setPrize5(p5);

      setComplimentBoxes(generateDefault30Compliments(p1, p2, p3, p4, p5, existing.compliments));
    }
  };

  // Publish only prizes (1-5)
  const handlePublishPrizes = async () => {
    if (!prize1 || !prize2 || !prize3 || !prize4 || !prize5) {
      addToast('Please fill all 5 winning prize numbers', 'error');
      return;
    }

    // Get current compliment boxes or existing
    const existing = getResultForSlotAndDate(selectedSlot, todayStr);
    let complimentSets: string[][] = [];
    const validNums = complimentBoxes.filter((n) => n && n.trim().length > 0);
    if (validNums.length > 0) {
      for (let i = 0; i < complimentBoxes.length; i += 5) {
        complimentSets.push(complimentBoxes.slice(i, i + 5));
      }
    } else if (existing && existing.compliments && existing.compliments.flat().length > 0) {
      complimentSets = existing.compliments;
    }

    await publishGameResult(selectedSlot, prize1, prize2, prize3, prize4, complimentSets, prize5, todayStr);
    setPreviewSlot(selectedSlot);
    setPreviewDate(todayStr);
  };

  // Publish only compliments
  const handlePublishCompliments = async () => {
    const validNumbers = complimentBoxes.map((n) => n.trim()).filter((n) => n.length > 0);
    if (validNumbers.length === 0) {
      addToast('Please fill at least some compliment numbers', 'error');
      return;
    }

    let complimentSets: string[][] = [];
    for (let i = 0; i < complimentBoxes.length; i += 5) {
      complimentSets.push(complimentBoxes.slice(i, i + 5));
    }

    await publishGameResult(selectedSlot, prize1, prize2, prize3, prize4, complimentSets, prize5, todayStr);
    setPreviewSlot(selectedSlot);
    setPreviewDate(todayStr);
  };

  const resetComplimentsToDefaults = () => {
    setComplimentBoxes(generateDefault30Compliments(prize1, prize2, prize3, prize4, prize5));
    addToast(`Auto-generated 30 compliments based on 5 prizes for ${selectedSlot}`, 'info');
  };

  const clearAllComplimentBoxes = () => {
    setComplimentBoxes(Array(30).fill(''));
    addToast('Cleared all 30 compliment number boxes', 'info');
  };

  const gameSlots: GameSlot[] = ['1 PM Game', '3 PM Game', '6 PM Game', '8 PM Game'];
  const activeSlotTheme = slotThemes[selectedSlot] || slotThemes['1 PM Game'];

  // Tab state
  const [activeTab, setActiveTab] = useState<'publish' | 'preview'>('publish');

  // Preview section state
  const [previewDate, setPreviewDate] = useState<string>(todayStr);
  const [previewSlot, setPreviewSlot] = useState<GameSlot>('1 PM Game');
  const [isPreviewSlotOpen, setIsPreviewSlotOpen] = useState(false);
  const previewDateRef = useRef<HTMLInputElement>(null);
  const previewSlotTheme = slotThemes[previewSlot] || slotThemes['1 PM Game'];

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-16 select-none font-sans">
      <HeaderBanner title="Result Management" />

      <div className="px-4 sm:px-6 py-5 space-y-4 max-w-4xl mx-auto w-full">

        {/* ── TOP TABS NAVIGATION ── */}
        <div className="bg-neutral-950 border border-gold/40 p-1.5 rounded-2xl grid grid-cols-2 gap-2 shadow-md">
          <button
            type="button"
            onClick={() => setActiveTab('publish')}
            className={`py-3 px-2 sm:px-4 rounded-xl font-black text-xs uppercase tracking-wider text-center cursor-pointer transition-all ${
              activeTab === 'publish'
                ? 'bg-gold-metallic text-black shadow-lg'
                : 'bg-transparent text-neutral-400 hover:text-white'
            }`}
          >
            1. POSITIONS &amp; COMPLIMENTS
          </button>
          <button
            type="button"
            onClick={() => {
              setPreviewSlot(selectedSlot);
              setPreviewDate(todayStr);
              setActiveTab('preview');
            }}
            className={`py-3 px-2 sm:px-4 rounded-xl font-black text-xs uppercase tracking-wider text-center cursor-pointer transition-all ${
              activeTab === 'preview'
                ? 'bg-gold-metallic text-black shadow-lg'
                : 'bg-transparent text-neutral-400 hover:text-white'
            }`}
          >
            2. CUSTOMER RESULT PREVIEW
          </button>
        </div>

        {/* ── TAB 1: POSITIONS & COMPLIMENTS ── */}
        {activeTab === 'publish' && (
          <div className="bg-neutral-950 border border-gold/40 p-5 rounded-2xl space-y-5 shadow-md overflow-visible relative">
            
            {/* Section Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full border border-gold/80 bg-black flex items-center justify-center text-gold shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                  Positions &amp; Compliments
                </h2>
              </div>
              <span className="text-xs text-gold font-mono font-bold">5 Prizes + 30 Compliments</span>
            </div>

            {/* Slot Selector */}
            <div className="relative z-30">
              <label className="text-xs text-neutral-400 font-bold block mb-1.5">
                Select Game Slot:
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSlotDropdownOpen(!isSlotDropdownOpen)}
                  className={`w-full py-2.5 px-4 ${activeSlotTheme.badgeBg} ${activeSlotTheme.badgeText} font-black text-xs sm:text-sm rounded-xl border ${activeSlotTheme.badgeBorder} shadow-lg flex items-center justify-between gap-3 cursor-pointer transition-all hover:brightness-110 active:scale-95`}
                >
                  <div className="flex items-center gap-2">
                    <span className="opacity-80 text-[10px] tracking-wider uppercase">SLOT:</span>
                    <span>{selectedSlot}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSlotDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSlotDropdownOpen && (
                  <div className="absolute left-0 right-0 top-12 p-1.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1 shadow-2xl animate-drop-in z-50">
                    {gameSlots.map((slot) => {
                      const theme = slotThemes[slot];
                      const isSelected = slot === selectedSlot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleSelectSlot(slot)}
                          className={`w-full py-2 px-3 rounded-lg font-black text-xs uppercase tracking-wide flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? `${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`
                              : 'bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700'
                          }`}
                        >
                          <span>{slot}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Section 1: 5 Winning Prize Numbers */}
            <div className="space-y-3">
              <label className="text-xs text-gold font-black uppercase tracking-wider block">
                1. 5 Winning Prize Numbers:
              </label>

              {/* 1st Prize: full width on top */}
              <div className="text-xs">
                <span className="text-neutral-400 font-bold block mb-1">1st Prize Number</span>
                <input
                  type="text"
                  maxLength={3}
                  value={prize1}
                  onChange={(e) => setPrize1(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black font-mono font-black text-base rounded-md border-2 border-gold text-center shadow-inner"
                  required
                />
              </div>

              {/* 2nd & 3rd Prize: side by side */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <span className="text-neutral-400 font-bold block mb-1">2nd Prize Number</span>
                  <input
                    type="text"
                    maxLength={3}
                    value={prize2}
                    onChange={(e) => setPrize2(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-black font-mono font-black text-base rounded-md border-2 border-gold text-center shadow-inner"
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
                    className="w-full px-3 py-2 bg-white text-black font-mono font-black text-base rounded-md border-2 border-gold text-center shadow-inner"
                    required
                  />
                </div>
              </div>

              {/* 4th & 5th Prize: side by side */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <span className="text-neutral-400 font-bold block mb-1">4th Prize Number</span>
                  <input
                    type="text"
                    maxLength={3}
                    value={prize4}
                    onChange={(e) => setPrize4(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-black font-mono font-black text-base rounded-md border-2 border-gold text-center shadow-inner"
                    required
                  />
                </div>
                <div>
                  <span className="text-neutral-400 font-bold block mb-1">5th Prize Number</span>
                  <input
                    type="text"
                    maxLength={3}
                    value={prize5}
                    onChange={(e) => setPrize5(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-black font-mono font-black text-base rounded-md border-2 border-gold text-center shadow-inner"
                    required
                  />
                </div>
              </div>

              {/* Publish Prizes Button */}
              <button
                type="button"
                onClick={handlePublishPrizes}
                className="w-full py-3 bg-gold-metallic text-black font-black text-sm rounded-xl uppercase shadow-md hover:opacity-95 cursor-pointer transition-all active:scale-[0.99]"
              >
                PUBLISH PRIZES ({selectedSlot})
              </button>
            </div>

            {/* Section 2: Compliment Winning Number (30 Boxes) */}
            <div className="space-y-3 pt-2 border-t border-neutral-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs text-gold font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>2. Compliment Winning Number:</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetComplimentsToDefaults}
                    className="p-1 px-2.5 text-[11px] bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-gold rounded-lg border border-neutral-700 flex items-center gap-1 cursor-pointer"
                    title="Auto generate default 30 compliments"
                  >
                    <RotateCcw className="w-3 h-3" /> Auto-Fill
                  </button>
                  <button
                    type="button"
                    onClick={clearAllComplimentBoxes}
                    className="p-1 px-2.5 text-[11px] bg-neutral-900 hover:bg-rose-950 text-neutral-400 hover:text-rose-300 rounded-lg border border-neutral-700 cursor-pointer"
                    title="Clear all boxes"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* 30 Compliment Boxes in 2-col / 5-col grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
                {complimentBoxes.map((num, idx) => (
                  <div key={idx} className="bg-neutral-900/90 p-2 rounded-xl border border-neutral-800 focus-within:border-gold/60 transition-all">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-neutral-400 font-bold uppercase font-mono">
                        #{idx + 1}
                      </span>
                      {complimentBoxes[idx] && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...complimentBoxes];
                            updated[idx] = '';
                            setComplimentBoxes(updated);
                          }}
                          className="text-neutral-500 hover:text-rose-400 text-[10px] font-bold px-0.5"
                          title="Clear box"
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
                      className="w-full px-2 py-1.5 bg-white text-black font-mono font-black text-sm rounded-lg border-2 border-gold text-center focus:outline-none focus:ring-1 focus:ring-amber-400 shadow-inner"
                    />
                  </div>
                ))}
              </div>

              {/* Publish Compliments Button */}
              <button
                type="button"
                onClick={handlePublishCompliments}
                className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-gold border border-gold/60 font-black text-sm rounded-xl uppercase shadow-md cursor-pointer transition-all active:scale-[0.99]"
              >
                PUBLISH COMPLIMENTS ({selectedSlot})
              </button>
            </div>

          </div>
        )}

        {/* ── TAB 2: CUSTOMER RESULT PREVIEW ── */}
        {activeTab === 'preview' && (
          <div className="bg-neutral-950 border border-gold/40 p-4 sm:p-5 rounded-2xl space-y-3.5 shadow-md">
            {/* Header */}
            <div className="flex items-center gap-2.5 border-b border-neutral-800 pb-3">
              <div className="w-7 h-7 rounded-full bg-black p-1 flex items-center justify-center shrink-0 border border-gold/80">
                <img src={goldTrophy} alt="Preview" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white">Published Result Preview</h3>
                <p className="text-[10px] text-neutral-400">Live Customer View Layout</p>
              </div>
            </div>

            {/* Date & Change Date Row */}
            <div className="grid grid-cols-2 gap-2">
              <div
                onClick={() => previewDateRef.current?.showPicker?.()}
                className="bg-gold-metallic text-black rounded-xl px-3 py-2 cursor-pointer flex items-center justify-center h-10"
              >
                <span className="font-black text-xs font-mono tracking-wide">
                  {previewDate.split('-').reverse().join('-')}
                </span>
                <input
                  ref={previewDateRef}
                  type="date"
                  value={previewDate}
                  onChange={(e) => e.target.value && setPreviewDate(e.target.value)}
                  className="absolute opacity-0 w-0 h-0"
                />
              </div>
              <button
                type="button"
                onClick={() => previewDateRef.current?.showPicker?.()}
                className="bg-neutral-900 border border-neutral-700 hover:border-neutral-500 text-neutral-200 rounded-xl px-3 py-2 h-10 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Calendar className="w-4 h-4 text-gold shrink-0" />
                <span className="font-bold text-xs">Change date</span>
              </button>
            </div>

            {/* Slot Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsPreviewSlotOpen(!isPreviewSlotOpen)}
                className={`w-full h-10 px-4 rounded-xl font-black text-xs uppercase flex items-center justify-between transition-all cursor-pointer shadow border ${previewSlotTheme.pillActive}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="opacity-80 text-[10px] tracking-wider uppercase">TIME:</span>
                  <span className="font-black tracking-wider">{previewSlot.replace(' Game', '')}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isPreviewSlotOpen ? 'rotate-180' : ''}`} />
              </button>
              {isPreviewSlotOpen && (
                <div className="absolute left-0 right-0 top-11 p-1.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1 shadow-2xl z-40">
                  {gameSlots.map((slot) => {
                    const theme = slotThemes[slot];
                    const isSel = slot === previewSlot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => { setPreviewSlot(slot); setIsPreviewSlotOpen(false); }}
                        className={`w-full py-1.5 px-3 rounded-lg font-black text-xs uppercase tracking-wide flex items-center justify-between cursor-pointer transition-all ${
                          isSel ? theme.pillActive : 'bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800'
                        }`}
                      >
                        <span>{slot.replace(' Game', '')}</span>
                        {isSel && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 5 Prize Cards */}
            {(() => {
              const res = getResultForSlotAndDate(previewSlot, previewDate);
              const prizes = [
                { id: 1, val: res?.prize1 || '' },
                { id: 2, val: res?.prize2 || '' },
                { id: 3, val: res?.prize3 || '' },
                { id: 4, val: res?.prize4 || '' },
                { id: 5, val: res?.prize5 || '' },
              ];
              const comps = res?.compliments ? res.compliments.flat() : [];
              const hasComps = comps.some((c) => c && c.trim().length > 0);
              const fallback = ['743','741','744','740','745','820','818','821','817','822','351','349','352','348','353','195','193','196','192','197','621','624','682','723','803','839','862','886','915','941'];
              const display30 = Array.from({ length: 30 }, (_, i) => (hasComps ? (comps[i] || '—') : (fallback[i] || '—')));
              return (
                <>
                  <div className="space-y-1.5">
                    {prizes.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center rounded-xl bg-neutral-950 border transition-all py-2 px-3.5 shadow-sm ${previewSlotTheme.pillActive.includes('border') ? 'border-sky-400/60' : 'border-gold/40'}`}
                      >
                        <div className={`w-7 h-7 rounded-lg border shrink-0 font-black text-xs flex items-center justify-center mr-3 ${previewSlotTheme.pillActive}`}>
                          {item.id}
                        </div>
                        <span className="font-black font-mono tracking-widest text-white text-xl">
                          {item.val || '—'}
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
                          {val || '—'}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* WhatsApp Share */}
                  <button
                    type="button"
                    onClick={() => {
                      const slotTimeMap: Record<string, string> = {
                        '1 PM Game': '01:00 PM', '3 PM Game': '03:00 PM',
                        '6 PM Game': '06:00 PM', '8 PM Game': '08:00 PM',
                      };
                      const dateStr = previewDate.split('-').reverse().join('-');
                      const rows: string[] = [];
                      for (let i = 0; i < 30; i += 5) {
                        rows.push(display30.slice(i, i + 5).join(' | ') + ' |');
                      }
                      const text = `${dateStr}\n${slotTimeMap[previewSlot] || previewSlot}\n\n1 - ${prizes[0].val}\n2 - ${prizes[1].val}\n3 - ${prizes[2].val}\n4 - ${prizes[3].val}\n5 - ${prizes[4].val}\n\nOthers:-\n${rows.join('\n')}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:brightness-110 text-white font-black text-xs tracking-wider uppercase rounded-xl shadow border border-emerald-400 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.316 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.818-.981zm10.707-7.669c-.27-.135-1.602-.79-1.85-.88-.248-.09-.428-.135-.609.135-.18.27-.788.858-1.06.158-.18.315-.202.585-.068.27.135 1.14.42 2.171 1.341.803.717 1.346 1.604 1.503 1.875.158.27.017.417-.118.551-.122.122-.27.315-.405.473-.135.158-.18.27-.27.45-.09.18-.045.338-.022.473-.068.135-.609-1.468-.834-2.012-.22-.53-.443-.458-.609-.467-.157-.008-.337-.01-.518-.01-.18 0-.473.068-.72.338-.248.27-.946.924-.946 2.253 0 1.329.968 2.614 1.103 2.794.135.18 1.905 2.909 4.615 4.079.645.278 1.149.444 1.542.569.649.206 1.24.177 1.706.108.52-.078 1.602-.655 1.827-1.288.225-.633.225-1.174.158-1.288-.067-.113-.247-.18-.517-.315z" />
                    </svg>
                    <span>Share Result to WhatsApp</span>
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
