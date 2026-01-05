// API client for squads
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export type Sport = 'nfl' | 'six-nations';

export interface Squad {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  joinCode: string;
  ownerId: string;
  maxMembers: number;
  potEnabled: boolean;
  potAmount?: number;
  potCurrency: string;
  potDeadline?: string;
  sport: Sport;
  createdAt: string;
  updatedAt: string;
  members: SquadMember[];
  owner: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  payments?: SquadPayment[];
  _count?: {
    members: number;
    payments: number;
  };
  unreadCount?: number;
}

export interface SquadMember {
  id: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt?: string;
  username: string; // Kept for backward compatibility
  user?: {
    id: string;
    username: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
}

export interface SquadPayment {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paidAt?: string;
  user: {
    id: string;
    username: string;
  };
}

export interface CreateSquadData {
  name: string;
  description?: string;
  imageUrl?: string;
  maxMembers: number;
  potEnabled?: boolean;
  potAmount?: number;
  potDeadline?: string;
  sport?: Sport;
}

export interface JoinSquadData {
  joinCode: string;
}

export interface CreateJoinRequestData {
  joinCode: string;
  message?: string;
}

export interface SquadJoinRequest {
  id: string;
  squadId: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  requestedAt: string;
  respondedAt?: string;
  respondedBy?: string;
  user: {
    id: string;
    username: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    email?: string;
  };
  squad?: {
    id: string;
    name: string;
  };
}

class SquadsAPI {
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
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      
      // If unauthorized, clear token but don't redirect (let auth system handle it)
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        throw new Error('Authentication required');
      }
      
      // Use the error message from backend, fallback to generic message
      const errorMessage = error.error || error.message || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async createSquad(data: CreateSquadData): Promise<Squad> {
    return this.request<Squad>('/api/squads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async joinSquad(data: JoinSquadData): Promise<Squad> {
    try {
      const result = await this.request<Squad>('/api/squads/join', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return result;
    } catch (error) {
      console.error('Join squad failed:', error);
      throw error;
    }
  }

  async getUserSquads(sport?: Sport): Promise<Squad[]> {
    const params = sport ? `?sport=${sport}` : '';
    return this.request<Squad[]>(`/api/squads${params}`);
  }

  async getSquad(squadId: string): Promise<Squad> {
    return this.request<Squad>(`/api/squads/${squadId}`);
  }

  async updateSquadSettings(squadId: string, data: Partial<CreateSquadData>): Promise<Squad> {
    return this.request<Squad>(`/api/squads/${squadId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async leaveSquad(squadId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/squads/${squadId}/leave`, {
      method: 'DELETE',
    });
  }

  async deleteSquad(squadId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/squads/${squadId}`, {
      method: 'DELETE',
    });
  }

  async updateMemberRole(squadId: string, userId: string, role: 'admin' | 'member'): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/squads/${squadId}/members/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async removeMember(squadId: string, userId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/squads/${squadId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  async getPotStatus(squadId: string): Promise<{
    potEnabled: boolean;
    potAmount?: number;
    potDeadline?: string;
    totalCollected: number;
    paidMembers: number;
    totalMembers: number;
    percentPaid: number;
    payments: SquadPayment[];
  }> {
    return this.request(`/api/squads/${squadId}/pot`);
  }

  async createPotPaymentSession(squadId: string): Promise<{
    sessionId: string;
    url: string;
  }> {
    return this.request(`/api/squads/${squadId}/pot/checkout`, {
      method: 'POST',
    });
  }

  async markMessagesAsRead(squadId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/squads/${squadId}/read`, {
      method: 'PUT',
    });
  }

  // Join request methods
  async createJoinRequest(data: CreateJoinRequestData): Promise<SquadJoinRequest> {
    return this.request<SquadJoinRequest>('/api/squads/join-request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPendingJoinRequests(squadId: string): Promise<SquadJoinRequest[]> {
    return this.request<SquadJoinRequest[]>(`/api/squads/${squadId}/join-requests`);
  }

  async approveJoinRequest(squadId: string, requestId: string): Promise<Squad> {
    return this.request<Squad>(`/api/squads/${squadId}/join-requests/${requestId}/approve`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async rejectJoinRequest(squadId: string, requestId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/squads/${squadId}/join-requests/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getJoinRequestStatus(squadId: string): Promise<SquadJoinRequest | null> {
    try {
      return await this.request<SquadJoinRequest>(`/api/squads/${squadId}/join-request-status`);
    } catch (error) {
      return null;
    }
  }

  async getMyJoinRequests(sport?: Sport): Promise<SquadJoinRequest[]> {
    const params = sport ? `?sport=${sport}` : '';
    return this.request<SquadJoinRequest[]>(`/api/squads/my-join-requests${params}`);
  }
}

export const squadsAPI = new SquadsAPI();