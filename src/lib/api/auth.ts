// Frontend Auth API client
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserStats {
  squads: {
    owned: number;
    member: number;
    total: number;
  };
  payments: {
    count: number;
    totalAmount: number;
  };
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}

class AuthAPI {
  private token: string | null = null;

  constructor() {
    // Try to load token from localStorage
    this.token = localStorage.getItem('authToken');
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry: boolean = false
  ): Promise<T> {
    const fullUrl = `${API_BASE}${endpoint}`;
    console.log(`[AuthAPI] Request to ${fullUrl}, has token: ${!!this.token}`);
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      credentials: 'include', // Important for CORS with cookies
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      console.error(`[AuthAPI] Request failed for ${endpoint}:`, {
        status: response.status,
        error: error,
        hasToken: !!this.token
      });
      
      // If unauthorized, check if it's email verification issue
      if (response.status === 401) {
        // Email verification check disabled - skip this check
        // if (error.error === 'Email verification required') {
        //   // Don't clear token, just throw specific error for email verification
        //   throw new Error('EMAIL_VERIFICATION_REQUIRED');
        // }
        
        // Clear token on any 401 error
        this.clearToken();
        
        // Don't redirect or retry during initial auth flow or if we're already handling auth
        if (endpoint === '/api/auth/me' || endpoint === '/api/auth/refresh' || endpoint === '/api/auth/login') {
          return Promise.reject(new Error('401 Authentication required'));
        }
        
        // For other endpoints, just throw error - let the UI handle the redirect
        return Promise.reject(new Error('401 Authentication required'));
      }
      
      // Handle different error response formats from backend
      const errorMessage = error.error || error.message || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Resend verification email
  async resendVerification(email: string): Promise<{ message: string; instructions: string[] }> {
    return this.request<{ message: string; instructions: string[] }>('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }



  // Get OAuth login URL
  async getLoginUrl(): Promise<{ authUrl: string }> {
    return this.request<{ authUrl: string }>('/api/auth/login');
  }

  // Exchange OAuth tokens
  async exchangeToken(idToken: string): Promise<AuthTokens> {
    const result = await this.request<AuthTokens>('/api/auth/okta/exchange', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    
    this.setToken(result.accessToken);
    return result;
  }

  // Refresh access token
  async refreshToken(): Promise<AuthTokens> {
    // Don't attempt refresh if we don't have a token
    if (!this.token) {
      throw new Error('No token to refresh');
    }
    
    const result = await this.request<AuthTokens>('/api/auth/refresh', {
      method: 'POST',
    });
    
    this.setToken(result.accessToken);
    return result;
  }

  // Get current user profile
  async getProfile(): Promise<User> {
    return this.request<User>('/api/auth/me');
  }

  // Update user profile
  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    username?: string;
    avatarUrl?: string;
    displayName?: string;
  }): Promise<User> {
    return this.request<User>('/api/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Get user squads (via auth endpoint)
  async getUserSquads(): Promise<any[]> {
    return this.request<any[]>('/api/auth/me/squads');
  }

  // Get user statistics
  async getUserStats(): Promise<UserStats> {
    return this.request<UserStats>('/api/auth/me/stats');
  }

  // Logout
  async logout(): Promise<void> {
    await this.request('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    this.clearToken();
    // Also clear the login attempt flag from AuthGuard
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.removeItem("auth.loginAttempted");
    }
  }

  // Delete account
  async deleteAccount(): Promise<{ message: string }> {
    const result = await this.request<{ message: string }>('/api/auth/me', {
      method: 'DELETE',
    });
    this.clearToken();
    return result;
  }

  // Token management
  setToken(token: string): void {
    console.log('[AuthAPI] Setting token:', token ? 'Token received' : 'No token');
    this.token = token;
    localStorage.setItem('authToken', token);
    console.log('[AuthAPI] Token saved to localStorage');
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Full auth reset for debugging
  resetAuth(): void {
    console.log('[AuthAPI] Performing full auth reset');
    this.token = null;
    localStorage.clear();
    sessionStorage.clear();
    // Clear all cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    console.log('[AuthAPI] Auth reset complete');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Auto-login redirect
  redirectToLogin(): void {
    // Don't redirect if we're already on home page or in a redirect loop
    if (window.location.pathname === '/' || window.location.pathname === '/login') {
      console.log('Already on login page or home, not redirecting');
      return;
    }
    
    // Clear token first to prevent loops
    this.clearToken();
    
    // Simple redirect to home page where LoginPage component will handle the rest
    console.log('Redirecting to home page for authentication');
    window.location.href = '/';
  }
}

export const authAPI = new AuthAPI();
