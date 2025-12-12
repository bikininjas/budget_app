import type {
  ChildMonthlyBudget,
  ChildMonthlyBudgetCreate,
  ChildMonthlyBudgetUpdate,
} from '@/types';
import { api as apiClient } from './client';

export const childBudgetsApi = {
  // Set or update a monthly budget
  setBudget: async (data: ChildMonthlyBudgetCreate): Promise<ChildMonthlyBudget> => {
    const response = await apiClient.post<ChildMonthlyBudget>('/child-budgets', data);
    return response.data;
  },

  // Get all budgets for a user
  getUserBudgets: async (userId: number): Promise<ChildMonthlyBudget[]> => {
    const response = await apiClient.get<ChildMonthlyBudget[]>('/child-budgets', {
      params: { user_id: userId },
    });
    return response.data;
  },

  // Get a specific monthly budget
  getMonthlyBudget: async (userId: number, year: number, month: number): Promise<ChildMonthlyBudget | null> => {
    const response = await apiClient.get<ChildMonthlyBudget | null>(
      `/child-budgets/${year}/${month}`,
      { params: { user_id: userId } }
    );
    return response.data;
  },

  // Update a monthly budget
  updateBudget: async (
    userId: number,
    year: number,
    month: number,
    data: ChildMonthlyBudgetUpdate
  ): Promise<ChildMonthlyBudget> => {
    const response = await apiClient.put<ChildMonthlyBudget>(
      `/child-budgets/${year}/${month}`,
      data,
      { params: { user_id: userId } }
    );
    return response.data;
  },

  // Delete a monthly budget
  deleteBudget: async (userId: number, year: number, month: number): Promise<void> => {
    await apiClient.delete(`/child-budgets/${year}/${month}`, {
      params: { user_id: userId },
    });
  },
};
