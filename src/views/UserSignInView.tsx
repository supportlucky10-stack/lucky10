import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Eye, EyeOff } from 'lucide-react';

export const UserSignInView: React.FC = () => {
  const { loginUser } = useApp();
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
    <div className="relative w-full min-h-screen bg-black text-white px-3 sm:px-6 py-4 sm:py-8 flex flex-col justify-center items-center antialiased select-none">
      
      {/* Background Radial Light Gold Ambient Glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="w-[650px] h-[650px] bg-[radial-gradient(circle,rgba(212,175,55,0.2)_0%,rgba(212,175,55,0.06)_45%,transparent_70%)] blur-3xl opacity-90" />
      </div>

      {/* Login Container Box with Light Gold Outer Glow & Metallic Border */}
      <div className="relative max-w-sm mx-auto w-full my-auto rounded-2xl sm:rounded-3xl border border-gold/40 bg-neutral-950/90 shadow-[0_0_60px_rgba(212,175,55,0.22)] p-5 sm:p-8 flex flex-col items-center justify-center transition-all duration-300">
        <form onSubmit={handleSubmit} className="w-full space-y-3 sm:space-y-4">
          <div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 sm:py-3.5 bg-white text-black placeholder-gray-500 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-gold text-xs sm:text-base shadow border-0 transition-all"
              required
            />
          </div>

          <div className="relative w-full">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 sm:py-3.5 pr-10 bg-white text-black placeholder-gray-500 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-gold text-xs sm:text-base shadow border-0 transition-all"
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
              className="w-32 sm:w-44 py-2 sm:py-3.5 bg-gold-metallic text-black font-black text-xs sm:text-base tracking-wider rounded-lg shadow-[0_4px_25px_rgba(212,175,55,0.35)] uppercase hover:opacity-95 transition-all active:scale-95 cursor-pointer"
            >
              SIGN IN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
