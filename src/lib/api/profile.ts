// API client for user profile
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  walletBalance: number;
  walletCurrency: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface ProfileUpdateData {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  username?: string;
}

class ProfileAPI {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      
      // If unauthorized, clear token but don't redirect (let auth system handle it)
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        throw new Error('Authentication required');
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async getProfile(): Promise<UserProfile> {
    return this.request<UserProfile>('/api/profile');
  }

  async updateProfile(data: ProfileUpdateData): Promise<{
    success: boolean;
    message: string;
    user: UserProfile;
  }> {
    return this.request<{
      success: boolean;
      message: string;
      user: UserProfile;
    }>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const profileAPI = new ProfileAPI();