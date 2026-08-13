import { apiRequest } from './api';
import type { UserAccount, GameResult, PayoutLog, GameSlot } from '../types';

export const adminService = {
  async getAllUsers(): Promise<UserAccount[]> {
    return await apiRequest<UserAccount[]>('/api/admin/users', { method: 'GET' });
  },

  async deleteUser(userId: string): Promise<void> {
    await apiRequest(`/api/admin/users/${userId}`, { method: 'DELETE' });
  },

  async clearAllUsers(): Promise<void> {
    await apiRequest('/api/admin/users', { method: 'DELETE' });
  },

  async publishResult(
    gameSlot: GameSlot,
    prize1: string,
    prize2: string,
    prize3: string,
    prize4: string,
    compliments: string[][]
  ): Promise<GameResult> {
    return await apiRequest<GameResult>('/api/admin/results', {
      method: 'POST',
      body: JSON.stringify({ gameSlot, prize1, prize2, prize3, prize4, compliments }),
    });
  },

  async getPayoutLogs(): Promise<PayoutLog[]> {
    return await apiRequest<PayoutLog[]>('/api/admin/payouts', { method: 'GET' });
  },

  async processPayout(userId: string, amount: number): Promise<PayoutLog> {
    return await apiRequest<PayoutLog>(`/api/admin/payouts/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  async getTransactions() {
    return await apiRequest<any[]>('/api/admin/transactions', { method: 'GET' });
  },

  async getIssues() {
    return await apiRequest<any[]>('/api/admin/issues', { method: 'GET' });
  },

  async toggleIssueStatus(issueId: string) {
    return await apiRequest(`/api/admin/issues/${issueId}`, { method: 'PUT' });
  },

  async getReports() {
    return await apiRequest<any>('/api/admin/reports', { method: 'GET' });
  },
};
