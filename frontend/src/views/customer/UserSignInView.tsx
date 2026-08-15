import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export const UserSignInView: React.FC = () => {
  const { loginUser } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Lock iOS Safari rubber-band scrolling and set browser tab title
  useEffect(() => {
    document.title = 'Vogue and velour';
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!username.trim()) {
      setLoginError('Please enter Agency Name / Username');
      return;
    }
    const res = await loginUser(username.trim(), password.trim());
    if (!res.success) {
      setLoginError(res.error || 'Invalid Agency Name / Username or Password.');
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-[#1c212b] text-black flex flex-col items-center justify-center px-4 py-8 antialiased select-none font-sans overflow-hidden">
      
      {/* Blurred Abstract Dark Ambient Top Header Background */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,rgba(120,80,160,0.35),transparent_60%),radial-gradient(ellipse_at_top_left,rgba(30,90,130,0.3),transparent_50%)] blur-2xl pointer-events-none" />

      {/* Main Light Gray Standalone Box Card */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md bg-[#eaeded] rounded-[32px] sm:rounded-[36px] p-7 sm:p-10 shadow-2xl space-y-6 sm:space-y-7 my-auto border border-white/40">
        
        {/* Serif Header Title */}
        <div className="text-center pt-2 pb-1">
          <h1 className="text-3xl sm:text-4xl font-serif font-black text-[#0c3827] tracking-tight">
            Vogue &amp; Velour
          </h1>
        </div>

        {/* Sign In Form with Underline Input Fields */}
        <form onSubmit={handleSubmit} className="w-full space-y-5 sm:space-y-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Agency Name / Username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (loginError) setLoginError('');
              }}
              className="w-full bg-transparent border-b border-neutral-400 focus:border-[#0c3827] py-2.5 text-neutral-900 placeholder-neutral-500 font-medium text-sm sm:text-base focus:outline-none transition-colors"
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (loginError) setLoginError('');
              }}
              className="w-full bg-transparent border-b border-neutral-400 focus:border-[#0c3827] py-2.5 pr-10 text-neutral-900 placeholder-neutral-500 font-medium text-sm sm:text-base focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-900 p-1 cursor-pointer"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-neutral-600" />
              ) : (
                <Eye className="w-4 h-4 text-neutral-600" />
              )}
            </button>
          </div>

          {loginError && (
            <div className="p-2.5 bg-rose-100 border border-rose-300 text-rose-800 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <div className="pt-2 space-y-3">
            <button
              type="submit"
              className="w-full py-3.5 sm:py-4 bg-[#0c3827] hover:bg-[#072418] active:scale-[0.98] text-white font-semibold text-sm sm:text-base rounded-full shadow-md transition-all cursor-pointer tracking-wider"
            >
              Sign In
            </button>
          </div>
        </form>

        {/* Footer Text Row */}
        <div className="pt-3 pb-1 text-xs sm:text-sm font-medium border-t border-neutral-300 flex justify-between items-center text-neutral-700">
          <span>Forgot password?</span>
          <button 
            type="button"
            onClick={async () => {
              setLoginError('');
              const res = await loginUser('demo', 'demo123');
              if (!res.success) {
                setLoginError(res.error || 'Demo account is unavailable.');
              }
            }}
            className="text-[#0c3827] font-bold hover:underline cursor-pointer"
          >
            Demo Sign In →
          </button>
        </div>

      </div>
    </div>
  );
};
