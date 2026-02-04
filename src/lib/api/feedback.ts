import { api } from "./client";

export interface FeedbackItem {
  id: string;
  content: string;
  category: "bug" | "feature" | "general";
  contactEmail?: string;
  status: "new" | "reviewed" | "resolved";
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackStats {
  total: number;
  new: number;
  reviewed: number;
  resolved: number;
}

export interface SubmitFeedbackData {
  content: string;
  category: "bug" | "feature" | "general";
  contactEmail?: string;
}

export const feedbackAPI = {
  submit: (data: SubmitFeedbackData) =>
    api.post<{ success: boolean; id: string }>("/feedback", data).then((r) => r.data),
};

export const feedbackAdminAPI = {
  getAll: (filters?: { status?: string; category?: string }) =>
    api
      .get<FeedbackItem[]>("/feedback/admin", { params: filters })
      .then((r) => r.data),

  getStats: () =>
    api.get<FeedbackStats>("/feedback/admin/stats").then((r) => r.data),

  update: (id: string, data: { status?: string; adminNotes?: string }) =>
    api.patch<FeedbackItem>(`/feedback/admin/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/feedback/admin/${id}`).then((r) => r.data),
};
