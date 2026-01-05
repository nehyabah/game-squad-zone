import { useState, useEffect } from 'react';
import { squadsAPI, type Squad, type CreateSquadData, type JoinSquadData } from '@/lib/api/squads';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useSport } from '@/hooks/use-sport';

export function useSquads() {
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { selectedSport } = useSport();

  const fetchSquads = async () => {
    setLoading(true);
    setError(null);
    try {
      const userSquads = await squadsAPI.getUserSquads(selectedSport);
      setSquads(userSquads);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch squads';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createSquad = async (data: CreateSquadData): Promise<Squad | null> => {
    setLoading(true);
    setError(null);
    try {
      const squadData = { ...data, sport: selectedSport };
      const newSquad = await squadsAPI.createSquad(squadData);
      setSquads(prev => [...prev, newSquad]);
      toast({
        title: 'Success',
        description: `Squad "${data.name}" created successfully!`,
      });
      return newSquad;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create squad';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const joinSquad = async (data: JoinSquadData): Promise<Squad | null> => {
    setLoading(true);
    setError(null);
    try {
      const joinedSquad = await squadsAPI.joinSquad(data);
      setSquads(prev => {
        const existing = prev.find(s => s.id === joinedSquad.id);
        if (existing) {
          return prev.map(s => s.id === joinedSquad.id ? joinedSquad : s);
        }
        return [...prev, joinedSquad];
      });
      toast({
        title: 'Success',
        description: `Joined squad "${joinedSquad.name}" successfully!`,
      });
      return joinedSquad;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join squad';
      setError(message);
      
      // Check if it's the "already a member" error to customize the toast
      const isAlreadyMember = message.includes('already part of') || message.includes('Already a member');
      
      toast({
        title: isAlreadyMember ? 'Already In Squad! 🎉' : 'Error',
        description: message,
        variant: isAlreadyMember ? 'default' : 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const leaveSquad = async (squadId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await squadsAPI.leaveSquad(squadId);
      setSquads(prev => prev.filter(s => s.id !== squadId));
      toast({
        title: 'Success',
        description: 'Left squad successfully',
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to leave squad';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteSquad = async (squadId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await squadsAPI.deleteSquad(squadId);
      setSquads(prev => prev.filter(s => s.id !== squadId));
      toast({
        title: 'Success',
        description: 'Squad deleted successfully',
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete squad';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch squads if user is authenticated
    if (user) {
      fetchSquads();
    }
  }, [user, selectedSport]);

  return {
    squads,
    loading,
    error,
    createSquad,
    joinSquad,
    leaveSquad,
    deleteSquad,
    refetch: fetchSquads,
  };
}

export function useSquad(squadId: string) {
  const [squad, setSquad] = useState<Squad | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSquad = async () => {
    if (!squadId) return;
    
    setLoading(true);
    setError(null);
    try {
      const squadData = await squadsAPI.getSquad(squadId);
      setSquad(squadData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch squad';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (data: Partial<CreateSquadData>): Promise<boolean> => {
    if (!squadId) return false;

    setLoading(true);
    setError(null);
    try {
      const updatedSquad = await squadsAPI.updateSquadSettings(squadId, data);
      setSquad(updatedSquad);
      toast({
        title: 'Success',
        description: 'Squad settings updated successfully',
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update squad settings';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSquad();
  }, [squadId]);

  return {
    squad,
    loading,
    error,
    updateSettings,
    refetch: fetchSquad,
  };
}