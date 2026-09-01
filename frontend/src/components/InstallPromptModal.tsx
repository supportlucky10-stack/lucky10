import React, { useState, useEffect } from 'react';
import { Download, Share, X, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPromptModal: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if already in standalone app mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Capture Android/Desktop PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsOpen(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show popup after brief delay on every visit if not installed
    const timer = setTimeout(() => {
      if (!isStandalone) {
        setIsOpen(true);
      }
    }, 1200);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsOpen(false);
        }
      } catch (err) {
        console.error('PWA install prompt error:', err);
      }
    }
  };

  if (!isOpen || isInstalled) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4 animate-fade-in font-sans">
      <div className="bg-gradient-to-b from-[#181d24] via-[#12161c] to-[#0c0f13] border border-gold/40 rounded-2xl p-5 max-w-sm w-full shadow-[0_0_35px_rgba(0,0,0,0.85)] space-y-4 animate-drop-in text-white relative">
        
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-3.5 right-3.5 text-neutral-400 hover:text-white p-1 rounded-full bg-neutral-800/60 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* App Logo & Title */}
        <div className="flex items-center gap-3.5 pt-1">
          <img
            src="/pwa-192x192.png"
            alt="Leora Fashions"
            className="w-14 h-14 rounded-xl border border-gold/50 shadow-md object-cover shrink-0"
          />
          <div className="space-y-0.5">
            <h3 className="font-serif font-black text-lg text-white tracking-tight">
              Leora Fashions
            </h3>
            <p className="text-[11px] text-gold font-medium uppercase tracking-wider">
              Official Mobile App
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-neutral-300 leading-relaxed">
          Install the Leora Fashions app on your device for instant access, smooth performance, and exclusive updates.
        </p>

        {/* Action Controls */}
        {isIOS ? (
          <div className="bg-black/40 border border-neutral-700/60 rounded-xl p-3 space-y-2 text-xs text-neutral-200">
            <p className="font-semibold text-gold flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
              <span>Install on iPhone / iPad</span>
            </p>
            <ol className="space-y-1.5 list-decimal list-inside text-[11px] text-neutral-300">
              <li>
                Tap the <Share className="w-3.5 h-3.5 inline text-sky-400 mx-0.5" /> <strong>Share</strong> button in Safari toolbar
              </li>
              <li>
                Scroll down and tap <PlusSquare className="w-3.5 h-3.5 inline text-gold mx-0.5" /> <strong>Add to Home Screen</strong>
              </li>
            </ol>
            <button
              onClick={() => setIsOpen(false)}
              className="w-full mt-2 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <button
              onClick={deferredPrompt ? handleInstallClick : () => setIsOpen(false)}
              className="w-full py-3 bg-gradient-to-r from-gold via-yellow-400 to-gold-dark text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
            >
              <Download className="w-4 h-4 text-black stroke-[2.5]" />
              <span>Install App</span>
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-2 text-neutral-400 hover:text-neutral-200 text-xs font-medium transition-colors"
            >
              Continue in browser
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
