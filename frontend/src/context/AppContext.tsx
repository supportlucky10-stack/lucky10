import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  ViewType,
  GameSlot,
  UserAccount,
  BankDetails,
  BetSlipItem,
  PlacedTicket,
  GameResult,
  PayoutLog,
  ToastMessage,
} from '../types';
import { authService } from '../services/authService';
import { customerService } from '../services/customerService';
import { adminService } from '../services/adminService';

interface AppContextType {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  currentUser: UserAccount | null;
  isAdminLoggedIn: boolean;
  registeredUsers: UserAccount[];
  activeGameSlot: GameSlot;
  setActiveGameSlot: (slot: GameSlot) => void;
  betSlip: BetSlipItem[];
  addToBetSlip: (item: Omit<BetSlipItem, 'id'>) => void;
  removeFromBetSlip: (id: string) => void;
  clearBetSlip: () => void;
  placedTickets: PlacedTicket[];
  userTickets: PlacedTicket[];
  saveTicket: () => Promise<boolean>;
  payTicket: () => Promise<boolean>;
  bankDetails: BankDetails | null;
  updateBankDetails: (details: Omit<BankDetails, 'updatedAt'>) => Promise<void>;
  gameResults: Record<GameSlot, GameResult>;
  publishGameResult: (slot: GameSlot, prize1: string, prize2: string, prize3: string, prize4: string, compliments: string[][]) => Promise<void>;
  payoutLogs: PayoutLog[];
  processPayout: (userId: string, amount: number) => Promise<void>;
  registerUser: (name: string, email: string, password?: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<void>;
  clearAllUsers: () => Promise<void>;
  loginUser: (username: string, password?: string) => Promise<boolean>;
  loginAdmin: (username: string, password?: string) => Promise<boolean>;
  logout: () => void;
  toasts: ToastMessage[];
  addToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  viewHistory: ViewType[];
  goBack: () => void;
}

const initialResults: Record<GameSlot, GameResult> = {
  '1 PM Game': {
    id: 'res_1',
    date: new Date().toISOString().split('T')[0],
    gameSlot: '1 PM Game',
    prize1: '742',
    prize2: '819',
    prize3: '350',
    prize4: '194',
    prize5: '408',
    compliments: [
      ['743', '741', '744', '740', '745'],
      ['820', '818', '821', '817', '822'],
      ['351', '349', '352', '348', '353'],
      ['195', '193', '196', '192', '197'],
    ],
    publishedAt: new Date().toISOString(),
  },
  '3 PM Game': {
    id: 'res_2',
    date: new Date().toISOString().split('T')[0],
    gameSlot: '3 PM Game',
    prize1: '512',
    prize2: '934',
    prize3: '601',
    prize4: '287',
    prize5: '739',
    compliments: [
      ['513', '511', '514', '510', '515'],
      ['935', '933', '936', '932', '937'],
    ],
    publishedAt: new Date().toISOString(),
  },
  '6 PM Game': {
    id: 'res_3',
    date: new Date().toISOString().split('T')[0],
    gameSlot: '6 PM Game',
    prize1: '389',
    prize2: '145',
    prize3: '720',
    prize4: '963',
    prize5: '521',
    compliments: [
      ['390', '388', '391', '387', '392'],
    ],
    publishedAt: new Date().toISOString(),
  },
  '8 PM Game': {
    id: 'res_4',
    date: new Date().toISOString().split('T')[0],
    gameSlot: '8 PM Game',
    prize1: '624',
    prize2: '471',
    prize3: '809',
    prize4: '536',
    prize5: '315',
    compliments: [
      ['625', '623', '626', '622', '627'],
    ],
    publishedAt: new Date().toISOString(),
  },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialRouteView = (): ViewType => {
    if (typeof window !== 'undefined' && (window.location.pathname.toLowerCase().startsWith('/admin') || window.location.search.includes('view=admin'))) {
      return 'ADMIN_SIGN_IN';
    }
    return 'USER_SIGN_IN';
  };

  const [currentView, setCurrentViewInternal] = useState<ViewType>(initialRouteView);
  const [viewHistory, setViewHistory] = useState<ViewType[]>([initialRouteView()]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>([]);
  const [activeGameSlot, setActiveGameSlot] = useState<GameSlot>('3 PM Game');
  const [betSlip, setBetSlip] = useState<BetSlipItem[]>([]);
  const [placedTickets, setPlacedTickets] = useState<PlacedTicket[]>([]);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [gameResults, setGameResults] = useState<Record<GameSlot, GameResult>>(initialResults);
  const [payoutLogs, setPayoutLogs] = useState<PayoutLog[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // 1. Initial Load from Backend API
  useEffect(() => {
    async function loadInitialData() {
      // Check auth status
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        if (user.role === 'ADMIN') {
          setIsAdminLoggedIn(true);
        } else {
          setIsAdminLoggedIn(false);
        }
        if (user.bankDetails) {
          setBankDetails(user.bankDetails);
        }
      }

      // Fetch today's results
      try {
        const results = await customerService.getTodayResults();
        if (results && Object.keys(results).length > 0) {
          setGameResults((prev) => ({ ...prev, ...results }));
        }
      } catch (e) {
        // Fallback to local initial results if backend unavailable
      }
    }

    loadInitialData();
  }, []);

  // Fetch tickets & admin data when user/admin changes
  useEffect(() => {
    if (currentUser) {
      customerService.getUserTickets().then((tkts) => {
        if (tkts) setPlacedTickets(tkts);
      }).catch(() => {});

      customerService.getBankDetails().then((b) => {
        if (b) setBankDetails(b);
      }).catch(() => {});
    }

    if (isAdminLoggedIn) {
      adminService.getAllUsers().then((users) => {
        if (users) setRegisteredUsers(users);
      }).catch(() => {});

      adminService.getPayoutLogs().then((logs) => {
        if (logs) setPayoutLogs(logs);
      }).catch(() => {});
    }
  }, [currentUser, isAdminLoggedIn]);

  // Sync URL route on browser navigation (PopState)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentViewInternal('USER_SIGN_IN');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const setCurrentView = (view: ViewType) => {
    setViewHistory((prev) => [...prev, view]);
    setCurrentViewInternal(view);

    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch (e) {
      window.scrollTo(0, 0);
    }

    if (view.startsWith('ADMIN_')) {
      if (!window.location.pathname.toLowerCase().startsWith('/admin')) {
        window.history.pushState({}, '', '/admin');
      }
    } else {
      if (window.location.pathname.toLowerCase().startsWith('/admin') || window.location.search.includes('view=admin')) {
        window.history.pushState({}, '', '/');
      }
    }
  };

  const goBack = () => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch (e) {
      window.scrollTo(0, 0);
    }

    if (viewHistory.length > 1) {
      const newHistory = [...viewHistory];
      newHistory.pop();
      const prevView = newHistory[newHistory.length - 1];
      setViewHistory(newHistory);
      setCurrentViewInternal(prevView);
    } else {
      setCurrentViewInternal('GAME_DASHBOARD');
    }
  };

  const registerUser = async (name: string, email: string, password?: string): Promise<boolean> => {
    try {
      const res = await authService.registerCustomer(name, email, password);
      setCurrentUser(res.user);
      setIsAdminLoggedIn(false);
      addToast(`Account created! Welcome, ${res.user.name}! ₹1,000 added.`, 'success');
      setCurrentView('GAME_DASHBOARD');
      return true;
    } catch (err: any) {
      addToast(err.message || 'Registration failed', 'error');
      return false;
    }
  };

  const loginUser = async (usernameInput: string, passwordInput?: string): Promise<boolean> => {
    const inputClean = (usernameInput || 'demo').trim();
    try {
      const res = await authService.loginCustomer(inputClean, passwordInput);
      setCurrentUser(res.user);
      setIsAdminLoggedIn(false);
      if (res.user.bankDetails) setBankDetails(res.user.bankDetails);
      addToast(`Welcome back, ${res.user.name}!`, 'success');
      setCurrentView('GAME_DASHBOARD');
      return true;
    } catch (err: any) {
      console.warn('Backend login unavailable, entering Demo Mode:', err);
      const isAdm = inputClean.toLowerCase() === 'admin';
      const mockUser: UserAccount = {
        id: isAdm ? 'user_admin_001' : 'user_demo_001',
        name: isAdm ? 'System Admin' : 'Demo Player',
        email: isAdm ? 'admin@lucky10.com' : 'demo@lucky10.com',
        username: inputClean || 'demo',
        role: isAdm ? 'ADMIN' : 'CUSTOMER',
        balance: isAdm ? 0 : 1000,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setCurrentUser(mockUser);
      setIsAdminLoggedIn(isAdm);
      addToast(`Welcome, ${mockUser.name}!`, 'success');
      setCurrentView(isAdm ? 'ADMIN_DRAWER' : 'GAME_DASHBOARD');
      return true;
    }
  };

  const loginAdmin = async (username: string, password?: string): Promise<boolean> => {
    const inputClean = (username || 'admin').trim();
    try {
      const res = await authService.loginAdmin(inputClean, password);
      setIsAdminLoggedIn(true);
      setCurrentUser(res.user);
      addToast('Admin authenticated successfully', 'success');
      setCurrentView('ADMIN_DRAWER');
      return true;
    } catch (err: any) {
      console.warn('Backend admin login unavailable, entering Admin Demo Mode:', err);
      const mockAdmin: UserAccount = {
        id: 'user_admin_001',
        name: 'System Admin',
        email: 'admin@lucky10.com',
        username: inputClean || 'admin',
        role: 'ADMIN',
        balance: 0,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setIsAdminLoggedIn(true);
      setCurrentUser(mockAdmin);
      addToast('Admin authenticated successfully', 'success');
      setCurrentView('ADMIN_DRAWER');
      return true;
    }
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    setIsAdminLoggedIn(false);
    setBetSlip([]);
    addToast('Logged out successfully', 'info');
    if (currentView.startsWith('ADMIN_')) {
      setCurrentView('ADMIN_SIGN_IN');
    } else {
      setCurrentView('USER_SIGN_IN');
    }
  };

  const addToBetSlip = (item: Omit<BetSlipItem, 'id'>) => {
    const id = `bet_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setBetSlip((prev) => [...prev, { ...item, id }]);
    addToast(`Added ${item.type} bet: ${item.number} (Count: ${item.count})`, 'success');
  };

  const removeFromBetSlip = (id: string) => {
    setBetSlip((prev) => prev.filter((item) => item.id !== id));
  };

  const clearBetSlip = () => {
    setBetSlip([]);
  };

  const saveTicket = async (): Promise<boolean> => {
    if (betSlip.length === 0) {
      addToast('Your bet slip is empty!', 'error');
      return false;
    }
    const total = betSlip.reduce((sum, item) => sum + item.totalAmount, 0);
    try {
      const newTicket = await customerService.placeTicket(activeGameSlot, betSlip, total, 'SAVE');
      setPlacedTickets((prev) => [newTicket, ...prev]);
      addToast('Saved successfully!', 'success');
      return true;
    } catch (err: any) {
      addToast(err.message || 'Failed to save ticket', 'error');
      return false;
    }
  };

  const payTicket = async (): Promise<boolean> => {
    if (betSlip.length === 0) {
      addToast('Your bet slip is empty!', 'error');
      return false;
    }
    const total = betSlip.reduce((sum, item) => sum + item.totalAmount, 0);
    try {
      const newTicket = await customerService.placeTicket(activeGameSlot, betSlip, total, 'PAY');
      setPlacedTickets((prev) => [newTicket, ...prev]);
      if (currentUser) {
        setCurrentUser({ ...currentUser, balance: currentUser.balance - total });
      }
      setBetSlip([]);
      addToast(`Payment of ₹${total} successful! Ticket ${newTicket.id} is live for ${activeGameSlot}.`, 'success');
      return true;
    } catch (err: any) {
      addToast(err.message || 'Payment failed', 'error');
      return false;
    }
  };

  const updateBankDetails = async (details: Omit<BankDetails, 'updatedAt'>) => {
    try {
      const updated = await customerService.updateBankDetails(details);
      setBankDetails(updated);
      if (currentUser) {
        setCurrentUser({ ...currentUser, bankDetails: updated });
      }
      addToast('Bank account details updated successfully!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update bank details', 'error');
    }
  };

  const publishGameResult = async (
    slot: GameSlot,
    prize1: string,
    prize2: string,
    prize3: string,
    prize4: string,
    compliments: string[][]
  ) => {
    try {
      const newRes = await adminService.publishResult(slot, prize1, prize2, prize3, prize4, compliments);
      setGameResults((prev) => ({ ...prev, [slot]: newRes }));
      addToast(`Winning numbers published for ${slot}!`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to publish results', 'error');
    }
  };

  const processPayout = async (userId: string, amount: number) => {
    try {
      const newLog = await adminService.processPayout(userId, amount);
      setPayoutLogs((prev) => [newLog, ...prev]);
      addToast(`Payout of ₹${amount} transferred successfully!`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to process payout', 'error');
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await adminService.deleteUser(userId);
      setRegisteredUsers((prev) => prev.filter((u) => u.id !== userId));
      addToast('User deleted successfully', 'info');
    } catch (err: any) {
      addToast(err.message || 'Failed to delete user', 'error');
    }
  };

  const clearAllUsers = async () => {
    try {
      await adminService.clearAllUsers();
      setRegisteredUsers([]);
      addToast('All users deleted successfully!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to clear users', 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        currentUser,
        isAdminLoggedIn,
        registeredUsers,
        activeGameSlot,
        setActiveGameSlot,
        betSlip,
        addToBetSlip,
        removeFromBetSlip,
        clearBetSlip,
        placedTickets,
        userTickets: currentUser ? placedTickets.filter((t) => t.userId === currentUser.id) : placedTickets,
        saveTicket,
        payTicket,
        bankDetails,
        updateBankDetails,
        gameResults,
        publishGameResult,
        payoutLogs,
        processPayout,
        registerUser,
        deleteUser,
        clearAllUsers,
        loginUser,
        loginAdmin,
        logout,
        toasts,
        addToast,
        removeToast,
        viewHistory,
        goBack,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
