import { useState, useEffect } from 'react';
import { leaderboardAPI, type LeaderboardEntry, type WeeklyLeaderboardEntry } from '@/lib/api/leaderboards';
import { toast } from '@/hooks/use-toast';
import { useSport } from '@/hooks/use-sport';

export function useSeasonLeaderboard() {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedSport } = useSport();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await leaderboardAPI.getSeasonLeaderboard(selectedSport);

      // Sort by win percentage descending, then by points descending
      const sortedResult = result.sort((a, b) => {
        if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
        return b.points - a.points;
      });

      setData(sortedResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch season leaderboard';
      setError(errorMessage);
      console.error('Season leaderboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedSport]);

  return { data, loading, error, refetch: fetchData };
}

export function useWeeklyLeaderboard(weekId: string) {
  const [data, setData] = useState<WeeklyLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedSport } = useSport();

  const fetchData = async () => {
    if (!weekId) return;

    try {
      setLoading(true);
      setError(null);
      const result = await leaderboardAPI.getWeeklyLeaderboard(weekId, selectedSport);

      // Sort by win percentage descending, then by points descending
      const sortedResult = result.sort((a, b) => {
        if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
        return b.points - a.points;
      });

      setData(sortedResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weekly leaderboard';
      setError(errorMessage);
      console.error('Weekly leaderboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [weekId, selectedSport]);

  return { data, loading, error, refetch: fetchData };
}

export function useSquadLeaderboard(squadId: string, weekId?: string) {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!squadId) return;

    try {
      setLoading(true);
      setError(null);
      const result = await leaderboardAPI.getSquadLeaderboard(squadId, weekId);

      // Sort by win percentage descending, then by points descending
      const sortedResult = result.sort((a, b) => {
        if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
        return b.points - a.points;
      });

      setData(sortedResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch squad leaderboard';
      setError(errorMessage);
      console.error('Squad leaderboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [squadId, weekId]);

  return { data, loading, error, refetch: fetchData };
}

// Generic leaderboard hook
export function useLeaderboard(params?: {
  scope?: 'squad' | 'global';
  week?: string;
  squadId?: string;
}) {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await leaderboardAPI.getLeaderboard(params);

      // Sort by win percentage descending, then by points descending
      const sortedResult = result.sort((a, b) => {
        if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
        return b.points - a.points;
      });

      setData(sortedResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch leaderboard';
      setError(errorMessage);
      console.error('Leaderboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params?.scope, params?.week, params?.squadId]);

  return { data, loading, error, refetch: fetchData };
}