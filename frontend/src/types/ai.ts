export interface Message {
  type: "user" | "bot";
  content: string;
  timestamp: string;
}

export interface Insight {
  type: "positive" | "opportunity" | "warning";
  title: string;
  message: string;
  confidence: string;
}

export interface Tip {
  title: string;
  description: string;
  impact: string;
  difficulty: string;
  icon?: any;
}

// Add these to your existing frontend/src/types/api.ts file

// ==================== ENHANCED AI/FORECAST TYPES ====================

export interface MonthlyForecast {
  month: string;
  predicted_expenses: number;
  lower_bound?: number;
  upper_bound?: number;
  confidence: number;
}

export interface ModelInfo {
  algorithm: string;
  data_points: number;
  training_period: string;
}

export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  change_percentage: number;
  message: string;
}

export interface ForecastResponse {
  forecast: MonthlyForecast[];
  method: 'prophet' | 'statistical' | 'none';
  model_info?: ModelInfo;
  trend_analysis?: TrendAnalysis;
  message?: string;
}

export interface CategoryForecast {
  category: string;
  current_monthly_avg: number;
  predicted_next_month: number;
  trend_percentage: number;
  confidence: number;
}

export interface CategoryForecastResponse {
  category_forecasts: CategoryForecast[];
  total_predicted: number;
  forecast_period: string;
  message?: string;
}