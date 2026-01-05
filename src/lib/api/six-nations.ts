// API client for Six Nations management
import { api } from './client';

// Types
export interface SixNationsRound {
  id: string;
  roundNumber: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  _count?: {
    matches: number;
  };
}

export interface SixNationsMatch {
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
  round?: SixNationsRound;
  _count?: {
    questions: number;
  };
}

export interface SixNationsQuestion {
  id: string;
  matchId: string;
  questionNumber: number;
  questionText: string;
  questionType: 'multiple_choice' | 'yes_no';
  options: string[] | null;
  correctAnswer: string | null;
  points: number;
  text?: string; // Alias for questionText
  match?: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    matchDate?: string; // Include matchDate for visibility checks
    round?: SixNationsRound;
  };
}

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  isAdmin: boolean;
}

// Rounds API
export const roundsAPI = {
  getAll: async (): Promise<SixNationsRound[]> => {
    const response = await api.get('/six-nations/rounds');
    return response.data;
  },

  create: async (data: {
    roundNumber: number;
    name: string;
    startDate: string;
    endDate: string;
  }): Promise<SixNationsRound> => {
    const response = await api.post('/six-nations/rounds', data);
    return response.data;
  },

  update: async (id: string, data: {
    roundNumber?: number;
    name?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<SixNationsRound> => {
    const response = await api.put(`/six-nations/rounds/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/six-nations/rounds/${id}`);
  },

  activate: async (id: string): Promise<SixNationsRound> => {
    const response = await api.patch(`/six-nations/rounds/${id}/activate`);
    return response.data;
  },
};

// Matches API
export const matchesAPI = {
  getAll: async (): Promise<SixNationsMatch[]> => {
    const response = await api.get('/six-nations/matches');
    return response.data;
  },

  // Admin: Get all matches regardless of round activation status
  getAllAdmin: async (): Promise<SixNationsMatch[]> => {
    const response = await api.get('/six-nations/admin/matches');
    return response.data;
  },

  create: async (data: {
    roundId: string;
    matchNumber: number;
    homeTeam: string;
    awayTeam: string;
    matchDate: string;
    venue?: string;
  }): Promise<SixNationsMatch> => {
    const response = await api.post('/six-nations/matches', data);
    return response.data;
  },

  update: async (id: string, data: {
    matchNumber?: number;
    homeTeam?: string;
    awayTeam?: string;
    matchDate?: string;
    venue?: string;
  }): Promise<SixNationsMatch> => {
    const response = await api.put(`/six-nations/matches/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/six-nations/matches/${id}`);
  },

  updateScore: async (id: string, homeScore: number, awayScore: number): Promise<SixNationsMatch> => {
    const response = await api.patch(`/six-nations/matches/${id}/score`, { homeScore, awayScore });
    return response.data;
  },
};

// Questions API
export const questionsAPI = {
  getAll: async (): Promise<SixNationsQuestion[]> => {
    const response = await api.get('/six-nations/questions');
    return response.data;
  },

  // Admin: Get all questions regardless of round activation status
  getAllAdmin: async (): Promise<SixNationsQuestion[]> => {
    const response = await api.get('/six-nations/admin/questions');
    return response.data;
  },

  create: async (data: {
    matchId: string;
    questionNumber: number;
    questionText: string;
    questionType: 'multiple_choice' | 'yes_no';
    options?: string[];
    points: number;
  }): Promise<SixNationsQuestion> => {
    const response = await api.post('/six-nations/questions', data);
    return response.data;
  },

  update: async (id: string, data: {
    questionNumber?: number;
    questionText?: string;
    questionType?: 'multiple_choice' | 'yes_no';
    options?: string[];
    points?: number;
  }): Promise<SixNationsQuestion> => {
    const response = await api.put(`/six-nations/questions/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/six-nations/questions/${id}`);
  },

  setCorrectAnswer: async (id: string, correctAnswer: string): Promise<SixNationsQuestion> => {
    const response = await api.patch(`/six-nations/questions/${id}/answer`, { correctAnswer });
    return response.data;
  },
};

// Admin Users API
export const adminUsersAPI = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get('/six-nations/admin/users');
    return response.data;
  },

  toggleAdmin: async (id: string, isAdmin: boolean): Promise<User> => {
    const response = await api.patch(`/six-nations/admin/users/${id}/admin`, { isAdmin });
    return response.data;
  },
};

// Answers API
export interface SixNationsUserAnswer {
  id: string;
  questionId: string;
  userId: string;
  answer: string | null; // Can be null when hidden (before match starts)
  isCorrect: boolean | null; // Can be null when hidden or pending
  createdAt: string;
  updatedAt: string;
  question?: SixNationsQuestion;
}

export const answersAPI = {
  submit: async (answers: { questionId: string; answer: string }[]): Promise<SixNationsUserAnswer[]> => {
    const response = await api.post('/six-nations/answers', { answers });
    return response.data;
  },

  getUserAnswers: async (roundId?: string): Promise<SixNationsUserAnswer[]> => {
    const params = roundId ? { roundId } : {};
    const response = await api.get('/six-nations/answers', { params });
    return response.data;
  },

  getSpecificUserAnswers: async (userId: string, roundId?: string): Promise<SixNationsUserAnswer[]> => {
    const params = roundId ? { roundId } : {};
    const response = await api.get(`/six-nations/answers/user/${userId}`, { params });
    return response.data;
  },
};

// Leaderboard API
export interface SixNationsLeaderboardEntry {
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

export const leaderboardAPI = {
  get: async (roundId?: string): Promise<SixNationsLeaderboardEntry[]> => {
    const params = roundId ? { roundId } : {};
    const response = await api.get('/six-nations/leaderboard', { params });
    return response.data;
  },
};
