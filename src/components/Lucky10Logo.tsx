import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const Lucky10Logo: React.FC<LogoProps> = ({ size = 'lg', showSubtitle = true }) => {
  const dimensions = {
    sm: { width: 70, titleSize: 'text-base', subtitleSize: 'text-sm' },
    md: { width: 120, titleSize: 'text-xl', subtitleSize: 'text-lg' },
    lg: { width: 190, titleSize: 'text-3xl', subtitleSize: 'text-4xl' },
    xl: { width: 250, titleSize: 'text-4xl', subtitleSize: 'text-5xl' },
  }[size];

  return (
    <div className="flex flex-col items-center justify-center select-none py-1 transition-transform hover:scale-105 duration-300">
      <div className="relative flex items-center justify-center">
        <img
          src="/assets/lucky10-logo.png"
          alt="LUCKY 10 Logo"
          style={{ width: `${dimensions.width}px` }}
          className="h-auto object-contain filter drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]"
        />
      </div>

      {showSubtitle && (
        <div className="text-center mt-3 space-y-1">
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
