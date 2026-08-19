export type ViewType =
  | 'USER_SIGN_IN'
  | 'GAME_DASHBOARD'
  | 'USER_DRAWER'
  | 'PAYOUT_STRUCTURE'
  | 'CHANGE_GAME'
  | 'TODAYS_WINNING_NUMBERS'
  | 'TOTAL_COUNT_VIEW'
  | 'COUNT_REPORT'
  | 'TODAYS_RESULT'
  | 'PREVIOUS_WINNING_NUMBERS'
  | 'UPDATE_BANK_DETAILS'
  | 'MY_PLAY_REPORT'
  | 'EDIT_DELETE_BILL'
  | 'ADMIN_SIGN_IN'
  | 'ADMIN_DRAWER'
  | 'ADMIN_USERS_LIST'
  | 'ADMIN_RESULT_MANAGEMENT'
  | 'ADMIN_REPORTS'
  | 'ADMIN_PAYOUTS'
  | 'ADMIN_TRANSACTION_LOGS'
  | 'ADMIN_ISSUES'
  | 'ADMIN_LIMIT_BLOCK';

export type GameSlot = '1 PM Game' | '3 PM Game' | '6 PM Game' | '8 PM Game';

export interface AgencyNumberLimit {
  id: string;
  agencyId: string;
  agencyName: string;
  number: string;
  gameSlot: GameSlot | 'ALL';
  maxCount: number;
  createdAt: string;
}

export interface BlockedNumberRule {
  id: string;
  number: string;
  gameSlot: GameSlot | 'ALL';
  reason?: string;
  createdAt: string;
}

export interface GlobalLimitRule {
  defaultMaxCount: number;
  isEnabled: boolean;
  gameSlot: GameSlot | 'ALL';
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  username: string;
  password?: string;
  role?: string;
  balance: number;
  mode?: string;
  isActive?: boolean;
  bankDetails?: BankDetails;
  createdAt: string;
}

export interface BankDetails {
  accountHolderName: string;
  accountNo: string;
  bankName: string;
  ifsc: string;
  branchName: string;
  updatedAt: string;
}

export interface BetSlipItem {
  id: string;
  number: string;
  count: number;
  type: string;
  playMode?: string;
  unitPrice: number;
  totalAmount: number;
  amount?: number;
}

export interface PlacedTicket {
  id: string;
  ticketId?: string;
  userId: string;
  userName?: string;
  agencyName?: string;
  customerName?: string;
  gameSlot: GameSlot;
  items: BetSlipItem[];
  totalAmount: number;
  placedAt: string;
  createdAt?: string;
  actionType?: string;
  status?: 'PENDING' | 'WON' | 'LOST' | 'PAID';
  winAmount?: number;
}

export interface GameResult {
  id: string;
  date: string;
  gameSlot: GameSlot;
  prize1: string;
  prize2: string;
  prize3: string;
  prize4: string;
  prize5?: string;
  compliments: string[][];
  publishedAt: string;
}

export interface PayoutLog {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  bankAccount: string;
  status: 'SUCCESS' | 'PROCESSING' | 'FAILED';
  date: string;
}

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}
