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

interface AppContextType {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  currentUser: UserAccount | null;
  registeredUsers: UserAccount[];
  activeGameSlot: GameSlot;
  setActiveGameSlot: (slot: GameSlot) => void;
  betSlip: BetSlipItem[];
  addToBetSlip: (item: Omit<BetSlipItem, 'id'>) => void;
  removeFromBetSlip: (id: string) => void;
  clearBetSlip: () => void;
  placedTickets: PlacedTicket[];
  userTickets: PlacedTicket[];
  saveTicket: () => boolean;
  payTicket: () => boolean;
  bankDetails: BankDetails | null;
  updateBankDetails: (details: Omit<BankDetails, 'updatedAt'>) => void;
  gameResults: Record<GameSlot, GameResult>;
  publishGameResult: (slot: GameSlot, prize1: string, prize2: string, prize3: string, prize4: string, compliments: string[][]) => void;
  payoutLogs: PayoutLog[];
  processPayout: (userId: string, amount: number) => void;
  registerUser: (name: string, email: string, password?: string) => boolean;
  deleteUser: (userId: string) => void;
  clearAllUsers: () => void;
  loginUser: (username: string, password?: string) => boolean;
  logout: () => void;
  toasts: ToastMessage[];
  addToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  viewHistory: ViewType[];
  goBack: () => void;
}

const defaultBankDetails: BankDetails = {
  accountHolderName: 'Adithyan Pavithran',
  accountNo: '98765432101234',
  bankName: 'State Bank of India',
  ifsc: 'SBIN0004321',
  branchName: 'Kasaragod Main Branch',
  updatedAt: '2026-08-01',
};

const initialUsers: UserAccount[] = [
  {
    id: 'user_1',
    name: 'Adithyan',
    email: 'adithyan@example.com',
    username: 'adithyan',
    password: 'password123',
    balance: 2500,
    bankDetails: defaultBankDetails,
    createdAt: '2026-08-01',
  },
  {
    id: 'user_2',
    name: 'Jerin',
    email: 'jerin@example.com',
    username: 'jerin',
    password: 'password123',
    balance: 1800,
    createdAt: '2026-08-02',
  },
];

const initialResults: Record<GameSlot, GameResult> = {
  '1 PM Game': {
    id: 'res_1',
    date: new Date().toISOString().split('T')[0],
    gameSlot: '1 PM Game',
    prize1: '742',
    prize2: '819',
    prize3: '350',
    prize4: '194',
    compliments: [
      ['743', '741', '744', '740'],
      ['820', '818', '821', '817'],
      ['351', '349', '352', '348'],
      ['195', '193', '196', '192'],
      ['529', '631', '412', '908'],
      ['111', '222', '333', '444'],
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
    compliments: [
      ['513', '511', '514', '510'],
      ['935', '933', '936', '932'],
      ['602', '600', '603', '599'],
      ['288', '286', '289', '285'],
      ['104', '762', '891', '345'],
      ['555', '666', '777', '888'],
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
    compliments: [
      ['390', '388', '391', '387'],
      ['146', '144', '147', '143'],
      ['721', '719', '722', '718'],
      ['964', '962', '965', '961'],
      ['432', '876', '210', '654'],
      ['999', '000', '123', '456'],
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
    compliments: [
      ['625', '623', '626', '622'],
      ['472', '470', '473', '469'],
      ['810', '808', '811', '807'],
      ['537', '535', '538', '534'],
      ['319', '842', '705', '168'],
      ['789', '012', '345', '678'],
    ],
    publishedAt: new Date().toISOString(),
  },
};

const initialPayoutLogs: PayoutLog[] = [
  {
    id: 'pay_1',
    userId: 'user_1',
    userName: 'Adithyan',
    amount: 5000,
    bankAccount: 'SBIN0004321 - 9876****1234',
    status: 'SUCCESS',
    date: '2026-08-06',
  },
  {
    id: 'pay_2',
    userId: 'user_2',
    userName: 'Jerin',
    amount: 2500,
    bankAccount: 'HDFC0001234 - 1234****5678',
    status: 'SUCCESS',
    date: '2026-08-05',
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialRouteView = (): ViewType => {
    return 'USER_SIGN_IN';
  };

  const [currentView, setCurrentViewInternal] = useState<ViewType>(initialRouteView);
  const [viewHistory, setViewHistory] = useState<ViewType[]>([initialRouteView()]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('lucky10_registered_users');
    return saved ? JSON.parse(saved) : initialUsers;
  });
  const [activeGameSlot, setActiveGameSlot] = useState<GameSlot>('1 PM Game');
  const [betSlip, setBetSlip] = useState<BetSlipItem[]>([]);
  const [placedTickets, setPlacedTickets] = useState<PlacedTicket[]>([]);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [gameResults, setGameResults] = useState<Record<GameSlot, GameResult>>(initialResults);
  const [payoutLogs, setPayoutLogs] = useState<PayoutLog[]>(initialPayoutLogs);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    localStorage.setItem('lucky10_registered_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

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

    // Reset window scroll position to top instantly
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch (e) {
      window.scrollTo(0, 0);
    }

    // Update URL path for separate User and Admin links
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
      newHistory.pop(); // Remove current
      const prevView = newHistory[newHistory.length - 1];
      setViewHistory(newHistory);
      setCurrentViewInternal(prevView);
    } else {
      setCurrentViewInternal('GAME_DASHBOARD');
    }
  };

  const registerUser = (name: string, email: string, password?: string): boolean => {
    if (!name.trim() || !email.trim() || !password?.trim()) {
      addToast('Please fill in all fields to sign up', 'error');
      return false;
    }

    const nInput = name.trim().toLowerCase();
    const eInput = email.trim().toLowerCase();
    const pInput = password.trim();

    const existing = registeredUsers.find(
      (u) =>
        u.email.toLowerCase() === eInput ||
        u.username.toLowerCase() === eInput ||
        u.name.toLowerCase() === nInput
    );

    if (existing) {
      addToast('An account with this email/name already exists', 'error');
      return false;
    }

    const username = eInput.includes('@') ? eInput.split('@')[0] : eInput;
    const newUser: UserAccount = {
      id: `user_${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      username: username,
      password: pInput,
      balance: 1000, // Welcome bonus ₹1000
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updatedUsers = [...registeredUsers, newUser];
    setRegisteredUsers(updatedUsers);
    localStorage.setItem('lucky10_registered_users', JSON.stringify(updatedUsers));
    
    // Automatically set current user to newly registered user
    setCurrentUser(newUser);

    addToast(`Account created! Welcome, ${newUser.name}! ₹1,000 added.`, 'success');
    return true;
  };

  const loginUser = (usernameInput: string, passwordInput?: string): boolean => {
    if (!usernameInput.trim() || !passwordInput?.trim()) {
      addToast('Please enter username/email and password', 'error');
      return false;
    }

    const uInput = usernameInput.trim().toLowerCase();
    const pInput = passwordInput.trim();

    // Fetch latest users from state or localStorage
    const saved = localStorage.getItem('lucky10_registered_users');
    const allUsers: UserAccount[] = saved ? JSON.parse(saved) : registeredUsers;

    // Flexible matching by username, email, or name
    const user = allUsers.find(
      (u) =>
        (u.username.toLowerCase() === uInput ||
          u.email.toLowerCase() === uInput ||
          u.name.toLowerCase() === uInput ||
          u.email.toLowerCase().startsWith(uInput)) &&
        u.password === pInput
    );

    if (user) {
      setCurrentUser(user);
      if (user.bankDetails) setBankDetails(user.bankDetails);
      addToast(`Welcome back, ${user.name}!`, 'success');
      setCurrentView('GAME_DASHBOARD');
      return true;
    }

    // Demo user fallback
    if ((uInput === 'demo' || uInput === 'demo player') && (pInput === '123456' || pInput === 'demo')) {
      const demoUser: UserAccount = {
        id: 'user_demo',
        name: 'Demo Player',
        email: 'demo@lucky10.com',
        username: 'demo',
        balance: 5000,
        createdAt: '2026-08-07',
      };
      setCurrentUser(demoUser);
      addToast('Logged in as Demo Player!', 'success');
      setCurrentView('GAME_DASHBOARD');
      return true;
    }

    addToast('Invalid username or password', 'error');
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setBetSlip([]);
    addToast('Logged out successfully', 'info');
    setCurrentView('USER_SIGN_IN');
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

  const saveTicket = (): boolean => {
    if (betSlip.length === 0) {
      addToast('Your bet slip is empty!', 'error');
      return false;
    }
    const total = betSlip.reduce((sum, item) => sum + item.totalAmount, 0);
    const newTicket: PlacedTicket = {
      id: `TKT${Math.floor(100000 + Math.random() * 900000)}`,
      userId: currentUser?.id || 'guest',
      gameSlot: activeGameSlot,
      items: [...betSlip],
      totalAmount: total,
      placedAt: new Date().toISOString(),
      status: 'PENDING',
    };
    setPlacedTickets((prev) => [newTicket, ...prev]);
    addToast('Saved successfully!', 'success');
    return true;
  };

  const payTicket = (): boolean => {
    if (betSlip.length === 0) {
      addToast('Your bet slip is empty!', 'error');
      return false;
    }
    const total = betSlip.reduce((sum, item) => sum + item.totalAmount, 0);

    if (currentUser && currentUser.balance < total) {
      addToast(`Insufficient balance (Available: ₹${currentUser.balance}). Total needed: ₹${total}`, 'error');
      return false;
    }

    if (currentUser) {
      const updatedBalance = currentUser.balance - total;
      setCurrentUser({ ...currentUser, balance: updatedBalance });
      setRegisteredUsers((prev) =>
        prev.map((u) => (u.id === currentUser.id ? { ...u, balance: updatedBalance } : u))
      );
    }

    const newTicket: PlacedTicket = {
      id: `PAY${Math.floor(100000 + Math.random() * 900000)}`,
      userId: currentUser?.id || 'guest',
      gameSlot: activeGameSlot,
      items: [...betSlip],
      totalAmount: total,
      placedAt: new Date().toISOString(),
      status: 'PENDING',
    };

    setPlacedTickets((prev) => [newTicket, ...prev]);
    setBetSlip([]);
    addToast(`Payment of ₹${total} successful! Ticket ${newTicket.id} is live for ${activeGameSlot}.`, 'success');
    return true;
  };

  const updateBankDetails = (details: Omit<BankDetails, 'updatedAt'>) => {
    const updated: BankDetails = {
      ...details,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setBankDetails(updated);
    if (currentUser) {
      const updatedUser = { ...currentUser, bankDetails: updated };
      setCurrentUser(updatedUser);
      setRegisteredUsers((prev) =>
        prev.map((u) => (u.id === currentUser.id ? updatedUser : u))
      );
    }
    addToast('Bank account details updated successfully!', 'success');
  };

  const publishGameResult = (
    slot: GameSlot,
    prize1: string,
    prize2: string,
    prize3: string,
    prize4: string,
    compliments: string[][]
  ) => {
    const newRes: GameResult = {
      id: `res_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      gameSlot: slot,
      prize1,
      prize2,
      prize3,
      prize4,
      compliments,
      publishedAt: new Date().toISOString(),
    };

    setGameResults((prev) => ({
      ...prev,
      [slot]: newRes,
    }));
    addToast(`Winning numbers published for ${slot}!`, 'success');
  };

  const processPayout = (userId: string, amount: number) => {
    const user = registeredUsers.find((u) => u.id === userId);
    const newLog: PayoutLog = {
      id: `pay_${Date.now()}`,
      userId,
      userName: user?.name || 'Player',
      amount,
      bankAccount: user?.bankDetails ? `${user.bankDetails.ifsc} - ${user.bankDetails.accountNo}` : 'Bank Pending',
      status: 'SUCCESS',
      date: new Date().toISOString().split('T')[0],
    };

    setPayoutLogs((prev) => [newLog, ...prev]);
    addToast(`Payout of ₹${amount} transferred to ${user?.name || 'Player'}!`, 'success');
  };

  const deleteUser = (userId: string) => {
    setRegisteredUsers((prev) => prev.filter((u) => u.id !== userId));
    addToast('User deleted successfully', 'info');
  };

  const clearAllUsers = () => {
    setRegisteredUsers([]);
    localStorage.removeItem('lucky10_registered_users');
    addToast('All users deleted successfully!', 'success');
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        currentUser,
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
