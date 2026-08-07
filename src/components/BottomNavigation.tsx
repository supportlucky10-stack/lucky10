import React from 'react';
import { useApp } from '../context/AppContext';
import type { ViewType } from '../types';

export const BottomNavigation: React.FC = () => {
  const { currentView, setCurrentView } = useApp();

  // Hide bottom nav on sign in / sign up / admin views
  if (
    currentView === 'USER_SIGN_IN' ||
    currentView === 'USER_SIGN_UP' ||
    currentView === 'FORGOT_PASSWORD' ||
    currentView.startsWith('ADMIN_')
  ) {
    return null;
  }

  const navItems: { label: string; view: ViewType; icon: string }[] = [
    { label: 'Play', view: 'GAME_DASHBOARD', icon: '/assets/gold-ticket.png' },
    { label: 'Change Game', view: 'CHANGE_GAME', icon: '/assets/gold-calendar.png' },
    { label: "Today's Result", view: 'TODAYS_RESULT', icon: '/assets/gold-trophy.png' },
    { label: 'Today Winners', view: 'TODAYS_WINNING_NUMBERS', icon: '/assets/gold-trophy.png' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full bg-black/95 backdrop-blur-md border-t border-neutral-900 py-2.5 px-4 sm:px-8 flex items-center justify-around z-40 shadow-2xl">
      {navItems.map((item) => {
        const isActive = currentView === item.view;
        return (
          <button
            key={item.label}
            onClick={() => setCurrentView(item.view)}
            className={`flex flex-col items-center gap-1 transition-all group ${
              isActive ? 'text-gold scale-105' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full bg-black p-1.5 flex items-center justify-center transition-all ${
                isActive
                  ? 'border-2 border-gold shadow-[0_0_12px_rgba(212,175,55,0.6)] bg-neutral-950'
                  : 'border border-neutral-800 group-hover:border-gold/60 group-hover:scale-105'
              }`}
            >
              <img
                src={item.icon}
                alt={item.label}
                className="w-full h-full object-contain filter drop-shadow"
              />
            </div>
            <span className={`text-[11px] sm:text-xs font-black tracking-wide ${isActive ? 'text-gold' : ''}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
