import React, { useState } from 'react';
import { Lucky10Logo } from '../components/Lucky10Logo';
import { useApp } from '../context/AppContext';

export const UserSignUpView: React.FC = () => {
  const { registerUser, setCurrentView } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = registerUser(name, email, password);
    if (success) {
      setCurrentView('GAME_DASHBOARD');
    }
  };

  return (
    <div className="w-full min-h-screen bg-black text-white px-6 py-8 flex flex-col justify-between overflow-y-auto">
      {/* Centered Web Card Box */}
      <div className="max-w-md mx-auto w-full my-auto bg-neutral-950 p-8 rounded-2xl border border-neutral-800 shadow-xl flex flex-col items-center">
        
        <Lucky10Logo size="xl" showSubtitle={true} />

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4 mt-6">
          <div>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3.5 bg-white text-black placeholder-neutral-400 font-medium rounded-lg focus:outline-none text-base shadow border-0"
              required
            />
          </div>

          <div>
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 bg-white text-black placeholder-neutral-400 font-medium rounded-lg focus:outline-none text-base shadow border-0"
              required
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
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
              SIGN UP
            </button>
          </div>
        </form>

        <div className="pt-6">
          <button
            type="button"
            onClick={() => setCurrentView('USER_SIGN_IN')}
            className="text-white hover:text-gold text-base font-normal transition-colors"
          >
            I'm already a member
          </button>
        </div>
      </div>
    </div>
  );
};
