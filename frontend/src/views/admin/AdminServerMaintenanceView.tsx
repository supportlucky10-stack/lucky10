import React, { useState, useEffect } from 'react';
import { HeaderBanner } from '../../components/HeaderBanner';
import { useApp } from '../../context/AppContext';
import { Power, ShieldAlert } from 'lucide-react';

export const AdminServerMaintenanceView: React.FC = () => {
  const { setCurrentView, maintenanceState, updateMaintenance, addToast } = useApp();

  const [maintenanceEnabled, setMaintenanceEnabled] = useState(maintenanceState.isEnabled);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setMaintenanceEnabled(maintenanceState.isEnabled);
  }, [maintenanceState]);

  const handleToggle = async () => {
    setIsUpdating(true);
    const nextState = !maintenanceEnabled;
    setMaintenanceEnabled(nextState);
    try {
      await updateMaintenance({
        isEnabled: nextState,
        message: maintenanceState.message || 'Server is under maintenance. Please try again later.',
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
      </div>
    </div>
  );
};
