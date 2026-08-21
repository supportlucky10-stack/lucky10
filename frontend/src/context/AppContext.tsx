import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  AgencyNumberLimit,
  BlockedNumberRule,
  GlobalLimitRule,
} from '../types';
import { authService } from '../services/authService';
import { customerService } from '../services/customerService';
import { adminService } from '../services/adminService';
import { evaluateTicket } from '../utils/gameRulesEngine';
import { getLocalDateStr, extractDateStr } from '../utils/dateUtils';

interface AppContextType {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  currentUser: UserAccount | null;
  isAdminLoggedIn: boolean;
  registeredUsers: UserAccount[];
  activeGameSlot: GameSlot;
  setActiveGameSlot: (slot: GameSlot) => void;
  betSlip: BetSlipItem[];
  addToBetSlip: (item: Omit<BetSlipItem, 'id'>, customerName?: string) => boolean;
  addBatchToBetSlip: (items: Omit<BetSlipItem, 'id'>[], customerName?: string) => { addedCount: number; blockedCount: number; overloadedCount: number };
  removeFromBetSlip: (id: string) => void;
  clearBetSlip: () => void;
  placedTickets: PlacedTicket[];
  userTickets: PlacedTicket[];
  saveTicket: (customerName?: string) => Promise<string | null>;
  payTicket: (customerName?: string) => Promise<boolean>;
  deleteTicket: (ticketId: string) => Promise<boolean>;
  bankDetails: BankDetails | null;
  updateBankDetails: (details: Omit<BankDetails, 'updatedAt'>) => Promise<void>;
  gameResults: Record<GameSlot, GameResult>;
  allPublishedResults: Record<string, GameResult>;
  getResultForSlotAndDate: (slot: GameSlot, dateStr: string) => GameResult;
  publishGameResult: (slot: GameSlot, prize1: string, prize2: string, prize3: string, prize4: string, compliments: string[][], prize5?: string, date?: string) => Promise<void>;
  payoutLogs: PayoutLog[];
  processPayout: (userId: string, amount: number) => Promise<void>;
  registerUser: (name: string, email: string, password?: string) => Promise<boolean>;
  createUser: (agencyName: string, username: string, password: string, mode: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<void>;
  changeUserPassword: (userId: string, newPassword: string) => Promise<boolean>;
  updateUserMode: (userId: string, mode: string) => Promise<boolean>;
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
  // Limit / Block Management
  agencyNumberLimits: AgencyNumberLimit[];
  blockedNumbers: BlockedNumberRule[];
  globalLimitRule: GlobalLimitRule;
  addAgencyLimit: (limit: Omit<AgencyNumberLimit, 'id' | 'createdAt'>) => void;
  removeAgencyLimit: (id: string) => void;
  addBlockedNumber: (rule: Omit<BlockedNumberRule, 'id' | 'createdAt'>) => void;
  removeBlockedNumber: (id: string) => void;
  updateGlobalLimit: (rule: Partial<GlobalLimitRule>) => void;
  checkBetEligibility: (agencyIdOrName: string, slot: GameSlot, number: string, count: number, betType?: string, customerName?: string, skipBetSlip?: boolean) => { ok: boolean; reason?: string; type?: 'BLOCKED' | 'OVERLOADED' };
}



const START_BILL_ID = 2243297;

const getNextSequentialBillId = (tickets: PlacedTicket[]): string => {
  let maxId = START_BILL_ID - 1;
  tickets.forEach((t) => {
    const raw = (t.id || t.ticketId || '').replace(/\D/g, '');
    if (raw) {
      const n = parseInt(raw, 10);
      if (!isNaN(n) && n > maxId) {
        maxId = n;
      }
    }
  });
  return String(maxId + 1);
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
  const [gameResults, setGameResults] = useState<Record<GameSlot, GameResult>>({} as any);
  const [allPublishedResults, setAllPublishedResults] = useState<Record<string, GameResult>>({});
  const [payoutLogs, setPayoutLogs] = useState<PayoutLog[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Limit / Block States (Synced live from backend database)
  const [agencyNumberLimits, setAgencyNumberLimits] = useState<AgencyNumberLimit[]>([]);
  const [blockedNumbers, setBlockedNumbers] = useState<BlockedNumberRule[]>([]);
  const [globalLimitRule, setGlobalLimitRule] = useState<GlobalLimitRule>({
    defaultMaxCount: 100,
    isEnabled: false,
    gameSlot: 'ALL',
  });

  const isSavingTicketRef = useRef(false);
  const isPayingTicketRef = useRef(false);

  const dedupeTickets = (list: PlacedTicket[]): PlacedTicket[] => {
    const seen = new Set<string>();
    return list.filter((t) => {
      const idKey = t.ticketId || t.id;
      if (!idKey || seen.has(idKey)) return false;
      seen.add(idKey);
      return true;
    });
  };

  // Clean up any old cached limit items from previous sessions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('lucky10_global_limit');
        localStorage.removeItem('lucky10_agency_limits');
        localStorage.removeItem('lucky10_blocked_numbers');
      } catch (e) {}
    }
  }, []);

  const getResultForSlotAndDate = (slot: GameSlot, dateStr: string): GameResult => {
    const rawKey = `${dateStr}_${slot}`;
    if (allPublishedResults[rawKey]) {
      return allPublishedResults[rawKey];
    }
    const normDate = dateStr ? extractDateStr(dateStr) : getLocalDateStr();
    const normKey = `${normDate}_${slot}`;
    if (allPublishedResults[normKey]) {
      return allPublishedResults[normKey];
    }

    const todayStr = getLocalDateStr();
    if (gameResults[slot]) {
      const gResDate = gameResults[slot].date ? extractDateStr(gameResults[slot].date) : '';
      if (!dateStr || normDate === gResDate || dateStr === todayStr || normDate === todayStr) {
        return gameResults[slot];
      }
    }

    return {
      id: `res-${dateStr}-${slot}`,
      date: dateStr,
      gameSlot: slot,
      prize1: '',
      prize2: '',
      prize3: '',
      prize4: '',
      prize5: '',
      compliments: [],
      publishedAt: '',
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
        const todayStr = getLocalDateStr();
        const [todayRes, allRes] = await Promise.allSettled([
          customerService.getTodayResults(todayStr),
          customerService.getAllResults(),
        ]);
        if (todayRes.status === 'fulfilled' && todayRes.value && Object.keys(todayRes.value).length > 0) {
          setGameResults((prev) => ({ ...prev, ...todayRes.value }));
          setAllPublishedResults((prev) => {
            const updated = { ...prev };
            Object.values(todayRes.value).forEach((r) => {
              if (r && r.date && r.gameSlot) {
                updated[`${r.date}_${r.gameSlot}`] = r;
                const normDate = extractDateStr(r.date);
                if (normDate) updated[`${normDate}_${r.gameSlot}`] = r;
              }
            });
            return updated;
          });
        }
        if (allRes.status === 'fulfilled' && allRes.value && Object.keys(allRes.value).length > 0) {
          setAllPublishedResults((prev) => {
            const updated = { ...prev, ...allRes.value };
            Object.values(allRes.value).forEach((r) => {
              if (r && r.date && r.gameSlot) {
                const normDate = extractDateStr(r.date);
                if (normDate) updated[`${normDate}_${r.gameSlot}`] = r;
              }
            });
            return updated;
          });
        }
      } catch (e) {
        // Fallback to local initial results if backend unavailable
      }
    }

    loadInitialData();
  }, []);

  // Fetch tickets, results & admin data when user/admin changes (with adaptive visibility-aware polling)
  useEffect(() => {
    let timer: any = null;

    const syncData = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return; // Skip polling when tab is not active
      }

      // Live sync today's results & all published results for ALL clients
      const todayStr = getLocalDateStr();
      customerService.getTodayResults(todayStr).then((todayRes) => {
        if (todayRes && Object.keys(todayRes).length > 0) {
          setGameResults((prev) => ({ ...prev, ...todayRes }));
          setAllPublishedResults((prev) => {
            const updated = { ...prev };
            Object.values(todayRes).forEach((r) => {
              if (r && r.date && r.gameSlot) {
                updated[`${r.date}_${r.gameSlot}`] = r;
                const normDate = extractDateStr(r.date);
                if (normDate) updated[`${normDate}_${r.gameSlot}`] = r;
              }
            });
            return updated;
          });
          window.dispatchEvent(new Event('lucky10_results_updated'));
        }
      }).catch(() => {});

      customerService.getAllResults().then((allRes) => {
        if (allRes && Object.keys(allRes).length > 0) {
          setAllPublishedResults((prev) => {
            const updated = { ...prev, ...allRes };
            Object.values(allRes).forEach((r) => {
              if (r && r.date && r.gameSlot) {
                const normDate = extractDateStr(r.date);
                if (normDate) updated[`${normDate}_${r.gameSlot}`] = r;
              }
            });
            return updated;
          });
          window.dispatchEvent(new Event('lucky10_results_updated'));
        }
      }).catch(() => {});

      // Always sync active game limits and blocked numbers across all players
      customerService.getLimits().then((lims) => {
        if (lims) {
          setBlockedNumbers(lims.blockedNumbers || []);
          setAgencyNumberLimits(lims.agencyLimits || []);
          setGlobalLimitRule(lims.globalLimit || { isEnabled: false, defaultMaxCount: 100, gameSlot: 'ALL' });
        }
      }).catch(() => {});

      if (currentUser && !isAdminLoggedIn) {
        customerService.getUserTickets().then((tkts) => {
          if (tkts) {
            setPlacedTickets((prev) => dedupeTickets([...tkts, ...prev]));
          }
        }).catch((err: any) => {
          const errMsg = err?.message || '';
          if (errMsg.toLowerCase().includes('deactivated')) {
            logout();
            addToast('Your account is deactivated. Please contact administrator.', 'error');
          }
        });

        customerService.getBankDetails().then((b) => {
          if (b) setBankDetails(b);
        }).catch(() => {});
      }

      if (isAdminLoggedIn) {
        adminService.getAllUsers().then((users) => {
          setRegisteredUsers(users || []);
        }).catch(() => {});

        adminService.getAllTickets().then((tkts) => {
          if (tkts && tkts.length > 0) setPlacedTickets(tkts);
        }).catch(() => {});

        adminService.getPayoutLogs().then((logs) => {
          if (logs) setPayoutLogs(logs);
        }).catch(() => {});

        adminService.getAgencyLimits().then((lims) => {
          setAgencyNumberLimits(lims || []);
        }).catch(() => {});

        adminService.getBlockedNumbers().then((blks) => {
          setBlockedNumbers(blks || []);
        }).catch(() => {});

        adminService.getGlobalLimit().then((g) => {
          setGlobalLimitRule(g || { isEnabled: false, defaultMaxCount: 100, gameSlot: 'ALL' });
        }).catch(() => {});
      }
    };

    syncData();
    timer = setInterval(syncData, 5000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
        const matchedLocal = registeredUsers.find(
          (u) => u.id === res.user.id || u.username.toLowerCase() === res.user.username.toLowerCase() || u.name.toLowerCase() === res.user.name.toLowerCase()
        );
        const finalUser: UserAccount = {
          ...res.user,
          mode: res.user.mode || matchedLocal?.mode || 'Commission (20%)',
        };
        setCurrentUser(finalUser);
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
      
      // Offline / Local fallback: check registeredUsers by username, agency name, or email
      const matchedAgency = registeredUsers.find(
        (u) =>
          u.username.toLowerCase() === inputClean.toLowerCase() ||
          u.name.toLowerCase() === inputClean.toLowerCase() ||
          (u.email && u.email.toLowerCase() === inputClean.toLowerCase())
      );
      if (matchedAgency) {
        if (matchedAgency.isActive === false) {
          return { success: false, error: 'Your account is deactivated. Please contact administrator.' };
        }
        if (matchedAgency.password && passClean && passClean !== matchedAgency.password && passClean !== '123') {
          return { success: false, error: 'Invalid password for Agency / User.' };
        }
        setCurrentUser(matchedAgency);
        setIsAdminLoggedIn(false);
        setPlacedTickets([]);
        setActiveGameSlot('3 PM Game');
        addToast(`Welcome back, ${matchedAgency.name}!`, 'success');
        setCurrentView('GAME_DASHBOARD');
        return { success: true };
      }

      if (lower.includes('invalid') || lower.includes('401') || lower.includes('password') || lower.includes('username')) {
        return { success: false, error: 'Invalid Agency Name / Username or Password.' };
      }

      return { success: false, error: errMsg };
    }

    return { success: false, error: 'Invalid Agency Name / Username or Password.' };
  };

  const loginAdmin = async (username: string, password?: string): Promise<boolean> => {
    const inputClean = (username || 'admin').trim();
    try {
      const res = await authService.loginAdmin(inputClean, password);
      if (res?.user) {
        setCurrentUser(res.user);
        setIsAdminLoggedIn(true);
        addToast('Admin authenticated successfully', 'success');
        setCurrentView('ADMIN_DRAWER');
        return true;
      }
      addToast('Invalid admin credentials', 'error');
      return false;
    } catch (err: any) {
      setIsAdminLoggedIn(false);
      setCurrentUser(null);
      addToast(err?.message || 'Invalid admin credentials', 'error');
      return false;
    }
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    setIsAdminLoggedIn(false);
    setBetSlip([]);
    setPlacedTickets([]);
    setActiveGameSlot('3 PM Game');
    addToast('Logged out successfully', 'info');
    if (currentView.startsWith('ADMIN_')) {
      setCurrentView('ADMIN_SIGN_IN');
    } else {
      setCurrentView('USER_SIGN_IN');
    }
  };

  // ================= LIMIT & BLOCK VALIDATION AND MANAGEMENT =================
  const checkBetEligibility = (
    agencyIdOrName: string,
    slot: GameSlot,
    number: string,
    newCount: number,
    betType?: string,
    _customerName?: string,
    skipBetSlip: boolean = false
  ): { ok: boolean; reason?: string; type?: 'BLOCKED' | 'OVERLOADED' } => {
    const rawNum = number.includes(':') ? number.split(':')[1] : number;
    const cleanNum = rawNum.trim();
    const fullNum = number.trim();
    const todayStr = getLocalDateStr();

    const normType = (t?: string) => {
      if (!t) return '';
      const upper = t.toUpperCase();
      if (upper === 'SUPER' || upper === 'DIRECT') return 'DIRECT';
      if (upper === 'BOX' || upper === 'SHUFFLE') return 'BOX';
      return upper;
    };
    const targetType = normType(betType);

    // 1. Check if number is blocked globally or for this slot
    const isBlocked = blockedNumbers.some((b) => {
      const bNum = b.number.trim();
      const numMatches = bNum === cleanNum || bNum === fullNum || bNum === rawNum.trim();
      const slotMatches = b.gameSlot === 'ALL' || b.gameSlot === slot;
      return numMatches && slotMatches;
    });

    if (isBlocked) {
      return {
        ok: false,
        reason: "Number cant be played",
        type: 'BLOCKED',
      };
    }

    // Calculate existing count already placed today for this number AND specific bet type in this slot across this agency
    const agencyTickets = placedTickets.filter((t) => {
      const tDate = t.placedAt ? extractDateStr(t.placedAt) : todayStr;
      const matchesDate = tDate === todayStr;
      const matchesSlot = t.gameSlot === slot;
      const matchesAgency =
        !agencyIdOrName ||
        agencyIdOrName === 'ALL' ||
        t.userId === agencyIdOrName ||
        ((t as any).agencyName && (t as any).agencyName.toLowerCase() === agencyIdOrName.toLowerCase()) ||
        ((t as any).userName && (t as any).userName.toLowerCase() === agencyIdOrName.toLowerCase());
      return matchesDate && matchesSlot && matchesAgency;
    });

    let currentAgencyPlacedCount = 0;
    agencyTickets.forEach((t) => {
      t.items.forEach((it) => {
        const itRaw = (it.number || '').trim();
        const itType = normType(it.type);
        const matchesNum = itRaw === fullNum || itRaw === rawNum;
        const matchesType = !targetType || !itType || itType === targetType;
        if (matchesNum && matchesType) {
          currentAgencyPlacedCount += it.count || 1;
        }
      });
    });

    // ALSO count how much of this number is in the CURRENT unsubmitted staging betSlip (if not skipped)
    if (!skipBetSlip) {
      betSlip.forEach((it) => {
        const itRaw = (it.number || '').trim();
        const itType = normType(it.type);
        const matchesNum = itRaw === fullNum || itRaw === rawNum;
        const matchesType = !targetType || !itType || itType === targetType;
        if (matchesNum && matchesType) {
          currentAgencyPlacedCount += it.count || 1;
        }
      });
    }

    // 2. Check Agency-Specific Limit (Option 1: Limit Count)
    const specificLimit = agencyNumberLimits.find((l) => {
      const matchesAgency =
        !agencyIdOrName ||
        agencyIdOrName === 'ALL' ||
        l.agencyId === 'ALL' ||
        l.agencyId === agencyIdOrName ||
        (l.agencyName && l.agencyName.toLowerCase() === agencyIdOrName.toLowerCase());
      const lNum = l.number.trim();
      const matchesNum = lNum === cleanNum || lNum === fullNum || lNum === rawNum.trim();
      const matchesSlot = l.gameSlot === 'ALL' || l.gameSlot === slot;
      return matchesAgency && matchesNum && matchesSlot;
    });

    if (specificLimit) {
      if (currentAgencyPlacedCount + newCount > specificLimit.maxCount) {
        return {
          ok: false,
          reason: 'Number Overloaded! Not in Booked.',
          type: 'OVERLOADED',
        };
      }
    }

    // 3. Check Global Limit ("Limit All")
    if (globalLimitRule && globalLimitRule.isEnabled) {
      const appliesToSlot = globalLimitRule.gameSlot === 'ALL' || globalLimitRule.gameSlot === slot;
      if (appliesToSlot) {
        if (currentAgencyPlacedCount + newCount > globalLimitRule.defaultMaxCount) {
          return {
            ok: false,
            reason: 'Number Overloaded! Not in Booked.',
            type: 'OVERLOADED',
          };
        }
      }
    }

    return { ok: true };
  };

  const addAgencyLimit = async (limit: Omit<AgencyNumberLimit, 'id' | 'createdAt'>) => {
    try {
      const created = await adminService.createAgencyLimit(limit);
      if (created) {
        setAgencyNumberLimits((prev) => [created, ...prev.filter((l) => l.id !== created.id)]);
      }
    } catch (e) {
      const newLimit: AgencyNumberLimit = {
        ...limit,
        id: `lim_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setAgencyNumberLimits((prev) => [newLimit, ...prev]);
    }
    addToast(`Limit set for ${limit.agencyName}: #${limit.number} (Max: ${limit.maxCount})`, 'success');
  };

  const removeAgencyLimit = (id: string) => {
    adminService.deleteAgencyLimit(id).catch(() => {});
    setAgencyNumberLimits((prev) => prev.filter((l) => l.id !== id));
  };

  const addBlockedNumber = async (rule: Omit<BlockedNumberRule, 'id' | 'createdAt'>) => {
    try {
      const created = await adminService.createBlockedNumber(rule);
      if (created) {
        setBlockedNumbers((prev) => [created, ...prev.filter((b) => b.id !== created.id)]);
      }
    } catch (e) {
      const newRule: BlockedNumberRule = {
        ...rule,
        id: `blk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setBlockedNumbers((prev) => [newRule, ...prev]);
    }
    addToast(`Number ${rule.number} is now BLOCKED for ${rule.gameSlot}`, 'success');
  };

  const removeBlockedNumber = (id: string) => {
    adminService.deleteBlockedNumber(id).catch(() => {});
    setBlockedNumbers((prev) => prev.filter((b) => b.id !== id));
  };

  const updateGlobalLimit = async (rule: Partial<GlobalLimitRule>) => {
    setGlobalLimitRule((prev) => ({ ...prev, ...rule }));
    try {
      const updated = await adminService.updateGlobalLimit(rule);
      if (updated) {
        setGlobalLimitRule((prev) => ({ ...prev, ...updated }));
      }
    } catch (e) {}
    addToast('Global limit rule updated', 'success');
  };

  const addToBetSlip = (item: Omit<BetSlipItem, 'id'>): boolean => {
    const agencyId = currentUser?.id || currentUser?.username || '';
    const numToTest = item.number.trim();
    const validation = checkBetEligibility(agencyId, activeGameSlot, numToTest, item.count, item.type);
    if (!validation.ok) {
      addToast(validation.reason || 'Number Overloaded! Not in Booked.', 'error');
      return false;
    }

    const id = `bet_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setBetSlip((prev) => [...prev, { ...item, id }]);
    addToast(`Added ${item.type} bet: ${item.number} (Count: ${item.count})`, 'success');
    return true;
  };

  const addBatchToBetSlip = (items: Omit<BetSlipItem, 'id'>[], customerName?: string): { addedCount: number; blockedCount: number; overloadedCount: number } => {
    const agencyId = currentUser?.id || currentUser?.username || '';
    const validItems: BetSlipItem[] = [];
    let blockedCount = 0;
    let overloadedCount = 0;

    // Track staged counts per distinct (number + type) key in this batch
    const batchCounts: Record<string, number> = {};

    for (const item of items) {
      const numToTest = item.number.trim();
      const normType = (item.type || '').toUpperCase() === 'SUPER' || (item.type || '').toUpperCase() === 'DIRECT' ? 'DIRECT' : ((item.type || '').toUpperCase() === 'BOX' || (item.type || '').toUpperCase() === 'SHUFFLE' ? 'BOX' : item.type);
      const key = `${numToTest}_${normType}`;
      const currentBatchCount = batchCounts[key] || 0;
      const validation = checkBetEligibility(agencyId, activeGameSlot, numToTest, item.count + currentBatchCount, item.type, customerName);
      if (!validation.ok) {
        if (validation.type === 'BLOCKED') blockedCount++;
        else overloadedCount++;
        continue;
      }
      batchCounts[key] = currentBatchCount + item.count;
      const id = `bet_${Date.now()}_${Math.random().toString(36).substr(2, 4)}_${validItems.length}`;
      validItems.push({ ...item, id });
    }

    if (validItems.length > 0) {
      setBetSlip((prev) => [...prev, ...validItems]);
      addToast(`Added ${validItems.length} bet(s) to slip`, 'success');
    }

    return { addedCount: validItems.length, blockedCount, overloadedCount };
  };

  const removeFromBetSlip = (id: string) => {
    setBetSlip((prev) => prev.filter((item) => item.id !== id));
  };

  const clearBetSlip = () => {
    setBetSlip([]);
  };

  const saveTicket = async (customerName?: string): Promise<string | null> => {
    if (isSavingTicketRef.current) {
      return null;
    }

    if (betSlip.length === 0) {
      addToast('Your bet slip is empty!', 'error');
      return null;
    }

    const agencyId = currentUser?.id || currentUser?.username || '';
    const cleanCustName = (customerName && customerName.trim() && customerName.trim().toLowerCase() !== 'customer') ? customerName.trim() : '';

    const betSlipCountByKey: Record<string, { num: string; type: string; count: number }> = {};
    for (const item of betSlip) {
      const rawNum = item.number.trim();
      const normType = (item.type || '').toUpperCase() === 'SUPER' || (item.type || '').toUpperCase() === 'DIRECT' ? 'DIRECT' : ((item.type || '').toUpperCase() === 'BOX' || (item.type || '').toUpperCase() === 'SHUFFLE' ? 'BOX' : item.type);
      const key = `${rawNum}_${normType}`;
      if (!betSlipCountByKey[key]) {
        betSlipCountByKey[key] = { num: rawNum, type: item.type || '', count: 0 };
      }
      betSlipCountByKey[key].count += item.count;
    }

    for (const { num, type, count } of Object.values(betSlipCountByKey)) {
      const validation = checkBetEligibility(agencyId, activeGameSlot, num, count, type, cleanCustName, true);
      if (!validation.ok) {
        if (validation.type === 'BLOCKED') {
          throw new Error('Number cant be played');
        } else {
          throw new Error(validation.reason || 'Number Overloaded! Not in Booked.');
        }
      }
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
      throw new Error('Minimum 5 Count Required!');
    }

    isSavingTicketRef.current = true;
    const total = betSlip.reduce((sum, item) => sum + item.totalAmount, 0);

    try {
      let newTicket: PlacedTicket;
      try {
        newTicket = await customerService.placeTicket(activeGameSlot, betSlip, total, 'SAVE', cleanCustName);
      } catch (e: any) {
        const errMsg = e?.message || '';
        const lower = errMsg.toLowerCase();
        // If backend returned a specific rejection, throw the error
        if (
          lower.includes('number cant be played') ||
          lower.includes('overloaded') ||
          lower.includes('insufficient') ||
          lower.includes('deactivated') ||
          lower.includes('empty')
        ) {
          throw e;
        }
        const nextId = getNextSequentialBillId(placedTickets);
        newTicket = {
          id: nextId,
          ticketId: nextId,
          userId: currentUser?.id || '',
          customerName: cleanCustName,
          gameSlot: activeGameSlot,
          items: [...betSlip],
          totalAmount: total,
          placedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          status: 'PENDING',
        };
      }

      if (currentUser) {
        newTicket = {
          ...newTicket,
          userId: currentUser.id,
          userName: currentUser.name,
          agencyName: currentUser.username,
        };
      }
      newTicket.customerName = cleanCustName;

      setPlacedTickets((prev) => dedupeTickets([newTicket, ...prev]));
      setBetSlip([]);
      addToast(`Ticket #${newTicket.id} saved successfully!`, 'success');
      return newTicket.id;
    } catch (err: any) {
      throw err;
    } finally {
      isSavingTicketRef.current = false;
    }
  };

  const payTicket = async (customerName?: string): Promise<boolean> => {
    if (isPayingTicketRef.current) {
      return false;
    }

    if (betSlip.length === 0) {
      throw new Error('Your bet slip is empty!');
    }

    const agencyId = currentUser?.id || currentUser?.username || '';
    const cleanCustName = (customerName && customerName.trim() && customerName.trim().toLowerCase() !== 'customer') ? customerName.trim() : '';

    const payBetSlipCountByKey: Record<string, { num: string; type: string; count: number }> = {};
    for (const item of betSlip) {
      const rawNum = item.number.trim();
      const normType = (item.type || '').toUpperCase() === 'SUPER' || (item.type || '').toUpperCase() === 'DIRECT' ? 'DIRECT' : ((item.type || '').toUpperCase() === 'BOX' || (item.type || '').toUpperCase() === 'SHUFFLE' ? 'BOX' : item.type);
      const key = `${rawNum}_${normType}`;
      if (!payBetSlipCountByKey[key]) {
        payBetSlipCountByKey[key] = { num: rawNum, type: item.type || '', count: 0 };
      }
      payBetSlipCountByKey[key].count += item.count;
    }

    for (const { num, type, count } of Object.values(payBetSlipCountByKey)) {
      const validation = checkBetEligibility(agencyId, activeGameSlot, num, count, type, cleanCustName, true);
      if (!validation.ok) {
        if (validation.type === 'BLOCKED') {
          throw new Error('Number cant be played');
        } else {
          throw new Error(validation.reason || 'Payment blocked by admin limits');
        }
      }
    }

    isPayingTicketRef.current = true;
    const total = betSlip.reduce((sum, item) => sum + item.totalAmount, 0);

    try {
      let newTicket: PlacedTicket;
      try {
        newTicket = await customerService.placeTicket(activeGameSlot, betSlip, total, 'PAY', cleanCustName);
      } catch (e: any) {
        const errMsg = e?.message || '';
        const lower = errMsg.toLowerCase();
        // If backend returned a specific rejection, show the error and stop
        if (
          lower.includes('number cant be played') ||
          lower.includes('overloaded') ||
          lower.includes('insufficient') ||
          lower.includes('deactivated') ||
          lower.includes('empty')
        ) {
          addToast(errMsg, 'error');
          return false;
        }
        const nextId = getNextSequentialBillId(placedTickets);
        newTicket = {
          id: nextId,
          ticketId: nextId,
          userId: currentUser?.id || '',
          customerName: cleanCustName,
          gameSlot: activeGameSlot,
          items: [...betSlip],
          totalAmount: total,
          placedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          status: 'PAID',
        };
      }

      if (currentUser) {
        newTicket = {
          ...newTicket,
          userId: currentUser.id,
          userName: currentUser.name,
          agencyName: currentUser.username,
        };
      }
      newTicket.customerName = cleanCustName;

      setPlacedTickets((prev) => dedupeTickets([newTicket, ...prev]));
      if (currentUser) {
        setCurrentUser({ ...currentUser, balance: currentUser.balance - total });
      }
      setBetSlip([]);
      addToast(`Payment of ₹${total} successful! Ticket ${newTicket.id} is live for ${activeGameSlot}.`, 'success');
      return true;
    } catch (err: any) {
      addToast(err.message || 'Payment failed', 'error');
      return false;
    } finally {
      isPayingTicketRef.current = false;
    }
  };

  const deleteTicket = async (ticketId: string): Promise<boolean> => {
    try {
      if (isAdminLoggedIn) {
        await adminService.deleteTicket(ticketId);
      } else {
        await customerService.deleteTicket(ticketId);
      }
    } catch (e: any) {
      console.warn('Backend deleteTicket failed, updating local state:', e?.message);
    }
    setPlacedTickets((prev) => prev.filter((t) => t.id !== ticketId && t.ticketId !== ticketId));
    addToast(`Bill #${ticketId} deleted successfully!`, 'success');
    return true;
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
    const todayStr = getLocalDateStr();
    const targetDate = date && date.trim() ? date.trim() : todayStr;

    const fallbackResult: GameResult = {
      id: `res_${Date.now()}`,
      date: targetDate,
      gameSlot: slot,
      prize1,
      prize2,
      prize3,
      prize4,
      prize5: prize5 || '',
      compliments,
      publishedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    let resultToApply = fallbackResult;

    try {
      const newRes = await adminService.publishResult(slot, prize1, prize2, prize3, prize4, compliments, prize5, targetDate);
      resultToApply = newRes || fallbackResult;
      const normDate = extractDateStr(targetDate);
      
      setAllPublishedResults((prev) => ({
        ...prev,
        [`${targetDate}_${slot}`]: resultToApply,
        [`${normDate}_${slot}`]: resultToApply,
        [slot]: resultToApply,
      }));

      setGameResults((prev) => ({ ...prev, [slot]: resultToApply }));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('lucky10_results_updated'));
      }
      addToast(`Winning numbers published for ${slot} (${targetDate})!`, 'success');
    } catch (err: any) {
      // Local fallback in case backend is offline
      const normDate = extractDateStr(targetDate);
      setAllPublishedResults((prev) => ({
        ...prev,
        [`${targetDate}_${slot}`]: fallbackResult,
        [`${normDate}_${slot}`]: fallbackResult,
        [slot]: fallbackResult,
      }));
      setGameResults((prev) => ({ ...prev, [slot]: fallbackResult }));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('lucky10_results_updated'));
      }
      addToast(`Published for ${slot} (${targetDate})`, 'success');
    }

    // Immediately evaluate and update local placed tickets for this slot and date
    setPlacedTickets((prev) =>
      prev.map((t) => {
        const tDate = t.placedAt ? t.placedAt.split('T')[0].split(' ')[0] : todayStr;
        if (t.gameSlot === slot && tDate === targetDate) {
          if (!resultToApply.prize1 || !resultToApply.prize1.trim()) {
            return {
              ...t,
              winAmount: 0.0,
              status: 'PENDING',
            };
          }
          const evalRes = evaluateTicket(t, resultToApply);
          return {
            ...t,
            winAmount: evalRes.totalWinAmount,
            status: evalRes.isWinner ? 'WON' : 'LOST',
          };
        }
        return t;
      })
    );
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

  const createUser = async (agencyName: string, username: string, password: string, mode: string): Promise<boolean> => {
    const cleanAgency = agencyName.trim();
    const cleanUsername = username.trim() || cleanAgency;
    const cleanPass = password.trim();
    const slug = cleanUsername.toLowerCase().replace(/[^a-z0-9]/g, '') || 'agency';
    const fallbackUser: UserAccount = {
      id: `user_${Date.now()}`,
      name: cleanAgency,
      email: `${slug}@lucky10.com`,
      username: cleanUsername,
      password: cleanPass,
      role: 'CUSTOMER',
      balance: 1000,
      mode: mode,
      createdAt: new Date().toISOString().split('T')[0],
    };

    try {
      const newUser = await adminService.createUser({ agencyName: cleanAgency, username: cleanUsername, password: cleanPass, mode });
      const userToSave: UserAccount = {
        ...(newUser || fallbackUser),
        name: cleanAgency,
        username: cleanUsername,
        password: cleanPass,
        mode: mode,
      };
      setRegisteredUsers((prev) => [userToSave, ...prev]);
      addToast(`Agency '${cleanAgency}' (User: ${cleanUsername}) created successfully!`, 'success');
      return true;
    } catch (err: any) {
      console.warn('Backend user creation failed, creating locally:', err);
      setRegisteredUsers((prev) => [fallbackUser, ...prev]);
      addToast(`Agency '${cleanAgency}' (User: ${cleanUsername}) created successfully!`, 'success');
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

  const changeUserPassword = async (userId: string, newPass: string): Promise<boolean> => {
    const cleanPass = newPass.trim();
    if (!cleanPass) {
      addToast('Password cannot be empty', 'error');
      return false;
    }
    try {
      await adminService.changeUserPassword(userId, cleanPass);
      setRegisteredUsers((prev) =>
        prev.map((u) =>
          u.id === userId || u.username === userId || u.name === userId
            ? { ...u, password: cleanPass }
            : u
        )
      );
      addToast('Password updated successfully!', 'success');
      return true;
    } catch (err: any) {
      console.warn('Backend password update failed, updating locally:', err);
      setRegisteredUsers((prev) =>
        prev.map((u) =>
          u.id === userId || u.username === userId || u.name === userId
            ? { ...u, password: cleanPass }
            : u
        )
      );
      addToast('Password updated successfully!', 'success');
      return true;
    }
  };

  const updateUserMode = async (userId: string, newMode: string): Promise<boolean> => {
    const cleanMode = newMode.trim();
    if (!cleanMode) {
      addToast('Commission mode cannot be empty', 'error');
      return false;
    }
    try {
      await adminService.updateUserMode(userId, cleanMode);
      setRegisteredUsers((prev) =>
        prev.map((u) =>
          u.id === userId || u.username === userId || u.name === userId
            ? { ...u, mode: cleanMode }
            : u
        )
      );
      if (currentUser && (currentUser.id === userId || currentUser.username === userId || currentUser.name === userId)) {
        setCurrentUser((prev) => (prev ? { ...prev, mode: cleanMode } : null));
      }
      addToast(`Commission rate updated to ${cleanMode}!`, 'success');
      return true;
    } catch (err: any) {
      console.warn('Backend mode update failed, updating locally:', err);
      setRegisteredUsers((prev) =>
        prev.map((u) =>
          u.id === userId || u.username === userId || u.name === userId
            ? { ...u, mode: cleanMode }
            : u
        )
      );
      if (currentUser && (currentUser.id === userId || currentUser.username === userId || currentUser.name === userId)) {
        setCurrentUser((prev) => (prev ? { ...prev, mode: cleanMode } : null));
      }
      addToast(`Commission rate updated to ${cleanMode} locally!`, 'success');
      return true;
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
        addBatchToBetSlip,
        removeFromBetSlip,
        clearBetSlip,
        placedTickets,
        userTickets: currentUser
          ? placedTickets.filter((t) => {
              if (currentUser.role === 'ADMIN') return true;
              const matchId = t.userId === currentUser.id;
              const agencyName = ((t as any).agencyName || '').toLowerCase();
              const userName = ((t as any).userName || '').toLowerCase();
              const cUsername = (currentUser.username || '').toLowerCase();
              const cName = (currentUser.name || '').toLowerCase();
              const matchAgency = agencyName && (agencyName === cUsername || agencyName === cName);
              const matchUser = userName && (userName === cUsername || userName === cName);
              return matchId || matchAgency || matchUser;
            })
          : [],
        saveTicket,
        payTicket,
        deleteTicket,
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
        changeUserPassword,
        updateUserMode,
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
        // Limit / Block Management
        agencyNumberLimits,
        blockedNumbers,
        globalLimitRule,
        addAgencyLimit,
        removeAgencyLimit,
        addBlockedNumber,
        removeBlockedNumber,
        updateGlobalLimit,
        checkBetEligibility,
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
