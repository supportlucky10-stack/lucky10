import React from 'react';
import { useApp } from '../../context/AppContext';

// Import icons from src/assets/admin logo
import a1Icon from '../../assets/admin logo/a1.png';
import a2Icon from '../../assets/admin logo/a2.png';
import a3Icon from '../../assets/admin logo/a3.png';
import a4Icon from '../../assets/admin logo/a4.png';

export const AdminDrawerView: React.FC = () => {
  const { logout, setCurrentView } = useApp();

  const menuItems = [
    { label: 'Users List', icon: a1Icon, action: () => setCurrentView('ADMIN_USERS_LIST') },
    { label: 'Result Management', icon: a2Icon, action: () => setCurrentView('ADMIN_RESULT_MANAGEMENT') },
    { label: 'Reports', icon: a3Icon, action: () => setCurrentView('ADMIN_REPORTS') },
    { label: 'Limit / Block', icon: a4Icon, action: () => setCurrentView('ADMIN_LIMIT_BLOCK') },
  ];

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-16 select-none">
      <div>
        {/* Top Gold Banner Header (Hello Admin and Logo removed as requested) */}
        <div className="w-full bg-gold-banner px-5 py-4 sm:py-5 flex items-center justify-between shadow-md border-b border-[#aa771c] min-h-[48px]">
        </div>

        {/* Menu Items List (Users List, Result Management, Reports, Limit / Block) */}
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

        {/* Exit Button */}
        <div className="pt-6 sm:pt-8 px-6 pb-10">
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
