import React, { useState } from 'react';
import { Lucky10Logo } from '../components/Lucky10Logo';
import { useApp } from '../context/AppContext';

export const AdminSignInView: React.FC = () => {
  const { loginAdmin, setCurrentView } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginAdmin(username, password);
  };

  return (
    <div className="w-full min-h-screen bg-black text-white px-4 sm:px-6 py-4 sm:py-8 flex flex-col justify-center overflow-y-auto">
      {/* Centered Web Card Box */}
      <div className="max-w-md mx-auto w-full my-auto bg-neutral-950 p-4 sm:p-8 rounded-xl sm:rounded-2xl border border-neutral-800 shadow-xl flex flex-col items-center">
        
        <Lucky10Logo size="lg" showSubtitle={false} />

        <h2 className="text-base sm:text-xl font-black text-gold tracking-wide mt-2 sm:mt-4">
          ADMIN PORTAL
        </h2>

        <form onSubmit={handleSubmit} className="w-full space-y-3 sm:space-y-4 mt-3 sm:mt-6">
          <div>
            <input
              type="text"
              placeholder="Admin Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 sm:py-3.5 bg-white text-black placeholder-neutral-400 font-medium rounded-lg focus:outline-none text-xs sm:text-base shadow border-0"
              required
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 sm:py-3.5 bg-white text-black placeholder-neutral-400 font-medium rounded-lg focus:outline-none text-xs sm:text-base shadow border-0"
              required
            />
          </div>

          <div className="pt-2 sm:pt-4 flex justify-center">
            <button
              type="submit"
              className="w-36 sm:w-44 py-2.5 sm:py-3.5 bg-gold-metallic text-black font-black text-xs sm:text-base tracking-wider rounded-lg shadow-lg uppercase hover:opacity-95 transition-transform active:scale-98"
            >
              SIGN IN
            </button>
          </div>
        </form>

        <div className="pt-3 sm:pt-6">
          <button
            type="button"
            onClick={() => setCurrentView('USER_SIGN_IN')}
            className="text-white hover:text-gold text-xs sm:text-base font-normal transition-colors"
          >
            Return to User Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
