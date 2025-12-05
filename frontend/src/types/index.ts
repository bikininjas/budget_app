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

export interface ChangePassword {
  current_password: string;
  new_password: string;
}

export interface MagicLinkRequest {
  email: string;
}

export interface SetInitialPassword {
  token: string;
  new_password: string;
}

export interface UserPasswordStatus {
  email: string;
  password_set: boolean;
  user_exists: boolean;
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
  is_recurring: boolean;
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
  is_recurring?: boolean;
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
  is_recurring?: boolean;
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

// Recurring Budget types (from expenses marked as recurring)
export interface RecurringBudgetItem {
  id: number;
  label: string;
  description: string | null;
  amount: number;
  frequency: Frequency;
  monthly_amount: number;
  category_name: string | null;
  category_color: string | null;
}

export interface RecurringBudgetCategory {
  category: string;
  total: number;
}

export interface RecurringBudget {
  total_monthly: number;
  items: RecurringBudgetItem[];
  by_category: RecurringBudgetCategory[];
}

// Recurring Charges types (planned budget, not actual expenses)
export type ChargeFrequency = 'monthly' | 'quarterly' | 'annual';

export interface RecurringCharge {
  id: number;
  name: string;
  description: string | null;
  amount: number;
  frequency: ChargeFrequency;
  category_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
  monthly_amount: number;
}

export interface RecurringChargeCreate {
  name: string;
  description?: string;
  amount: number;
  frequency?: ChargeFrequency;
  category_id: number;
}

export interface RecurringChargeUpdate {
  name?: string;
  description?: string;
  amount?: number;
  frequency?: ChargeFrequency;
  category_id?: number;
  is_active?: boolean;
}

export interface BudgetSummary {
  total_monthly: number;
  total_annual: number;
  charges: RecurringCharge[];
  by_category: RecurringBudgetCategory[];
}

// Monthly History types
export interface MonthlyHistoryCategory {
  name: string;
  color: string;
  icon: string | null;
  total: number;
  count: number;
}

export interface MonthlyHistoryExpense {
  id: number;
  label: string;
  amount: number;
  date: string;
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
  is_recurring: boolean;
}

export interface MonthlyHistory {
  year: number;
  month: number;
  total: number;
  count: number;
  categories: MonthlyHistoryCategory[];
  expenses: MonthlyHistoryExpense[];
}
