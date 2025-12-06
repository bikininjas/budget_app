import type {
  ChildExpense,
  ChildExpenseCreate,
  ChildExpenseUpdate,
  ChildExpenseSummary,
} from '@/types';
import { api as apiClient } from './client';

export const childExpensesApi = {
  // Get all child expenses with optional filters
  getAll: async (params?: {
    user_id?: number;
    month?: number;
    year?: number;
  }): Promise<ChildExpense[]> => {
    const response = await apiClient.get<ChildExpense[]>('/child-expenses', {
      params,
    });
    return response.data;
  },

  // Get budget summary for a user
  getSummary: async (params?: {
    user_id?: number;
    month?: number;
    year?: number;
  }): Promise<ChildExpenseSummary> => {
    const response = await apiClient.get<ChildExpenseSummary>(
      '/child-expenses/summary',
      { params }
    );
    return response.data;
  },

  // Get a single child expense by ID
  getById: async (id: number): Promise<ChildExpense> => {
    const response = await apiClient.get<ChildExpense>(`/child-expenses/${id}`);
    return response.data;
  },

  // Create a new child expense
  create: async (data: ChildExpenseCreate): Promise<ChildExpense> => {
    const response = await apiClient.post<ChildExpense>('/child-expenses', data);
    return response.data;
  },

  // Update a child expense
  update: async (id: number, data: ChildExpenseUpdate): Promise<ChildExpense> => {
    const response = await apiClient.put<ChildExpense>(
      `/child-expenses/${id}`,
      data
    );
    return response.data;
  },

  // Delete a child expense
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/child-expenses/${id}`);
  },
};
