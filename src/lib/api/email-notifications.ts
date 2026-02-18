import { api } from './client';

// Types
export type RecipientFilter = "all" | "active_players" | "missing_picks" | "specific";

export interface EmailLog {
  id: string;
  type: string;
  subject: string;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  sentBy: string;
  roundId: string | null;
  details: Record<string, any> | null;
  status: string;
  createdAt: string;
  completedAt: string | null;
  sentByUser: {
    id: string;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

export interface SendEmailResult {
  logId: string;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  status: string;
}

export interface RecipientPreview {
  count: number;
  unsubscribedCount?: number;
  recipients: {
    id: string;
    email: string;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
  }[];
}

export const emailNotificationAPI = {
  sendRoundResults: async (
    roundId: string,
    recipientFilter?: RecipientFilter,
    specificUserIds?: string[]
  ): Promise<SendEmailResult> => {
    const response = await api.post('/six-nations/admin/email/round-results', {
      roundId,
      recipientFilter,
      specificUserIds,
    });
    return response.data;
  },

  sendPicksReminder: async (
    roundId: string,
    recipientFilter: RecipientFilter,
    specificUserIds?: string[]
  ): Promise<SendEmailResult> => {
    const response = await api.post('/six-nations/admin/email/picks-reminder', {
      roundId,
      recipientFilter,
      specificUserIds,
    });
    return response.data;
  },

  sendCustom: async (
    subject: string,
    body: string,
    recipientFilter: RecipientFilter,
    roundId?: string,
    specificUserIds?: string[]
  ): Promise<SendEmailResult> => {
    const response = await api.post('/six-nations/admin/email/custom', {
      subject,
      body,
      recipientFilter,
      roundId,
      specificUserIds,
    });
    return response.data;
  },

  getHistory: async (limit?: number, type?: string): Promise<EmailLog[]> => {
    const params: Record<string, string> = {};
    if (limit) params.limit = String(limit);
    if (type) params.type = type;
    const response = await api.get('/six-nations/admin/email/history', { params });
    return response.data;
  },

  previewRecipients: async (
    recipientFilter: RecipientFilter,
    roundId?: string,
    specificUserIds?: string[]
  ): Promise<RecipientPreview> => {
    const params: Record<string, string> = { recipientFilter };
    if (roundId) params.roundId = roundId;
    if (specificUserIds?.length) params.specificUserIds = specificUserIds.join(',');
    const response = await api.get('/six-nations/admin/email/preview-recipients', { params });
    return response.data;
  },
};
