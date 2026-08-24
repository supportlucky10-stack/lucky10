import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HeaderBanner } from '../../components/HeaderBanner';
import type { GameSlot } from '../../types';
import { ShieldAlert, Ban, Globe, Trash2, PlusCircle, CheckCircle, Lock } from 'lucide-react';

export const AdminLimitBlockView: React.FC = () => {
  const {
    setCurrentView,
    registeredUsers,
    agencyNumberLimits,
    blockedNumbers,
    globalLimitRule,
    addAgencyLimit,
    removeAgencyLimit,
    addBlockedNumber,
    removeBlockedNumber,
    updateGlobalLimit,
    addToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'LIMIT_COUNT' | 'BLOCK_NUMBER' | 'LIMIT_ALL'>('LIMIT_COUNT');

  // Option 1: Limit Count Form State (Default: 'ALL' for All Agencies)
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('ALL');
  const [limitSlot, setLimitSlot] = useState<GameSlot | 'ALL'>('ALL');
  const [limitNumber, setLimitNumber] = useState<string>('');
  const [limitMaxCount, setLimitMaxCount] = useState<string>('50');

  // Option 2: Block Number Form State
  const [blockNumberInput, setBlockNumberInput] = useState<string>('');
  const [blockSlot, setBlockSlot] = useState<GameSlot | 'ALL'>('ALL');

  // Option 3: Limit All Form State
  const [globalMaxCount, setGlobalMaxCount] = useState<string>(String(globalLimitRule.defaultMaxCount || 50));
  const [globalSlot, setGlobalSlot] = useState<GameSlot | 'ALL'>(globalLimitRule.gameSlot || 'ALL');

  React.useEffect(() => {
    if (globalLimitRule) {
      setGlobalMaxCount(String(globalLimitRule.defaultMaxCount || 50));
      setGlobalSlot(globalLimitRule.gameSlot || 'ALL');
    }
  }, [globalLimitRule]);

  // Restrict keydown to strictly digits 0-9 and control keys
  const allowOnlyDigits = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'].includes(e.key) ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return;
    }
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  // Handlers
  const handleSaveAgencyLimit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = limitNumber.trim();
    const countNum = parseInt(limitMaxCount, 10);

    if (!cleanNum) {
      addToast('Please enter a valid game number (e.g. 742)', 'error');
      return;
    }
    if (isNaN(countNum) || countNum <= 0) {
      addToast('Please enter a valid count limit (greater than 0)', 'error');
      return;
    }

    const agency = registeredUsers.find((u) => u.id === selectedAgencyId);
    const agencyName = agency ? agency.name : 'All Agencies';

    addAgencyLimit({
      agencyId: selectedAgencyId,
      agencyName,
      number: cleanNum,
      gameSlot: limitSlot,
      maxCount: countNum,
    });

    setLimitNumber('');
  };

  const handleSaveBlockNumber = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = blockNumberInput.trim();
    if (!cleanNum) {
      addToast('Please enter a game number to block (e.g. 742)', 'error');
      return;
    }

    addBlockedNumber({
      number: cleanNum,
      gameSlot: blockSlot,
    });

    setBlockNumberInput('');
  };

  const handleSaveGlobalLimit = (e: React.FormEvent) => {
    e.preventDefault();
    const countNum = parseInt(globalMaxCount, 10);
    if (isNaN(countNum) || countNum <= 0) {
      addToast('Please enter a valid count limit (greater than 0)', 'error');
      return;
    }

    updateGlobalLimit({
      isEnabled: true,
      defaultMaxCount: countNum,
      gameSlot: globalSlot,
    });
  };

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-20 select-none font-sans">
      <HeaderBanner
        title="LIMIT / BLOCK"
        showBack={true}
        onBackClick={() => setCurrentView('ADMIN_DRAWER')}
      />

      <div className="max-w-md mx-auto w-full px-3 sm:px-4 py-4 space-y-4">
        {/* Navigation Tabs / 3 Options Box */}
        <div className="grid grid-cols-3 gap-1.5 bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800 shadow-md">
          <button
            type="button"
            onClick={() => setActiveTab('LIMIT_COUNT')}
            className={`py-2.5 px-2 rounded-xl text-xs font-black tracking-wide flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'LIMIT_COUNT'
                ? 'bg-gradient-to-b from-[#edd177] via-[#c89825] to-[#996e19] text-black shadow-lg scale-[1.02]'
                : 'text-neutral-400 hover:text-white bg-neutral-900/50'
            }`}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span className="leading-tight text-center">1. Limit Count</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BLOCK_NUMBER')}
            className={`py-2.5 px-2 rounded-xl text-xs font-black tracking-wide flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'BLOCK_NUMBER'
                ? 'bg-gradient-to-b from-[#edd177] via-[#c89825] to-[#996e19] text-black shadow-lg scale-[1.02]'
                : 'text-neutral-400 hover:text-white bg-neutral-900/50'
            }`}
          >
            <Ban className="w-4 h-4 shrink-0" />
            <span className="leading-tight text-center">2. Block Number</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LIMIT_ALL')}
            className={`py-2.5 px-2 rounded-xl text-xs font-black tracking-wide flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'LIMIT_ALL'
                ? 'bg-gradient-to-b from-[#edd177] via-[#c89825] to-[#996e19] text-black shadow-lg scale-[1.02]'
                : 'text-neutral-400 hover:text-white bg-neutral-900/50'
            }`}
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span className="leading-tight text-center">3. Limit All</span>
          </button>
        </div>

        {/* ================= OPTION 1: LIMIT COUNT ================= */}
        {activeTab === 'LIMIT_COUNT' && (
          <div className="space-y-4 animate-drop-in">
            {/* Agency Limit Form Card */}
            <div className="bg-neutral-950 border border-neutral-800 p-4 sm:p-5 rounded-2xl shadow-xl space-y-3.5">
              <div className="flex items-center gap-2 border-b border-neutral-800 pb-2.5">
                <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                <h2 className="text-xs sm:text-sm font-black text-white tracking-wide uppercase">LIMIT COUNT</h2>
              </div>

              <form onSubmit={handleSaveAgencyLimit} className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                      AGENCY NAME
                    </label>
                    <select
                      value={selectedAgencyId}
                      onChange={(e) => setSelectedAgencyId(e.target.value)}
                      className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-white focus:border-gold outline-none cursor-pointer"
                    >
                      <option value="ALL">All Agencies</option>
                      {registeredUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                      GAME SLOT
                    </label>
                    <select
                      value={limitSlot}
                      onChange={(e) => setLimitSlot(e.target.value as any)}
                      className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-white focus:border-gold outline-none cursor-pointer"
                    >
                      <option value="ALL">All Slots</option>
                      <option value="1 PM Game">1 PM Game</option>
                      <option value="3 PM Game">3 PM Game</option>
                      <option value="6 PM Game">6 PM Game</option>
                      <option value="8 PM Game">8 PM Game</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                      GAME NUMBER
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="e.g. 742"
                      value={limitNumber}
                      onChange={(e) => setLimitNumber(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={allowOnlyDigits}
                      className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono font-black text-gold focus:border-gold outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                      MAX COUNT LIMIT
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="e.g. 50"
                      value={limitMaxCount}
                      onChange={(e) => setLimitMaxCount(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={allowOnlyDigits}
                      className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono font-black text-gold focus:border-gold outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-center">
                  <button
                    type="submit"
                    className="px-8 py-2 bg-gradient-to-b from-[#edd177] via-[#c89825] to-[#996e19] text-black font-black text-xs sm:text-sm rounded-xl shadow-md hover:brightness-110 active:scale-[0.98] transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>SAVE LIMIT</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Configured Limits List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black uppercase tracking-wider text-neutral-300">
                  Active Agency Limits ({agencyNumberLimits.length})
                </span>
              </div>

              {agencyNumberLimits.length === 0 ? (
                <div className="bg-neutral-950 border border-neutral-850 p-6 rounded-2xl text-center text-neutral-400 text-xs font-semibold">
                  No agency limits set. All numbers can be played up to account limits.
                </div>
              ) : (
                <div className="space-y-2">
                  {agencyNumberLimits.map((rule) => (
                    <div
                      key={rule.id}
                      className="bg-neutral-950 border border-neutral-800 hover:border-gold/50 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-md transition-all font-mono"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-sm sm:text-base font-black text-gold bg-black px-2.5 py-1 rounded-xl border border-gold/40 shadow-inner shrink-0">
                          {rule.number}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-black text-white uppercase truncate">
                            {rule.agencyName}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-sans mt-0.5">
                            {rule.gameSlot}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="bg-gold/10 text-gold border border-gold/30 px-2.5 py-1 rounded-xl text-xs font-black font-mono">
                          Limit: {rule.maxCount}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeAgencyLimit(rule.id)}
                          className="p-1.5 text-neutral-400 hover:text-rose-400 bg-black hover:bg-rose-950/40 rounded-xl border border-neutral-800 hover:border-rose-700/50 transition-all cursor-pointer shrink-0"
                          title="Remove Limit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= OPTION 2: BLOCK NUMBER ================= */}
        {activeTab === 'BLOCK_NUMBER' && (
          <div className="space-y-4 animate-drop-in">
            {/* Block Number Form Card */}
            <div className="bg-neutral-950 border border-neutral-800 p-4 sm:p-5 rounded-2xl shadow-xl space-y-3.5">
              <div className="flex items-center gap-2 border-b border-neutral-800 pb-2.5">
                <Ban className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
                <h2 className="text-xs sm:text-sm font-black text-white tracking-wide uppercase">BLOCK NUMBER</h2>
              </div>

              <form onSubmit={handleSaveBlockNumber} className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                      GAME NUMBER
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="e.g. 742"
                      value={blockNumberInput}
                      onChange={(e) => setBlockNumberInput(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={allowOnlyDigits}
                      className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono font-black text-rose-400 focus:border-rose-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                      GAME SLOT
                    </label>
                    <select
                      value={blockSlot}
                      onChange={(e) => setBlockSlot(e.target.value as any)}
                      className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-white focus:border-rose-500 outline-none cursor-pointer"
                    >
                      <option value="ALL">All Slots</option>
                      <option value="1 PM Game">1 PM Game</option>
                      <option value="3 PM Game">3 PM Game</option>
                      <option value="6 PM Game">6 PM Game</option>
                      <option value="8 PM Game">8 PM Game</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-center">
                  <button
                    type="submit"
                    className="px-8 py-2 bg-gradient-to-b from-rose-500 via-rose-600 to-rose-800 hover:brightness-110 text-white font-black text-xs sm:text-sm rounded-xl shadow-md active:scale-[0.98] transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>BLOCK NUMBER</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Blocked Numbers List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black uppercase tracking-wider text-neutral-300">
                  Currently Blocked Numbers ({blockedNumbers.length})
                </span>
              </div>

              {blockedNumbers.length === 0 ? (
                <div className="bg-neutral-950 border border-neutral-850 p-6 rounded-2xl text-center text-neutral-400 text-xs font-semibold">
                  No numbers are currently blocked. All numbers can be played.
                </div>
              ) : (
                <div className="space-y-2">
                  {blockedNumbers.map((blk) => (
                    <div
                      key={blk.id}
                      className="bg-neutral-950 border border-rose-900/40 hover:border-rose-600/70 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-md transition-all font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm sm:text-base font-black text-rose-400 bg-black px-2.5 py-1 rounded-xl border border-rose-800/60 shadow-inner">
                          {blk.number}
                        </span>
                        <span className="text-xs font-bold text-white uppercase">{blk.gameSlot}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeBlockedNumber(blk.id)}
                        className="px-3 py-1.5 text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-700 rounded-xl border border-rose-800/60 transition-all font-black text-xs cursor-pointer shrink-0 uppercase tracking-wide"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= OPTION 3: LIMIT ALL ================= */}
        {activeTab === 'LIMIT_ALL' && (
          <div className="space-y-4 animate-drop-in">
            {/* Current Status Card */}
            {globalLimitRule && globalLimitRule.isEnabled ? (
              <div className="bg-emerald-950/40 border border-emerald-500/50 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-md font-sans">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <div className="min-w-0">
                    <span className="text-emerald-300 font-extrabold text-xs block">
                      STATUS: ACTIVE ({globalLimitRule.defaultMaxCount} Max Count)
                    </span>
                    <span className="text-[10px] text-emerald-400/80 block font-mono">
                      Applied Slot: {globalLimitRule.gameSlot === 'ALL' ? 'All Slots' : globalLimitRule.gameSlot}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => updateGlobalLimit({ isEnabled: false })}
                  className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-600/60 text-rose-300 rounded-xl text-xs font-extrabold cursor-pointer shrink-0 transition-all shadow-sm"
                >
                  Disable Limit
                </button>
              </div>
            ) : (
              <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-2xl text-center text-neutral-400 text-xs font-semibold">
                Limit All is currently <span className="text-rose-400 font-bold">DISABLED</span>. Numbers have no global count limit.
              </div>
            )}

            {/* Limit All Settings Card */}
            <div className="bg-neutral-950 border border-neutral-800 p-4 sm:p-5 rounded-2xl shadow-xl space-y-3.5 font-sans">
              <div className="flex items-center gap-2 border-b border-neutral-800 pb-2.5">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                <h2 className="text-xs sm:text-sm font-black text-white tracking-wide uppercase">ALL NUMBERS COUNT LIMIT</h2>
              </div>

              <form onSubmit={handleSaveGlobalLimit} className="space-y-3.5">
                {/* Global Max Count & Slot */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                      LIMIT COUNT
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="e.g. 50"
                      value={globalMaxCount}
                      onChange={(e) => setGlobalMaxCount(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={allowOnlyDigits}
                      className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono font-black text-gold focus:border-gold outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                      APPLIED SLOT
                    </label>
                    <select
                      value={globalSlot}
                      onChange={(e) => setGlobalSlot(e.target.value as any)}
                      className="w-full bg-black border border-neutral-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-white focus:border-gold outline-none cursor-pointer"
                    >
                      <option value="ALL">All Slots</option>
                      <option value="1 PM Game">1 PM Game</option>
                      <option value="3 PM Game">3 PM Game</option>
                      <option value="6 PM Game">6 PM Game</option>
                      <option value="8 PM Game">8 PM Game</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-center">
                  <button
                    type="submit"
                    className="px-8 py-2 bg-gradient-to-b from-[#edd177] via-[#c89825] to-[#996e19] text-black font-black text-xs sm:text-sm rounded-xl shadow-md hover:brightness-110 active:scale-[0.98] transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>APPLY LIMIT ALL</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
