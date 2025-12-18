import api from './client';
import type { Token, User, UserLogin, UserCreate, ChangePassword, MagicLinkRequest, SetInitialPassword, UserPasswordStatus } from '@/types';

export const authApi = {
  login: async (credentials: UserLogin): Promise<Token> => {
    const response = await api.post<Token>('/auth/login', credentials, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  register: async (userData: UserCreate): Promise<User> => {
    const response = await api.post<User>('/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  refreshToken: async (): Promise<Token> => {
    const response = await api.post<Token>('/auth/refresh');
    return response.data;
  },

  changePassword: async (data: ChangePassword): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/change-password', data);
    return response.data;
  },

  checkEmail: async (data: MagicLinkRequest): Promise<UserPasswordStatus> => {
    const response = await api.post<UserPasswordStatus>('/auth/check-email', data);
    return response.data;
  },

  requestMagicLink: async (data: MagicLinkRequest): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/request-magic-link', data);
    return response.data;
  },

  verifyMagicLink: async (token: string): Promise<{ valid: boolean; email: string; full_name: string }> => {
    const response = await api.post<{ valid: boolean; email: string; full_name: string }>(
      `/auth/verify-magic-link?token=${encodeURIComponent(token)}`
    );
    return response.data;
  },

  setInitialPassword: async (data: SetInitialPassword): Promise<Token> => {
    const response = await api.post<Token>('/auth/set-initial-password', data);
    return response.data;
  },
};

export default authApi;
