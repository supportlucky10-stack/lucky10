import React, { useState, useEffect } from 'react';
import { Lucky10Logo } from '../components/Lucky10Logo';
import { useApp } from '../context/AppContext';

export const AdminSignInView: React.FC = () => {
  const { loginAdmin, setCurrentView } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Strict body fixed lock to prevent mobile keyboard & touch drag scrolling
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
    <div className="fixed inset-0 w-full h-[100dvh] max-h-[100dvh] bg-black text-white px-3 sm:px-6 py-2 sm:py-6 flex flex-col justify-center items-center overflow-hidden overscroll-none touch-none select-none z-50">
      
      {/* Background Radial Light Gold Ambient Glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(212,175,55,0.18)_0%,rgba(212,175,55,0.05)_45%,transparent_70%)] blur-3xl opacity-90" />
      </div>

      {/* Premium Centered Gold Card Box */}
      <div className="relative max-w-md mx-auto w-full my-auto bg-neutral-950/95 p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-gold/40 shadow-[0_0_50px_rgba(212,175,55,0.22)] flex flex-col items-center">
        
        <Lucky10Logo size="lg" showSubtitle={false} />

        <h2 className="text-base sm:text-xl font-black text-gold tracking-wide mt-2 sm:mt-4 uppercase">
          ADMIN PORTAL
        </h2>

        <form onSubmit={handleSubmit} className="w-full space-y-2.5 sm:space-y-4 mt-3 sm:mt-6">
          <div>
            <input
              type="text"
              placeholder="Admin Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 sm:py-3.5 bg-white text-black placeholder-neutral-500 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-gold text-xs sm:text-base shadow border-0"
              required
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 sm:py-3.5 bg-white text-black placeholder-neutral-500 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-gold text-xs sm:text-base shadow border-0"
              required
            />
          </div>

          <div className="pt-2 sm:pt-4 flex justify-center">
            <button
              type="submit"
              className="w-36 sm:w-44 py-2.5 sm:py-3.5 bg-gold-metallic text-black font-black text-xs sm:text-base tracking-wider rounded-lg shadow-[0_4px_25px_rgba(212,175,55,0.35)] uppercase hover:opacity-95 transition-all active:scale-95"
            >
              SIGN IN
            </button>
          </div>
        </form>

        <div className="pt-3 sm:pt-6">
          <button
            type="button"
            onClick={() => setCurrentView('USER_SIGN_IN')}
            className="text-neutral-300 hover:text-gold text-xs sm:text-sm font-medium transition-colors"
          >
            Return to User Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
