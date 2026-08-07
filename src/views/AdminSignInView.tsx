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
    <div className="w-full min-h-screen bg-black text-white px-6 py-8 flex flex-col justify-between overflow-y-auto">
      {/* Centered Web Card Box */}
      <div className="max-w-md mx-auto w-full my-auto bg-neutral-950 p-8 rounded-2xl border border-neutral-800 shadow-xl flex flex-col items-center">
        
        <Lucky10Logo size="xl" showSubtitle={false} />

        <h2 className="text-xl font-black text-gold tracking-wide mt-4">
          ADMIN PORTAL
        </h2>

        <form onSubmit={handleSubmit} className="w-full space-y-4 mt-6">
          <div>
            <input
              type="text"
              placeholder="Admin Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3.5 bg-white text-black placeholder-neutral-400 font-medium rounded-lg focus:outline-none text-base shadow border-0"
              required
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 bg-white text-black placeholder-neutral-400 font-medium rounded-lg focus:outline-none text-base shadow border-0"
              required
            />
          </div>

          <div className="pt-4 flex justify-center">
            <button
              type="submit"
              className="w-44 py-3.5 bg-gold-metallic text-black font-black text-base tracking-wider rounded-lg shadow-lg uppercase hover:opacity-95 transition-transform active:scale-98"
            >
              SIGN IN
            </button>
          </div>
        </form>

        <div className="pt-6">
          <button
            type="button"
            onClick={() => setCurrentView('USER_SIGN_IN')}
            className="text-white hover:text-gold text-base font-normal transition-colors"
          >
            Return to User Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
