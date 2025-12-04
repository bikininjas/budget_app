import api from './client';
import type { Account, AccountCreate } from '@/types';

export const accountsApi = {
  getAll: async (): Promise<Account[]> => {
    const response = await api.get<Account[]>('/accounts');
    return response.data;
  },

  getById: async (id: number): Promise<Account> => {
    const response = await api.get<Account>(`/accounts/${id}`);
    return response.data;
  },

  create: async (account: AccountCreate): Promise<Account> => {
    const response = await api.post<Account>('/accounts', account);
    return response.data;
  },

  update: async (id: number, account: Partial<AccountCreate>): Promise<Account> => {
    const response = await api.patch<Account>(`/accounts/${id}`, account);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/accounts/${id}`);
  },
};

export default accountsApi;
