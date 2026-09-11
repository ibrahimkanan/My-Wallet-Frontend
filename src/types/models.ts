export interface User {
  id: string;
  email: string;
  name: string | null;
  default_monthly_budget?: number | null;
  created_at?: string;
  updated_at?: string;
}

export type WalletType = 'cash' | 'bank' | 'card';

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: WalletType;
  balance: number;
  created_at?: string;
  updated_at?: string;
}

export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
  icon?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  category_id?: string | null;
  type: TransactionType;
  amount: number;
  note?: string | null;
  transaction_date: string; // "YYYY-MM-DD"
  created_at?: string;
  updated_at?: string;
  category_name?: string | null;
  wallet_name?: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id?: string | null;
  amount: number;
  month: number;
  year: number;
  created_at?: string;
  updated_at?: string;
}

export interface BudgetSummaryItem {
  budget_id: string;
  category_id: string | null;
  budgeted: number;
  spent: number;
  remaining: number;
  category_name?: string | null;
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  user_id: string;
  wallet_id: string;
  category_id?: string | null;
  type: TransactionType;
  amount: number;
  note?: string | null;
  frequency: RecurringFrequency;
  start_date: string;
  end_date?: string | null;
  next_run_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MonthlyChartSummary {
  month: number;
  year: number;
  total_income: number;
  total_expense: number;
  net: number;
  by_category: Array<{
    category_id: string;
    category_name: string;
    total: number;
  }>;
}

export interface YearlyChartSummary {
  year: number;
  total_income: number;
  total_expense: number;
  net: number;
  by_month: Array<{
    month: number;
    total_income: number;
    total_expense: number;
    net: number;
  }>;
}
