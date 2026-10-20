import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Lock, Eye, EyeOff, ArrowRight, Home } from 'lucide-react';

export const AdminSignInView: React.FC = () => {
  const { loginAdmin, setCurrentView } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = 'Lucky 10 - Admin Login';
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');
    if (!username.trim()) {
      setLoginError('Please enter username or email');
      return;
    }
    setIsLoading(true);
    try {
      const ok = await loginAdmin(username.trim(), password.trim());
      if (!ok) {
        setLoginError('Invalid admin credentials');
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen min-h-[100dvh] bg-black text-white flex flex-col items-center justify-center relative overflow-hidden select-none px-4 py-8 antialiased font-sans">
      
      {/* Home Button Navigation back to User Login */}
      <button
        type="button"
        onClick={() => setCurrentView('USER_SIGN_IN')}
        className="absolute top-5 left-5 sm:top-6 sm:left-6 z-40 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/80 border border-[#f5b82e]/50 text-[#f5b82e] hover:bg-[#f5b82e]/15 hover:border-[#f5b82e] active:scale-95 transition-all backdrop-blur-md shadow-[0_0_15px_rgba(245,184,46,0.2)] cursor-pointer group"
        title="Go to User Login"
      >
        <Home className="w-4 h-4 stroke-[2.2] group-hover:scale-110 transition-transform" />
        <span className="text-xs font-bold tracking-wide">User Login</span>
      </button>

      {/* Glossy Dark Floor Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-[#060606] pointer-events-none" />

      {/* Main Glass Card Container */}
      <div className="relative z-10 w-full max-w-[365px] sm:max-w-[390px] flex flex-col items-center">
        
        {/* Glass Card */}
        <div
          className="relative w-full rounded-[32px] sm:rounded-[36px] p-6 sm:p-8 pt-8 sm:pt-9 pb-8 sm:pb-9 bg-[#0b0b0b]/80 backdrop-blur-2xl border-[1.5px] border-[#f5b82e]/85 overflow-hidden"
          style={{
            boxShadow: '0 0 40px rgba(245, 184, 46, 0.35), inset 0 0 20px rgba(245, 184, 46, 0.12), 0 20px 50px rgba(0, 0, 0, 0.8)',
          }}
        >
          {/* Card Header Home Shortcut */}
          <button
            type="button"
            onClick={() => setCurrentView('USER_SIGN_IN')}
            className="absolute top-4 right-4 z-20 p-2 rounded-full text-[#f5b82e]/70 hover:text-[#f5b82e] hover:bg-[#f5b82e]/10 active:scale-90 transition-all cursor-pointer"
            title="Go to User Login"
          >
            <Home className="w-5 h-5 stroke-[2]" />
          </button>

          {/* Diagonal Glass Sheen Highlight */}
          <div
            className="absolute inset-0 pointer-events-none rounded-[32px] sm:rounded-[36px] overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.13) 0%, rgba(255, 255, 255, 0.02) 42%, transparent 65%)',
            }}
          />

          {/* Specular Edge Flares */}
          {/* Top-Left Corner Glare */}
          <div className="absolute top-2 left-6 pointer-events-none z-20 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_3px_#ffdf5d,0_0_18px_6px_rgba(245,184,46,0.9)]" />
            <div className="absolute w-12 h-[2px] bg-gradient-to-r from-transparent via-[#fff8cc] to-transparent blur-[0.5px]" />
          </div>

          {/* Top-Center Border Glare */}
          <div className="absolute -top-[1.5px] left-1/2 -translate-x-1/2 pointer-events-none z-20 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_3px_#ffdf5d,0_0_20px_7px_rgba(245,184,46,0.95)]" />
            <div className="absolute w-16 h-[2px] bg-gradient-to-r from-transparent via-[#fff8cc] to-transparent blur-[0.5px]" />
          </div>

          {/* Top-Right Corner Glare */}
          <div className="absolute top-2 right-6 pointer-events-none z-20 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_3px_#ffdf5d,0_0_18px_6px_rgba(245,184,46,0.9)]" />
            <div className="absolute w-10 h-[2px] bg-gradient-to-r from-transparent via-[#fff8cc] to-transparent blur-[0.5px]" />
          </div>

          {/* Right Edge Flare */}
          <div className="absolute top-[45%] -right-[1.5px] -translate-y-1/2 pointer-events-none z-20 flex flex-col items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_3px_#ffdf5d,0_0_18px_6px_rgba(245,184,46,0.9)]" />
            <div className="absolute h-10 w-[2px] bg-gradient-to-b from-transparent via-[#fff8cc] to-transparent blur-[0.5px]" />
          </div>

          {/* Bottom-Center Border Glare */}
          <div className="absolute -bottom-[1.5px] left-1/2 -translate-x-1/2 pointer-events-none z-20 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_3px_#ffdf5d,0_0_20px_7px_rgba(245,184,46,0.95)]" />
            <div className="absolute w-20 h-[2px] bg-gradient-to-r from-transparent via-[#fff8cc] to-transparent blur-[0.5px]" />
          </div>

          {/* Top Avatar Circle */}
          <div className="relative w-22 h-22 sm:w-24 sm:h-24 rounded-full mx-auto flex items-center justify-center bg-black/40 border-2 border-[#f5b82e] shadow-[0_0_25px_rgba(245,184,46,0.5),inset_0_0_15px_rgba(245,184,46,0.25)]">
            {/* Top Vertex Glare on Circle */}
            <div className="absolute -top-[3px] left-1/2 -translate-x-1/2 pointer-events-none flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_3px_#ffe270,0_0_20px_6px_rgba(245,184,46,0.9)]" />
              <div className="absolute w-10 h-[2px] bg-gradient-to-r from-transparent via-[#fff8cc] to-transparent blur-[0.5px]" />
            </div>

            {/* Gold Crown Outline Icon */}
            <svg
              viewBox="0 0 64 64"
              className="w-13 h-13 sm:w-14 sm:h-14 drop-shadow-[0_0_12px_rgba(245,184,46,0.65)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* 3 top circles */}
              <circle cx="15" cy="22" r="2.5" fill="#f5b82e" />
              <circle cx="32" cy="14" r="2.5" fill="#f5b82e" />
              <circle cx="49" cy="22" r="2.5" fill="#f5b82e" />
              {/* Crown body */}
              <path
                d="M15 25 L22 34 L32 17 L42 34 L49 25 L46 43 H18 L15 25 Z"
                stroke="#f5b82e"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Base bar */}
              <path
                d="M18 48 H46"
                stroke="#f5b82e"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Title & Subtitle */}
          <div className="text-center mt-4 mb-6">
            <h1 className="text-2xl sm:text-[27px] font-bold text-white tracking-wide">
              Admin Login
            </h1>
            <p className="text-neutral-400 text-sm font-normal mt-1">
              Access admin panel
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {/* Input 1: Username or Email */}
            <div className="relative flex items-center bg-[#101010]/95 border border-[#262626] focus-within:border-[#f5b82e]/80 rounded-2xl px-4 py-3 sm:py-3.5 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.7)]">
              <User className="w-5 h-5 text-neutral-400 stroke-[1.8] shrink-0" />
              <input
                type="text"
                name="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (loginError) setLoginError('');
                }}
                placeholder="Username or Email"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full bg-transparent text-white placeholder-neutral-500 text-[14px] sm:text-[15px] font-medium focus:outline-none pl-3 pr-1 caret-[#f5b82e]"
              />
              {/* Subtle Warm Highlight between inputs */}
              <div className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-8 h-[1.5px] bg-gradient-to-r from-transparent via-[#f5b82e]/60 to-transparent blur-[0.5px] pointer-events-none" />
            </div>

            {/* Input 2: Password */}
            <div className="relative flex items-center bg-[#101010]/95 border border-[#262626] focus-within:border-[#f5b82e]/80 rounded-2xl px-4 py-3 sm:py-3.5 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.7)]">
              <Lock className="w-5 h-5 text-neutral-400 stroke-[1.8] shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (loginError) setLoginError('');
                }}
                placeholder="Password"
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full bg-transparent text-white placeholder-neutral-500 text-[14px] sm:text-[15px] font-medium focus:outline-none pl-3 pr-1 caret-[#f5b82e]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0"
                tabIndex={-1}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 stroke-[1.8]" />
                ) : (
                  <Eye className="w-5 h-5 stroke-[1.8]" />
                )}
              </button>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="py-2 px-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs font-medium text-center">
                {loginError}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 sm:py-4 mt-5 sm:mt-6 rounded-2xl font-bold text-black text-[16px] sm:text-[17px] tracking-wide flex items-center justify-center gap-2.5 transition-all duration-150 active:scale-[0.985] hover:brightness-105 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(180deg, #ffdc4a 0%, #f7b726 50%, #d89108 100%)',
                boxShadow: '0 0 32px rgba(245, 184, 46, 0.45), 0 4px 14px rgba(0, 0, 0, 0.5)',
              }}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Logging in...</span>
                </div>
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight className="w-5 h-5 stroke-[2.75] text-black" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
