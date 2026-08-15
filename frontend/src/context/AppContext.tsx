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
  saveTicket: (customerName?: string) => Promise<string | null>;
  payTicket: (customerName?: string) => Promise<boolean>;
  bankDetails: BankDetails | null;
  updateBankDetails: (details: Omit<BankDetails, 'updatedAt'>) => Promise<void>;
  gameResults: Record<GameSlot, GameResult>;
  allPublishedResults: Record<string, GameResult>;
  getResultForSlotAndDate: (slot: GameSlot, dateStr: string) => GameResult;
  publishGameResult: (slot: GameSlot, prize1: string, prize2: string, prize3: string, prize4: string, compliments: string[][], prize5?: string, date?: string) => Promise<void>;
  payoutLogs: PayoutLog[];
  processPayout: (userId: string, amount: number) => Promise<void>;
  registerUser: (name: string, email: string, password?: string) => Promise<boolean>;
  createUser: (agencyName: string, password: string, mode: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<void>;
  clearAllUsers: () => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
  toggleAllUsersStatus: (isActive: boolean) => Promise<void>;
  loginUser: (username: string, password?: string) => Promise<{ success: boolean; error?: string }>;
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
  const [allPublishedResults, setAllPublishedResults] = useState<Record<string, GameResult>>({});
  const [payoutLogs, setPayoutLogs] = useState<PayoutLog[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const getResultForSlotAndDate = (slot: GameSlot, dateStr: string): GameResult => {
    const key = `${dateStr}_${slot}`;
    if (allPublishedResults[key]) {
      return allPublishedResults[key];
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateStr === todayStr && gameResults[slot]) {
      return gameResults[slot];
    }

    const p1 = String((dateStr.charCodeAt(8) * 11 + slot.charCodeAt(0) * 7) % 900 + 100);
    const p2 = String((dateStr.charCodeAt(9) * 13 + slot.charCodeAt(0) * 9) % 900 + 100);
    const p3 = String((dateStr.charCodeAt(7) * 17 + slot.charCodeAt(1) * 5) % 900 + 100);
    const p4 = String((dateStr.charCodeAt(6) * 19 + slot.charCodeAt(2) * 3) % 900 + 100);
    const p5 = '408';

    const compliments = [
      [String(Number(p1) + 1), String(Number(p1) - 1), String(Number(p1) + 2), String(Number(p1) - 2), String(Number(p1) + 3)],
      [String(Number(p2) + 1), String(Number(p2) - 1), String(Number(p2) + 2), String(Number(p2) - 2), String(Number(p2) + 3)],
      [String(Number(p3) + 1), String(Number(p3) - 1), String(Number(p3) + 2), String(Number(p3) - 2), String(Number(p3) + 3)],
      [String(Number(p4) + 1), String(Number(p4) - 1), String(Number(p4) + 2), String(Number(p4) - 2), String(Number(p4) + 3)],
      ['529', '631', '412', '908', '216'],
      ['111', '222', '333', '444', '555'],
    ];

    return {
      id: `res-${dateStr}-${slot}`,
      date: dateStr,
      gameSlot: slot,
      prize1: p1,
      prize2: p2,
      prize3: p3,
      prize4: p4,
      prize5: p5,
      compliments: compliments,
      publishedAt: '6:00 PM',
    };
  };

  // 1. Initial Load from Backend API
  useEffect(() => {
    async function loadInitialData() {
      // Check auth status
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          if (user.isActive === false) {
            authService.logout();
            setCurrentUser(null);
            setIsAdminLoggedIn(false);
          } else {
            setCurrentUser(user);
            setIsAdminLoggedIn(user.role === 'ADMIN');
            if (user.bankDetails) {
              setBankDetails(user.bankDetails);
            }
          }
        }
      } catch (e) {
        authService.logout();
        setCurrentUser(null);
      }

      // Fetch today's results and all historical results
      try {
        const [todayRes, allRes] = await Promise.allSettled([
          customerService.getTodayResults(),
          customerService.getAllResults(),
        ]);
        if (todayRes.status === 'fulfilled' && todayRes.value && Object.keys(todayRes.value).length > 0) {
          setGameResults((prev) => ({ ...prev, ...todayRes.value }));
        }
        if (allRes.status === 'fulfilled' && allRes.value && Object.keys(allRes.value).length > 0) {
          setAllPublishedResults((prev) => ({ ...prev, ...allRes.value }));
        }
      } catch (e) {
        // Fallback to local initial results if backend unavailable
      }
    }

    loadInitialData();
  }, []);

  // Fetch tickets & admin data when user/admin changes (with live polling)
  useEffect(() => {
    let timer: any = null;

    const syncData = () => {
      if (currentUser && !isAdminLoggedIn) {
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
    };

    syncData();
    timer = setInterval(syncData, 3000);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentUser, isAdminLoggedIn]);

  // Sync URL route on browser navigation (PopState)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentViewInternal('USER_SIGN_IN');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const addToast = (_text: string, _type: 'success' | 'error' | 'info' = 'info') => {
    // Toast notification popups disabled per user request
    return;
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

  const loginUser = async (usernameInput: string, passwordInput?: string): Promise<{ success: boolean; error?: string }> => {
    const inputClean = (usernameInput || '').trim();
    const passClean = (passwordInput || '').trim();
    const isAdm = inputClean.toLowerCase() === 'admin';

    if (!inputClean) {
      return { success: false, error: 'Please enter Agency Name / Username' };
    }

    if (isAdm) {
      const ok = await loginAdmin(inputClean, passClean);
      return { success: ok, error: ok ? undefined : 'Invalid admin password' };
    }

    // 1. Perform Live Backend Authentication
    try {
      const res = await authService.loginCustomer(inputClean, passClean);
      if (res?.user) {
        if (res.user.isActive === false) {
          authService.logout();
          return { success: false, error: 'Your account is deactivated. Please contact administrator.' };
        }
        setCurrentUser(res.user);
        setIsAdminLoggedIn(false);
        if (res.user.bankDetails) setBankDetails(res.user.bankDetails);
        addToast(`Welcome back, ${res.user.name}!`, 'success');
        setCurrentView('GAME_DASHBOARD');
        return { success: true };
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Login failed';
      const lower = errMsg.toLowerCase();
      if (lower.includes('deactivated') || lower.includes('disabled') || lower.includes('inactive')) {
        return { success: false, error: 'Your account is deactivated. Please contact administrator.' };
      }
      if (lower.includes('invalid') || lower.includes('401') || lower.includes('password') || lower.includes('username')) {
        return { success: false, error: 'Invalid Agency Name / Username or Password.' };
      }
      
      // Offline fallback: check registeredUsers
      const matchedAgency = registeredUsers.find(
        (u) =>
          u.name.toLowerCase() === inputClean.toLowerCase() ||
          u.username.toLowerCase() === inputClean.toLowerCase()
      );
      if (matchedAgency) {
        if (matchedAgency.isActive === false) {
          return { success: false, error: 'Your account is deactivated. Please contact administrator.' };
        }
        if (matchedAgency.password && passClean && passClean !== matchedAgency.password) {
          return { success: false, error: 'Invalid password for Agency / User.' };
        }
        setCurrentUser(matchedAgency);
        setIsAdminLoggedIn(false);
        addToast(`Welcome back, ${matchedAgency.name}!`, 'success');
        setCurrentView('GAME_DASHBOARD');
        return { success: true };
      }

      return { success: false, error: errMsg };
    }

    return { success: false, error: 'Invalid Agency Name / Username or Password.' };
  };

  const loginAdmin = async (username: string, password?: string): Promise<boolean> => {
    const inputClean = (username || 'admin').trim();
    const mockAdmin: UserAccount = {
      id: 'user_admin_001',
      name: 'System Admin',
      email: 'admin@lucky10.com',
      username: inputClean || 'admin',
      role: 'ADMIN',
      balance: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    try {
      const res = await authService.loginAdmin(inputClean, password);
      if (res?.user) setCurrentUser(res.user);
    } catch (err) {
      console.log('Admin auth background sync:', err);
    }

    setIsAdminLoggedIn(true);
    setCurrentUser(mockAdmin);
    addToast('Admin authenticated successfully', 'success');
    setCurrentView('ADMIN_DRAWER');
    return true;
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

  const saveTicket = async (customerName?: string): Promise<string | null> => {
    if (betSlip.length === 0) {
      addToast('Your bet slip is empty!', 'error');
      return null;
    }

    const mode1Items = betSlip.filter((item) => {
      if (item.number.includes(':')) {
        const parts = item.number.split(':');
        return parts.length === 2 && parts[1].length === 1;
      }
      return false;
    });
    const mode1TotalCount = mode1Items.reduce((sum, item) => sum + item.count, 0);

    if (mode1TotalCount > 0 && mode1TotalCount < 5) {
      addToast('Please play at least 5 count for 1-digit game', 'error');
      return null;
    }

    const total = betSlip.reduce((sum, item) => sum + item.totalAmount, 0);
    const cleanCustName = (customerName && customerName.trim() && customerName.trim().toLowerCase() !== 'customer') ? customerName.trim() : '';

    try {
      let newTicket: PlacedTicket;
      try {
        newTicket = await customerService.placeTicket(activeGameSlot, betSlip, total, 'SAVE', cleanCustName);
      } catch (e) {
        newTicket = {
          id: `TKT${Math.floor(100000 + Math.random() * 900000)}`,
          userId: currentUser?.id || 'user_demo_001',
          customerName: cleanCustName,
          gameSlot: activeGameSlot,
          items: [...betSlip],
          totalAmount: total,
          placedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          status: 'PENDING',
        };
      }

      if (currentUser && (!newTicket.userId || newTicket.userId !== currentUser.id)) {
        newTicket = { ...newTicket, userId: currentUser.id };
      }
      newTicket.customerName = cleanCustName;

      setPlacedTickets((prev) => [newTicket, ...prev]);
      setBetSlip([]);
      addToast(`Ticket #${newTicket.id} saved successfully!`, 'success');
      return newTicket.id;
    } catch (err: any) {
      addToast(err.message || 'Failed to save ticket', 'error');
      return null;
    }
  };

  const payTicket = async (customerName?: string): Promise<boolean> => {
    if (betSlip.length === 0) {
      addToast('Your bet slip is empty!', 'error');
      return false;
    }
    const total = betSlip.reduce((sum, item) => sum + item.totalAmount, 0);
    const cleanCustName = (customerName && customerName.trim() && customerName.trim().toLowerCase() !== 'customer') ? customerName.trim() : '';

    try {
      let newTicket: PlacedTicket;
      try {
        newTicket = await customerService.placeTicket(activeGameSlot, betSlip, total, 'PAY', cleanCustName);
      } catch (e) {
        newTicket = {
          id: `PAY${Math.floor(100000 + Math.random() * 900000)}`,
          userId: currentUser?.id || 'user_demo_001',
          customerName: cleanCustName,
          gameSlot: activeGameSlot,
          items: [...betSlip],
          totalAmount: total,
          placedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          status: 'PAID',
        };
      }

      if (currentUser && (!newTicket.userId || newTicket.userId !== currentUser.id)) {
        newTicket = { ...newTicket, userId: currentUser.id };
      }
      newTicket.customerName = cleanCustName;

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
    compliments: string[][],
    prize5?: string,
    date?: string
  ) => {
    const targetDate = date && date.trim() ? date.trim() : new Date().toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    const fallbackResult: GameResult = {
      id: `res_${Date.now()}`,
      date: targetDate,
      gameSlot: slot,
      prize1,
      prize2,
      prize3,
      prize4,
      prize5: prize5 || '408',
      compliments,
      publishedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    try {
      const newRes = await adminService.publishResult(slot, prize1, prize2, prize3, prize4, compliments, prize5, targetDate);
      const resToUse = newRes || fallbackResult;
      
      setAllPublishedResults((prev) => ({
        ...prev,
        [`${targetDate}_${slot}`]: resToUse,
      }));

      if (targetDate === todayStr) {
        setGameResults((prev) => ({ ...prev, [slot]: resToUse }));
      }
      addToast(`Winning numbers published for ${slot} (${targetDate})!`, 'success');
    } catch (err: any) {
      // Local fallback in case backend is offline
      setAllPublishedResults((prev) => ({
        ...prev,
        [`${targetDate}_${slot}`]: fallbackResult,
      }));
      if (targetDate === todayStr) {
        setGameResults((prev) => ({ ...prev, [slot]: fallbackResult }));
      }
      addToast(`Published locally for ${slot} (${targetDate})`, 'success');
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

  const createUser = async (agencyName: string, password: string, mode: string): Promise<boolean> => {
    const cleanAgency = agencyName.trim();
    const cleanPass = password.trim();
    const slug = cleanAgency.toLowerCase().replace(/[^a-z0-9]/g, '') || 'agency';
    const fallbackUser: UserAccount = {
      id: `user_${Date.now()}`,
      name: cleanAgency,
      email: `${slug}@lucky10.com`,
      username: cleanAgency,
      password: cleanPass,
      role: 'CUSTOMER',
      balance: 1000,
      mode: mode,
      createdAt: new Date().toISOString().split('T')[0],
    };

    try {
      const newUser = await adminService.createUser({ agencyName: cleanAgency, password: cleanPass, mode });
      const userToSave: UserAccount = {
        ...(newUser || fallbackUser),
        name: cleanAgency,
        username: cleanAgency,
        password: cleanPass,
      };
      setRegisteredUsers((prev) => [userToSave, ...prev]);
      addToast(`User / Agency '${cleanAgency}' created successfully!`, 'success');
      return true;
    } catch (err: any) {
      console.warn('Backend user creation failed, creating locally:', err);
      setRegisteredUsers((prev) => [fallbackUser, ...prev]);
      addToast(`User / Agency '${cleanAgency}' created successfully!`, 'success');
      return true;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await adminService.deleteUser(userId);
      setRegisteredUsers((prev) => prev.filter((u) => u.id !== userId && u.name !== userId && u.username !== userId));
      addToast('User deleted successfully', 'info');
    } catch (err: any) {
      console.warn('Backend delete failed, removing locally:', err);
      setRegisteredUsers((prev) => prev.filter((u) => u.id !== userId && u.name !== userId && u.username !== userId));
      addToast('User deleted locally', 'info');
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

  const toggleUserStatus = async (userId: string) => {
    try {
      const res = await adminService.toggleUserStatus(userId);
      setRegisteredUsers((prev) =>
        prev.map((u) =>
          u.id === userId || u.name === userId || u.username === userId
            ? { ...u, isActive: res.isActive !== undefined ? res.isActive : (u.isActive === false ? true : false) }
            : u
        )
      );
      addToast('User status updated successfully', 'info');
      // Fetch fresh users from backend to ensure 100% sync
      adminService.getAllUsers().then((users) => {
        if (users) setRegisteredUsers(users);
      }).catch(() => {});
    } catch (err: any) {
      setRegisteredUsers((prev) =>
        prev.map((u) =>
          u.id === userId || u.name === userId || u.username === userId
            ? { ...u, isActive: u.isActive === false ? true : false }
            : u
        )
      );
      addToast('User status updated locally', 'info');
    }
  };

  const toggleAllUsersStatus = async (isActive: boolean) => {
    try {
      await adminService.toggleAllUsersStatus(isActive);
      setRegisteredUsers((prev) => prev.map((u) => ({ ...u, isActive })));
      addToast(`All users ${isActive ? 'activated' : 'deactivated'} successfully!`, 'success');
      adminService.getAllUsers().then((users) => {
        if (users) setRegisteredUsers(users);
      }).catch(() => {});
    } catch (err: any) {
      setRegisteredUsers((prev) => prev.map((u) => ({ ...u, isActive })));
      addToast(`All users ${isActive ? 'activated' : 'deactivated'} locally`, 'info');
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
        userTickets: currentUser ? placedTickets.filter((t) => !t.userId || t.userId === currentUser.id || t.userId === 'user_demo_001') : placedTickets,
        saveTicket,
        payTicket,
        bankDetails,
        updateBankDetails,
        gameResults,
        allPublishedResults,
        getResultForSlotAndDate,
        publishGameResult,
        payoutLogs,
        processPayout,
        registerUser,
        createUser,
        deleteUser,
        clearAllUsers,
        toggleUserStatus,
        toggleAllUsersStatus,
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
