import api from './client';
import type {
  RecurringCharge,
  RecurringChargeCreate,
  RecurringChargeUpdate,
  BudgetSummary,
} from '@/types';

export const recurringChargesApi = {
  getAll: async (includeInactive = false): Promise<RecurringCharge[]> => {
    const params = new URLSearchParams();
    if (includeInactive) {
      params.append('include_inactive', 'true');
    }
    const response = await api.get<RecurringCharge[]>('/recurring-charges', { params });
    return response.data;
  },

  getById: async (id: number): Promise<RecurringCharge> => {
    const response = await api.get<RecurringCharge>(`/recurring-charges/${id}`);
    return response.data;
  },

  getSummary: async (): Promise<BudgetSummary> => {
    const response = await api.get<BudgetSummary>('/recurring-charges/summary');
    return response.data;
  },

  create: async (data: RecurringChargeCreate): Promise<RecurringCharge> => {
    const response = await api.post<RecurringCharge>('/recurring-charges', data);
    return response.data;
  },

  update: async (id: number, data: RecurringChargeUpdate): Promise<RecurringCharge> => {
    const response = await api.patch<RecurringCharge>(`/recurring-charges/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/recurring-charges/${id}`);
  },
};

export default recurringChargesApi;
