import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { MobileContainer } from './components/MobileContainer';

// Customer View Imports
import { UserSignInView } from './views/customer/UserSignInView';
import { GameDashboardView } from './views/customer/GameDashboardView';
import { UserDrawerView } from './views/customer/UserDrawerView';
import { PayoutStructureView } from './views/customer/PayoutStructureView';
import { ChangeGameView } from './views/customer/ChangeGameView';
import { TodaysWinningNumbersView } from './views/customer/TodaysWinningNumbersView';
import { TodaysResultView } from './views/customer/TodaysResultView';
import { PreviousWinningNumbersView } from './views/customer/PreviousWinningNumbersView';
import { MyPlayReportView } from './views/customer/MyPlayReportView';
import { EditDeleteBillView } from './views/customer/EditDeleteBillView';
import { TotalCountView } from './views/customer/TotalCountView';

// Admin View Imports (Lazy-Loaded to reduce initial player bundle)
const AdminSignInView = React.lazy(() => import('./views/admin/AdminSignInView').then(m => ({ default: m.AdminSignInView })));
const AdminDrawerView = React.lazy(() => import('./views/admin/AdminDrawerView').then(m => ({ default: m.AdminDrawerView })));
const AdminUsersAndResultsView = React.lazy(() => import('./views/admin/AdminUsersAndResultsView').then(m => ({ default: m.AdminUsersAndResultsView })));
const AdminResultManagementView = React.lazy(() => import('./views/admin/AdminResultManagementView').then(m => ({ default: m.AdminResultManagementView })));
const AdminReportsView = React.lazy(() => import('./views/admin/AdminReportsView').then(m => ({ default: m.AdminReportsView })));
const AdminIssuesView = React.lazy(() => import('./views/admin/AdminIssuesView').then(m => ({ default: m.AdminIssuesView })));
const AdminLimitBlockView = React.lazy(() => import('./views/admin/AdminLimitBlockView').then(m => ({ default: m.AdminLimitBlockView })));

import { CheckCircle, AlertCircle, Info, X, Clock } from 'lucide-react';

const ViewRouter: React.FC = () => {
  const { currentView, toasts, removeToast, isAdminLoggedIn, currentUser, logout } = useApp();
  const [showTimeoutModal, setShowTimeoutModal] = useState<boolean>(false);

  const isUserInSession = Boolean(currentUser) || isAdminLoggedIn || (currentView !== 'USER_SIGN_IN' && currentView !== 'ADMIN_SIGN_IN');

  // 30-Minute Inactivity Session Monitor
  useEffect(() => {
    if (!isUserInSession) {
      localStorage.setItem('lucky10_last_active', String(Date.now()));
      return;
    }

    const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutes

    const updateActivity = () => {
      localStorage.setItem('lucky10_last_active', String(Date.now()));
    };

    let lastRecorded = 0;
    const throttledUpdate = () => {
      const now = Date.now();
      if (now - lastRecorded > 1000) {
        lastRecorded = now;
        updateActivity();
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click', 'wheel'];
    events.forEach((evt) => {
      window.addEventListener(evt, throttledUpdate, { passive: true });
    });

    const checkInactivity = () => {
      const now = Date.now();
      const lastActiveStr = localStorage.getItem('lucky10_last_active');
      const lastActive = lastActiveStr ? parseInt(lastActiveStr, 10) : now;
      if (now - lastActive >= INACTIVITY_LIMIT_MS) {
        setShowTimeoutModal(true);
      }
    };

    const intervalId = setInterval(checkInactivity, 2000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkInactivity);

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, throttledUpdate);
      });
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkInactivity);
    };
  }, [isUserInSession]);

  const handleTimeoutOk = () => {
    setShowTimeoutModal(false);
    localStorage.setItem('lucky10_last_active', String(Date.now()));
    logout();
  };

  const renderView = () => {
    // Auth Guard for Admin Routes
    if (currentView.startsWith('ADMIN_') && currentView !== 'ADMIN_SIGN_IN' && !isAdminLoggedIn) {
      return <AdminSignInView />;
    }

    switch (currentView) {
      case 'USER_SIGN_IN':
        return <UserSignInView />;
      case 'GAME_DASHBOARD':
        return <GameDashboardView />;
      case 'USER_DRAWER':
        return <UserDrawerView />;
      case 'PAYOUT_STRUCTURE':
        return <PayoutStructureView />;
      case 'CHANGE_GAME':
        return <ChangeGameView />;
      case 'TODAYS_WINNING_NUMBERS':
        return <TodaysWinningNumbersView />;
      case 'TOTAL_COUNT_VIEW':
        return <TotalCountView />;
      case 'TODAYS_RESULT':
        return <TodaysResultView />;
      case 'PREVIOUS_WINNING_NUMBERS':
        return <PreviousWinningNumbersView />;
      case 'MY_PLAY_REPORT':
        return <MyPlayReportView />;
      case 'EDIT_DELETE_BILL':
        return <EditDeleteBillView />;
      case 'ADMIN_SIGN_IN':
        return <AdminSignInView />;
      case 'ADMIN_DRAWER':
        return <AdminDrawerView />;
      case 'ADMIN_USERS_LIST':
        return <AdminUsersAndResultsView />;
      case 'ADMIN_RESULT_MANAGEMENT':
        return <AdminResultManagementView />;
      case 'ADMIN_REPORTS':
        return <AdminReportsView />;
      case 'ADMIN_ISSUES':
        return <AdminIssuesView />;
      case 'ADMIN_LIMIT_BLOCK':
        return <AdminLimitBlockView />;
      default:
        return <UserSignInView />;
    }
  };

  if (currentView === 'NOT_FOUND') {
    return (
      <div className="w-full min-h-screen bg-black text-neutral-400 flex flex-col items-center justify-center p-6 text-center font-sans select-none">
        <div className="flex items-center gap-4 border-b border-neutral-800 pb-4 mb-4">
          <span className="text-2xl font-bold text-white tracking-wider font-mono">404</span>
          <span className="text-sm text-neutral-400">This page could not be found.</span>
        </div>
      </div>
    );
  }

  return (
    <MobileContainer>
      {/* Toast Notification Container */}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xs px-2 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3 rounded-lg shadow-xl text-xs font-semibold flex items-center justify-between gap-2 border transition-all animate-bounce-short ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
                : toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
                : 'bg-neutral-900/90 text-gold border-gold/40'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-gold shrink-0" />}
              <span>{toast.text}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-neutral-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* 30-Minute Inactivity Session Timeout Modal */}
      {showTimeoutModal && (
        <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-gradient-to-b from-neutral-900 via-neutral-950 to-black border-2 border-gold/80 rounded-2xl p-6 max-w-sm w-full text-center shadow-[0_0_40px_rgba(212,175,55,0.35)] space-y-4 animate-drop-in font-mono">
            <div className="w-16 h-16 mx-auto rounded-full bg-gold/10 border-2 border-gold/50 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.25)]">
              <Clock className="w-8 h-8 text-gold animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-black text-gold tracking-wider uppercase">
                SESSION TIMEOUT
              </h3>
              <p className="text-xs text-neutral-300 font-medium leading-relaxed">
                You have been inactive for 30 minutes. Your session has timed out for security.
              </p>
            </div>

            <button
              onClick={handleTimeoutOk}
              className="w-full py-3.5 bg-gradient-to-r from-gold via-yellow-400 to-gold-dark text-black font-black text-sm uppercase tracking-widest rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer font-mono"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <React.Suspense fallback={<div className="p-8 text-center text-gold/60 text-xs font-mono">Loading...</div>}>
        {renderView()}
      </React.Suspense>
    </MobileContainer>
  );
};

export function App() {
  return (
    <AppProvider>
      <ViewRouter />
    </AppProvider>
  );
}

export default App;
