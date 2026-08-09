import React, { useState } from 'react';
import { Lucky10Logo } from '../components/Lucky10Logo';
import { useApp } from '../context/AppContext';

export const UserSignInView: React.FC = () => {
  const { loginUser, setCurrentView } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginUser(username, password);
  };

  return (
    <div className="relative w-full min-h-screen bg-black text-white px-3 sm:px-6 py-3 sm:py-8 flex flex-col justify-between overflow-y-auto">
      
      {/* Background Radial Light Gold Ambient Glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="w-[650px] h-[650px] bg-[radial-gradient(circle,rgba(212,175,55,0.2)_0%,rgba(212,175,55,0.06)_45%,transparent_70%)] blur-3xl opacity-90" />
      </div>

      {/* Unified 2-in-1 Container Box with Light Gold Outer Glow & Metallic Border */}
      <div className="relative max-w-4xl mx-auto w-full my-auto rounded-2xl sm:rounded-3xl border border-gold/40 bg-neutral-950/90 shadow-[0_0_60px_rgba(212,175,55,0.22)] overflow-hidden grid grid-cols-1 md:grid-cols-12 transition-all duration-300">

        {/* Left Column (5 cols on Desktop): "Why Play LUCKY 10?" with Rich Inside Gradient */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#1c180e] via-neutral-950 to-black p-4 sm:p-7 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gold/20 space-y-3 sm:space-y-4">
          
          <h3 className="text-gold font-extrabold text-xs sm:text-base border-b border-gold/20 pb-2 flex items-center gap-2 tracking-wide uppercase">
            <span className="text-gold text-sm sm:text-base">✨</span> Why Play LUCKY 10?
          </h3>

          <div className="space-y-2.5 sm:space-y-4 text-[11px] sm:text-xs leading-snug">
            {/* Bullet 1 */}
            <div className="flex items-center sm:items-start gap-2.5 sm:gap-3 pb-2 sm:pb-3 border-b border-neutral-800/80 group">
              <div className="shrink-0 p-1 rounded-lg bg-black/80 border border-gold/40 shadow-[0_0_10px_rgba(212,175,55,0.2)] group-hover:scale-105 transition-transform">
                <img src="/assets/gold-ticket.png" alt="Gold Ticket" className="w-4 h-4 sm:w-5 sm:h-5 object-contain filter drop-shadow" />
              </div>
              <p className="text-neutral-200">
                <strong className="font-extrabold text-white">Lucky10</strong> is an exciting{' '}
                <strong className="font-extrabold text-gold">online number game</strong> with 3 modes.
              </p>
            </div>

            {/* Bullet 2 */}
            <div className="flex items-center sm:items-start gap-2.5 sm:gap-3 pb-2 sm:pb-3 border-b border-neutral-800/80 group">
              <div className="shrink-0 p-1 rounded-lg bg-black/80 border border-gold/40 shadow-[0_0_10px_rgba(212,175,55,0.2)] group-hover:scale-105 transition-transform">
                <img src="/assets/gold-trophy.png" alt="Gold Trophy" className="w-4 h-4 sm:w-5 sm:h-5 object-contain filter drop-shadow" />
              </div>
              <p className="text-neutral-200">
                Play from <strong className="font-extrabold text-white">₹10 to ₹200</strong> &amp; win{' '}
                <strong className="font-extrabold text-gold">₹5,000 to ₹1,00,000</strong>.
              </p>
            </div>

            {/* Bullet 3 */}
            <div className="flex items-center sm:items-start gap-2.5 sm:gap-3 pb-2 sm:pb-3 border-b border-neutral-800/80 group">
              <div className="shrink-0 p-1 rounded-lg bg-black/80 border border-gold/40 shadow-[0_0_10px_rgba(212,175,55,0.2)] group-hover:scale-105 transition-transform">
                <img src="/assets/gold-calendar.png" alt="Gold Calendar" className="w-4 h-4 sm:w-5 sm:h-5 object-contain filter drop-shadow" />
              </div>
              <p className="text-neutral-200">
                <strong className="font-extrabold text-white">4 games every day</strong> with new chances to win.
              </p>
            </div>

            {/* Bullet 4 */}
            <div className="flex items-center sm:items-start gap-2.5 sm:gap-3 group">
              <div className="shrink-0 p-1 rounded-lg bg-black/80 border border-gold/40 shadow-[0_0_10px_rgba(212,175,55,0.2)] group-hover:scale-105 transition-transform">
                <img src="/assets/gold-bank.png" alt="Gold Bank" className="w-4 h-4 sm:w-5 sm:h-5 object-contain filter drop-shadow" />
              </div>
              <p className="text-neutral-200">
                Prizes credited on the <strong className="font-extrabold text-gold">same day</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols on Desktop): Form Container with Matching Inside Gradient */}
        <div className="md:col-span-7 bg-gradient-to-tl from-[#1a160d] via-black to-[#0e0c07] p-4 sm:p-8 flex flex-col items-center justify-center">
          <div className="w-full max-w-sm flex flex-col items-center">
            <Lucky10Logo size="lg" showSubtitle={true} />

            <form onSubmit={handleSubmit} className="w-full space-y-3 sm:space-y-4 mt-3 sm:mt-5">
              <div>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 sm:py-3.5 bg-white text-black placeholder-gray-500 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-gold text-xs sm:text-base shadow border-0 transition-all"
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 sm:py-3.5 bg-white text-black placeholder-gray-500 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-gold text-xs sm:text-base shadow border-0 transition-all"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm text-white px-1 pt-0.5 font-normal">
                <button
                  type="button"
                  onClick={() => setCurrentView('FORGOT_PASSWORD')}
                  className="hover:text-gold transition-colors text-white text-[11px] sm:text-sm font-medium"
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentView('USER_SIGN_UP')}
                  className="hover:text-gold transition-colors text-white text-[11px] sm:text-sm font-medium"
                >
                  Sign Up
                </button>
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
          </div>
        </div>

      </div>

      {/* Footer Info */}
      <div className="relative text-center pt-2 pb-1 border-t border-neutral-900/80 flex justify-center items-center text-[10px] sm:text-xs text-neutral-500 max-w-4xl mx-auto w-full shrink-0">
        <span>Demo Credentials: demo / 123456</span>
      </div>
    </div>
  );
};
