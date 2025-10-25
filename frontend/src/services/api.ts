import { Transaction, AnalyticsSummary, CategoryBreakdown } from '../types/api';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const token = localStorage.getItem('authToken');
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/signin';
          throw new Error('Unauthorized - please login again');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // ==================== AUTH ROUTES ====================
  
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: { 
    email: string; 
    username?: string;
    password: string; 
    full_name: string;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ...userData,
        username: userData.username || userData.email.split('@')[0]
      }),
    });
  }

  async refreshToken(refreshToken: string) {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // ==================== TRANSACTION ROUTES ====================
  
  async getTransactions(params?: {
    limit?: number;
    offset?: number;
  }): Promise<Transaction[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const query = queryParams.toString();
    return this.request<Transaction[]>(`/transactions${query ? `?${query}` : ''}`);
  }

  async getTransaction(id: number): Promise<Transaction> {
    return this.request<Transaction>(`/transactions/${id}`);
  }

  async createTransaction(transaction: {
    amount: number;
    description: string;
    transaction_type: 'income' | 'expense';
    date?: string;
  }): Promise<Transaction> {
    return this.request<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  async updateTransaction(id: number, transaction: {
    amount?: number;
    description?: string;
    category?: string;
    transaction_type?: 'income' | 'expense';
    date?: string;
  }): Promise<Transaction> {
    return this.request<Transaction>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transaction),
    });
  }

  async deleteTransaction(id: number): Promise<void> {
    return this.request<void>(`/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  // Advanced transaction filtering
  async filterTransactions(params: {
    category?: string;
    transaction_type?: 'income' | 'expense';
    date_from?: string;
    date_to?: string;
    min_amount?: number;
    max_amount?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Transaction[]> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    return this.request<Transaction[]>(`/transactions/filter?${queryParams.toString()}`);
  }

  async getCategoryStatistics(params?: {
    date_from?: string;
    date_to?: string;
    transaction_type?: 'income' | 'expense';
  }) {
    const queryParams = new URLSearchParams();
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.transaction_type) queryParams.append('transaction_type', params.transaction_type);
    
    const query = queryParams.toString();
    return this.request(`/transactions/stats/category${query ? `?${query}` : ''}`);
  }

  async getTimelineStatistics(params?: {
    date_from?: string;
    date_to?: string;
    group_by?: 'day' | 'week' | 'month';
  }) {
    const queryParams = new URLSearchParams();
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.group_by) queryParams.append('group_by', params.group_by);
    
    const query = queryParams.toString();
    return this.request(`/transactions/stats/timeline${query ? `?${query}` : ''}`);
  }

  async exportTransactions(params?: {
    date_from?: string;
    date_to?: string;
    format?: 'json';
  }): Promise<Transaction[]> {
    const queryParams = new URLSearchParams();
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.format) queryParams.append('format', params.format);
    
    const query = queryParams.toString();
    return this.request<Transaction[]>(`/transactions/export${query ? `?${query}` : ''}`);
  }

  // ==================== ANALYTICS ROUTES ====================
  
  async getIncomeExpenseSummary(): Promise<AnalyticsSummary> {
    return this.request<AnalyticsSummary>('/analytics/summary');
  }

  async getMonthlyAnalytics() {
    return this.request('/analytics/monthly');
  }

  // ==================== AI SERVICES ROUTES ====================
  
  async chatWithAdvisor(message: string, conversationHistory: any[] = []): Promise<{ 
    response: string; 
    timestamp: string;
  }> {
    return this.request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ 
        message,
        conversation_history: conversationHistory 
      }),
    });
  }

  async getAIInsights(): Promise<{ insights: any[] }> {
    return this.request<{ insights: any[] }>('/ai/insights');
  }

  async getExpenseForecasting(months: number = 3): Promise<any> {
    return this.request(`/ai/forecast`, {
      method: 'POST',
      body: JSON.stringify({ months }),
    });
  }

  async getFinancialTips(): Promise<{ tips: any[] }> {
    return this.request<{ tips: any[] }>('/ai/tips');
  }

  // ==================== BUDGET ROUTES ====================
  
  async createBudget(budget: {
    category: string;
    monthly_limit: number;
    month: number;
    year: number;
  }) {
    return this.request('/budgets', {
      method: 'POST',
      body: JSON.stringify(budget),
    });
  }

  async getBudgets(params?: {
    month?: number;
    year?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.month) queryParams.append('month', params.month.toString());
    if (params?.year) queryParams.append('year', params.year.toString());
    
    const query = queryParams.toString();
    return this.request(`/budgets${query ? `?${query}` : ''}`);
  }

  async getBudget(id: number) {
    return this.request(`/budgets/${id}`);
  }

  async updateBudget(id: number, budget: {
    monthly_limit?: number;
    month?: number;
    year?: number;
  }) {
    return this.request(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(budget),
    });
  }

  async deleteBudget(id: number): Promise<void> {
    return this.request<void>(`/budgets/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== GOALS ROUTES ====================
  
  async createGoal(goal: {
    name: string;
    description?: string;
    target_amount: number;
    current_amount?: number;
    target_date: string;
  }) {
    return this.request('/goals', {
      method: 'POST',
      body: JSON.stringify(goal),
    });
  }

  async getGoals(includeCompleted: boolean = false) {
    return this.request(`/goals?include_completed=${includeCompleted}`);
  }

  async getGoal(id: number) {
    return this.request(`/goals/${id}`);
  }

  async updateGoal(id: number, goal: {
    name?: string;
    description?: string;
    target_amount?: number;
    current_amount?: number;
    target_date?: string;
    is_completed?: boolean;
  }) {
    return this.request(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(goal),
    });
  }

  async contributeToGoal(id: number, amount: number) {
    return this.request(`/goals/${id}/contribute`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async deleteGoal(id: number): Promise<void> {
    return this.request<void>(`/goals/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== USER PROFILE ROUTES ====================
  
  async getCurrentUser() {
    return this.request('/users/me');
  }

  async updateUserProfile(profile: {
    email?: string;
    username?: string;
    full_name?: string;
  }) {
    return this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  async changePassword(passwordData: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }) {
    return this.request('/users/me/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  async deactivateAccount(): Promise<void> {
    return this.request<void>('/users/me', {
      method: 'DELETE',
    });
  }

  async reactivateAccount() {
    return this.request('/users/me/reactivate', {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService();