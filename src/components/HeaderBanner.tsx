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
    <div className="relative w-full bg-gold-banner px-6 py-4 min-h-[85px] flex items-center justify-between shadow-lg select-none border-b-2 border-[#aa771c]">
      <div className="flex items-center gap-3 max-w-[70%]">
        {showBack && (
          <button
            onClick={handleBack}
            className="p-1.5 text-black hover:bg-black/15 rounded-full transition-colors"
            title="Go Back"
          >
            <ArrowLeft className="w-7 h-7 stroke-[3]" />
          </button>
        )}
        <h1 className="text-black font-black text-xl sm:text-2xl tracking-tight leading-tight truncate uppercase">
          {title}
        </h1>
      </div>

      <div className="flex items-center shrink-0">
        <Lucky10Logo size="sm" showSubtitle={false} />
      </div>
    </div>
  );
};
