import React from 'react';
import { useApp } from '../context/AppContext';
import { Lucky10Logo } from '../components/Lucky10Logo';

export const UserDrawerView: React.FC = () => {
  const { currentUser, logout, setCurrentView } = useApp();

  const menuItems = [
    { label: 'Payout Structure', action: () => setCurrentView('PAYOUT_STRUCTURE') },
    { label: 'Change Game', action: () => setCurrentView('CHANGE_GAME') },
    { label: 'My Play Report', action: () => setCurrentView('GAME_DASHBOARD') },
    { label: "Today's Winning Numbers", action: () => setCurrentView('TODAYS_WINNING_NUMBERS') },
    { label: 'Today Winners', action: () => setCurrentView('TODAYS_WINNING_NUMBERS') },
    { label: 'Winners Price Transactions', action: () => setCurrentView('PAYOUT_STRUCTURE') },
    { label: 'Update Your Bank Account', action: () => setCurrentView('UPDATE_BANK_DETAILS') },
  ];

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-between overflow-y-auto">
      <div>
        {/* Top Gold Banner Header matching Page 5 */}
        <div className="w-full bg-gold-banner px-5 py-4 flex items-center justify-between shadow-md">
          <h2 className="text-[#3b82f6] sm:text-black font-extrabold text-xl sm:text-2xl tracking-tight">
            {currentUser?.name || 'User Name'}
          </h2>
          <div className="scale-75 origin-right">
            <Lucky10Logo size="sm" showSubtitle={false} />
          </div>
        </div>

        {/* Menu Items matching Page 5 */}
        <div className="px-6 pt-6 space-y-4">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className="w-full text-left pb-2 border-b border-gray-300 text-white hover:text-gold font-bold text-lg tracking-wide transition-colors"
            >
              {item.label}
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
