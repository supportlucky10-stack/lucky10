import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Server, Power, Check } from 'lucide-react';

// Import icons from src/assets/admin logo
import a1Icon from '../../assets/admin logo/a1.png';
import a2Icon from '../../assets/admin logo/a2.png';
import a3Icon from '../../assets/admin logo/a3.png';
import a4Icon from '../../assets/admin logo/a4.png';

export const AdminDrawerView: React.FC = () => {
  const { logout, setCurrentView, maintenanceState, updateMaintenance } = useApp();
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
    await updateMaintenance({
      isEnabled: nextState,
      message: maintenanceMsg.trim() || 'Server is under maintenance. Please try again later.',
    });
    setIsUpdating(false);
  };

  const handleSaveMessage = async () => {
    setIsUpdating(true);
    await updateMaintenance({
      isEnabled: maintenanceEnabled,
      message: maintenanceMsg.trim() || 'Server is under maintenance. Please try again later.',
    });
    setIsUpdating(false);
  };

  const menuItems = [
    { label: 'Users List', icon: a1Icon, action: () => setCurrentView('ADMIN_USERS_LIST') },
    { label: 'Result Management', icon: a2Icon, action: () => setCurrentView('ADMIN_RESULT_MANAGEMENT') },
    { label: 'Reports', icon: a3Icon, action: () => setCurrentView('ADMIN_REPORTS') },
    { label: 'Limit / Block', icon: a4Icon, action: () => setCurrentView('ADMIN_LIMIT_BLOCK') },
  ];

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-16 select-none font-sans">
      <div>
        {/* Top Gold Banner Header */}
        <div
          className="w-full bg-gold-banner px-5 pb-4 sm:pb-5 flex items-center justify-between shadow-md border-b border-[#aa771c] min-h-[48px]"
          style={{ paddingTop: 'max(16px, env(safe-area-inset-top, 0px))' }}
        >
        </div>

        {/* Menu Items List */}
        <div className="pt-2 divide-y divide-neutral-800">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className="w-full text-left py-4 px-6 text-white hover:text-gold font-bold text-base sm:text-lg tracking-wide transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-7 h-7 flex items-center justify-center shrink-0">
                  <img src={item.icon} alt={item.label} className="w-full h-full object-contain filter drop-shadow" />
                </div>
                <span className="font-bold text-white tracking-wide text-base sm:text-lg">{item.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Server Maintenance Control Card */}
        <div className="mx-6 my-4 p-4 rounded-2xl bg-neutral-950 border-2 border-neutral-800 shadow-xl space-y-3 font-sans">
          <div className="flex items-center justify-between gap-2 border-b border-neutral-900 pb-2.5">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-amber-400 shrink-0" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Server Maintenance
              </h3>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider font-mono ${
                maintenanceEnabled
                  ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {maintenanceEnabled ? 'PORTAL LOCKED' : 'PORTAL ACTIVE'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div>
              <p className="text-xs font-bold text-neutral-200">Maintenance Lock</p>
              <p className="text-[11px] text-neutral-400">
                {maintenanceEnabled
                  ? 'Active: Users cannot perform any actions'
                  : 'Inactive: Users have normal access'}
              </p>
            </div>
            <button
              type="button"
              disabled={isUpdating}
              onClick={handleToggle}
              className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-md ${
                maintenanceEnabled
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white border border-rose-400 hover:brightness-110 active:scale-95'
                  : 'bg-gradient-to-r from-neutral-800 to-neutral-700 text-neutral-300 border border-neutral-600 hover:text-white hover:brightness-110 active:scale-95'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{maintenanceEnabled ? 'TURN OFF' : 'TURN ON'}</span>
            </button>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-neutral-900">
            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">
              Announcement Message
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={maintenanceMsg}
                onChange={(e) => setMaintenanceMsg(e.target.value)}
                placeholder="Server is under maintenance. Please try again later."
                className="flex-1 px-3 py-2 bg-neutral-900 text-white font-semibold text-xs rounded-xl border border-neutral-700 focus:outline-none focus:border-amber-400 shadow-inner"
              />
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleSaveMessage}
                className="px-3 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:brightness-110 active:scale-95 text-black font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow transition-all shrink-0 flex items-center gap-1"
                title="Update Message"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>SAVE</span>
              </button>
            </div>
          </div>
        </div>

        {/* Exit Button */}
        <div className="pt-2 sm:pt-4 px-6 pb-10">
          <button
            onClick={logout}
            className="px-8 py-2.5 bg-gradient-to-b from-[#edd177] via-[#c89825] to-[#996e19] text-black font-black text-xs sm:text-sm rounded-lg shadow-md hover:brightness-110 active:scale-95 transition-all uppercase tracking-wide cursor-pointer"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
};

