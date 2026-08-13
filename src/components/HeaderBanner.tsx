import React from 'react';
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
    <div className="relative w-full bg-gold-banner px-3.5 sm:px-6 py-2.5 sm:py-3.5 min-h-[56px] sm:min-h-[70px] flex items-center justify-center shadow-md select-none border-b border-[#aa771c]">
      {showBack && (
        <button
          onClick={handleBack}
          className="absolute left-3.5 sm:left-6 p-1 text-black hover:bg-black/15 rounded-full transition-colors shrink-0 cursor-pointer z-10"
          title="Go Back"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
        </button>
      )}

      <h1 className="w-full text-black font-black text-sm sm:text-lg tracking-wider leading-tight text-center uppercase truncate px-8">
        {title}
      </h1>
    </div>
  );
};
