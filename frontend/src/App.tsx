import React from 'react';
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
import { UpdateBankDetailsView } from './views/customer/UpdateBankDetailsView';
import { MyPlayReportView } from './views/customer/MyPlayReportView';
import { EditDeleteBillView } from './views/customer/EditDeleteBillView';
import { TotalCountView } from './views/customer/TotalCountView';

// Admin View Imports
import { AdminSignInView } from './views/admin/AdminSignInView';
import { AdminDrawerView } from './views/admin/AdminDrawerView';
import { AdminUsersAndResultsView } from './views/admin/AdminUsersAndResultsView';
import { AdminResultManagementView } from './views/admin/AdminResultManagementView';
import { AdminReportsView } from './views/admin/AdminReportsView';
import { AdminPayoutsView } from './views/admin/AdminPayoutsView';
import { AdminTransactionLogsView } from './views/admin/AdminTransactionLogsView';
import { AdminIssuesView } from './views/admin/AdminIssuesView';
import { AdminLimitBlockView } from './views/admin/AdminLimitBlockView';

import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ViewRouter: React.FC = () => {
  const { currentView, toasts, removeToast, isAdminLoggedIn } = useApp();

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
      case 'UPDATE_BANK_DETAILS':
        return <UpdateBankDetailsView />;
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
      case 'ADMIN_PAYOUTS':
        return <AdminPayoutsView />;
      case 'ADMIN_TRANSACTION_LOGS':
        return <AdminTransactionLogsView />;
      case 'ADMIN_ISSUES':
        return <AdminIssuesView />;
      case 'ADMIN_LIMIT_BLOCK':
        return <AdminLimitBlockView />;
      default:
        return <UserSignInView />;
    }
  };

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

      {renderView()}
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
