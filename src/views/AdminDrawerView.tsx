import React from 'react';
import { useApp } from '../context/AppContext';
import { Lucky10Logo } from '../components/Lucky10Logo';
import { ChevronRight } from 'lucide-react';

export const AdminDrawerView: React.FC = () => {
  const { logout, setCurrentView } = useApp();

  const menuItems = [
    { label: 'Users List', icon: '/assets/gold-ticket.png', action: () => setCurrentView('ADMIN_USERS_LIST') },
    { label: 'Result Management', icon: '/assets/gold-calendar.png', action: () => setCurrentView('ADMIN_USERS_LIST') },
    { label: 'Reports', icon: '/assets/gold-question.png', action: () => setCurrentView('ADMIN_REPORTS') },
    { label: 'Payouts', icon: '/assets/gold-bank.png', action: () => setCurrentView('ADMIN_PAYOUTS') },
    { label: 'Transaction Logs', icon: '/assets/gold-trophy.png', action: () => setCurrentView('ADMIN_TRANSACTION_LOGS') },
  ];

  return (
    <div className="w-full flex-1 bg-black text-white flex flex-col justify-between overflow-y-auto">
      <div>
        {/* Top Gold Banner Header matching Page 13 */}
        <div className="w-full bg-gold-banner px-6 py-4 flex items-center justify-between shadow-md">
          <h2 className="text-black font-extrabold text-xl tracking-tight">
            Admin Details
          </h2>
          <div className="scale-75 origin-right">
            <Lucky10Logo size="sm" showSubtitle={false} />
          </div>
        </div>

        {/* Menu Items with Gold Logo Icons */}
        <div className="px-6 pt-8 space-y-3.5">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className="w-full text-left py-2.5 border-b border-neutral-800 text-white hover:text-gold font-bold text-lg tracking-wide transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-black p-1.5 flex items-center justify-center shrink-0 border border-gold/80 shadow group-hover:scale-105 transition-transform">
                  <img src={item.icon} alt={item.label} className="w-full h-full object-contain filter drop-shadow" />
                </div>
                <span>{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-gold transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Logout Button matching Page 13 */}
      <div className="px-6 pb-10 pt-6">
        <button
          onClick={logout}
          className="px-6 py-2.5 btn-gold font-extrabold text-sm rounded tracking-wide shadow-md hover:opacity-90"
        >
          Logout
        </button>
      </div>
    </div>
  );
};
