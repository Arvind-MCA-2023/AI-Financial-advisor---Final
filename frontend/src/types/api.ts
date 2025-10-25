export interface User {
  id: number;
  email: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  amount: number;
  description: string;
  category: string;
  transaction_type: 'income' | 'expense';
  date: string;
  created_at: string;
}

export interface ExpenseAnalytics {
  total_expenses: number;
  total_income: number;
  net_income: number;
  expense_by_category: Record<string, number>;
  monthly_trends: {
    month: string;
    expenses: number;
    income: number;
  }[];
}

export interface AIInsight {
  id: string;
  type: 'tip' | 'warning' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category?: string;
  generated_at: string;
}

export interface AIForecast {
  period: string;
  predicted_expenses: number;
  predicted_savings: number;
  confidence_level: number;
  key_drivers: string[];
}

export interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: string;
}

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

export interface AnalyticsSummary {
  total_income: number;
  total_expenses: number;
  net_savings: number;
  savings_rate: number;
  category_breakdown?: CategoryBreakdown[];
}

export interface CategoryBreakdown {
  category: string;
  total_amount: number;
  percentage: number;
  transaction_count: number;
}
