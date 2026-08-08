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
    <div className="w-full min-h-screen bg-black text-white px-3 sm:px-12 py-3 sm:py-8 flex flex-col justify-between overflow-y-auto">
      {/* Responsive Web & Mobile Layout Container */}
      <div className="max-w-4xl mx-auto w-full my-auto py-1 sm:py-6 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-12 items-center">

        {/* Bullet Points Container (Left Column on Desktop, Top on Mobile) */}
        <div className="bg-neutral-950 p-3 sm:p-7 rounded-xl sm:rounded-2xl border border-neutral-800 shadow-xl space-y-2 sm:space-y-4">
          <h3 className="text-gold font-extrabold text-xs sm:text-lg border-b border-neutral-800 pb-1.5 sm:pb-2 flex items-center gap-1.5 sm:gap-2">
            <span>✨</span> Why Play LUCKY 10?
          </h3>

          <div className="space-y-1.5 sm:space-y-4 text-[11px] sm:text-sm leading-snug">
            {/* Bullet 1 */}
            <div className="flex items-center sm:items-start gap-2 sm:gap-3.5 pb-1.5 sm:pb-3 border-b border-neutral-800">
              <div className="shrink-0">
                <img src="/assets/gold-ticket.png" alt="Gold Ticket Logo" className="w-4 h-4 sm:w-7 sm:h-7 object-contain drop-shadow" />
              </div>
              <p className="text-white">
                <strong className="font-extrabold text-white">Lucky10</strong> is an exciting{' '}
                <strong className="font-extrabold text-white">online number game</strong> with 3 modes.
              </p>
            </div>

            {/* Bullet 2 */}
            <div className="flex items-center sm:items-start gap-2 sm:gap-3.5 pb-1.5 sm:pb-3 border-b border-neutral-800">
              <div className="shrink-0">
                <img src="/assets/gold-trophy.png" alt="Gold Trophy Logo" className="w-4 h-4 sm:w-7 sm:h-7 object-contain drop-shadow" />
              </div>
              <p className="text-white">
                Play from <strong className="font-extrabold text-white">₹10 to ₹200</strong> &amp; win{' '}
                <strong className="font-extrabold text-white">₹5,000 to ₹1,00,000</strong>.
              </p>
            </div>

            {/* Bullet 3 */}
            <div className="flex items-center sm:items-start gap-2 sm:gap-3.5 pb-1.5 sm:pb-3 border-b border-neutral-800">
              <div className="shrink-0">
                <img src="/assets/gold-calendar.png" alt="Gold Calendar Logo" className="w-4 h-4 sm:w-7 sm:h-7 object-contain drop-shadow" />
              </div>
              <p className="text-white">
                <strong className="font-extrabold text-white">4 games every day</strong> with new chances to win.
              </p>
            </div>

            {/* Bullet 4 */}
            <div className="flex items-center sm:items-start gap-2 sm:gap-3.5">
              <div className="shrink-0">
                <img src="/assets/gold-bank.png" alt="Gold Bank Logo" className="w-4 h-4 sm:w-7 sm:h-7 object-contain drop-shadow" />
              </div>
              <p className="text-white">
                Prizes credited on the <strong className="font-extrabold text-white">same day</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Form Container (Right Column on Desktop, Bottom on Mobile) */}
        <div className="bg-neutral-950 p-4 sm:p-8 rounded-xl sm:rounded-2xl border border-neutral-800 shadow-xl flex flex-col items-center max-w-sm mx-auto w-full">
          <Lucky10Logo size="lg" showSubtitle={true} />

          <form onSubmit={handleSubmit} className="w-full space-y-2.5 sm:space-y-4 mt-2 sm:mt-4">
            <div>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 sm:py-3.5 bg-white text-black placeholder-gray-500 font-medium rounded-lg focus:outline-none text-xs sm:text-base shadow border-0"
                required
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 sm:py-3.5 bg-white text-black placeholder-gray-500 font-medium rounded-lg focus:outline-none text-xs sm:text-base shadow border-0"
                required
              />
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm text-white px-1 pt-0.5 font-normal">
              <button
                type="button"
                onClick={() => setCurrentView('FORGOT_PASSWORD')}
                className="hover:text-gold transition-colors text-white text-[11px] sm:text-sm"
              >
                Forgot password?
              </button>
              <button
                type="button"
                onClick={() => setCurrentView('USER_SIGN_UP')}
                className="hover:text-gold transition-colors text-white text-[11px] sm:text-sm font-normal"
              >
                Sign Up
              </button>
            </div>

            <div className="pt-1.5 sm:pt-4 flex justify-center">
              <button
                type="submit"
                className="w-32 sm:w-44 py-2.5 sm:py-3.5 bg-gold-metallic text-black font-black text-xs sm:text-base tracking-wider rounded-lg shadow-lg uppercase hover:opacity-95 transition-transform active:scale-98"
              >
                SIGN IN
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Footer Info */}
      <div className="text-center pt-2 pb-1 border-t border-neutral-900 flex justify-center items-center text-[10px] sm:text-xs text-neutral-500 max-w-4xl mx-auto w-full shrink-0">
        <span>Demo Credentials: demo / 123456</span>
      </div>
    </div>
  );
};
