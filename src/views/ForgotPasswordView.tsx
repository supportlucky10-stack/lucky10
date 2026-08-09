import React, { useState, useEffect } from 'react';
import { Lucky10Logo } from '../components/Lucky10Logo';
import { useApp } from '../context/AppContext';

export const ForgotPasswordView: React.FC = () => {
  const { addToast, setCurrentView } = useApp();
  const [email, setEmail] = useState('');

  // Lock iOS Safari rubber-band scrolling while view is active
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
    if (!email.trim()) {
      addToast('Please enter your registered e-mail address', 'error');
      return;
    }
    addToast(`Password reset link sent to ${email}`, 'success');
    setCurrentView('USER_SIGN_IN');
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] max-h-[100dvh] bg-black text-white px-3 sm:px-6 py-2 sm:py-6 flex flex-col justify-center items-center overflow-hidden overscroll-none touch-none select-none z-50">
      
      {/* Background Radial Light Gold Ambient Glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(212,175,55,0.18)_0%,rgba(212,175,55,0.05)_45%,transparent_70%)] blur-3xl opacity-90" />
      </div>

      {/* Centered Gold Card Box */}
      <div className="relative max-w-md mx-auto w-full my-auto bg-neutral-950/95 p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-gold/40 shadow-[0_0_50px_rgba(212,175,55,0.22)] flex flex-col items-center text-center">
        
        <Lucky10Logo size="lg" showSubtitle={true} />

        <h2 className="text-lg sm:text-2xl font-montserrat font-extrabold text-white tracking-wide mt-3 sm:mt-5">
          Forgot your Password?
        </h2>

        <form onSubmit={handleSubmit} className="w-full space-y-3 sm:space-y-5 mt-3 sm:mt-5">
          <div>
            <input
              type="email"
              placeholder="Registered E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 sm:py-3.5 bg-white text-black placeholder-neutral-500 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-gold text-xs sm:text-base shadow border-0"
              required
            />
          </div>

          <div className="pt-2 sm:pt-4 flex justify-center">
            <button
              type="submit"
              className="w-48 sm:w-56 py-2.5 sm:py-3.5 bg-gold-metallic text-black font-montserrat font-black text-xs sm:text-base tracking-wider rounded-lg shadow-[0_4px_25px_rgba(212,175,55,0.35)] hover:opacity-95 transition-all active:scale-95 whitespace-nowrap"
            >
              Reset Your Password
            </button>
          </div>
        </form>

        <div className="pt-3 sm:pt-6">
          <button
            type="button"
            onClick={() => setCurrentView('USER_SIGN_IN')}
            className="text-neutral-300 hover:text-gold text-xs sm:text-sm font-medium transition-colors"
          >
            Return to sign in
          </button>
        </div>
      </div>
    </div>
  );
};
