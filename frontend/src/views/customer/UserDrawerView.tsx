import React from 'react';
import { useApp } from '../../context/AppContext';

export const UserDrawerView: React.FC = () => {
  const { logout, setCurrentView, setActiveGameSlot } = useApp();

  const menuItems = [
    {
      label: 'Home',
      action: () => {
        setActiveGameSlot('3 PM Game');
        setCurrentView('GAME_DASHBOARD');
      },
    },
    {
      label: 'Change Game',
      action: () => setCurrentView('CHANGE_GAME'),
    },
    {
      label: 'Reports',
      action: () => setCurrentView('MY_PLAY_REPORT'),
    },
    {
      label: 'Total Count View',
      action: () => setCurrentView('TOTAL_COUNT_VIEW'),
    },
    {
      label: 'Edit, Delete Bill',
      action: () => setCurrentView('EDIT_DELETE_BILL'),
    },
    {
      label: 'Result View',
      action: () => setCurrentView('TODAYS_RESULT'),
    },
  ];

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-between pb-24 sm:pb-32 antialiased select-none font-sans">
      <div>
        {/* Sidebar Menu Items in Dark Gold Aesthetic */}
        <div className="px-5 sm:px-8 pt-6 sm:pt-8">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.action();
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              }}
              className="w-full flex items-center py-4 sm:py-4.5 border-b border-neutral-700/80 text-left text-white hover:text-gold font-extrabold text-sm sm:text-base md:text-lg tracking-wide transition-all group cursor-pointer"
            >
              <span className="truncate">{item.label}</span>
            </button>
          ))}

          {/* LOGOUT Button in Gold Metallic Style */}
          <div className="pt-8 sm:pt-10 pb-10">
            <button
              onClick={logout}
              className="px-7 py-2.5 bg-gradient-to-b from-[#edd177] via-[#c89825] to-[#996e19] text-black font-black text-xs sm:text-sm rounded-lg shadow-md hover:brightness-110 active:scale-95 transition-all uppercase tracking-wide cursor-pointer"
            >
              LOGOUT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
