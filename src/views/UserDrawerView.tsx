import React from 'react';
import { useApp } from '../context/AppContext';
import { Lucky10Logo } from '../components/Lucky10Logo';
import { ArrowLeft } from 'lucide-react';

export const UserDrawerView: React.FC = () => {
  const { logout, setCurrentView } = useApp();

  const menuItems = [
    { label: 'Payout Structure', icon: '/assets/gold-question.png', action: () => setCurrentView('PAYOUT_STRUCTURE') },
    { label: 'Change Game', icon: '/assets/gold-calendar.png', action: () => setCurrentView('CHANGE_GAME') },
    { label: 'My Play Report', icon: '/assets/gold-ticket.png', action: () => setCurrentView('GAME_DASHBOARD') },
    { label: "Today's Winning Numbers", icon: '/assets/gold-trophy.png', action: () => setCurrentView('TODAYS_WINNING_NUMBERS') },
    { label: 'Today Winners', icon: '/assets/gold-trophy.png', action: () => setCurrentView('TODAYS_WINNING_NUMBERS') },
    { label: 'Winners Price Transactions', icon: '/assets/gold-trophy.png', action: () => setCurrentView('PAYOUT_STRUCTURE') },
    { label: 'Update Your Bank Account', icon: '/assets/gold-bank.png', action: () => setCurrentView('UPDATE_BANK_DETAILS') },
  ];

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-between overflow-y-auto pb-32 sm:pb-36">
      <div>
        {/* Top Gold Banner Header */}
        <div className="w-full bg-gold-banner px-5 py-3.5 flex items-center justify-between shadow-md">
          <button
            onClick={() => setCurrentView('GAME_DASHBOARD')}
            className="flex items-center gap-2 text-black hover:opacity-80 font-black text-lg sm:text-xl tracking-tight transition-opacity"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
            <span>Back</span>
          </button>
          <div className="scale-75 origin-right flex items-center gap-2">
            <Lucky10Logo size="sm" showSubtitle={false} />
          </div>
        </div>

        {/* Menu Items with Gold Logo Icons */}
        <div className="px-6 pt-6 space-y-3.5">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className="w-full flex items-center gap-3.5 pb-2.5 border-b border-neutral-800 text-left text-white hover:text-gold font-bold text-lg tracking-wide transition-colors group"
            >
              <img src={item.icon} alt={item.label} className="w-7 h-7 object-contain group-hover:scale-110 transition-transform shrink-0" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Logout Button at bottom left matching Page 5 */}
      <div className="px-6 pb-8 pt-6">
        <button
          onClick={logout}
          className="px-6 py-2.5 bg-gold-metallic text-black font-extrabold text-base rounded tracking-wide shadow-md hover:opacity-95"
        >
          Logout
        </button>
      </div>
    </div>
  );
};
