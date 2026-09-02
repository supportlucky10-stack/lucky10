import React, { useState, useEffect } from 'react';
import { Download, Share, X, PlusSquare } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PROMPT_SEEN_KEY = 'myntra_pwa_install_prompt_seen';

export const InstallPromptModal: React.FC = () => {
  const { currentView, isAdminLoggedIn } = useApp();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  const isAdminSection =
    isAdminLoggedIn ||
    currentView.startsWith('ADMIN_') ||
    (typeof window !== 'undefined' &&
      (window.location.pathname.includes('/admin') ||
       window.location.hash.includes('/admin') ||
       window.location.search.includes('admin')));

  useEffect(() => {
    // Never show inside admin views
    if (isAdminSection) return;

    // Check if already in standalone app mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Only show the install once - never repeat on every visit
    if (localStorage.getItem(PROMPT_SEEN_KEY)) {
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
      if (!localStorage.getItem(PROMPT_SEEN_KEY)) {
        localStorage.setItem(PROMPT_SEEN_KEY, 'true');
        setIsOpen(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show popup after brief delay on the first visit only
    const timer = setTimeout(() => {
      if (!isStandalone && !localStorage.getItem(PROMPT_SEEN_KEY)) {
        localStorage.setItem(PROMPT_SEEN_KEY, 'true');
        setIsOpen(true);
      }
    }, 1200);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, [isAdminSection]);

  const handleDismiss = () => {
    localStorage.setItem(PROMPT_SEEN_KEY, 'true');
    setIsOpen(false);
  };

  const handleInstallClick = async () => {
    localStorage.setItem(PROMPT_SEEN_KEY, 'true');
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
    } else {
      setIsOpen(false);
    }
  };

  if (isAdminSection || !isOpen || isInstalled) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4 animate-fade-in font-sans">
      <div className="bg-[#12161c] border border-neutral-700/80 rounded-2xl p-4 sm:p-5 max-w-sm w-full shadow-[0_0_35px_rgba(0,0,0,0.85)] space-y-4 animate-drop-in text-white relative">
        
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 text-neutral-400 hover:text-white p-1 rounded-full bg-neutral-800/60 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* App Logo & Title: ONLY Myntra logo with Myntra */}
        <div className="flex items-center gap-3.5 pt-1 pr-8">
          <img
            src="/pwa-192x192.png"
            alt="Myntra"
            className="w-12 h-12 rounded-xl shadow-md object-contain bg-white shrink-0 p-1"
          />
          <div>
            <h3 className="font-bold text-lg text-white tracking-tight leading-tight">
              Myntra
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        {isIOS ? (
          <div className="bg-black/40 border border-neutral-700/60 rounded-xl p-3 space-y-2 text-xs text-neutral-200">
            <ol className="space-y-1.5 list-decimal list-inside text-[11px] text-neutral-300">
              <li>
                Tap <Share className="w-3.5 h-3.5 inline text-sky-400 mx-0.5" /> <strong>Share</strong> in browser
              </li>
              <li>
                Tap <PlusSquare className="w-3.5 h-3.5 inline text-yellow-400 mx-0.5" /> <strong>Add to Home Screen</strong>
              </li>
            </ol>
            <button
              onClick={handleDismiss}
              className="w-full mt-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        ) : (
          <div className="pt-1">
            <button
              onClick={deferredPrompt ? handleInstallClick : handleDismiss}
              className="w-full py-3 bg-gradient-to-r from-gold via-yellow-400 to-gold-dark text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
            >
              <Download className="w-4 h-4 text-black stroke-[2.5]" />
              <span>Install</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
