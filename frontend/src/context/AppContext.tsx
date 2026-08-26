import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type {
  ViewType,
  GameSlot,
  UserAccount,
  BetSlipItem,
  PlacedTicket,
  GameResult,
  ToastMessage,
  AgencyNumberLimit,
  BlockedNumberRule,
  GlobalLimitRule,
} from '../types';
import { authService } from '../services/authService';
import { customerService } from '../services/customerService';
import { adminService } from '../services/adminService';
import { evaluateTicket } from '../utils/gameRulesEngine';
import { getLocalDateStr, extractDateStr, getDefaultBillingSlot, getBusinessDateIST } from '../utils/dateUtils';



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
  deleteTicket: (ticketId: string) => Promise<boolean>;
  gameResults: Record<GameSlot, GameResult>;
  allPublishedResults: Record<string, GameResult>;
  getResultForSlotAndDate: (slot: GameSlot, dateStr: string) => GameResult;
  refreshResults: (dateStr?: string) => Promise<void>;
  fetchDataForDate: (date: string) => Promise<void>;
  publishGameResult: (slot: GameSlot, prize1: string, prize2: string, prize3: string, prize4: string, compliments: string[][], prize5?: string, date?: string) => Promise<void>;
  registerUser: (name: string, email: string, password?: string) => Promise<boolean>;
  createUser: (agencyName: string, username: string, password: string, mode: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<void>;
  changeUserPassword: (userId: string, newPassword: string) => Promise<boolean>;
  updateUserMode: (userId: string, mode: string) => Promise<boolean>;
  clearAllUsers: () => Promise<void>;
  toggleUserStatus: (userId: string, targetActive?: boolean) => Promise<void>;
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
  refreshAllData: () => Promise<void>;
}



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
  const [activeGameSlot, setActiveGameSlot] = useState<GameSlot>(getDefaultBillingSlot());
  const [betSlip, setBetSlip] = useState<BetSlipItem[]>([]);
  const [placedTickets, setPlacedTickets] = useState<PlacedTicket[]>([]);
  const [gameResults, setGameResults] = useState<Record<GameSlot, GameResult>>({} as any);
  const [allPublishedResults, setAllPublishedResults] = useState<Record<string, GameResult>>({});
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

  // Midnight Business Date Reset: resets to default slot when crossing midnight
  const lastBusinessDateRef = useRef<string>(getBusinessDateIST());

  useEffect(() => {
    const syncMidnightDate = () => {
      const currentBusinessDate = getBusinessDateIST();
      const dateChanged = currentBusinessDate !== lastBusinessDateRef.current;

      if (dateChanged) {
        lastBusinessDateRef.current = currentBusinessDate;
        const defaultSlot = getDefaultBillingSlot();
        setActiveGameSlot(defaultSlot);
        setBetSlip([]);
      }
    };

    const timer = setInterval(syncMidnightDate, 5000);
    return () => clearInterval(timer);
  }, []);

  const getResultForSlotAndDate = useCallback((slot: GameSlot, dateStr: string): GameResult => {
    const rawKey = `${dateStr}_${slot}`;
    if (allPublishedResults[rawKey] && allPublishedResults[rawKey].gameSlot === slot) {
      const resDate = extractDateStr(allPublishedResults[rawKey].date);
      const targetDate = extractDateStr(dateStr);
      if (resDate === targetDate) {
        return allPublishedResults[rawKey];
      }
    }
    const normDate = dateStr ? extractDateStr(dateStr) : getLocalDateStr();
    const normKey = `${normDate}_${slot}`;
    if (allPublishedResults[normKey] && allPublishedResults[normKey].gameSlot === slot) {
      const resDate = extractDateStr(allPublishedResults[normKey].date);
      if (resDate === normDate) {
        return allPublishedResults[normKey];
      }
    }

    const todayStr = getLocalDateStr();
    if (gameResults[slot] && gameResults[slot].gameSlot === slot) {
      const gResDate = gameResults[slot].date ? extractDateStr(gameResults[slot].date) : '';
      if (normDate === todayStr && gResDate === todayStr) {
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
  }, [allPublishedResults, gameResults]);

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
            const isAdm = user.role === 'ADMIN';
            setIsAdminLoggedIn(isAdm);
            if (isAdm) {
              setCurrentViewInternal('ADMIN_REPORTS');
              if (!window.location.pathname.toLowerCase().startsWith('/admin')) {
                window.history.pushState({}, '', '/admin');
              }
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

    const loadInitialData = async () => {
      try {
        const todayStr = getLocalDateStr();
        const todayRes = await customerService.getTodayResults(todayStr);
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
      } catch {}

      try {
        const allRes = await customerService.getAllResults();
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
      } catch {}

      try {
        const lims = await customerService.getLimits();
        if (lims) {
          setBlockedNumbers(lims.blockedNumbers || []);
          setAgencyNumberLimits(lims.agencyLimits || []);
          setGlobalLimitRule(lims.globalLimit || { isEnabled: false, defaultMaxCount: 100, gameSlot: 'ALL' });
        }
      } catch {}

      if (currentUser && !isAdminLoggedIn) {
        try {
          const tkts = await customerService.getUserTickets();
          if (tkts) {
            setPlacedTickets((prev) => dedupeTickets([...tkts, ...prev]));
          }
        } catch (err: any) {
          const errMsg = err?.message || '';
          if (errMsg.toLowerCase().includes('deactivated')) {
            logout();
            addToast('Your account is deactivated. Please contact administrator.', 'error');
          }
        }
      }

      if (isAdminLoggedIn) {
        try {
          const [users, tkts, lims, blks, g] = await Promise.all([
            adminService.getAllUsers().catch(() => []),
            adminService.getAllTickets().catch(() => []),
            adminService.getAgencyLimits().catch(() => []),
            adminService.getBlockedNumbers().catch(() => []),
            adminService.getGlobalLimit().catch(() => null),
          ]);
          if (users) setRegisteredUsers(users);
          if (tkts) setPlacedTickets((prev) => dedupeTickets([...tkts, ...prev]));
          if (lims) setAgencyNumberLimits(lims);
          if (blks) setBlockedNumbers(blks);
          if (g) setGlobalLimitRule(g);
        } catch {}
      }
    };

    // Complete real-time periodic poll (3 seconds) for live tickets, users, results & limits
    const pollLiveUpdates = async () => {
      if (document.visibilityState !== 'visible') return;

      try {
        const todayStr = getLocalDateStr();
        const todayRes = await customerService.getTodayResults(todayStr).catch(() => ({}));
        if (todayRes && Object.keys(todayRes).length > 0) {
          const isResultDifferent = (a?: any, b?: any): boolean => {
            if (!a || !b) return true;
            if ((a.prize1 || '') !== (b.prize1 || '')) return true;
            if ((a.prize2 || '') !== (b.prize2 || '')) return true;
            if ((a.prize3 || '') !== (b.prize3 || '')) return true;
            if ((a.prize4 || '') !== (b.prize4 || '')) return true;
            if ((a.prize5 || '') !== (b.prize5 || '')) return true;
            if (a.publishedAt !== b.publishedAt) return true;
            if (JSON.stringify(a.compliments || []) !== JSON.stringify(b.compliments || [])) return true;
            return false;
          };

          let hasResultChange = false;
          setGameResults((prev) => {
            let changed = false;
            for (const k in todayRes) {
              if (isResultDifferent(prev[k], todayRes[k])) {
                changed = true;
                break;
              }
            }
            if (changed) hasResultChange = true;
            return changed ? { ...prev, ...todayRes } : prev;
          });
          setAllPublishedResults((prev) => {
            let changed = false;
            const updated: Record<string, GameResult> = { ...prev };
            Object.values(todayRes).forEach((r: any) => {
              if (r && r.date && r.gameSlot) {
                const normDate = extractDateStr(r.date);
                if (normDate) {
                  const key = `${normDate}_${r.gameSlot}`;
                  if (isResultDifferent(prev[key], r)) {
                    updated[key] = r;
                    changed = true;
                  }
                }
              }
            });
            if (changed) hasResultChange = true;
            return changed ? updated : prev;
          });
          if (hasResultChange) {
            window.dispatchEvent(new Event('lucky10_results_updated'));
          }
        }
      } catch {}

      try {
        const lims = await customerService.getLimits().catch(() => null);
        if (lims) {
          const newBlks = lims.blockedNumbers || [];
          setBlockedNumbers((prev) => (JSON.stringify(prev) === JSON.stringify(newBlks) ? prev : newBlks));
          const newAgencyLimits = lims.agencyLimits || [];
          setAgencyNumberLimits((prev) => (JSON.stringify(prev) === JSON.stringify(newAgencyLimits) ? prev : newAgencyLimits));
          const newGlobal = lims.globalLimit || { isEnabled: false, defaultMaxCount: 100, gameSlot: 'ALL' };
          setGlobalLimitRule((prev) => (JSON.stringify(prev) === JSON.stringify(newGlobal) ? prev : newGlobal));
        }
      } catch {}

      if (isAdminLoggedIn) {
        try {
          const [users, tkts] = await Promise.all([
            adminService.getAllUsers().catch(() => null),
            adminService.getAllTickets().catch(() => null),
          ]);
          if (users) setRegisteredUsers((prev) => (JSON.stringify(prev) === JSON.stringify(users) ? prev : users));
          if (tkts) {
            setPlacedTickets((prev) => {
              const deduped = dedupeTickets([...tkts, ...prev]);
              if (deduped.length === prev.length) {
                let diff = false;
                for (let i = 0; i < deduped.length; i++) {
                  if (deduped[i].id !== prev[i].id || deduped[i].status !== prev[i].status) {
                    diff = true;
                    break;
                  }
                }
                if (!diff) return prev;
              }
              return deduped;
            });
          }
        } catch {}
      } else if (currentUser) {
        try {
          // Authoritatively verify currentUser status from backend database
          const freshProfile = await authService.getCurrentUser().catch(() => null);
          if (freshProfile) {
            if (freshProfile.isActive === false) {
              logout();
              addToast('Your account is deactivated. Please contact administrator.', 'error');
              return;
            }
            setCurrentUser((prev) => {
              if (!prev) return freshProfile;
              if (
                prev.id === freshProfile.id &&
                prev.name === freshProfile.name &&
                prev.username === freshProfile.username &&
                prev.mode === freshProfile.mode &&
                prev.role === freshProfile.role &&
                prev.isActive === freshProfile.isActive &&
                prev.agencyName === freshProfile.agencyName
              ) {
                return prev;
              }
              return freshProfile;
            });
          }
          const tkts = await customerService.getUserTickets().catch(() => null);
          if (tkts) {
            setPlacedTickets((prev) => {
              const deduped = dedupeTickets([...tkts, ...prev]);
              if (deduped.length === prev.length) {
                let diff = false;
                for (let i = 0; i < deduped.length; i++) {
                  if (deduped[i].id !== prev[i].id || deduped[i].status !== prev[i].status) {
                    diff = true;
                    break;
                  }
                }
                if (!diff) return prev;
              }
              return deduped;
            });
          }
        } catch (err: any) {
          const errMsg = err?.message || '';
          if (errMsg.toLowerCase().includes('deactivated')) {
            logout();
            addToast('Your account is deactivated. Please contact administrator.', 'error');
          }
        }
      }
    };

    loadInitialData();
    timer = setInterval(pollLiveUpdates, 2000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pollLiveUpdates();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser?.id, isAdminLoggedIn]);

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
    let targetView = view;
    // Guard: ADMIN users must never be routed to customer betting counter
    if ((isAdminLoggedIn || currentUser?.role === 'ADMIN') && (targetView === 'GAME_DASHBOARD' || targetView === 'EDIT_DELETE_BILL')) {
      targetView = 'ADMIN_REPORTS';
    }

    setViewHistory((prev) => [...prev, targetView]);
    setCurrentViewInternal(targetView);

    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch (e) {
      window.scrollTo(0, 0);
    }

    if (targetView.startsWith('ADMIN_')) {
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
      if ((isAdminLoggedIn || currentUser?.role === 'ADMIN') && (prevView === 'GAME_DASHBOARD' || prevView === 'EDIT_DELETE_BILL')) {
        setCurrentViewInternal('ADMIN_REPORTS');
      } else {
        setCurrentViewInternal(prevView);
      }
    } else {
      if (isAdminLoggedIn || currentUser?.role === 'ADMIN') {
        setCurrentViewInternal('ADMIN_REPORTS');
      } else {
        setCurrentViewInternal('GAME_DASHBOARD');
      }
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

        if (res.user.role === 'ADMIN') {
          setCurrentUser(res.user);
          setIsAdminLoggedIn(true);
          addToast('Admin authenticated successfully', 'success');
          setCurrentView('ADMIN_REPORTS');
          return { success: true };
        }

        const finalUser: UserAccount = {
          ...res.user,
          mode: res.user.mode || 'Commission (20%)',
        };
        setCurrentUser(finalUser);
        setIsAdminLoggedIn(false);
        setPlacedTickets([]);
        setActiveGameSlot(getDefaultBillingSlot());
        addToast(`Welcome back, ${res.user.name}!`, 'success');
        setCurrentView('GAME_DASHBOARD');
        return { success: true };
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Login failed';
      const lower = errMsg.toLowerCase();
      if (lower.includes('deactivated') || lower.includes('disabled') || lower.includes('inactive')) {
        authService.logout();
        return { success: false, error: 'Your account is deactivated. Please contact administrator.' };
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
    setRegisteredUsers([]);
    setBetSlip([]);
    setPlacedTickets([]);
    setAgencyNumberLimits([]);
    setBlockedNumbers([]);
    setActiveGameSlot(getDefaultBillingSlot());
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
        reason: "Number Overloaded! Not in Booked.",
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
      const lims = await customerService.getLimits().catch(() => null);
      if (lims && lims.agencyLimits) {
        setAgencyNumberLimits(lims.agencyLimits);
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

  const removeAgencyLimit = async (id: string) => {
    setAgencyNumberLimits((prev) => prev.filter((l) => l.id !== id));
    try {
      await adminService.deleteAgencyLimit(id);
    } catch (e) {}
    try {
      const lims = await customerService.getLimits().catch(() => null);
      if (lims && lims.agencyLimits) {
        setAgencyNumberLimits(lims.agencyLimits);
      }
    } catch (e) {}
    addToast('Agency limit removed successfully', 'success');
  };

  const addBlockedNumber = async (rule: Omit<BlockedNumberRule, 'id' | 'createdAt'>) => {
    try {
      const created = await adminService.createBlockedNumber(rule);
      if (created) {
        setBlockedNumbers((prev) => [created, ...prev.filter((b) => b.id !== created.id)]);
      }
      const lims = await customerService.getLimits().catch(() => null);
      if (lims && lims.blockedNumbers) {
        setBlockedNumbers(lims.blockedNumbers);
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

  const removeBlockedNumber = async (id: string) => {
    setBlockedNumbers((prev) => prev.filter((b) => b.id !== id));
    try {
      await adminService.deleteBlockedNumber(id);
    } catch (e) {}
    try {
      const lims = await customerService.getLimits().catch(() => null);
      if (lims && lims.blockedNumbers) {
        setBlockedNumbers(lims.blockedNumbers);
      }
    } catch (e) {}
    addToast('Number unblocked successfully', 'success');
  };

  const updateGlobalLimit = async (rule: Partial<GlobalLimitRule>) => {
    setGlobalLimitRule((prev) => ({ ...prev, ...rule }));
    try {
      const updated = await adminService.updateGlobalLimit(rule);
      if (updated) {
        setGlobalLimitRule((prev) => ({ ...prev, ...updated }));
      }
      const lims = await customerService.getLimits().catch(() => null);
      if (lims && lims.globalLimit) {
        setGlobalLimitRule(lims.globalLimit);
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
        throw new Error(validation.reason || 'Number Overloaded! Not in Booked.');
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
      const newTicket = await customerService.placeTicket(activeGameSlot, betSlip, total, 'SAVE', cleanCustName);

      if (currentUser) {
        newTicket.userId = currentUser.id;
        newTicket.userName = currentUser.name || currentUser.agencyName || currentUser.username;
        newTicket.agencyName = currentUser.name || currentUser.agencyName || currentUser.username;
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



  const deleteTicket = async (ticketId: string): Promise<boolean> => {
    try {
      if (isAdminLoggedIn) {
        await adminService.deleteTicket(ticketId);
      } else {
        await customerService.deleteTicket(ticketId);
      }
      setPlacedTickets((prev) => prev.filter((t) => t.id !== ticketId && t.ticketId !== ticketId));
      addToast(`Bill #${ticketId} deleted successfully!`, 'success');
      return true;
    } catch (e: any) {
      addToast(e?.message || 'Failed to delete bill', 'error');
      return false;
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
        const tDate = extractDateStr(t.placedAt || (t as any).createdAt);
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

    // Also pull latest calculated records directly from server
    if (isAdminLoggedIn) {
      adminService.getAllTickets().then((tkts) => {
        if (tkts) {
          setPlacedTickets((prev) => dedupeTickets([...tkts, ...prev]));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('lucky10_tickets_updated'));
          }
        }
      }).catch(() => {});
    } else if (currentUser) {
      customerService.getUserTickets().then((tkts) => {
        if (tkts) {
          setPlacedTickets((prev) => dedupeTickets([...tkts, ...prev]));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('lucky10_tickets_updated'));
          }
        }
      }).catch(() => {});
    }
  };

  const createUser = async (agencyName: string, username: string, password: string, mode: string): Promise<boolean> => {
    const cleanAgency = agencyName.trim();
    const cleanUsername = username.trim() || cleanAgency;
    const cleanPass = password.trim();

    try {
      const newUser = await adminService.createUser({ agencyName: cleanAgency, username: cleanUsername, password: cleanPass, mode });
      if (newUser && newUser.id) {
        const userToSave: UserAccount = {
          id: newUser.id,
          name: newUser.name || cleanAgency,
          email: newUser.email || `${cleanUsername.toLowerCase().replace(/[^a-z0-9]/g, '') || 'agency'}@lucky10.com`,
          username: newUser.username || cleanUsername,
          password: cleanPass,
          mode: newUser.mode || mode,
          role: newUser.role || 'CUSTOMER',
          isActive: newUser.isActive !== false,
          createdAt: newUser.createdAt || new Date().toISOString().split('T')[0],
        };
        setRegisteredUsers((prev) => [userToSave, ...prev.filter((u) => u.id !== userToSave.id)]);
        addToast(`Agency '${cleanAgency}' (User: ${cleanUsername}) created successfully!`, 'success');
        
        // Immediately refresh users from database
        adminService.getAllUsers().then((fresh) => {
          if (fresh) setRegisteredUsers(fresh);
        }).catch(() => {});
        return true;
      }
      throw new Error('Failed to create agency user on server');
    } catch (err: any) {
      const msg = err?.message || 'Failed to create user on server';
      addToast(msg, 'error');
      throw err;
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

  const toggleUserStatus = async (userId: string, targetActive?: boolean) => {
    try {
      const explicitActive = targetActive !== undefined ? targetActive : undefined;
      const res = await adminService.toggleUserStatus(userId, explicitActive);
      const newActive = res.isActive !== undefined ? res.isActive : (targetActive !== undefined ? targetActive : true);
      setRegisteredUsers((prev) =>
        prev.map((u) =>
          u.id === userId || u.name === userId || u.username === userId
            ? { ...u, isActive: newActive }
            : u
        )
      );
      addToast(`User ${newActive ? 'activated' : 'deactivated'} successfully`, 'info');
      // Fetch fresh authoritative users list from backend to ensure 100% database sync
      const freshUsers = await adminService.getAllUsers();
      if (freshUsers) setRegisteredUsers(freshUsers);
    } catch (err: any) {
      addToast(err?.message || 'Failed to update user status', 'error');
      try {
        const freshUsers = await adminService.getAllUsers();
        if (freshUsers) setRegisteredUsers(freshUsers);
      } catch {}
    }
  };

  const toggleAllUsersStatus = async (isActive: boolean) => {
    try {
      await adminService.toggleAllUsersStatus(isActive);
      setRegisteredUsers((prev) => prev.map((u) => ({ ...u, isActive })));
      addToast(`All users ${isActive ? 'activated' : 'deactivated'} successfully!`, 'success');
      const freshUsers = await adminService.getAllUsers();
      if (freshUsers) setRegisteredUsers(freshUsers);
    } catch (err: any) {
      addToast(err?.message || 'Failed to update all users status', 'error');
      try {
        const freshUsers = await adminService.getAllUsers();
        if (freshUsers) setRegisteredUsers(freshUsers);
      } catch {}
    }
  };

  const refreshAllData = useCallback(async () => {
    try {
      const todayStr = getLocalDateStr();
      const [todayRes, allRes, lims] = await Promise.all([
        customerService.getTodayResults(todayStr).catch(() => ({})),
        customerService.getAllResults().catch(() => ({})),
        customerService.getLimits().catch(() => null),
      ]);

      if (todayRes && Object.keys(todayRes).length > 0) {
        setGameResults((prev) => ({ ...prev, ...todayRes }));
        setAllPublishedResults((prev) => {
          const updated: Record<string, GameResult> = { ...prev, ...todayRes };
          Object.values(todayRes).forEach((r: any) => {
            if (r && r.date && r.gameSlot) {
              const normDate = extractDateStr(r.date);
              if (normDate) updated[`${normDate}_${r.gameSlot}`] = r;
              updated[`${r.date}_${r.gameSlot}`] = r;
            }
          });
          return updated;
        });
      }

      if (allRes && Object.keys(allRes).length > 0) {
        setAllPublishedResults((prev) => {
          const updated: Record<string, GameResult> = { ...prev, ...allRes };
          Object.values(allRes).forEach((r: any) => {
            if (r && r.date && r.gameSlot) {
              const normDate = extractDateStr(r.date);
              if (normDate) updated[`${normDate}_${r.gameSlot}`] = r;
              updated[`${r.date}_${r.gameSlot}`] = r;
            }
          });
          return updated;
        });
      }

      if (lims) {
        if (lims.blockedNumbers) setBlockedNumbers(lims.blockedNumbers);
        if (lims.agencyLimits) setAgencyNumberLimits(lims.agencyLimits);
        if (lims.globalLimit) setGlobalLimitRule(lims.globalLimit);
      }

      if (isAdminLoggedIn) {
        const [users, tkts] = await Promise.all([
          adminService.getAllUsers().catch(() => null),
          adminService.getAllTickets().catch(() => null),
        ]);
        if (users) setRegisteredUsers(users);
        if (tkts) setPlacedTickets((prev) => dedupeTickets([...tkts, ...prev]));
      } else if (currentUser) {
        const tkts = await customerService.getUserTickets().catch(() => null);
        if (tkts) {
          setPlacedTickets((prev) => dedupeTickets([...tkts, ...prev]));
        }
      }
    } catch {}
  }, [currentUser, isAdminLoggedIn]);

  const refreshResults = useCallback(async (dateStr?: string) => {
    try {
      const targetDate = dateStr && dateStr.trim() ? dateStr.trim() : getBusinessDateIST();
      const [byDateRes, allRes] = await Promise.all([
        customerService.getResultsByDate(targetDate).catch(() => ({})),
        customerService.getAllResults().catch(() => ({})),
      ]);

      if (byDateRes && Object.keys(byDateRes).length > 0) {
        setGameResults((prev) => ({ ...prev, ...byDateRes }));
        setAllPublishedResults((prev) => {
          const updated: Record<string, GameResult> = { ...prev, ...byDateRes };
          Object.values(byDateRes).forEach((r: any) => {
            if (r && r.date && r.gameSlot) {
              const normDate = extractDateStr(r.date);
              if (normDate) updated[`${normDate}_${r.gameSlot}`] = r;
              updated[`${r.date}_${r.gameSlot}`] = r;
            }
          });
          return updated;
        });
      }

      if (allRes && Object.keys(allRes).length > 0) {
        setAllPublishedResults((prev) => {
          const updated: Record<string, GameResult> = { ...prev, ...allRes };
          Object.values(allRes).forEach((r: any) => {
            if (r && r.date && r.gameSlot) {
              const normDate = extractDateStr(r.date);
              if (normDate) updated[`${normDate}_${r.gameSlot}`] = r;
              updated[`${r.date}_${r.gameSlot}`] = r;
            }
          });
          return updated;
        });
      }
    } catch {}
  }, []);

  // ── fetchDataForDate ──────────────────────────────────────────────────────────
  // Fetches tickets and results for a SPECIFIC business date from the backend,
  // merging them into global state without replacing other-date records.
  // This is the authoritative fix for historical-date data isolation:
  //   - Results are stored by `${date}_${slot}` key (already correct)
  //   - Tickets are merged by ID deduplication so any date's records persist
  // Live realtime events (today's publication) do NOT fire fetchDataForDate,
  // so historical date data is never overwritten by today's events.
  const fetchDataForDate = useCallback(async (date: string) => {
    if (!date || !date.trim()) return;
    const targetDate = date.trim();
    try {
      // 1. Fetch results for this date and merge into allPublishedResults
      const dateResults = await customerService.getResultsByDate(targetDate).catch(() => ({}));
      if (dateResults && Object.keys(dateResults).length > 0) {
        setAllPublishedResults((prev) => {
          const updated: Record<string, GameResult> = { ...prev };
          Object.values(dateResults).forEach((r: any) => {
            if (r && r.date && r.gameSlot) {
              const normDate = extractDateStr(r.date);
              if (normDate) updated[`${normDate}_${r.gameSlot}`] = r;
              updated[`${r.date}_${r.gameSlot}`] = r;
            }
          });
          return updated;
        });
      }

      // 2. Fetch tickets for this date and MERGE into placedTickets (never replace)
      // Admin sees all agencies; customer sees only their own.
      const dateTickets = isAdminLoggedIn
        ? await adminService.getTicketsByDate(targetDate).catch(() => [] as PlacedTicket[])
        : currentUser
          ? await customerService.getTicketsByDate(targetDate).catch(() => [] as PlacedTicket[])
          : [];

      if (dateTickets && dateTickets.length > 0) {
        setPlacedTickets((prev) => {
          // Build a set of existing ticket IDs for fast lookup
          const existingIds = new Set(prev.map((t) => t.ticketId || t.id));
          // Only add tickets not already in state (dedup by ID)
          const newTickets = dateTickets.filter((t) => {
            const tid = (t as any).ticketId || t.id;
            return tid && !existingIds.has(tid);
          });
          if (newTickets.length === 0) return prev;
          return dedupeTickets([...prev, ...newTickets]);
        });
      }
    } catch {
      // non-fatal — historical fetch failure must not crash the UI
    }
  }, [currentUser, isAdminLoggedIn]);

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
          ? (currentUser.role === 'ADMIN'
              ? placedTickets
              : placedTickets.filter((t) => {
                  if (!t.userId) return true;
                  const tUid = (t.userId || '').toLowerCase();
                  const cId = (currentUser.id || '').toLowerCase();
                  const uUsername = (currentUser.username || '').toLowerCase();
                  const uName = (currentUser.name || '').toLowerCase();
                  const tAgency = ((t as any).agencyName || '').toLowerCase();
                  const tUser = ((t as any).userName || '').toLowerCase();
                  return (
                    tUid === cId ||
                    tUid === uUsername ||
                    tUid === uName ||
                    (tAgency && (tAgency === uUsername || tAgency === uName)) ||
                    (tUser && (tUser === uUsername || tUser === uName))
                  );
                }))
          : placedTickets,
        saveTicket,
        deleteTicket,
        gameResults,
        allPublishedResults,
        getResultForSlotAndDate,
        refreshResults,
        fetchDataForDate,
        publishGameResult,
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
        refreshAllData,
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
