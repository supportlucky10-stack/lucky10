import React from 'react';
import { Lucky10Logo } from './Lucky10Logo';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HeaderBannerProps {
  title: string;
  showBack?: boolean;
  onBackClick?: () => void;
}

export const HeaderBanner: React.FC<HeaderBannerProps> = ({
  title,
  showBack = true,
  onBackClick,
}) => {
  const { goBack } = useApp();

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      goBack();
    }
  };

  return (
    <div className="sticky top-0 z-30 w-full bg-gold-banner px-3.5 sm:px-6 py-2.5 sm:py-3.5 min-h-[56px] sm:min-h-[70px] flex items-center justify-between shadow-md select-none border-b border-[#aa771c]">
      <div className="flex items-center gap-2 sm:gap-3 max-w-[75%]">
        {showBack && (
          <button
            onClick={handleBack}
            className="p-1 text-black hover:bg-black/15 rounded-full transition-colors shrink-0"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
          </button>
        )}
        <h1 className="text-black font-black text-sm sm:text-xl tracking-tight leading-tight truncate uppercase">
          {title}
        </h1>
      </div>

      <div className="flex items-center shrink-0">
        <Lucky10Logo size="sm" showSubtitle={false} variant="black" />
      </div>
    </div>
  );
};
