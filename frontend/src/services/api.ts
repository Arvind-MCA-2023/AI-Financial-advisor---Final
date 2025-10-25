import { Transaction,AnalyticsSummary,CategoryBreakdown } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';


class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Add auth token if available
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
          // Token expired or invalid - redirect to login
          localStorage.removeItem('authToken');
          window.location.href = '/login';
          throw new Error('Unauthorized - please login again');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: { email: string; password: string; full_name: string }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Transaction endpoints
  async getTransactions(): Promise<Transaction[]> {
    // ✅ FIX: Use the authenticated request method
    return this.request<Transaction[]>('/transactions');
  }

  async createTransaction(transaction: {
    amount: number;
    description: string;
    transaction_type: 'income' | 'expense';
    date?: string;
  }) {
    console.log('Creating transaction with data:', transaction);
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  async updateTransaction(id: number, transaction: Partial<{
    amount: number;
    description: string;
    category: string;
    transaction_type: 'income' | 'expense';
  }>) {
    return this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transaction),
    });
  }

  async deleteTransaction(id: number) {
    return this.request(`/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  // Analytics endpoints
  async getExpenseAnalytics(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const query = params.toString();
    return this.request(`/analytics/expenses${query ? `?${query}` : ''}`);
  }

  async getIncomeExpenseSummary(): Promise<AnalyticsSummary> {
    return this.request<AnalyticsSummary>('/analytics/summary');
  }

  async getCategoryBreakdown(): Promise<CategoryBreakdown[]> {
    return this.request<CategoryBreakdown[]>('/analytics/categories');
  }

  // AI endpoints
  async getAIInsights(): Promise<{ insights: any[] }> {
    return this.request<{ insights: any[] }>('/ai/insights');
  }

  async getExpenseForecasting(months?: number): Promise<any> {
    const params = months ? `?months=${months}` : '';
    return this.request(`/ai/forecast${params}`);
  }

  async chatWithAdvisor(message: string, conversationHistory: any[] = []): Promise<{ response: string; timestamp: string }> {
    return this.request<{ response: string; timestamp: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ 
        message,
        conversation_history: conversationHistory 
      }),
    });
  }

  async categorizeTransaction(description: string, amount: number): Promise<{ category: string; confidence: number; ai_categorized: boolean }> {
    return this.request<{ category: string; confidence: number; ai_categorized: boolean }>('/ai/categorize', {
      method: 'POST',
      body: JSON.stringify({ description, amount }),
    });
  }

  async getFinancialTips(): Promise<{ tips: any[] }> {
    return this.request<{ tips: any[] }>('/ai/tips');
  }

  // Reports endpoints
  async generateReport(type: 'monthly' | 'annual', params?: { 
    year?: number; 
    month?: number;
    format?: 'json' | 'pdf';
  }) {
    const queryParams = new URLSearchParams();
    if (params?.year) queryParams.append('year', params.year.toString());
    if (params?.month) queryParams.append('month', params.month.toString());
    if (params?.format) queryParams.append('format', params.format);
    
    const query = queryParams.toString();
    return this.request(`/reports/${type}${query ? `?${query}` : ''}`);
  }
}

export const apiService = new ApiService();