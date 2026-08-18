import React from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HeaderBannerProps {
  title: string;
  showBack?: boolean;
  onBackClick?: () => void;
  showHome?: boolean;
  onHomeClick?: () => void;
  rightElement?: React.ReactNode;
}

export const HeaderBanner: React.FC<HeaderBannerProps> = ({
  title,
  showBack = true,
  onBackClick,
  showHome = true,
  onHomeClick,
  rightElement,
}) => {
  const { goBack, setCurrentView, currentUser } = useApp();

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      goBack();
    }
  };

  const handleHome = () => {
    if (onHomeClick) {
      onHomeClick();
    } else {
      if (currentUser?.role === 'ADMIN') {
        setCurrentView('ADMIN_DRAWER');
      } else {
        setCurrentView('GAME_DASHBOARD');
      }
    }
  };

  return (
    <div
      className="relative w-full bg-gold-banner px-3.5 sm:px-6 pb-2 sm:pb-3 min-h-[56px] sm:min-h-[64px] flex items-center justify-between shadow-md select-none border-b border-[#aa771c] shrink-0"
      style={{ paddingTop: 'max(8px, env(safe-area-inset-top, 0px))' }}
    >
      <div className="flex items-center gap-2 sm:gap-3 max-w-[78%]">
        {showBack && (
          <button
            onClick={handleBack}
            className="p-1 text-black hover:bg-black/15 rounded-full transition-colors shrink-0 cursor-pointer z-10"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
          </button>
        )}
        <h1 className="text-black font-black text-sm sm:text-lg md:text-xl tracking-tight leading-tight truncate uppercase">
          {title}
        </h1>
      </div>

      {rightElement ? (
        <div className="shrink-0 z-10 flex items-center">{rightElement}</div>
      ) : showHome ? (
        <button
          onClick={handleHome}
          className="p-1.5 sm:p-2 text-black hover:bg-black/15 active:scale-90 rounded-xl transition-all shrink-0 cursor-pointer z-10 flex items-center justify-center border border-black/25 hover:border-black/50 shadow-sm"
          title="Go to Home"
        >
          <Home className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
        </button>
      ) : null}
    </div>
  );
};
