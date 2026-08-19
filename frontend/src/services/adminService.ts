import { apiRequest } from './api';
import type { UserAccount, GameResult, PayoutLog, GameSlot, PlacedTicket } from '../types';

export const adminService = {
  async getAllUsers(): Promise<UserAccount[]> {
    return await apiRequest<UserAccount[]>('/api/admin/users', { method: 'GET' });
  },

  async createUser(data: { agencyName: string; username?: string; password: string; mode: string }): Promise<UserAccount> {
    return await apiRequest<UserAccount>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async toggleUserStatus(userId: string, isActive?: boolean): Promise<{ id: string; isActive: boolean }> {
    return await apiRequest<{ id: string; isActive: boolean }>(`/api/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify(isActive !== undefined ? { isActive } : {}),
    });
  },

  async toggleAllUsersStatus(isActive: boolean): Promise<void> {
    await apiRequest('/api/admin/users/status-all', {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    });
  },

  async deleteUser(userId: string): Promise<void> {
    await apiRequest(`/api/admin/users/${userId}`, { method: 'DELETE' });
  },

  async changeUserPassword(userId: string, password: string): Promise<void> {
    await apiRequest(`/api/admin/users/${userId}/password`, {
      method: 'PUT',
      body: JSON.stringify({ password }),
    });
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
    compliments: string[][],
    prize5?: string,
    date?: string
  ): Promise<GameResult> {
    return await apiRequest<GameResult>('/api/admin/results', {
      method: 'POST',
      body: JSON.stringify({ gameSlot, prize1, prize2, prize3, prize4, prize5, compliments, date }),
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

  async getAllTickets(): Promise<PlacedTicket[]> {
    return await apiRequest<PlacedTicket[]>('/api/admin/tickets', { method: 'GET' });
  },
};
