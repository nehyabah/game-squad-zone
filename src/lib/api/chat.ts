import { authAPI } from './auth';

export interface ChatMessage {
  id: string;
  message: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
  isCurrentUser: boolean;
}

export interface SendMessageData {
  message: string;
}

class ChatAPI {
  private baseUrl = '/api';

  async getSquadMessages(squadId: string): Promise<ChatMessage[]> {
    return authAPI.request(`${this.baseUrl}/squads/${squadId}/messages`);
  }

  async sendMessage(squadId: string, data: SendMessageData): Promise<ChatMessage> {
    return authAPI.request(`${this.baseUrl}/squads/${squadId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteMessage(squadId: string, messageId: string): Promise<void> {
    return authAPI.request(`${this.baseUrl}/squads/${squadId}/messages/${messageId}`, {
      method: 'DELETE',
    });
  }
}

export const chatApi = new ChatAPI();