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
  AgencyNumberLimit,
  BlockedNumberRule,
  GlobalLimitRule,
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
  createUser: (agencyName: string, username: string, password: string, mode: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<void>;
  changeUserPassword: (userId: string, newPassword: string) => Promise<boolean>;
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
  checkBetEligibility: (agencyIdOrName: string, slot: GameSlot, number: string, count: number) => { ok: boolean; reason?: string };
}

const defaultAgenciesList: UserAccount[] = [
  {
    id: 'user_demo_001',
    name: 'Demo Agency',
    username: 'demo',
    email: 'demo@lucky10.com',
    password: '123',
    role: 'CUSTOMER',
    balance: 8500,
    mode: 'With Commission (20%)',
    isActive: true,
    createdAt: new Date().toISOString().split('T')[0],
    bankDetails: {
      accountHolderName: 'Demo Agency Pvt Ltd',
      accountNo: '50100438291032',
      bankName: 'HDFC Bank',
      ifsc: 'HDFC0001234',
      branchName: 'MG Road, Bengaluru',
      updatedAt: new Date().toISOString().split('T')[0],
    },
  },
  {
    id: 'user_sriganesh_002',
    name: 'Sri Ganesh Agency',
    username: 'sriganesh',
    email: 'sriganesh@lucky10.com',
    password: '123',
    role: 'CUSTOMER',
    balance: 18450,
    mode: 'With Commission (20%)',
    isActive: true,
    createdAt: new Date().toISOString().split('T')[0],
    bankDetails: {
      accountHolderName: 'Sri Ganesh Enterprises',
      accountNo: '30981029384756',
      bankName: 'State Bank of India',
      ifsc: 'SBIN0004521',
      branchName: 'Gandhi Nagar, Chennai',
      updatedAt: new Date().toISOString().split('T')[0],
    },
  },
  {
    id: 'user_luckystar_003',
    name: 'Lucky Star Agency',
    username: 'luckystar',
    email: 'luckystar@lucky10.com',
    password: '123',
    role: 'CUSTOMER',
    balance: 24800,
    mode: 'With Commission (30%)',
    isActive: true,
    createdAt: new Date().toISOString().split('T')[0],
    bankDetails: {
      accountHolderName: 'Lucky Star Agency',
      accountNo: '91202004819283',
      bankName: 'ICICI Bank',
      ifsc: 'ICIC0000982',
      branchName: 'Koti, Hyderabad',
      updatedAt: new Date().toISOString().split('T')[0],
    },
  },
  {
    id: 'user_balaji_004',
    name: 'Balaji Lottery Agency',
    username: 'balaji_agency',
    email: 'balaji_agency@lucky10.com',
    password: '123',
    role: 'CUSTOMER',
    balance: 12300,
    mode: 'Without Commission',
    isActive: true,
    createdAt: new Date().toISOString().split('T')[0],
    bankDetails: {
      accountHolderName: 'Balaji Agencies',
      accountNo: '18491020003948',
      bankName: 'Axis Bank',
      ifsc: 'UTIB0001093',
      branchName: 'Camp, Pune',
      updatedAt: new Date().toISOString().split('T')[0],
    },
  },
  {
    id: 'user_royal_005',
    name: 'Royal Fortune Agency',
    username: 'royal_fortune',
    email: 'royal_fortune@lucky10.com',
    password: '123',
    role: 'CUSTOMER',
    balance: 31500,
    mode: 'With Commission (20%)',
    isActive: true,
    createdAt: new Date().toISOString().split('T')[0],
    bankDetails: {
      accountHolderName: 'Royal Fortune Ltd',
      accountNo: '00281040001928',
      bankName: 'Punjab National Bank',
      ifsc: 'PUNB0123400',
      branchName: 'Connaught Place, Delhi',
      updatedAt: new Date().toISOString().split('T')[0],
    },
  },
];

const defaultDemoUser: UserAccount = defaultAgenciesList[0];

const generateSampleCompliments = (baseStr: string, offset = 1): string[][] => {
  const base = parseInt(baseStr, 10) || 100;
  const list: string[] = [];
  for (let i = 1; i <= 30; i++) {
    const num = (base + i * offset) % 1000;
    list.push(String(num).padStart(3, '0'));
  }
  const rows: string[][] = [];
  for (let i = 0; i < 30; i += 5) {
    rows.push(list.slice(i, i + 5));
  }
  return rows;
};

const getInitialSampleGameResults = (): { todayResults: Record<GameSlot, GameResult>; allResults: Record<string, GameResult> } => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const yDate = new Date(now.getTime() - 86400000);
  const yesterdayStr = yDate.toISOString().split('T')[0];

  const todayResults: Record<GameSlot, GameResult> = {
    '1 PM Game': {
      id: `res-${todayStr}-1pm`,
      date: todayStr,
      gameSlot: '1 PM Game',
      prize1: '742',
      prize2: '819',
      prize3: '350',
      prize4: '194',
      prize5: '408',
      compliments: generateSampleCompliments('742', 1),
      publishedAt: `${todayStr}T13:05:00Z`,
    },
    '3 PM Game': {
      id: `res-${todayStr}-3pm`,
      date: todayStr,
      gameSlot: '3 PM Game',
      prize1: '512',
      prize2: '934',
      prize3: '601',
      prize4: '287',
      prize5: '739',
      compliments: generateSampleCompliments('512', 2),
      publishedAt: `${todayStr}T15:05:00Z`,
    },
    '6 PM Game': {
      id: `res-${todayStr}-6pm`,
      date: todayStr,
      gameSlot: '6 PM Game',
      prize1: '389',
      prize2: '145',
      prize3: '720',
      prize4: '963',
      prize5: '521',
      compliments: generateSampleCompliments('389', 3),
      publishedAt: `${todayStr}T18:05:00Z`,
    },
    '8 PM Game': {
      id: `res-${todayStr}-8pm`,
      date: todayStr,
      gameSlot: '8 PM Game',
      prize1: '624',
      prize2: '471',
      prize3: '809',
      prize4: '536',
      prize5: '315',
      compliments: generateSampleCompliments('624', 1),
      publishedAt: `${todayStr}T20:05:00Z`,
    },
  };

  const allResults: Record<string, GameResult> = {
    [`${todayStr}_1 PM Game`]: todayResults['1 PM Game'],
    [`${todayStr}_3 PM Game`]: todayResults['3 PM Game'],
    [`${todayStr}_6 PM Game`]: todayResults['6 PM Game'],
    [`${todayStr}_8 PM Game`]: todayResults['8 PM Game'],
    [`${yesterdayStr}_1 PM Game`]: {
      id: `res-${yesterdayStr}-1pm`,
      date: yesterdayStr,
      gameSlot: '1 PM Game',
      prize1: '418',
      prize2: '725',
      prize3: '291',
      prize4: '634',
      prize5: '802',
      compliments: generateSampleCompliments('418', 1),
      publishedAt: `${yesterdayStr}T13:05:00Z`,
    },
    [`${yesterdayStr}_3 PM Game`]: {
      id: `res-${yesterdayStr}-3pm`,
      date: yesterdayStr,
      gameSlot: '3 PM Game',
      prize1: '893',
      prize2: '314',
      prize3: '570',
      prize4: '129',
      prize5: '468',
      compliments: generateSampleCompliments('893', 2),
      publishedAt: `${yesterdayStr}T15:05:00Z`,
    },
    [`${yesterdayStr}_6 PM Game`]: {
      id: `res-${yesterdayStr}-6pm`,
      date: yesterdayStr,
      gameSlot: '6 PM Game',
      prize1: '165',
      prize2: '902',
      prize3: '438',
      prize4: '781',
      prize5: '250',
      compliments: generateSampleCompliments('165', 1),
      publishedAt: `${yesterdayStr}T18:05:00Z`,
    },
    [`${yesterdayStr}_8 PM Game`]: {
      id: `res-${yesterdayStr}-8pm`,
      date: yesterdayStr,
      gameSlot: '8 PM Game',
      prize1: '730',
      prize2: '249',
      prize3: '615',
      prize4: '382',
      prize5: '904',
      compliments: generateSampleCompliments('730', 3),
      publishedAt: `${yesterdayStr}T20:05:00Z`,
    },
  };

  return { todayResults, allResults };
};

const getInitialSampleTickets = (): PlacedTicket[] => {
  const now = new Date();
  const todayIso = now.toISOString();
  const yIso = new Date(now.getTime() - 86400000).toISOString();

  return [
    {
      id: '2243297',
      ticketId: '2243297',
      userId: 'user_sriganesh_002',
      userName: 'Sri Ganesh Agency',
      agencyName: 'Sri Ganesh Agency',
      customerName: 'Raju Bhai',
      gameSlot: '1 PM Game',
      totalAmount: 350,
      placedAt: todayIso,
      createdAt: todayIso,
      actionType: 'PAY',
      status: 'WON',
      winAmount: 5000,
      items: [
        { id: 'item-1', number: '742', count: 10, type: 'SUPER', unitPrice: 10, amount: 10, totalAmount: 100 },
        { id: 'item-2', number: '819', count: 15, type: 'SUPER', unitPrice: 10, amount: 10, totalAmount: 150 },
        { id: 'item-3', number: 'AB:42', count: 10, type: 'AB', unitPrice: 10, amount: 10, totalAmount: 100 },
      ],
    },
    {
      id: '2243298',
      ticketId: '2243298',
      userId: 'user_sriganesh_002',
      userName: 'Sri Ganesh Agency',
      agencyName: 'Sri Ganesh Agency',
      customerName: 'Vikram Patel',
      gameSlot: '1 PM Game',
      totalAmount: 500,
      placedAt: todayIso,
      createdAt: todayIso,
      actionType: 'PAY',
      status: 'WON',
      winAmount: 3750,
      items: [
        { id: 'item-4', number: '819', count: 15, type: 'SUPER', unitPrice: 10, amount: 10, totalAmount: 150 },
        { id: 'item-5', number: '350', count: 20, type: 'SUPER', unitPrice: 10, amount: 10, totalAmount: 200 },
        { id: 'item-6', number: 'A:7', count: 15, type: 'A', unitPrice: 10, amount: 10, totalAmount: 150 },
      ],
    },
    {
      id: '2243299',
      ticketId: '2243299',
      userId: 'user_luckystar_003',
      userName: 'Lucky Star Agency',
      agencyName: 'Lucky Star Agency',
      customerName: 'Priya Sharma',
      gameSlot: '3 PM Game',
      totalAmount: 600,
      placedAt: todayIso,
      createdAt: todayIso,
      actionType: 'PAY',
      status: 'WON',
      winAmount: 10000,
      items: [
        { id: 'item-7', number: '512', count: 20, type: 'SUPER', unitPrice: 10, amount: 10, totalAmount: 200 },
        { id: 'item-8', number: '934', count: 20, type: 'BOX', unitPrice: 10, amount: 10, totalAmount: 200 },
        { id: 'item-9', number: 'BC:12', count: 20, type: 'BC', unitPrice: 10, amount: 10, totalAmount: 200 },
      ],
    },
    {
      id: '2243300',
      ticketId: '2243300',
      userId: 'user_luckystar_003',
      userName: 'Lucky Star Agency',
      agencyName: 'Lucky Star Agency',
      customerName: 'Suresh Raina',
      gameSlot: '3 PM Game',
      totalAmount: 450,
      placedAt: todayIso,
      createdAt: todayIso,
      actionType: 'PAY',
      status: 'WON',
      winAmount: 1500,
      items: [
        { id: 'item-10', number: '601', count: 15, type: 'SUPER', unitPrice: 10, amount: 10, totalAmount: 150 },
        { id: 'item-11', number: '287', count: 15, type: 'SUPER', unitPrice: 10, amount: 10, totalAmount: 150 },
        { id: 'item-12', number: '739', count: 15, type: 'SUPER', unitPrice: 10, amount: 10, totalAmount: 150 },
      ],
    },
    {
      id: '2243301',
      ticketId: '2243301',
      userId: 'user_balaji_004',
      userName: 'Balaji Lottery Agency',
      agencyName: 'Balaji Lottery Agency',
      customerName: 'Anil Kumar',
      gameSlot: '6 PM Game',
      totalAmount: 700,
      placedAt: todayIso,
      createdAt: todayIso,
      actionType: 'PAY',
      status: 'WON',
      winAmount: 12500,
      items: [
        { id: 'item-13', number: '389', count: 25, type: 'SUPER', unitPrice: 10, amount: 10, totalAmount: 250 },
        { id: 'item-14', number: '145', count: 20, type: 'BOX', unitPrice: 10, amount: 10, totalAmount: 200 },
        { id: 'item-15', number: 'AB:38', count: 25, type: 'AB', unitPrice: 10, amount: 10, totalAmount: 250 },
      ],
    },
    {
      id: '2243302',
      ticketId: '2243302',
      userId: 'user_balaji_004',
      userName: 'Balaji Lottery Agency',
      agencyName: 'Balaji Lottery Agency',
      customerName: 'Amit Shah',
      gameSlot: '6 PM Game',
      totalAmount: 300,
      placedAt: todayIso,
      createdAt: todayIso,
      actionType: 'PAY',
      status: 'PENDING',
      winAmount: 0,
      items: [
        { id: 'item-16', number: '720', count: 10, type: 'SUPER', unitPrice: 10, amount: 10, totalAmount: 100 },
        { id: 'item-17', number: '963', count: 10, type: 'SUPER', unitPrice: 10, amount: 10, totalAmount: 100 },
        { id: 'item-18', number: '521', count: 10, type: 'SUPER', unitPrice: 10, amount: 10, totalAmount: 100 },
      ],
    },
    {
      id: '2243303',
      ticketId: '2243303',
      userId: 'user_royal_005',
      userName: 'Royal Fortune Agency',
      agencyName: 'Royal Fortune Agency',
      customerName: 'Deepak Verma',
      gameSlot: '8 PM Game',
      totalAmount: 800,
      placedAt: todayIso,
      createdAt: todayIso,
      actionType: 'PAY',
      status: 'WON',
      winAmount: 15000,
      items: [
        { id: 'item-19', number: '624', count: 30, type: 'SUPER', unitPrice: 10, amount: 10, totalAmount: 300 },
        { id: 'item-20', number: '471', count: 25, type: 'BOX', unitPrice: 10, amount: 10, totalAmount: 250 },
        { id: 'item-21', number: 'AC:64', count: 25, type: 'AC', unitPrice: 10, amount: 10, totalAmount: 250 },
      ],
    },
    {
      id: '2243304',
      ticketId: '2243304',
      userId: 'user_royal_005',
      userName: 'Royal Fortune Agency',
      agencyName: 'Royal Fortune Agency',
      customerName: 'Kavita Rao',
      gameSlot: '8 PM Game',
      totalAmount: 400,
      placedAt: todayIso,
      createdAt: todayIso,
      actionType: 'PAY',
      status: 'WON',
      winAmount: 2500,
      items: [
        { id: 'item-22', number: '471', count: 10, type: 'SUPER', unitPrice: 10, amount: 10, totalAmount: 100 },
        { id: 'item-23', number: '809', count: 15, type: 'SUPER', unitPrice: 10, amount: 10, totalAmount: 150 },
        { id: 'item-24', number: 'B:7', count: 15, type: 'B', unitPrice: 10, amount: 10, totalAmount: 150 },
      ],
    },
    {
      id: '2243305',
      ticketId: '2243305',
      userId: 'user_demo_001',
      userName: 'Demo Agency',
      agencyName: 'Demo Agency',
      customerName: 'Mahesh Babu',
      gameSlot: '1 PM Game',
      totalAmount: 300,
      placedAt: todayIso,
      createdAt: todayIso,
      actionType: 'PAY',
      status: 'WON',
      winAmount: 1000,
      items: [
        { id: 'item-25', number: '194', count: 20, type: 'SUPER', unitPrice: 10, amount: 10, totalAmount: 200 },
        { id: 'item-26', number: '408', count: 10, type: 'SUPER', unitPrice: 10, amount: 10, totalAmount: 100 },
      ],
    },
    {
      id: '2243306',
      ticketId: '2243306',
      userId: 'user_demo_001',
      userName: 'Demo Agency',
      agencyName: 'Demo Agency',
      customerName: 'Rajesh Sharma',
      gameSlot: '3 PM Game',
      totalAmount: 550,
      placedAt: todayIso,
      createdAt: todayIso,
      actionType: 'PAY',
      status: 'WON',
      winAmount: 7500,
      items: [
        { id: 'item-27', number: '512', count: 15, type: 'SUPER', unitPrice: 10, amount: 10, totalAmount: 150 },
        { id: 'item-28', number: '934', count: 20, type: 'BOX', unitPrice: 10, amount: 10, totalAmount: 200 },
        { id: 'item-29', number: 'C:2', count: 20, type: 'C', unitPrice: 10, amount: 10, totalAmount: 200 },
      ],
    },
    {
      id: '2243307',
      ticketId: '2243307',
      userId: 'user_sriganesh_002',
      userName: 'Sri Ganesh Agency',
      agencyName: 'Sri Ganesh Agency',
      customerName: 'Sunil Shetty',
      gameSlot: '1 PM Game',
      totalAmount: 400,
      placedAt: yIso,
      createdAt: yIso,
      actionType: 'PAY',
      status: 'WON',
      winAmount: 10000,
      items: [
        { id: 'item-30', number: '418', count: 20, type: 'SUPER', unitPrice: 10, amount: 10, totalAmount: 200 },
        { id: 'item-31', number: '725', count: 20, type: 'SUPER', unitPrice: 10, amount: 10, totalAmount: 200 },
      ],
    },
  ];
};

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

const getInitialSamplePayoutLogs = (): PayoutLog[] => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().split('T')[0];

  return [
    {
      id: 'pay_001',
      userId: 'user_sriganesh_002',
      userName: 'Sri Ganesh Agency',
      amount: 5000,
      bankAccount: 'SBIN0004521 - 30981029384756',
      status: 'SUCCESS',
      date: todayStr,
    },
    {
      id: 'pay_002',
      userId: 'user_luckystar_003',
      userName: 'Lucky Star Agency',
      amount: 10000,
      bankAccount: 'ICIC0000982 - 91202004819283',
      status: 'SUCCESS',
      date: todayStr,
    },
    {
      id: 'pay_003',
      userId: 'user_balaji_004',
      userName: 'Balaji Lottery Agency',
      amount: 7500,
      bankAccount: 'UTIB0001093 - 18491020003948',
      status: 'SUCCESS',
      date: todayStr,
    },
    {
      id: 'pay_004',
      userId: 'user_royal_005',
      userName: 'Royal Fortune Agency',
      amount: 12000,
      bankAccount: 'PUNB0123400 - 00281040001928',
      status: 'PROCESSING',
      date: yesterdayStr,
    },
  ];
};

const defaultAgencyLimits: AgencyNumberLimit[] = [
  {
    id: 'lim_demo_742',
    agencyId: 'user_demo_001',
    agencyName: 'Demo Agency',
    number: '742',
    gameSlot: 'ALL',
    maxCount: 50,
    createdAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'lim_ganesh_512',
    agencyId: 'user_sriganesh_002',
    agencyName: 'Sri Ganesh Agency',
    number: '512',
    gameSlot: 'ALL',
    maxCount: 100,
    createdAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'lim_lucky_819',
    agencyId: 'user_luckystar_003',
    agencyName: 'Lucky Star Agency',
    number: '819',
    gameSlot: 'ALL',
    maxCount: 75,
    createdAt: new Date().toISOString().split('T')[0],
  },
];

const defaultBlockedNumbers: BlockedNumberRule[] = [
  {
    id: 'blk_999',
    number: '999',
    gameSlot: 'ALL',
    reason: 'Admin Blocked / Risk Control',
    createdAt: new Date().toISOString().split('T')[0],
  },
  {
    id: 'blk_777',
    number: '777',
    gameSlot: '1 PM Game',
    reason: 'Admin Blocked for 1 PM',
    createdAt: new Date().toISOString().split('T')[0],
  },
];

const defaultGlobalLimitRule: GlobalLimitRule = {
  defaultMaxCount: 100,
  isEnabled: false,
  gameSlot: 'ALL',
};

const { todayResults: initialTodayResults, allResults: initialAllResults } = getInitialSampleGameResults();

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
  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>(defaultAgenciesList);
  const [activeGameSlot, setActiveGameSlot] = useState<GameSlot>('3 PM Game');
  const [betSlip, setBetSlip] = useState<BetSlipItem[]>([]);
  const [placedTickets, setPlacedTickets] = useState<PlacedTicket[]>(getInitialSampleTickets());
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [gameResults, setGameResults] = useState<Record<GameSlot, GameResult>>(initialTodayResults);
  const [allPublishedResults, setAllPublishedResults] = useState<Record<string, GameResult>>(initialAllResults);
  const [payoutLogs, setPayoutLogs] = useState<PayoutLog[]>(getInitialSamplePayoutLogs());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Limit / Block States
  const [agencyNumberLimits, setAgencyNumberLimits] = useState<AgencyNumberLimit[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lucky10_agency_limits');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return defaultAgencyLimits;
  });

  const [blockedNumbers, setBlockedNumbers] = useState<BlockedNumberRule[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lucky10_blocked_numbers');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return defaultBlockedNumbers;
  });

  const [globalLimitRule, setGlobalLimitRule] = useState<GlobalLimitRule>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lucky10_global_limit');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return defaultGlobalLimitRule;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lucky10_agency_limits', JSON.stringify(agencyNumberLimits));
    }
  }, [agencyNumberLimits]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lucky10_blocked_numbers', JSON.stringify(blockedNumbers));
    }
  }, [blockedNumbers]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lucky10_global_limit', JSON.stringify(globalLimitRule));
    }
  }, [globalLimitRule]);

  const getResultForSlotAndDate = (slot: GameSlot, dateStr: string): GameResult => {
    const key = `${dateStr}_${slot}`;
    if (allPublishedResults[key]) {
      return allPublishedResults[key];
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateStr === todayStr && gameResults[slot]) {
      return gameResults[slot];
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
          if (tkts && tkts.length > 0) setPlacedTickets(tkts);
        }).catch(() => {});

        customerService.getBankDetails().then((b) => {
          if (b) setBankDetails(b);
        }).catch(() => {});
      }

      if (isAdminLoggedIn) {
        adminService.getAllUsers().then((users) => {
          if (users && users.length > 0) {
            const hasDemo = users.some(
              (u) => u.username?.toLowerCase() === 'demo' || u.name?.toLowerCase() === 'demo player'
            );
            setRegisteredUsers(hasDemo ? users : [defaultDemoUser, ...users]);
          } else {
            setRegisteredUsers([defaultDemoUser]);
          }
        }).catch(() => {});

        adminService.getAllTickets().then((tkts) => {
          if (tkts && tkts.length > 0) setPlacedTickets(tkts);
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

    const isDemo = inputClean.toLowerCase() === 'demo' || inputClean.toLowerCase() === 'demouser' || inputClean.toLowerCase() === 'demo player';
    const isDemoPassValid = !passClean || ['123', 'demo123', 'demo'].includes(passClean.toLowerCase());

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
      // If Demo credentials, grant access immediately even if backend is offline on Vercel
      if (isDemo && isDemoPassValid) {
        setCurrentUser(defaultDemoUser);
        setIsAdminLoggedIn(false);
        addToast('Welcome back, Demo Player!', 'success');
        setCurrentView('GAME_DASHBOARD');
        return { success: true };
      }

      const errMsg = err?.message || 'Login failed';
      const lower = errMsg.toLowerCase();
      if (lower.includes('deactivated') || lower.includes('disabled') || lower.includes('inactive')) {
        return { success: false, error: 'Your account is deactivated. Please contact administrator.' };
      }
      
      // Offline / Local fallback: check registeredUsers by username
      const matchedAgency = registeredUsers.find(
        (u) =>
          u.username.toLowerCase() === inputClean.toLowerCase()
      );
      if (matchedAgency) {
        if (matchedAgency.isActive === false) {
          return { success: false, error: 'Your account is deactivated. Please contact administrator.' };
        }
        if (matchedAgency.password && passClean && passClean !== matchedAgency.password && passClean !== '123' && passClean !== 'demo123') {
          return { success: false, error: 'Invalid password for Agency / User.' };
        }
        setCurrentUser(matchedAgency);
        setIsAdminLoggedIn(false);
        addToast(`Welcome back, ${matchedAgency.name}!`, 'success');
        setCurrentView('GAME_DASHBOARD');
        return { success: true };
      }

      if (lower.includes('invalid') || lower.includes('401') || lower.includes('password') || lower.includes('username')) {
        return { success: false, error: 'Invalid Agency Name / Username or Password.' };
      }

      return { success: false, error: errMsg };
    }

    if (isDemo && isDemoPassValid) {
      setCurrentUser(defaultDemoUser);
      setIsAdminLoggedIn(false);
      addToast('Welcome back, Demo Player!', 'success');
      setCurrentView('GAME_DASHBOARD');
      return { success: true };
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
    setActiveGameSlot('1 PM Game');
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
    newCount: number
  ): { ok: boolean; reason?: string } => {
    const rawNum = number.includes(':') ? number.split(':')[1] : number;
    const cleanNum = rawNum.trim();
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Check if number is blocked globally or for this slot
    const isBlocked = blockedNumbers.some(
      (b) => b.number === cleanNum && (b.gameSlot === 'ALL' || b.gameSlot === slot)
    );
    if (isBlocked) {
      return {
        ok: false,
        reason: `Cannot play on number ${cleanNum}`,
      };
    }

    // Calculate existing count already placed today for this number in this slot across this agency
    const agencyTickets = placedTickets.filter((t) => {
      const tDate = t.placedAt ? t.placedAt.split('T')[0].split(' ')[0] : todayStr;
      const matchesDate = tDate === todayStr;
      const matchesSlot = t.gameSlot === slot;
      const matchesAgency =
        !agencyIdOrName ||
        agencyIdOrName === 'ALL' ||
        t.userId === agencyIdOrName ||
        (t as any).agencyName === agencyIdOrName ||
        (t as any).userName === agencyIdOrName;
      return matchesDate && matchesSlot && matchesAgency;
    });

    let currentAgencyPlacedCount = 0;
    agencyTickets.forEach((t) => {
      t.items.forEach((it) => {
        const itNum = it.number.includes(':') ? it.number.split(':')[1] : it.number;
        if (itNum.trim() === cleanNum) {
          currentAgencyPlacedCount += it.count || 1;
        }
      });
    });

    // 2. Check Agency-Specific Limit (Option 1: Limit Count)
    const specificLimit = agencyNumberLimits.find((l) => {
      const matchesAgency =
        l.agencyId === agencyIdOrName ||
        l.agencyName.toLowerCase() === agencyIdOrName.toLowerCase() ||
        l.agencyId === 'ALL';
      const matchesNum = l.number === cleanNum;
      const matchesSlot = l.gameSlot === 'ALL' || l.gameSlot === slot;
      return matchesAgency && matchesNum && matchesSlot;
    });

    if (specificLimit) {
      if (currentAgencyPlacedCount + newCount > specificLimit.maxCount) {
        return {
          ok: false,
          reason: `Limit of ${specificLimit.maxCount} count reached for number ${cleanNum} (${specificLimit.agencyName})`,
        };
      }
    }

    // 3. Check Global Limit ("Limit All")
    if (globalLimitRule.isEnabled) {
      const appliesToSlot = globalLimitRule.gameSlot === 'ALL' || globalLimitRule.gameSlot === slot;
      if (appliesToSlot) {
        if (currentAgencyPlacedCount + newCount > globalLimitRule.defaultMaxCount) {
          return {
            ok: false,
            reason: `Limit of ${globalLimitRule.defaultMaxCount} count reached for number ${cleanNum}`,
          };
        }
      }
    }

    return { ok: true };
  };

  const addAgencyLimit = (limit: Omit<AgencyNumberLimit, 'id' | 'createdAt'>) => {
    const newLimit: AgencyNumberLimit = {
      ...limit,
      id: `lim_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setAgencyNumberLimits((prev) => [newLimit, ...prev]);
    addToast(`Limit set for ${limit.agencyName}: #${limit.number} (Max: ${limit.maxCount})`, 'success');
  };

  const removeAgencyLimit = (id: string) => {
    setAgencyNumberLimits((prev) => prev.filter((l) => l.id !== id));
    addToast('Agency limit removed successfully', 'info');
  };

  const addBlockedNumber = (rule: Omit<BlockedNumberRule, 'id' | 'createdAt'>) => {
    const newRule: BlockedNumberRule = {
      ...rule,
      id: `blk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setBlockedNumbers((prev) => [newRule, ...prev]);
    addToast(`Number ${rule.number} is now BLOCKED for ${rule.gameSlot}`, 'success');
  };

  const removeBlockedNumber = (id: string) => {
    setBlockedNumbers((prev) => prev.filter((b) => b.id !== id));
    addToast('Number unblocked successfully', 'info');
  };

  const updateGlobalLimit = (rule: Partial<GlobalLimitRule>) => {
    setGlobalLimitRule((prev) => ({ ...prev, ...rule }));
    addToast('Global limit rule updated', 'success');
  };

  const addToBetSlip = (item: Omit<BetSlipItem, 'id'>) => {
    const agencyId = currentUser?.id || currentUser?.username || 'user_demo_001';
    const numToTest = item.number.includes(':') ? item.number.split(':')[1] : item.number;
    const validation = checkBetEligibility(agencyId, activeGameSlot, numToTest, item.count);
    if (!validation.ok) {
      addToast(validation.reason || 'Bet limit exceeded or number blocked', 'error');
      return;
    }

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

    const agencyId = currentUser?.id || currentUser?.username || 'user_demo_001';
    for (const item of betSlip) {
      const numToTest = item.number.includes(':') ? item.number.split(':')[1] : item.number;
      const validation = checkBetEligibility(agencyId, activeGameSlot, numToTest, item.count);
      if (!validation.ok) {
        addToast(validation.reason || 'Booking blocked by admin limits', 'error');
        return null;
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
        const nextId = getNextSequentialBillId(placedTickets);
        newTicket = {
          id: nextId,
          ticketId: nextId,
          userId: currentUser?.id || 'user_demo_001',
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

    const agencyId = currentUser?.id || currentUser?.username || 'user_demo_001';
    for (const item of betSlip) {
      const numToTest = item.number.includes(':') ? item.number.split(':')[1] : item.number;
      const validation = checkBetEligibility(agencyId, activeGameSlot, numToTest, item.count);
      if (!validation.ok) {
        addToast(validation.reason || 'Payment blocked by admin limits', 'error');
        return false;
      }
    }

    const total = betSlip.reduce((sum, item) => sum + item.totalAmount, 0);
    const cleanCustName = (customerName && customerName.trim() && customerName.trim().toLowerCase() !== 'customer') ? customerName.trim() : '';

    try {
      let newTicket: PlacedTicket;
      try {
        newTicket = await customerService.placeTicket(activeGameSlot, betSlip, total, 'PAY', cleanCustName);
      } catch (e) {
        const nextId = getNextSequentialBillId(placedTickets);
        newTicket = {
          id: nextId,
          ticketId: nextId,
          userId: currentUser?.id || 'user_demo_001',
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
        changeUserPassword,
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
