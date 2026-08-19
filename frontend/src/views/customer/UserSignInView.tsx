import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, MapPin, ArrowRight, Bell, Home, ShoppingBag, Sparkles, Store, User, Plus } from 'lucide-react';

export const UserSignInView: React.FC = () => {
  const { loginUser } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Lock iOS Safari rubber-band scrolling and set browser tab title to Leora Fashions
  useEffect(() => {
    document.title = 'Leora Fashions';
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'auto';
    document.body.style.touchAction = 'auto';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');
    if (!username.trim()) {
      setLoginError('Please enter username');
      return;
    }
    const res = await loginUser(username.trim(), password.trim());
    if (!res.success) {
      setLoginError(res.error || 'Invalid credentials');
    }
  };

  return (
    <div
      className="w-full min-h-screen min-h-[100dvh] bg-[#f8f9fa] text-black flex flex-col justify-between antialiased select-none font-sans"
      style={{ paddingBottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))' }}
    >
      
      {/* ================= 1. TOP YELLOW BRAND HEADER & SECRET LOGIN BAR ================= */}
      <div
        className="w-full bg-[#FFD000] px-4 pb-3.5 shadow-md space-y-2.5 shrink-0"
        style={{ paddingTop: 'max(14px, env(safe-area-inset-top, 0px))' }}
      >
        
        {/* Brand Title & Notification Bell */}
        <div className="flex items-center justify-between">
          <h1 className="font-serif font-black text-xl sm:text-2xl text-black tracking-tight">
            Leora Fashions
          </h1>
          <div className="relative cursor-pointer p-1">
            <Bell className="w-6 h-6 text-black fill-black/10 stroke-[2]" />
            <span className="absolute -top-0.5 -right-0.5 bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-[#FFD000] shadow-sm">
              10
            </span>
          </div>
        </div>

        {/* Search Bar (Secret Username Input) */}
        <form onSubmit={handleSubmit} className="w-full space-y-2.5">
          <div className="relative w-full bg-white rounded-lg px-3 py-2 flex items-center gap-2.5 shadow-sm border border-black/10 focus-within:border-black/40 transition-all">
            <Search className="w-4 h-4 text-neutral-500 shrink-0" />
            <input
              type="text"
              placeholder="Search for Offers, Highlights, Best Deals"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (loginError) setLoginError('');
              }}
              className="w-full bg-transparent text-black placeholder-neutral-500 font-medium text-xs sm:text-sm focus:outline-none select-text cursor-text caret-black"
            />
          </div>

          {/* Location Bar (Secret Password Input & Arrow Login Button) */}
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-black stroke-[2.5]" />
              </div>
              <input
                type="password"
                placeholder="Select Location"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (loginError) setLoginError('');
                }}
                className="w-full bg-transparent text-black placeholder-neutral-600/80 font-bold text-xs sm:text-sm focus:outline-none select-text cursor-text caret-black"
              />
            </div>

            {/* Right Arrow (Secret Submit Button) */}
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="p-1.5 text-black hover:bg-black/15 active:scale-90 rounded-md transition-all cursor-pointer shrink-0"
              title="Submit"
            >
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
            </button>
          </div>
        </form>
      </div>

      {/* ================= 2. MAIN CONTENT AREA (Banner + Pink Offers Grid) ================= */}
      <div className="w-full max-w-md mx-auto px-3.5 py-3 space-y-4 flex-1 flex flex-col justify-start">
        
        {/* Nike Billboard Banner Card */}
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex-1 bg-white rounded-2xl overflow-hidden shadow-sm border border-neutral-200/80">
            <img
              src="/liora/nike_billboard.jpg"
              alt="Nike Billboard"
              className="w-full h-auto object-cover max-h-[190px]"
            />
          </div>
          <div className="w-6 h-28 bg-[#7e606b] rounded-l-2xl shrink-0 opacity-80" />
        </div>

        {/* Hot Pink Offers Section Card */}
        <div className="w-full bg-[#E61853] rounded-2xl p-3.5 space-y-3 shadow-md">
          <div className="flex items-center justify-between text-white px-0.5">
            <h2 className="font-black text-lg tracking-tight text-white">Offers</h2>
            <span className="text-white/90 text-xs font-semibold hover:underline cursor-pointer">see all</span>
          </div>

          {/* 2x2 Grid of Fashion Offer Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            
            {/* Card 1: FRAPPE DRESS */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
              <div>
                <div className="bg-gradient-to-r from-[#edd177] via-[#c89825] to-[#edd177] text-black font-black text-[10px] text-center py-0.5 tracking-wider uppercase border-b border-[#a87c1a]">
                  BIG DEALS
                </div>
                <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
                  <img
                    src="/liora/frappe_dress.jpg"
                    alt="Frappe Dress"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute right-1.5 bottom-1.5 w-5 h-5 bg-[#FFD000] border border-black rounded-md flex items-center justify-center shadow-sm">
                    <Plus className="w-3.5 h-3.5 text-black stroke-[3]" />
                  </div>
                </div>
              </div>
              <div className="p-2 text-center space-y-0.5 font-sans">
                <span className="font-bold text-[10px] text-neutral-800 uppercase block tracking-tight truncate">
                  FRAPPE DRESS
                </span>
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-black">
                  <span className="text-neutral-400 line-through">₹5500/-</span>
                  <span className="text-[#E61853]">₹3750/-</span>
                </div>
              </div>
            </div>

            {/* Card 2: GOWN DRESS */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
              <div>
                <div className="bg-gradient-to-r from-[#edd177] via-[#c89825] to-[#edd177] text-black font-black text-[10px] text-center py-0.5 tracking-wider uppercase border-b border-[#a87c1a]">
                  30 % OFF
                </div>
                <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
                  <img
                    src="/liora/gown_dress.jpg"
                    alt="Gown Dress"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute right-1.5 bottom-1.5 w-5 h-5 bg-[#FFD000] border border-black rounded-md flex items-center justify-center shadow-sm">
                    <Plus className="w-3.5 h-3.5 text-black stroke-[3]" />
                  </div>
                </div>
              </div>
              <div className="p-2 text-center space-y-0.5 font-sans">
                <span className="font-bold text-[10px] text-neutral-800 uppercase block tracking-tight truncate">
                  GOWN DRESS
                </span>
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-black">
                  <span className="text-neutral-400 line-through">₹4100/-</span>
                  <span className="text-[#E61853]">₹2930/-</span>
                </div>
              </div>
            </div>

            {/* Card 3: PASHMINA SHAWL */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
              <div>
                <div className="bg-gradient-to-r from-[#edd177] via-[#c89825] to-[#edd177] text-black font-black text-[10px] text-center py-0.5 tracking-wider uppercase border-b border-[#a87c1a]">
                  STUNNING OFFER
                </div>
                <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
                  <img
                    src="/liora/pashmina_shawl.jpg"
                    alt="Pashmina Shawl"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute left-1.5 bottom-1.5 bg-[#FFD000] text-black text-[8px] font-black px-1 py-0.5 rounded border border-black shadow-sm">
                    7 DAY
                  </div>
                  <div className="absolute right-1.5 bottom-1.5 w-5 h-5 bg-[#FFD000] border border-black rounded-md flex items-center justify-center shadow-sm">
                    <Plus className="w-3.5 h-3.5 text-black stroke-[3]" />
                  </div>
                </div>
              </div>
              <div className="p-2 text-center space-y-0.5 font-sans">
                <span className="font-bold text-[10px] text-neutral-800 uppercase block tracking-tight truncate">
                  PASHMINA SHAWL
                </span>
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-black">
                  <span className="text-neutral-400 line-through">₹700/-</span>
                  <span className="text-[#E61853]">₹300/-</span>
                </div>
              </div>
            </div>

            {/* Card 4: TOP AND JEANS */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
              <div>
                <div className="bg-gradient-to-r from-[#edd177] via-[#c89825] to-[#edd177] text-black font-black text-[10px] text-center py-0.5 tracking-wider uppercase border-b border-[#a87c1a]">
                  LIMITED OFFER
                </div>
                <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
                  <img
                    src="/liora/top_and_jeans.jpg"
                    alt="Top and Jeans"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute left-1.5 bottom-1.5 bg-[#FFD000] text-black text-[8px] font-black px-1 py-0.5 rounded border border-black shadow-sm">
                    1 DAY
                  </div>
                  <div className="absolute right-1.5 bottom-1.5 w-5 h-5 bg-[#FFD000] border border-black rounded-md flex items-center justify-center shadow-sm">
                    <Plus className="w-3.5 h-3.5 text-black stroke-[3]" />
                  </div>
                </div>
              </div>
              <div className="p-2 text-center space-y-0.5 font-sans">
                <span className="font-bold text-[10px] text-neutral-800 uppercase block tracking-tight truncate">
                  TOP AND JEANS
                </span>
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-black">
                  <span className="text-neutral-400 line-through">₹1750/-</span>
                  <span className="text-[#E61853]">₹1100/-</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ================= 3. BOTTOM NAVIGATION BAR ================= */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 pt-2 px-4 flex items-center justify-around z-40 shadow-lg"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex flex-col items-center gap-0.5 text-[#FFD000] cursor-pointer">
          <Home className="w-5 h-5 stroke-[2.5]" />
          <span className="text-[10px] font-black text-black">Home</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 text-neutral-600 hover:text-black cursor-pointer">
          <ShoppingBag className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] font-bold">Offers</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 text-neutral-600 hover:text-black cursor-pointer">
          <Sparkles className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] font-bold">Highlights</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 text-neutral-600 hover:text-black cursor-pointer">
          <Store className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] font-bold">Stores</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 text-neutral-600 hover:text-black cursor-pointer">
          <User className="w-5 h-5 stroke-[2]" />
          <span className="text-[10px] font-bold">Profile</span>
        </div>
      </div>

    </div>
  );
};

