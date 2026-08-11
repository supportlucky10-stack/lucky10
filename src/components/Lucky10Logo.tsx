import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const Lucky10Logo: React.FC<LogoProps> = ({ size = 'lg', showSubtitle = true }) => {
  const dimensions = {
    sm: { imgClass: 'w-12 sm:w-16', titleSize: 'text-[10px] sm:text-xs', subtitleSize: 'text-[9px] sm:text-[10px]' },
    md: { imgClass: 'w-20 sm:w-28', titleSize: 'text-xs sm:text-sm', subtitleSize: 'text-xs sm:text-sm' },
    lg: { imgClass: 'w-24 sm:w-36', titleSize: 'text-sm sm:text-lg', subtitleSize: 'text-base sm:text-2xl' },
    xl: { imgClass: 'w-28 sm:w-44', titleSize: 'text-base sm:text-xl', subtitleSize: 'text-lg sm:text-3xl' },
  }[size];

  return (
    <div className="flex flex-col items-center justify-center select-none py-0.5 sm:py-1 transition-transform hover:scale-105 duration-300">
      <div className="relative flex items-center justify-center">
        <img
          src="/assets/lucky10-logo.png"
          alt="LUCKY 10 Logo"
          className={`${dimensions.imgClass} h-auto object-contain filter drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]`}
        />
      </div>

      {showSubtitle && (
        <div className="text-center mt-1 sm:mt-2 space-y-0.5">
          <h2 className={`text-white font-black tracking-widest leading-none ${dimensions.titleSize}`}>
            PLAY &amp; WIN
          </h2>
          <p className={`text-gold font-black tracking-widest leading-tight ${dimensions.subtitleSize}`}>
            JUST ₹10
          </p>
        </div>
      )}
    </div>
  );
};

