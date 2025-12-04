import api from './client';
import type {
  Expense,
  ExpenseCreate,
  ExpenseUpdate,
  ExpenseFilters,
  CategoryStats,
  MonthlyStats,
  UserBalance,
  RecurringBudget,
  MonthlyHistory,
} from '@/types';

export const expensesApi = {
  getAll: async (filters?: ExpenseFilters): Promise<Expense[]> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await api.get<Expense[]>('/expenses', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Expense> => {
    const response = await api.get<Expense>(`/expenses/${id}`);
    return response.data;
  },

  create: async (expense: ExpenseCreate): Promise<Expense> => {
    const response = await api.post<Expense>('/expenses', expense);
    return response.data;
  },

  update: async (id: number, expense: ExpenseUpdate): Promise<Expense> => {
    const response = await api.patch<Expense>(`/expenses/${id}`, expense);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/expenses/${id}`);
  },

  // Recurring expenses
  getRecurring: async (): Promise<Expense[]> => {
    const response = await api.get<Expense[]>('/expenses/recurring');
    return response.data;
  },

  getRecurringBudget: async (): Promise<RecurringBudget> => {
    const response = await api.get<RecurringBudget>('/expenses/recurring/budget');
    return response.data;
  },

  getByCategory: async (startDate?: string, endDate?: string): Promise<CategoryStats[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await api.get<CategoryStats[]>('/expenses/stats/by-category', { params });
    return response.data;
  },

  getMonthly: async (year: number): Promise<MonthlyStats[]> => {
    const response = await api.get<MonthlyStats[]>(`/expenses/stats/monthly/${year}`);
    return response.data;
  },

  getUserBalance: async (
    user1Id: number,
    user2Id: number,
    startDate?: string,
    endDate?: string
  ): Promise<UserBalance> => {
    const params = new URLSearchParams();
    params.append('user1_id', String(user1Id));
    params.append('user2_id', String(user2Id));
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await api.get<UserBalance>('/expenses/stats/balance', { params });
    return response.data;
  },

  getMonthlyHistory: async (): Promise<MonthlyHistory[]> => {
    const response = await api.get<MonthlyHistory[]>('/expenses/stats/history');
    return response.data;
  },
};

export default expensesApi;
