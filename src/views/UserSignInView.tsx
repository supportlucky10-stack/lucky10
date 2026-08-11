import React, { useState, useEffect } from 'react';
import { Lucky10Logo } from '../components/Lucky10Logo';
import { useApp } from '../context/AppContext';
import { Eye, EyeOff } from 'lucide-react';

export const UserSignInView: React.FC = () => {
  const { loginUser, setCurrentView } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Lock iOS Safari rubber-band scrolling while login view is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginUser(username, password);
  };

  return (
    <div className="relative w-full min-h-[100dvh] bg-black text-white px-3 sm:px-6 py-2 sm:py-6 flex flex-col justify-center items-center overflow-y-auto antialiased">
      
      {/* Background Radial Light Gold Ambient Glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="w-[650px] h-[650px] bg-[radial-gradient(circle,rgba(212,175,55,0.2)_0%,rgba(212,175,55,0.06)_45%,transparent_70%)] blur-3xl opacity-90" />
      </div>

      {/* Unified 2-in-1 Container Box with Light Gold Outer Glow & Metallic Border */}
      <div className="relative max-w-4xl mx-auto w-full my-auto rounded-2xl sm:rounded-3xl border border-gold/40 bg-neutral-950/90 shadow-[0_0_60px_rgba(212,175,55,0.22)] overflow-hidden grid grid-cols-12 transition-all duration-300">

        {/* Left Column (Top on Mobile, Left Column on Desktop): "Why Play LUCKY 10?" */}
        <div className="col-span-12 md:col-span-5 bg-gradient-to-br from-[#1c180e] via-neutral-950 to-black p-3 sm:p-7 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gold/20 space-y-1.5 sm:space-y-4">
          
          <h3 className="text-gold font-extrabold text-[11px] sm:text-base border-b border-gold/20 pb-1 sm:pb-2 flex items-center gap-1.5 tracking-wide uppercase">
            <span className="text-gold text-xs sm:text-base">✨</span> Why Play LUCKY 10?
          </h3>

          <div className="space-y-1 sm:space-y-4 text-[10px] sm:text-xs leading-snug">
            {/* Bullet 1 */}
            <div className="flex items-center sm:items-start gap-1.5 sm:gap-3 pb-1 sm:pb-3 border-b border-neutral-800/80 group">
              <div className="shrink-0 p-0.5 sm:p-1 rounded bg-black/80 border border-gold/40 shadow">
                <img src="/assets/gold-ticket.png" alt="Gold Ticket" className="w-3.5 h-3.5 sm:w-5 sm:h-5 object-contain filter drop-shadow" />
              </div>
              <p className="text-neutral-200">
                <strong className="font-extrabold text-white">Lucky10</strong> is an <strong className="font-extrabold text-gold">online number game</strong> with 3 modes.
              </p>
            </div>

            {/* Bullet 2 */}
            <div className="flex items-center sm:items-start gap-1.5 sm:gap-3 pb-1 sm:pb-3 border-b border-neutral-800/80 group">
              <div className="shrink-0 p-0.5 sm:p-1 rounded bg-black/80 border border-gold/40 shadow">
                <img src="/assets/gold-trophy.png" alt="Gold Trophy" className="w-3.5 h-3.5 sm:w-5 sm:h-5 object-contain filter drop-shadow" />
              </div>
              <p className="text-neutral-200">
                Play <strong className="font-extrabold text-white">₹10 to ₹200</strong> &amp; win <strong className="font-extrabold text-gold">₹5,000 to ₹1,00,000</strong>.
              </p>
            </div>

            {/* Bullet 3 */}
            <div className="flex items-center sm:items-start gap-1.5 sm:gap-3 pb-1 sm:pb-3 border-b border-neutral-800/80 group">
              <div className="shrink-0 p-0.5 sm:p-1 rounded bg-black/80 border border-gold/40 shadow">
                <img src="/assets/gold-calendar.png" alt="Gold Calendar" className="w-3.5 h-3.5 sm:w-5 sm:h-5 object-contain filter drop-shadow" />
              </div>
              <p className="text-neutral-200">
                <strong className="font-extrabold text-white">4 games every day</strong> with new chances to win.
              </p>
            </div>

            {/* Bullet 4 */}
            <div className="flex items-center sm:items-start gap-1.5 sm:gap-3 group">
              <div className="shrink-0 p-0.5 sm:p-1 rounded bg-black/80 border border-gold/40 shadow">
                <img src="/assets/gold-bank.png" alt="Gold Bank" className="w-3.5 h-3.5 sm:w-5 sm:h-5 object-contain filter drop-shadow" />
              </div>
              <p className="text-neutral-200">
                Prizes credited on the <strong className="font-extrabold text-gold">same day</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (Form Container) */}
        <div className="col-span-12 md:col-span-7 bg-gradient-to-tl from-[#1a160d] via-black to-[#0e0c07] p-3 sm:p-8 flex flex-col items-center justify-center">
          <div className="w-full max-w-sm flex flex-col items-center">
            <Lucky10Logo size="md" showSubtitle={true} />

            <form onSubmit={handleSubmit} className="w-full space-y-2 sm:space-y-4 mt-2 sm:mt-5">
              <div>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 sm:py-3.5 bg-white text-black placeholder-gray-500 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-gold text-xs sm:text-base shadow border-0 transition-all"
                  required
                />
              </div>

              <div className="relative w-full">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 sm:py-3.5 pr-10 bg-white text-black placeholder-gray-500 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-gold text-xs sm:text-base shadow border-0 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black focus:outline-none p-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-600" />
                  ) : (
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-600" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm text-white px-1 pt-0.5 font-normal">
                <button
                  type="button"
                  onClick={() => setCurrentView('FORGOT_PASSWORD')}
                  className="hover:text-gold transition-colors text-white text-[10px] sm:text-sm font-medium"
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentView('USER_SIGN_UP')}
                  className="hover:text-gold transition-colors text-white text-[10px] sm:text-sm font-medium"
                >
                  Sign Up
                </button>
              </div>

              <div className="pt-1.5 sm:pt-4 flex justify-center">
                <button
                  type="submit"
                  className="w-32 sm:w-44 py-2 sm:py-3.5 bg-gold-metallic text-black font-black text-xs sm:text-base tracking-wider rounded-lg shadow-[0_4px_25px_rgba(212,175,55,0.35)] uppercase hover:opacity-95 transition-all active:scale-95"
                >
                  SIGN IN
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
