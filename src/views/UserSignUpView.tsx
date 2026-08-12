import React, { useState } from 'react';
import { Lucky10Logo } from '../components/Lucky10Logo';
import { useApp } from '../context/AppContext';
import { Eye, EyeOff } from 'lucide-react';

export const UserSignUpView: React.FC = () => {
  const { registerUser, setCurrentView } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = registerUser(name, email, password);
    if (success) {
      setCurrentView('GAME_DASHBOARD');
    }
  };

  return (
    <div className="w-full min-h-screen bg-black text-white px-4 sm:px-6 py-4 sm:py-8 flex flex-col justify-center items-center antialiased select-none">
      {/* Centered Web Card Box */}
      <div className="max-w-md mx-auto w-full my-auto bg-neutral-950 p-4 sm:p-8 rounded-xl sm:rounded-2xl border border-neutral-800 shadow-xl flex flex-col items-center">
        
        <Lucky10Logo size="lg" showSubtitle={true} />

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-3 sm:space-y-4 mt-3 sm:mt-6">
          <div>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 sm:py-3.5 bg-white text-black placeholder-neutral-400 font-medium rounded-lg focus:outline-none text-xs sm:text-base shadow border-0"
              required
            />
          </div>

          <div>
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 sm:py-3.5 bg-white text-black placeholder-neutral-400 font-medium rounded-lg focus:outline-none text-xs sm:text-base shadow border-0"
              required
            />
          </div>

          <div className="relative w-full">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 sm:py-3.5 pr-10 bg-white text-black placeholder-neutral-400 font-medium rounded-lg focus:outline-none text-xs sm:text-base shadow border-0"
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

          <div className="pt-2 sm:pt-4 flex justify-center">
            <button
              type="submit"
              className="w-36 sm:w-44 py-2.5 sm:py-3.5 bg-gold-metallic text-black font-black text-xs sm:text-base tracking-wider rounded-lg shadow-lg uppercase hover:opacity-95 transition-transform active:scale-98"
            >
              SIGN UP
            </button>
          </div>
        </form>

        <div className="pt-3 sm:pt-6">
          <button
            type="button"
            onClick={() => setCurrentView('USER_SIGN_IN')}
            className="text-white hover:text-gold text-xs sm:text-base font-normal transition-colors"
          >
            I'm already a member
          </button>
        </div>
      </div>
    </div>
  );
};
