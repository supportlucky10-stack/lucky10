import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  variant?: 'gold' | 'black';
}

export const Lucky10Logo: React.FC<LogoProps> = ({
  size = 'lg',
  showSubtitle = true,
  variant = 'gold',
}) => {
  const dimensions = {
    sm: { imgClass: 'w-14 sm:w-20', titleSize: 'text-[11px] sm:text-xs', subtitleSize: 'text-[10px] sm:text-[11px]' },
    md: { imgClass: 'w-20 sm:w-28', titleSize: 'text-xs sm:text-sm', subtitleSize: 'text-xs sm:text-sm' },
    lg: { imgClass: 'w-28 sm:w-36', titleSize: 'text-sm sm:text-lg', subtitleSize: 'text-base sm:text-2xl' },
    xl: { imgClass: 'w-36 sm:w-48', titleSize: 'text-base sm:text-xl', subtitleSize: 'text-lg sm:text-3xl' },
  }[size];

  const logoSrc = variant === 'black' ? '/assets/lucky10-black-logo.png' : '/assets/lucky10-logo.png';
  const filterClass =
    variant === 'gold'
      ? 'filter drop-shadow-[0_0_12px_rgba(212,175,55,0.5)]'
      : 'filter drop-shadow-[0_0_5px_rgba(0,0,0,0.3)]';

  return (
    <div className="flex flex-col items-center justify-center select-none py-0.5 transition-transform hover:scale-105 duration-300">
      <div className="relative flex items-center justify-center">
        <img
          src={logoSrc}
          alt="LUCKY 10 Logo"
          className={`${dimensions.imgClass} h-auto object-contain ${filterClass}`}
        />
      </div>

      {showSubtitle && (
        <div className="text-center mt-1 space-y-0.5">
          <h2 className="text-white font-black tracking-widest leading-none text-xs sm:text-sm">
            PLAY &amp; WIN
          </h2>
          <p className="text-gold font-black tracking-widest leading-tight text-[10px] sm:text-xs">
            JUST ₹10
          </p>
        </div>
      )}
    </div>
  );
};



