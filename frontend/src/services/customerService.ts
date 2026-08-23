import { apiRequest } from './api';
import type { GameResult, PlacedTicket, GameSlot, BetSlipItem } from '../types';

export const customerService = {
  async getTodayResults(date?: string): Promise<Record<GameSlot, GameResult>> {
    return await apiRequest<Record<GameSlot, GameResult>>(`/api/customer/results/today${date ? `?date=${date}` : ''}`, { method: 'GET' });
  },

  async getResultsByDate(date?: string): Promise<Record<GameSlot, GameResult>> {
    return await apiRequest<Record<GameSlot, GameResult>>(`/api/customer/results/by-date${date ? `?date=${date}` : ''}`, { method: 'GET' });
  },

  async getAllResults(): Promise<Record<string, GameResult>> {
    return await apiRequest<Record<string, GameResult>>('/api/customer/results/all', { method: 'GET' });
  },

  async getPreviousResults(): Promise<GameResult[]> {
    return await apiRequest<GameResult[]>('/api/customer/results/previous', { method: 'GET' });
  },

  async placeTicket(gameSlot: GameSlot, items: Omit<BetSlipItem, 'id'>[], totalAmount: number, actionType: 'SAVE' | 'PAY' = 'SAVE', customerName?: string): Promise<PlacedTicket> {
    return await apiRequest<PlacedTicket>('/api/customer/tickets', {
      method: 'POST',
      body: JSON.stringify({ gameSlot, items, totalAmount, actionType, customerName }),
    });
  },

  async getUserTickets(): Promise<PlacedTicket[]> {
    return await apiRequest<PlacedTicket[]>('/api/customer/tickets', { method: 'GET' });
  },

  async deleteTicket(ticketId: string): Promise<{ success: boolean; message: string }> {
    return await apiRequest<{ success: boolean; message: string }>(`/api/customer/tickets/${ticketId}`, {
      method: 'DELETE',
    });
  },

  async submitIssue(category: string, description: string, attachment?: string) {
    return await apiRequest('/api/customer/issues', {
      method: 'POST',
      body: JSON.stringify({ category, description, attachment }),
    });
  },

  async getLimits(): Promise<{
    blockedNumbers: any[];
    agencyLimits: any[];
    globalLimit: any | null;
  }> {
    return await apiRequest('/api/customer/limits', { method: 'GET' });
  },

  async getGameStatus(): Promise<{
    date: string;
    ist_time: string;
    slots: Record<string, { is_open: boolean; cutoff: string }>;
  }> {
    return await apiRequest('/api/customer/game-status', { method: 'GET' });
  },
};
