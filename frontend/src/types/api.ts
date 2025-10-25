// ==================== USER TYPES ====================

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_name: string;
  user_id: number;
  email: string;
}

// ==================== TRANSACTION TYPES ====================

export interface Transaction {
  id: number;
  user_id: number;
  amount: number;
  description: string;
  category: string;
  transaction_type: 'income' | 'expense';
  date: string;
  created_at: string;
  updated_at?: string;
}

export interface TransactionCreate {
  description: string;
  amount: number;
  transaction_type: 'income' | 'expense';
  date?: string;
}

export interface TransactionUpdate {
  description?: string;
  amount?: number;
  category?: string;
  transaction_type?: 'income' | 'expense';
  date?: string;
}

// ==================== ANALYTICS TYPES ====================

export interface AnalyticsSummary {
  total_income: number;
  total_expenses: number;
  net_savings: number;
  savings_rate: number;
  category_breakdown: Record<string, number>;
}

export interface MonthlyAnalytics {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface CategoryBreakdown {
  category: string;
  total_amount: number;
  percentage: number;
  transaction_count: number;
}

export interface CategoryStatistics {
  transaction_type: 'income' | 'expense';
  total_amount: number;
  categories: Record<string, {
    total: number;
    count: number;
    average: number;
    percentage: number;
  }>;
  date_from?: string;
  date_to?: string;
}

export interface TimelineStatistics {
  group_by: 'day' | 'week' | 'month';
  date_from: string;
  date_to: string;
  timeline: Record<string, {
    income: number;
    expense: number;
    net: number;
  }>;
}

// ==================== AI TYPES ====================

export interface AIInsight {
  type: 'positive' | 'warning' | 'opportunity';
  title: string;
  message: string;
  confidence: string;
}

export interface AITip {
  title: string;
  description: string;
  impact: string;
  difficulty: string;
}

export interface AIForecast {
  forecast: {
    month: string;
    predicted_expenses: number;
    confidence: number;
  }[];
}

export interface ChatMessage {
  type: 'user' | 'bot';
  content: string;
  timestamp?: string;
}

export interface ChatResponse {
  response: string;
  timestamp: string;
}

// ==================== BUDGET TYPES ====================

export interface Budget {
  id: number;
  user_id: number;
  category: string;
  monthly_limit: number;
  current_spent: number;
  remaining: number;
  percentage_used: number;
  month: number;
  year: number;
  status: 'under_budget' | 'near_limit' | 'over_budget';
}

export interface BudgetCreate {
  category: string;
  monthly_limit: number;
  month: number;
  year: number;
}

export interface BudgetUpdate {
  monthly_limit?: number;
  month?: number;
  year?: number;
}

// ==================== GOAL TYPES ====================

export interface Goal {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  remaining_amount: number;
  progress_percentage: number;
  target_date: string;
  days_remaining: number;
  is_completed: boolean;
  status: 'on_track' | 'behind' | 'completed' | 'overdue';
  monthly_savings_needed: number;
}

export interface GoalCreate {
  name: string;
  description?: string;
  target_amount: number;
  current_amount?: number;
  target_date: string;
}

export interface GoalUpdate {
  name?: string;
  description?: string;
  target_amount?: number;
  current_amount?: number;
  target_date?: string;
  is_completed?: boolean;
}

// ==================== GENERIC RESPONSE TYPES ====================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  skip: number;
  limit: number;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

// ==================== REPORT TYPES ====================

export interface Report {
  id: string;
  type: 'monthly' | 'annual';
  period: string;
  total_income: number;
  total_expenses: number;
  net_savings: number;
  top_categories: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  generated_at: string;
}