import React from 'react';
import { useApp } from '../context/AppContext';
import type { ViewType } from '../types';

export const BottomNavigation: React.FC = () => {
  const { currentView, setCurrentView } = useApp();

  // Hide bottom nav on sign in / admin views
  if (
    currentView === 'USER_SIGN_IN' ||
    currentView.startsWith('ADMIN_')
  ) {
    return null;
  }

  // 4 items matching the exact 4 logos provided by the user in order
  const navItems: { label: string; view: ViewType; icon: string }[] = [
    { label: 'Play', view: 'GAME_DASHBOARD', icon: '/assets/sidebar-5.png' },
    { label: 'Change Game', view: 'CHANGE_GAME', icon: '/assets/sidebar-2.png' },
    { label: "Today's Result", view: 'TODAYS_RESULT', icon: '/assets/sidebar-3.png' },
    { label: 'Today Winners', view: 'TODAYS_WINNING_NUMBERS', icon: '/assets/sidebar-4.png' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full bg-black/95 backdrop-blur-md border-t border-neutral-900/90 py-2 px-2 sm:px-4 z-40 shadow-2xl select-none">
      <div className="grid grid-cols-4 max-w-sm sm:max-w-md mx-auto w-full items-center justify-items-center">
        {navItems.map((item) => {
          const isActive = currentView === item.view;
          return (
            <button
              key={item.label}
              onClick={() => {
                setCurrentView(item.view);
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              }}
              className={`w-full flex flex-col items-center justify-center text-center gap-1 transition-all group py-0.5 ${
                isActive ? 'text-gold scale-105' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-transform ${
                  isActive
                    ? 'scale-110 drop-shadow-[0_0_10px_rgba(212,175,55,0.9)]'
                    : 'group-hover:scale-105 opacity-85 hover:opacity-100'
                }`}
              >
                <img
                  src={item.icon}
                  alt={item.label}
                  className="w-full h-full object-contain filter drop-shadow"
                />
              </div>
              <span className={`text-[9px] sm:text-[11px] font-black tracking-tight leading-tight text-center truncate w-full px-0.5 ${isActive ? 'text-[#e2b847]' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
