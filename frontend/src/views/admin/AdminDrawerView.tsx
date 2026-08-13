import React from 'react';
import { useApp } from '../../context/AppContext';

// Import icons from src/assets/admin logo
import a1Icon from '../../assets/admin logo/a1.png';
import a2Icon from '../../assets/admin logo/a2.png';
import a3Icon from '../../assets/admin logo/a3.png';
import a4Icon from '../../assets/admin logo/a4.png';
import a5Icon from '../../assets/admin logo/a5.png';
import a6Icon from '../../assets/admin logo/a6.png';

// Import exact Lucky 10 Black Logo
import lucky10BlackLogo from '../../assets/lucky10-black-logo.png';

export const AdminDrawerView: React.FC = () => {
  const { logout, setCurrentView } = useApp();

  const menuItems = [
    { label: 'Users List', icon: a1Icon, action: () => setCurrentView('ADMIN_USERS_LIST') },
    { label: 'Result Management', icon: a2Icon, action: () => setCurrentView('ADMIN_RESULT_MANAGEMENT') },
    { label: 'Reports', icon: a3Icon, action: () => setCurrentView('ADMIN_REPORTS') },
    { label: 'Payouts', icon: a4Icon, action: () => setCurrentView('ADMIN_PAYOUTS') },
    { label: 'Transaction Logs', icon: a5Icon, action: () => setCurrentView('ADMIN_TRANSACTION_LOGS') },
    { label: 'Issues', icon: a6Icon, action: () => setCurrentView('ADMIN_ISSUES') },
  ];

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-16 select-none">
      <div>
        {/* Top Gold Banner Header */}
        <div className="w-full bg-gold-banner px-5 py-3 sm:py-3.5 flex items-center justify-between shadow-md border-b border-[#aa771c]">
          <h1 className="text-black font-black italic text-base sm:text-lg tracking-wide">
            Hello Admin
          </h1>
          <div className="flex items-center shrink-0">
            <img
              src={lucky10BlackLogo}
              alt="Lucky 10 Logo"
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain filter drop-shadow"
            />
          </div>
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

        {/* Logout Button Positioned Suitable and Moved Up */}
        <div className="pt-6 sm:pt-8 px-6 pb-10">
          <button
            onClick={logout}
            className="px-6 py-2.5 bg-gradient-to-b from-[#edd177] via-[#c89825] to-[#996e19] text-black font-black text-xs sm:text-sm rounded-lg shadow-md hover:brightness-110 active:scale-95 transition-all uppercase tracking-wide cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};


