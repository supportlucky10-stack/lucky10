import React, { useState, useEffect } from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';
import { useApp } from '../../context/AppContext';
import { Server, Power, Check, ShieldAlert, AlertTriangle, RefreshCw, Radio, Eye } from 'lucide-react';

export const AdminServerMaintenanceView: React.FC = () => {
  const { setCurrentView, maintenanceState, updateMaintenance, addToast, refreshAllData } = useApp();

  const [maintenanceEnabled, setMaintenanceEnabled] = useState(maintenanceState.isEnabled);
  const [maintenanceMsg, setMaintenanceMsg] = useState(maintenanceState.message);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setMaintenanceEnabled(maintenanceState.isEnabled);
    setMaintenanceMsg(maintenanceState.message);
  }, [maintenanceState]);

  const handleToggle = async () => {
    setIsUpdating(true);
    const nextState = !maintenanceEnabled;
    setMaintenanceEnabled(nextState);
    try {
      await updateMaintenance({
        isEnabled: nextState,
        message: maintenanceMsg.trim() || 'Server is under maintenance. Please try again later.',
      });
      if (nextState) {
        addToast('Maintenance Mode Activated. User portals are now locked.', 'error');
      } else {
        addToast('Maintenance Mode Deactivated. Normal access restored.', 'success');
      }
    } catch {
      addToast('Failed to update maintenance mode.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveMessage = async () => {
    const finalMsg = maintenanceMsg.trim() || 'Server is under maintenance. Please try again later.';
    setIsUpdating(true);
    try {
      await updateMaintenance({
        isEnabled: maintenanceEnabled,
        message: finalMsg,
      });
      addToast('Maintenance announcement updated successfully.', 'success');
    } catch {
      addToast('Failed to save announcement message.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePresetSelect = (text: string) => {
    setMaintenanceMsg(text);
  };

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-20 select-none font-sans">
      <HeaderBanner
        title="SERVER MAINTENANCE"
        showBack={true}
        onBackClick={() => setCurrentView('ADMIN_DRAWER')}
        showHome={true}
        onHomeClick={() => setCurrentView('ADMIN_DRAWER')}
      />

      <div className="max-w-xl mx-auto w-full px-4 sm:px-6 py-5 space-y-5">
        {/* Top Status Hero Card */}
        <div
          className={`p-5 rounded-2xl border-2 shadow-2xl transition-all ${
            maintenanceEnabled
              ? 'bg-gradient-to-b from-rose-950/60 to-black border-rose-700/80 shadow-rose-950/40'
              : 'bg-gradient-to-b from-emerald-950/40 to-black border-emerald-700/70 shadow-emerald-950/30'
          }`}
        >
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-800/80">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  maintenanceEnabled
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                    : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                }`}
              >
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-white tracking-wide uppercase">
                  Server Status
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${
                      maintenanceEnabled ? 'bg-rose-500 animate-ping' : 'bg-emerald-400 animate-pulse'
                    }`}
                  />
                  <span
                    className={`text-xs font-black uppercase tracking-wider font-mono ${
                      maintenanceEnabled ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {maintenanceEnabled ? 'PORTAL LOCKED (MAINTENANCE ON)' : 'PORTAL ONLINE (ACTIVE)'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => refreshAllData()}
              className="p-2 text-neutral-400 hover:text-white rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors"
              title="Refresh status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-3 text-xs text-neutral-300 space-y-1">
            {maintenanceEnabled ? (
              <p className="flex items-center gap-1.5 text-rose-300 font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                All players and agencies are currently blocked from betting and actions.
              </p>
            ) : (
              <p className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                <Radio className="w-4 h-4 shrink-0 text-emerald-400" />
                Portal is live. Users have unrestricted access to all games and accounts.
              </p>
            )}
          </div>
        </div>

        {/* Master Toggle Switch Card */}
        <div className="p-5 rounded-2xl bg-neutral-950 border-2 border-neutral-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-sm">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Maintenance Mode Control
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Toggle to instantly lock the site for emergency maintenance or database updates.
              </p>
            </div>

            <button
              type="button"
              disabled={isUpdating}
              onClick={handleToggle}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-lg active:scale-95 ${
                maintenanceEnabled
                  ? 'bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 text-white border border-rose-400 hover:brightness-110'
                  : 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 text-white border border-emerald-400 hover:brightness-110'
              }`}
            >
              <Power className={`w-4 h-4 stroke-[2.5] ${isUpdating ? 'animate-spin' : ''}`} />
              <span>{maintenanceEnabled ? 'TURN OFF MAINTENANCE' : 'TURN ON MAINTENANCE'}</span>
            </button>
          </div>
        </div>

        {/* Announcement Message Card */}
        <div className="p-5 rounded-2xl bg-neutral-950 border-2 border-neutral-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-amber-400 uppercase tracking-wider">
              Announcement Message
            </label>
            <span className="text-[11px] text-neutral-500 font-mono">
              Displayed on user screen
            </span>
          </div>

          <textarea
            rows={3}
            value={maintenanceMsg}
            onChange={(e) => setMaintenanceMsg(e.target.value)}
            placeholder="Server is under maintenance. Please try again later."
            className="w-full px-3.5 py-2.5 bg-neutral-900 text-white font-medium text-xs sm:text-sm rounded-xl border border-neutral-700 focus:outline-none focus:border-amber-400 shadow-inner resize-none leading-relaxed"
          />

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">
              Quick Presets:
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                'Server is under maintenance. Please try again later.',
                'Scheduled system update in progress. Please check back shortly.',
                'Routine database optimization underway. Games resume soon.',
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg border border-neutral-800 hover:border-neutral-600 transition-colors text-left"
                >
                  Preset {idx + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-neutral-900">
            <button
              type="button"
              disabled={isUpdating}
              onClick={handleSaveMessage}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:brightness-110 active:scale-95 text-black font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-lg transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isUpdating ? 'SAVING...' : 'SAVE MESSAGE'}</span>
            </button>
          </div>
        </div>

        {/* Live User Screen Preview Card */}
        <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-neutral-400">
            <Eye className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black uppercase tracking-wider text-neutral-300">
              User Screen Preview
            </span>
          </div>

          <div className="relative rounded-xl border border-neutral-800 bg-neutral-900/90 p-6 flex flex-col items-center justify-center text-center space-y-3 overflow-hidden shadow-inner">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Server className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-white tracking-wider uppercase">
                Server Under Maintenance
              </h4>
              <p className="text-xs text-amber-300/90 font-medium max-w-sm">
                "{maintenanceMsg || 'Server is under maintenance. Please try again later.'}"
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              <span>Real-time portal broadcast</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
