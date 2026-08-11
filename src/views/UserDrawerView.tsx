import React from 'react';
import { useApp } from '../context/AppContext';
import { Lucky10Logo } from '../components/Lucky10Logo';
import { ArrowLeft, Gamepad2 } from 'lucide-react';

export const UserDrawerView: React.FC = () => {
  const { logout, setCurrentView, addToast } = useApp();

  const menuItems: { label: string; iconType: 'image' | 'gamepad'; iconSrc?: string; action: () => void }[] = [
    {
      label: 'Payout Structure',
      iconType: 'image',
      iconSrc: '/assets/gold-ticket.png',
      action: () => setCurrentView('PAYOUT_STRUCTURE'),
    },
    {
      label: 'Change Game',
      iconType: 'gamepad',
      action: () => setCurrentView('CHANGE_GAME'),
    },
    {
      label: 'My Play Report',
      iconType: 'image',
      iconSrc: '/assets/gold-report-plain.png',
      action: () => setCurrentView('GAME_DASHBOARD'),
    },
    {
      label: 'Result',
      iconType: 'image',
      iconSrc: '/assets/gold-check.png',
      action: () => setCurrentView('TODAYS_RESULT'),
    },
    {
      label: 'Winning Report',
      iconType: 'image',
      iconSrc: '/assets/gold-trophy-plain.png',
      action: () => setCurrentView('TODAYS_WINNING_NUMBERS'),
    },
    {
      label: 'Update Bank Account',
      iconType: 'image',
      iconSrc: '/assets/gold-bank-building.png',
      action: () => setCurrentView('UPDATE_BANK_DETAILS'),
    },
    {
      label: 'Report Issue',
      iconType: 'image',
      iconSrc: '/assets/gold-warning.png',
      action: () => addToast('To report an issue, please contact support@lucky10.com', 'info'),
    },
  ];

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-start overflow-y-auto pb-12 sm:pb-16 select-none">
      <div>
        {/* Top Gold Banner Header */}
        <div className="w-full bg-gold-banner px-4 sm:px-5 py-3 flex items-center justify-between shadow-md border-b border-[#aa771c]">
          <button
            onClick={() => setCurrentView('GAME_DASHBOARD')}
            className="flex items-center gap-1.5 text-black hover:opacity-80 font-black text-sm sm:text-lg tracking-tight transition-opacity"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
            <span>Back</span>
          </button>
          <div className="flex items-center">
            <Lucky10Logo size="sm" showSubtitle={false} variant="black" />
          </div>
        </div>

        {/* Menu Items matched to Image design */}
        <div className="px-5 sm:px-8 pt-5 sm:pt-7 space-y-4 sm:space-y-5">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className="w-full flex items-center gap-3.5 sm:gap-4 pb-3 sm:pb-3.5 border-b border-neutral-700/80 text-left text-white hover:text-gold font-bold text-sm sm:text-lg tracking-normal transition-colors group"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center shrink-0">
                {item.iconType === 'gamepad' ? (
                  <Gamepad2 className="w-6 h-6 text-gold stroke-[2.2] group-hover:scale-110 transition-transform" />
                ) : (
                  <img
                    src={item.iconSrc}
                    alt={item.label}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                  />
                )}
              </div>
              <span className="truncate text-white group-hover:text-gold font-extrabold">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Logout Button */}
        <div className="px-5 sm:px-8 pt-6 sm:pt-8">
          <button
            onClick={logout}
            className="px-6 py-2.5 bg-gold-metallic text-black font-black text-xs sm:text-sm rounded-lg tracking-wide shadow-md hover:opacity-95 transition-transform active:scale-95"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

