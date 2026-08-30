import React, { useEffect, useState } from 'react';

export const SecurityShield: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBackgrounded, setIsBackgrounded] = useState(false);

  useEffect(() => {
    // 1. Right Click Prevention (Allows text selection/typing inside inputs)
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    };

    // 2. Copy Prevention (Allows copy inside inputs)
    const handleCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    };

    // 3. Drag Prevention
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    // 4. Keyboard Shortcuts Interceptor (PrintScreen, Ctrl+P, Ctrl+S, Ctrl+U, F12, DevTools)
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (e.key === 'PrintScreen') {
        try {
          if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText('');
          }
        } catch (_) {}
      }

      if (
        (isCtrlOrCmd && (key === 'p' || key === 's' || key === 'u')) ||
        e.key === 'F12' ||
        (isCtrlOrCmd && e.shiftKey && (key === 'i' || key === 'j' || key === 'c'))
      ) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        try {
          if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText('');
          }
        } catch (_) {}
      }
    };

    // 5. Visibility Change (App-Switcher / Multi-tasking thumbnail privacy shield)
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        setIsBackgrounded(true);
      } else {
        setIsBackgrounded(false);
      }
    };

    const handleWindowBlur = () => {
      setIsBackgrounded(true);
    };

    const handleWindowFocus = () => {
      setIsBackgrounded(false);
    };

    document.addEventListener('contextmenu', handleContextMenu, { capture: true });
    document.addEventListener('copy', handleCopy, { capture: true });
    document.addEventListener('dragstart', handleDragStart, { capture: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      document.removeEventListener('copy', handleCopy, { capture: true });
      document.removeEventListener('dragstart', handleDragStart, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  return (
    <>
      {children}

      {/* App Switcher & Background Thumbnail Privacy Shield */}
      {isBackgrounded && (
        <div
          className="fixed inset-0 z-[9999999] bg-black flex flex-col items-center justify-center pointer-events-none select-none"
          aria-hidden="true"
        >
          <div className="w-10 h-10 rounded-full border border-neutral-700 flex items-center justify-center mb-2">
            <div className="w-3 h-3 bg-neutral-600 rounded-full animate-pulse" />
          </div>
          <span className="text-neutral-500 font-mono text-[11px] tracking-wider">PROTECTED VIEW</span>
        </div>
      )}
    </>
  );
};
