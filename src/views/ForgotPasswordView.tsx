import React, { useState } from 'react';
import { Lucky10Logo } from '../components/Lucky10Logo';
import { useApp } from '../context/AppContext';

export const ForgotPasswordView: React.FC = () => {
  const { addToast, setCurrentView } = useApp();
  const [email, setEmail] = useState('');

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
    <div className="w-full min-h-screen bg-black text-white px-6 py-8 flex flex-col justify-between overflow-y-auto">
      {/* Centered Web Card Box */}
      <div className="max-w-md mx-auto w-full my-auto bg-neutral-950 p-8 rounded-2xl border border-neutral-800 shadow-xl flex flex-col items-center text-center">
        
        <Lucky10Logo size="xl" showSubtitle={true} />

        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide mt-6">
          Forgot your Password?
        </h2>

        <form onSubmit={handleSubmit} className="w-full space-y-5 mt-4">
          <div>
            <input
              type="email"
              placeholder="Registered E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 bg-white text-black placeholder-neutral-400 font-medium rounded-lg focus:outline-none text-base shadow border-0"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 bg-gold-metallic text-black font-black text-base tracking-wide rounded-lg shadow-lg uppercase hover:opacity-95 transition-transform active:scale-98"
            >
              Reset Your Password
            </button>
          </div>
        </form>

        <div className="pt-6">
          <button
            type="button"
            onClick={() => setCurrentView('USER_SIGN_IN')}
            className="text-white hover:text-gold text-base font-normal transition-colors"
          >
            Return to sign in
          </button>
        </div>
      </div>
    </div>
  );
};
