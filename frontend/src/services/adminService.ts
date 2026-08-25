import { apiRequest } from './api';
import type { UserAccount, GameResult, GameSlot, PlacedTicket } from '../types';

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

  async updateUserMode(userId: string, mode: string): Promise<void> {
    await apiRequest(`/api/admin/users/${userId}/mode`, {
      method: 'PUT',
      body: JSON.stringify({ mode }),
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

  async getTicketsByDate(date: string): Promise<PlacedTicket[]> {
    return await apiRequest<PlacedTicket[]>(`/api/admin/tickets/by-date?date=${encodeURIComponent(date)}`, { method: 'GET' });
  },

  async deleteTicket(ticketId: string): Promise<{ success: boolean; message: string }> {
    return await apiRequest<{ success: boolean; message: string }>(`/api/admin/tickets/${ticketId}`, {
      method: 'DELETE',
    });
  },

  async getAgencyLimits(): Promise<any[]> {
    return await apiRequest<any[]>('/api/admin/limits/agency', { method: 'GET' });
  },

  async createAgencyLimit(data: any): Promise<any> {
    return await apiRequest<any>('/api/admin/limits/agency', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteAgencyLimit(id: string): Promise<void> {
    await apiRequest(`/api/admin/limits/agency/${id}`, { method: 'DELETE' });
  },

  async getBlockedNumbers(): Promise<any[]> {
    return await apiRequest<any[]>('/api/admin/limits/blocked', { method: 'GET' });
  },

  async createBlockedNumber(data: any): Promise<any> {
    return await apiRequest<any>('/api/admin/limits/blocked', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteBlockedNumber(id: string): Promise<void> {
    await apiRequest(`/api/admin/limits/blocked/${id}`, { method: 'DELETE' });
  },

  async getGlobalLimit(): Promise<any> {
    return await apiRequest<any>('/api/admin/limits/global', { method: 'GET' });
  },

  async updateGlobalLimit(data: any): Promise<any> {
    return await apiRequest<any>('/api/admin/limits/global', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
