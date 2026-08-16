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
    placedTickets,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'LIMIT_COUNT' | 'BLOCK_NUMBER' | 'LIMIT_ALL'>('LIMIT_COUNT');

  // Option 1: Limit Count Form State
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>(registeredUsers[0]?.id || 'user_demo_001');
  const [limitSlot, setLimitSlot] = useState<GameSlot | 'ALL'>('ALL');
  const [limitNumber, setLimitNumber] = useState<string>('');
  const [limitMaxCount, setLimitMaxCount] = useState<string>('50');

  // Option 2: Block Number Form State (No reason input needed)
  const [blockNumberInput, setBlockNumberInput] = useState<string>('');
  const [blockSlot, setBlockSlot] = useState<GameSlot | 'ALL'>('ALL');

  // Option 3: Limit All Form State
  const [globalEnabled, setGlobalEnabled] = useState<boolean>(globalLimitRule.isEnabled);
  const [globalMaxCount, setGlobalMaxCount] = useState<string>(String(globalLimitRule.defaultMaxCount || 50));
  const [globalSlot, setGlobalSlot] = useState<GameSlot | 'ALL'>(globalLimitRule.gameSlot || 'ALL');

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
      isEnabled: globalEnabled,
      defaultMaxCount: countNum,
      gameSlot: globalSlot,
    });
  };

  // Helper to calculate live placed count today for agency + number + slot
  const getLivePlacedCount = (agencyId: string, number: string, slot: GameSlot | 'ALL') => {
    const todayStr = new Date().toISOString().split('T')[0];
    const matchingTickets = placedTickets.filter((t) => {
      const tDate = t.placedAt ? t.placedAt.split('T')[0].split(' ')[0] : todayStr;
      const matchDate = tDate === todayStr;
      const matchSlot = slot === 'ALL' || t.gameSlot === slot;
      const matchAgency = agencyId === 'ALL' || t.userId === agencyId;
      return matchDate && matchSlot && matchAgency;
    });

    let sum = 0;
    matchingTickets.forEach((t) => {
      t.items.forEach((it) => {
        const itNum = it.number.includes(':') ? it.number.split(':')[1] : it.number;
        if (itNum.trim() === number.trim()) {
          sum += it.count || 1;
        }
      });
    });
    return sum;
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
            {/* Limit Count Form Card */}
            <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
                <ShieldAlert className="w-5 h-5 text-gold" />
                <div>
                  <h2 className="text-sm font-black text-white tracking-wide uppercase">Agency-Wise Number Limit</h2>
                  <p className="text-[11px] text-neutral-400">Set max allowed bet count for a specific agency & number</p>
                </div>
              </div>

              <form onSubmit={handleSaveAgencyLimit} className="space-y-3.5">
                {/* Agency Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                    Select Agency
                  </label>
                  <select
                    value={selectedAgencyId}
                    onChange={(e) => setSelectedAgencyId(e.target.value)}
                    className="w-full bg-black border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white focus:border-gold outline-none cursor-pointer"
                  >
                    <option value="ALL">All Agencies (Universal)</option>
                    {registeredUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.username})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Game Slot Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                    Game Slot
                  </label>
                  <select
                    value={limitSlot}
                    onChange={(e) => setLimitSlot(e.target.value as any)}
                    className="w-full bg-black border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white focus:border-gold outline-none cursor-pointer"
                  >
                    <option value="ALL">All Slots</option>
                    <option value="1 PM Game">1 PM Game</option>
                    <option value="3 PM Game">3 PM Game</option>
                    <option value="6 PM Game">6 PM Game</option>
                    <option value="8 PM Game">8 PM Game</option>
                  </select>
                </div>

                {/* Number & Max Count in Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                      Game Number
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="e.g. 742"
                      value={limitNumber}
                      onChange={(e) => setLimitNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full bg-black border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm sm:text-base font-mono font-black text-gold focus:border-gold outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                      Limit Count
                    </label>
                    <input
                      type="number"
                      min={1}
                      placeholder="e.g. 50"
                      value={limitMaxCount}
                      onChange={(e) => setLimitMaxCount(e.target.value)}
                      className="w-full bg-black border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm sm:text-base font-mono font-black text-white focus:border-gold outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-b from-[#edd177] via-[#c89825] to-[#996e19] text-black font-black text-xs sm:text-sm rounded-xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>SET AGENCY LIMIT</span>
                </button>
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
                  {agencyNumberLimits.map((rule) => {
                    const currentPlaced = getLivePlacedCount(rule.agencyId, rule.number, rule.gameSlot);
                    const isLimitReached = currentPlaced >= rule.maxCount;

                    return (
                      <div
                        key={rule.id}
                        className="bg-neutral-950 border border-neutral-800 hover:border-gold/50 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-md transition-all font-mono"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base sm:text-lg font-black text-gold bg-black px-2.5 py-0.5 rounded-lg border border-gold/40 shadow-inner">
                              #{rule.number}
                            </span>
                            <span className="text-xs font-black text-white uppercase truncate max-w-[150px]">
                              {rule.agencyName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                            <span className="bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 text-[10px]">
                              {rule.gameSlot}
                            </span>
                            <span>Max: <strong className="text-white font-bold">{rule.maxCount}</strong></span>
                            <span className={isLimitReached ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                              (Used: {currentPlaced}/{rule.maxCount})
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeAgencyLimit(rule.id)}
                          className="p-2 text-neutral-400 hover:text-rose-400 bg-black hover:bg-rose-950/40 rounded-xl border border-neutral-800 hover:border-rose-700/50 transition-all cursor-pointer shrink-0"
                          title="Remove Limit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= OPTION 2: BLOCK NUMBER ================= */}
        {activeTab === 'BLOCK_NUMBER' && (
          <div className="space-y-4 animate-drop-in">
            {/* Block Number Form Card */}
            <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
                <Ban className="w-5 h-5 text-rose-400" />
                <div>
                  <h2 className="text-sm font-black text-white tracking-wide uppercase">Block Game Number</h2>
                  <p className="text-[11px] text-neutral-400">Blocked numbers cannot be played by any agency</p>
                </div>
              </div>

              <form onSubmit={handleSaveBlockNumber} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                      Game Number
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="e.g. 742"
                      value={blockNumberInput}
                      onChange={(e) => setBlockNumberInput(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full bg-black border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm sm:text-base font-mono font-black text-rose-400 focus:border-rose-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                      Game Slot
                    </label>
                    <select
                      value={blockSlot}
                      onChange={(e) => setBlockSlot(e.target.value as any)}
                      className="w-full bg-black border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white focus:border-rose-500 outline-none cursor-pointer"
                    >
                      <option value="ALL">All Slots</option>
                      <option value="1 PM Game">1 PM Game</option>
                      <option value="3 PM Game">3 PM Game</option>
                      <option value="6 PM Game">6 PM Game</option>
                      <option value="8 PM Game">8 PM Game</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-b from-rose-500 via-rose-600 to-rose-800 hover:brightness-110 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg active:scale-[0.98] transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>BLOCK THIS NUMBER</span>
                </button>
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
                      className="bg-neutral-950 border border-rose-900/40 hover:border-rose-600/70 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-md transition-all font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base sm:text-lg font-black text-rose-400 bg-black px-3 py-1 rounded-xl border border-rose-800/60 shadow-inner">
                          #{blk.number}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white uppercase">{blk.gameSlot}</span>
                          <span className="text-[10px] text-neutral-400">{blk.createdAt}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeBlockedNumber(blk.id)}
                        className="px-3.5 py-2 text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-700 rounded-xl border border-rose-800/60 transition-all font-black text-xs cursor-pointer shrink-0 uppercase tracking-wide"
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
            {/* Limit All Settings Card */}
            <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-2xl shadow-xl space-y-4 font-sans">
              <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
                <Globe className="w-5 h-5 text-gold" />
                <div>
                  <h2 className="text-sm font-black text-white tracking-wide uppercase">Limit All Numbers</h2>
                  <p className="text-[11px] text-neutral-400">Set universal count limit for all numbers across all agencies</p>
                </div>
              </div>

              <form onSubmit={handleSaveGlobalLimit} className="space-y-4">
                {/* Enable/Disable Toggle */}
                <div className="bg-black border border-neutral-800 p-4 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-white uppercase tracking-wider block">
                      Universal Cap Status
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      {globalEnabled ? 'Enforcing universal cap on all numbers' : 'Universal limit is disabled'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setGlobalEnabled(!globalEnabled)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      globalEnabled ? 'bg-gold justify-end' : 'bg-neutral-800 justify-start'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full shadow-md transition-all ${globalEnabled ? 'bg-black' : 'bg-neutral-500'}`} />
                  </button>
                </div>

                {/* Global Max Count & Slot */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                      Limit Count (Max Count)
                    </label>
                    <input
                      type="number"
                      min={1}
                      placeholder="e.g. 50"
                      value={globalMaxCount}
                      onChange={(e) => setGlobalMaxCount(e.target.value)}
                      className="w-full bg-black border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm sm:text-base font-mono font-black text-gold focus:border-gold outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                      Applied Slot
                    </label>
                    <select
                      value={globalSlot}
                      onChange={(e) => setGlobalSlot(e.target.value as any)}
                      className="w-full bg-black border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white focus:border-gold outline-none cursor-pointer"
                    >
                      <option value="ALL">All Slots</option>
                      <option value="1 PM Game">1 PM Game</option>
                      <option value="3 PM Game">3 PM Game</option>
                      <option value="6 PM Game">6 PM Game</option>
                      <option value="8 PM Game">8 PM Game</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-b from-[#edd177] via-[#c89825] to-[#996e19] text-black font-black text-xs sm:text-sm rounded-xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>APPLY LIMIT ALL</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
