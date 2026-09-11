import {
  User,
  Wallet,
  Category,
  Transaction,
  Budget,
  BudgetSummaryItem,
  RecurringTransaction,
  MonthlyChartSummary,
  YearlyChartSummary,
} from './models';

export interface ApiSuccessResponse<T = unknown> {
  status: 'ok';
  [key: string]: any;
}

export interface ApiErrorResponse {
  error?: string;
  message?: string;
  success?: boolean;
  errors?: Record<string, string[]>;
}

// Auth Endpoints
export interface RequestOtpPayload {
  email: string;
}

export interface RequestOtpResponse {
  message: string;
}

export interface VerifyOtpPayload {
  email: string;
  code: string;
}

export interface VerifyOtpResponse {
  status: 'ok';
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
  user: User;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  status: 'ok';
  accessToken: string;
  refreshToken: string;
}

export interface LogoutPayload {
  refreshToken: string;
}

// Profile
export interface UpdateProfilePayload {
  name?: string;
  password?: string;
  default_monthly_budget?: number;
}

export interface UpdateProfileResponse {
  status: 'ok';
  user: User;
}

// Wallets
export interface CreateWalletPayload {
  name: string;
  type: 'cash' | 'bank' | 'card';
}

export interface UpdateWalletPayload {
  name?: string;
  type?: 'cash' | 'bank' | 'card';
}

export interface GetWalletsResponse {
  wallets: Wallet[];
}

// Categories
export interface CreateCategoryPayload {
  name: string;
  type: 'income' | 'expense';
  icon?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  type?: 'income' | 'expense';
  icon?: string;
}

export interface GetCategoriesResponse {
  categories: Category[];
}

// Transactions
export interface CreateTransactionPayload {
  wallet_id: string;
  category_id?: string;
  type: 'income' | 'expense';
  amount: number;
  note?: string;
  transaction_date: string; // "YYYY-MM-DD"
}

export interface UpdateTransactionPayload {
  wallet_id?: string;
  category_id?: string;
  type?: 'income' | 'expense';
  amount?: number;
  note?: string;
  transaction_date?: string;
}

export interface GetTransactionsQuery {
  wallet_id?: string;
  category_id?: string;
  month?: number;
  year?: number;
  limit?: number;
  offset?: number;
}

export interface GetTransactionsResponse {
  transactions: Transaction[];
}

// Budgets
export interface CreateBudgetPayload {
  category_id?: string;
  amount: number;
  month: number;
  year: number;
}

export interface UpdateBudgetPayload {
  amount: number;
}

export interface GetBudgetsResponse {
  budgets: Budget[];
}

export interface GetBudgetSummaryResponse {
  summary: BudgetSummaryItem[];
}

// Recurring
export interface CreateRecurringPayload {
  wallet_id: string;
  category_id?: string;
  type: 'income' | 'expense';
  amount: number;
  note?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date?: string;
}

export interface GetRecurringResponse {
  recurring: RecurringTransaction[];
}

// Charts
export interface GetMonthlyChartResponse {
  summary: MonthlyChartSummary;
}

export interface GetYearlyChartResponse {
  summary: YearlyChartSummary;
}
