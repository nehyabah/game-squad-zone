import { api } from './client';

export interface FifaRound {
  id: string;
  roundNumber: number;
  name: string;
  startDate: string;
  endDate: string;
  lockTime?: string | null;
  isActive: boolean;
  isLocked: boolean;
  pointsPerQuestion: number;
  _count?: { matches: number };
}

export interface FifaMatch {
  id: string;
  roundId: string;
  matchNumber: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  venue?: string;
  homeScore: number | null;
  awayScore: number | null;
  completed: boolean;
  groupTeams?: string[] | null;
  round?: FifaRound;
  _count?: { questions: number };
}

export interface FifaQuestion {
  id: string;
  roundId?: string | null;   // Set for Round 0 & 1 questions
  matchId?: string | null;   // Set for Round 2-6 questions
  questionNumber: number;
  questionText: string;
  questionType: 'multiple_choice' | 'yes_no';
  options: string[] | null;
  correctAnswer: string | null;
  points: number;
  match?: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    matchDate?: string;
    round?: FifaRound;
  };
}

export interface FifaUserAnswer {
  id: string;
  questionId: string;
  userId: string;
  answer: string | null;
  isCorrect: boolean | null;
  createdAt: string;
  updatedAt: string;
  question?: FifaQuestion;
}

export interface FifaLeaderboardEntry {
  rank: number;
  user: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    avatarUrl?: string;
  };
  totalPoints: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalAnswers: number;
}

export interface FifaAuditLogEntry {
  id: string;
  action: string;
  performedBy: string;
  targetType: string;
  targetId: string;
  details: Record<string, any> | null;
  createdAt: string;
  performedByUser: { id: string; username: string; email: string; firstName?: string; lastName?: string } | null;
}

// Rounds API — fixed 7 rounds, admin can only edit name and lockTime
export const fifaRoundsAPI = {
  getAll: async (): Promise<FifaRound[]> => (await api.get('/fifa/rounds')).data,

  update: async (id: string, data: { name?: string; lockTime?: string | null }): Promise<FifaRound> =>
    (await api.put(`/fifa/rounds/${id}`, data)).data,

  activate: async (id: string): Promise<FifaRound> => (await api.patch(`/fifa/rounds/${id}/activate`)).data,

  deactivate: async (id: string): Promise<FifaRound> => (await api.patch(`/fifa/rounds/${id}/deactivate`)).data,

  lock: async (id: string): Promise<FifaRound> => (await api.patch(`/fifa/rounds/${id}/lock`)).data,

  unlock: async (id: string): Promise<FifaRound> => (await api.patch(`/fifa/rounds/${id}/unlock`)).data,
};

// Matches API
export const fifaMatchesAPI = {
  getAll: async (roundId?: string): Promise<FifaMatch[]> => (await api.get('/fifa/matches', { params: roundId ? { roundId } : {} })).data,

  getAllAdmin: async (): Promise<FifaMatch[]> => (await api.get('/fifa/admin/matches')).data,

  create: async (data: { roundId: string; matchNumber: number; homeTeam: string; awayTeam: string; matchDate: string; venue?: string; groupTeams?: string[] }): Promise<FifaMatch> =>
    (await api.post('/fifa/matches', data)).data,

  update: async (id: string, data: { matchNumber?: number; homeTeam?: string; awayTeam?: string; matchDate?: string; venue?: string; groupTeams?: string[] }): Promise<FifaMatch> =>
    (await api.put(`/fifa/matches/${id}`, data)).data,

  delete: async (id: string): Promise<void> => { await api.delete(`/fifa/matches/${id}`); },

  updateScore: async (id: string, homeScore: number, awayScore: number): Promise<FifaMatch> =>
    (await api.patch(`/fifa/matches/${id}/score`, { homeScore, awayScore })).data,
};

// Questions API
export const fifaQuestionsAPI = {
  getAll: async (roundId?: string): Promise<FifaQuestion[]> => (await api.get('/fifa/questions', { params: roundId ? { roundId } : {} })).data,

  getAllAdmin: async (): Promise<FifaQuestion[]> => (await api.get('/fifa/admin/questions')).data,

  create: async (data: { roundId?: string; matchId?: string; questionNumber: number; questionText: string; questionType: 'multiple_choice' | 'yes_no'; options?: string[]; points: number }): Promise<FifaQuestion> =>
    (await api.post('/fifa/questions', data)).data,

  update: async (id: string, data: { questionNumber?: number; questionText?: string; questionType?: 'multiple_choice' | 'yes_no'; options?: string[]; points?: number }): Promise<FifaQuestion> =>
    (await api.put(`/fifa/questions/${id}`, data)).data,

  delete: async (id: string): Promise<void> => { await api.delete(`/fifa/questions/${id}`); },

  setCorrectAnswer: async (id: string, correctAnswer: string): Promise<FifaQuestion> =>
    (await api.patch(`/fifa/questions/${id}/answer`, { correctAnswer })).data,

  clearCorrectAnswer: async (id: string): Promise<FifaQuestion> =>
    (await api.delete(`/fifa/questions/${id}/answer`)).data,
};

// Answers API
export const fifaAnswersAPI = {
  submit: async (answers: { questionId: string; answer: string }[]): Promise<FifaUserAnswer[]> =>
    (await api.post('/fifa/answers', { answers })).data,

  getUserAnswers: async (roundId?: string): Promise<FifaUserAnswer[]> => {
    const params = roundId ? { roundId } : {};
    return (await api.get('/fifa/answers', { params })).data;
  },

  getSpecificUserAnswers: async (userId: string, roundId?: string): Promise<FifaUserAnswer[]> => {
    const params = roundId ? { roundId } : {};
    return (await api.get(`/fifa/answers/user/${userId}`, { params })).data;
  },
};

// Leaderboard API
export const fifaLeaderboardAPI = {
  get: async (roundId?: string, scope?: string): Promise<FifaLeaderboardEntry[]> => {
    const params: Record<string, string> = {};
    if (roundId) params.roundId = roundId;
    if (scope) params.scope = scope;
    return (await api.get('/fifa/leaderboard', { params })).data;
  },
};

// Stats API
export interface FifaRoundBreakdown {
  roundNumber: number;
  roundName: string;
  points: number;
  correct: number;
  incorrect: number;
  total: number;
}

export const fifaStatsAPI = {
  getRoundBreakdown: async (userId: string): Promise<FifaRoundBreakdown[]> =>
    (await api.get(`/fifa/stats/round-breakdown/${userId}`)).data,
};

// Audit Log API
export const fifaAuditLogAPI = {
  getAll: async (filters?: { action?: string; performedBy?: string; limit?: number }): Promise<FifaAuditLogEntry[]> => {
    const params: Record<string, string> = {};
    if (filters?.action) params.action = filters.action;
    if (filters?.performedBy) params.performedBy = filters.performedBy;
    if (filters?.limit) params.limit = String(filters.limit);
    return (await api.get('/fifa/admin/audit-log', { params })).data;
  },
};
