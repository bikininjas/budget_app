// User types
export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  is_active: boolean;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  email: string;
  username: string;
  full_name: string;
  password: string;
  role?: 'admin' | 'user';
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

// Account types
export type AccountType =
  | 'caisse_epargne_joint'
  | 'caisse_epargne_seb'
  | 'caisse_epargne_marie'
  | 'n26_seb';

export interface Account {
  id: number;
  name: string;
  account_type: AccountType;
  balance: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountCreate {
  name: string;
  account_type: AccountType;
  balance?: number;
  description?: string;
}

// Category types
export interface Category {
  id: number;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreate {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

// Expense types
export enum SplitType {
  EQUAL = '50_50',
  ONE_THIRD = '33_67',
  TWO_THIRDS = '67_33',
  FULL_MARIE = '100_marie',
  FULL_SEB = '100_seb',
}

export enum Frequency {
  ONE_TIME = 'one_time',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
}

export interface Expense {
  id: number;
  label: string;
  description: string | null;
  amount: number;
  date: string;
  frequency: Frequency;
  split_type: SplitType;
  category_id: number;
  account_id: number;
  assigned_to: number;
  created_by: number;
  project_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category_name?: string;
  category_color?: string;
  account_name?: string;
  assigned_user_name?: string;
  project_name?: string;
}

export interface ExpenseCreate {
  label: string;
  description?: string;
  amount: number;
  date: string;
  frequency?: Frequency;
  split_type?: SplitType;
  category_id: number;
  account_id: number;
  assigned_to: number;
  project_id?: number;
}

export interface ExpenseUpdate {
  label?: string;
  description?: string;
  amount?: number;
  date?: string;
  frequency?: Frequency;
  split_type?: SplitType;
  category_id?: number;
  account_id?: number;
  assigned_to?: number;
  project_id?: number;
  is_active?: boolean;
}

export interface ExpenseFilters {
  category_id?: number;
  account_id?: number;
  assigned_to?: number;
  project_id?: number;
  frequency?: Frequency;
  split_type?: SplitType;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
}

// Project types
export interface Project {
  id: number;
  name: string;
  description: string | null;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_spent?: number;
  expense_count?: number;
}

export interface ProjectCreate {
  name: string;
  description?: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

export interface ProjectContribution {
  id: number;
  amount: number;
  note: string | null;
  project_id: number;
  user_id: number;
  created_at: string;
  user_name?: string;
}

export interface ProjectContributionCreate {
  amount: number;
  note?: string;
  project_id: number;
  user_id: number;
}

// Stats types
export interface CategoryStats {
  category_id: number;
  total: number;
  count: number;
}

export interface MonthlyStats {
  month: number;
  total: number;
  count: number;
}

export interface UserBalance {
  user1_paid: number;
  user1_should_pay: number;
  user1_balance: number;
  user2_paid: number;
  user2_should_pay: number;
  user2_balance: number;
}
