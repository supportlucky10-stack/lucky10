import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const Lucky10Logo: React.FC<LogoProps> = ({ size = 'lg', showSubtitle = true }) => {
  const dimensions = {
    sm: { width: 90, height: 90, titleSize: 'text-base', subtitleSize: 'text-sm' },
    md: { width: 140, height: 140, titleSize: 'text-xl', subtitleSize: 'text-lg' },
    lg: { width: 220, height: 220, titleSize: 'text-3xl', subtitleSize: 'text-4xl' },
    xl: { width: 270, height: 270, titleSize: 'text-4xl', subtitleSize: 'text-5xl' },
  }[size];

  return (
    <div className="flex flex-col items-center justify-center select-none py-2 transition-transform hover:scale-105 duration-300">
      <div className="relative flex items-center justify-center">
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox="0 0 240 240"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_25px_rgba(212,175,55,0.5)]"
        >
          <defs>
            <linearGradient id="goldGradientMain" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF4B8" />
              <stop offset="25%" stopColor="#E6C358" />
              <stop offset="50%" stopColor="#B8860B" />
              <stop offset="75%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#8A6008" />
            </linearGradient>
            
            <linearGradient id="goldGradientBright" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFF8D6" />
              <stop offset="50%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#997017" />
            </linearGradient>

            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Main Gold Circle */}
          <circle cx="120" cy="120" r="100" stroke="url(#goldGradientMain)" strokeWidth="6" fill="black" />
          <circle cx="120" cy="120" r="92" stroke="url(#goldGradientBright)" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.8" />

          {/* Top Center Shield Badge */}
          <g transform="translate(120, 36)">
            {/* Left dark half of shield */}
            <path
              d="M0 -18 L-16 -8 L-16 10 Q-16 22 0 30 Z"
              fill="#111111"
              stroke="url(#goldGradientMain)"
              strokeWidth="2"
            />
            {/* Right gold half of shield */}
            <path
              d="M0 -18 L16 -8 L16 10 Q16 22 0 30 Z"
              fill="url(#goldGradientBright)"
              stroke="url(#goldGradientMain)"
              strokeWidth="2"
            />
            {/* Checkmark in shield */}
            <path
              d="M-6 8 L-1 14 L9 3"
              stroke="#000000"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* 4 Stars around Shield */}
          {/* Left Star 1 */}
          <polygon points="58,48 60,53 65,53 61,56 63,61 58,58 53,61 55,56 51,53 56,53" fill="url(#goldGradientBright)" />
          {/* Left Star 2 */}
          <polygon points="80,38 82,43 87,43 83,46 85,51 80,48 75,51 77,46 73,43 78,43" fill="url(#goldGradientBright)" />
          {/* Right Star 1 */}
          <polygon points="160,38 162,43 167,43 163,46 165,51 160,48 155,51 157,46 153,43 158,43" fill="url(#goldGradientBright)" />
          {/* Right Star 2 */}
          <polygon points="182,48 184,53 189,53 185,56 187,61 182,58 177,61 179,56 175,53 180,53" fill="url(#goldGradientBright)" />

          {/* LUCKY Bold Italic White Text */}
          <g transform="translate(120, 114)">
            <text
              x="0"
              y="0"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="34"
              fontWeight="900"
              fontFamily="Arial Black, Impact, sans-serif"
              fontStyle="italic"
              letterSpacing="2"
              style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.9))' }}
            >
              LUCKY
            </text>
          </g>

          {/* Large Metallic 3D Gold 10 */}
          <g transform="translate(120, 172)">
            <text
              x="0"
              y="0"
              textAnchor="middle"
              fill="url(#goldGradientMain)"
              fontSize="68"
              fontWeight="900"
              fontFamily="Impact, Arial Black, sans-serif"
              fontStyle="italic"
              letterSpacing="-2"
              style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.9))' }}
            >
              10
            </text>
          </g>

          {/* Outer Dynamic Swoosh Arc Ring wrapping around 10 */}
          <path
            d="M 22 170 C 40 215, 195 210, 220 120"
            stroke="url(#goldGradientMain)"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />

          {/* JOIN • PLAY • WIN Bottom Curved Text */}
          <path id="curve" d="M 50 195 A 85 85 0 0 0 190 195" fill="none" />
          <text fontSize="11" fontWeight="900" fill="#FFFFFF" letterSpacing="3">
            <textPath href="#curve" startOffset="50%" textAnchor="middle">
              JOIN • PLAY • WIN
            </textPath>
          </text>
        </svg>
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
