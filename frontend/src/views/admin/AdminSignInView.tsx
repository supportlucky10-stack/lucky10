import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';

export const AdminSignInView: React.FC = () => {
  const { loginAdmin } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Strict body scroll lock
  useEffect(() => {
    const origPos = document.body.style.position;
    const origTop = document.body.style.top;
    const origLeft = document.body.style.left;
    const origRight = document.body.style.right;
    const origBottom = document.body.style.bottom;
    const origOverflow = document.body.style.overflow;
    const origTouch = document.body.style.touchAction;

    document.body.style.position = 'fixed';
    document.body.style.top = '0';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.bottom = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.position = origPos;
      document.body.style.top = origTop;
      document.body.style.left = origLeft;
      document.body.style.right = origRight;
      document.body.style.bottom = origBottom;
      document.body.style.overflow = origOverflow;
      document.body.style.touchAction = origTouch;
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginAdmin(username, password);
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] max-h-[100dvh] bg-[#FFFDF5] text-neutral-900 flex flex-col justify-between items-center overflow-hidden overscroll-none select-none z-50 font-sans">
      
      {/* TOP-LEFT ORGANIC YELLOW SHAPE */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <svg
          viewBox="0 0 400 400"
          className="absolute -top-28 -left-28 w-80 h-80 sm:w-96 sm:h-96 text-[#FBBF24] opacity-95"
          fill="currentColor"
        >
          <path d="M0,0 L320,0 C260,110 240,160 160,200 C80,240 30,220 0,300 Z" />
        </svg>
      </div>

      {/* TOP BRANDING & GREETING */}
      <div className="relative z-10 w-full max-w-sm px-5 pt-7 sm:pt-10 flex flex-col items-center shrink-0">
        
        {/* Liora Fashions Logo with Bag & Flower */}
        <div className="flex flex-col items-center justify-center">
          {/* Shopping Bag Icon with Yellow Flower */}
          <div className="relative w-12 h-12 flex items-center justify-center mb-1">
            <svg viewBox="0 0 100 100" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Bag Handle */}
              <path
                d="M38 40 V27 C38 20.37 43.37 15 50 15 C56.63 15 62 20.37 62 27 V40"
                stroke="#E11D48"
                strokeWidth="5"
                strokeLinecap="round"
              />
              {/* Bag Body */}
              <path
                d="M26 40 L32 82 C32.5 85.5 35.5 88 39 88 H61 C64.5 88 67.5 85.5 68 82 L74 40 C74.5 36.5 71.8 33.5 68.3 33.5 H31.7 C28.2 33.5 25.5 36.5 26 40 Z"
                stroke="#E11D48"
                strokeWidth="5.5"
                strokeLinejoin="round"
                fill="none"
              />
              {/* Daisy Flower on Right Handle Base */}
              <g transform="translate(65, 38)">
                <circle cx="0" cy="-6" r="3.5" fill="#FBBF24" />
                <circle cx="5.5" cy="-2.5" r="3.5" fill="#FBBF24" />
                <circle cx="4" cy="4.5" r="3.5" fill="#FBBF24" />
                <circle cx="-4" cy="4.5" r="3.5" fill="#FBBF24" />
                <circle cx="-5.5" cy="-2.5" r="3.5" fill="#FBBF24" />
                <circle cx="0" cy="0" r="3" fill="#D97706" />
              </g>
            </svg>
          </div>

          {/* Liora Fashions Text */}
          <div className="text-center leading-tight">
            <span className="font-serif text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight block">
              Liora
            </span>
            <span className="font-serif text-2xl sm:text-3xl font-extrabold text-[#E11D48] tracking-tight block -mt-1.5">
              Fashions
            </span>
          </div>

          {/* ADMIN PANEL Subtitle with Gold Lines */}
          <div className="flex items-center gap-2 mt-1.5 w-44 justify-center">
            <div className="h-[1.5px] bg-[#FBBF24] flex-1" />
            <span className="text-[10px] font-bold tracking-widest text-[#334155] uppercase whitespace-nowrap">
              ADMIN PANEL
            </span>
            <div className="h-[1.5px] bg-[#FBBF24] flex-1" />
          </div>
        </div>

        {/* Welcome Back & Subtitle */}
        <div className="mt-4 sm:mt-5 text-center">
          <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
            Welcome Back!
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 font-normal mt-0.5">
            Sign in to your admin account
          </p>
        </div>
      </div>

      {/* WHITE CARD FORM */}
      <div className="relative z-10 w-full max-w-sm px-5 my-auto shrink-0">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.06)] border border-neutral-100/90 p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
            
            {/* Field 1: Email or Phone (Admin Username) */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-neutral-800 mb-1.5">
                Email or Phone
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-400 absolute left-3.5 pointer-events-none shrink-0" />
                <input
                  type="text"
                  placeholder="Enter email or phone number"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 sm:pl-11 pr-3.5 py-2.5 sm:py-3 bg-white border border-neutral-200 focus:border-[#E11D48] text-neutral-900 placeholder:text-neutral-400 font-medium rounded-xl text-xs sm:text-sm shadow-sm outline-none transition-colors"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
            </div>

            {/* Field 2: Password (Admin Password) */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-neutral-800 mb-1.5">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-400 absolute left-3.5 pointer-events-none shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 sm:pl-11 pr-10 py-2.5 sm:py-3 bg-white border border-neutral-200 focus:border-[#E11D48] text-neutral-900 placeholder:text-neutral-400 font-medium rounded-xl text-xs sm:text-sm shadow-sm outline-none transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-neutral-400 hover:text-neutral-600 focus:outline-none p-1 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  ) : (
                    <Eye className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between pt-0.5 text-xs">
              <label className="flex items-center gap-2 text-neutral-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-neutral-300 text-[#E11D48] focus:ring-[#E11D48] cursor-pointer"
                />
                <span className="font-normal text-neutral-700">Remember me</span>
              </label>
              <button
                type="button"
                className="text-[#E11D48] hover:underline font-medium cursor-pointer"
                tabIndex={-1}
              >
                Forgot Password?
              </button>
            </div>

            {/* Primary Login Button (Submits Admin Login) */}
            <div className="pt-1.5">
              <button
                type="submit"
                className="w-full py-3 sm:py-3.5 bg-[#E11D48] hover:bg-[#D81B60] active:scale-[0.98] text-white font-bold text-sm sm:text-base rounded-xl shadow-md transition-all cursor-pointer text-center"
              >
                Login
              </button>
            </div>

            {/* OR Divider */}
            <div className="flex items-center gap-3 pt-1">
              <div className="h-[1px] bg-neutral-200 flex-1" />
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                OR
              </span>
              <div className="h-[1px] bg-neutral-200 flex-1" />
            </div>

            {/* Cosmetic Login with OTP Button */}
            <div>
              <button
                type="button"
                className="w-full py-2.5 sm:py-3 bg-white border border-[#FBBF24] hover:bg-neutral-50 active:scale-[0.98] text-neutral-800 font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                tabIndex={-1}
              >
                <Shield className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]/20" />
                <span>Login with OTP</span>
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* BOTTOM ORGANIC YELLOW WAVE & FOOTER */}
      <div className="relative w-full shrink-0 flex flex-col items-center justify-end pb-3 sm:pb-5 pt-4 z-10">
        {/* Bottom Yellow Organic Curve Background */}
        <div className="absolute bottom-0 left-0 right-0 w-full pointer-events-none -z-10 overflow-hidden leading-none">
          <svg
            viewBox="0 0 500 150"
            preserveAspectRatio="none"
            className="w-full h-24 sm:h-32 text-[#FBBF24]"
            fill="currentColor"
          >
            <path d="M0,70 C150,130 350,10 500,60 L500,150 L0,150 Z" />
          </svg>
        </div>

        {/* Footer Text */}
        <div className="text-center text-neutral-800 text-[11px] sm:text-xs font-medium leading-relaxed select-none">
          <div>© 2026 Liora Fashions</div>
          <div className="text-neutral-700">All Rights Reserved</div>
        </div>
      </div>

    </div>
  );
};
