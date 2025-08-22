import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Pick {
  gameId: string;
  team: 'home' | 'away';
  gameInfo?: {
    homeTeam: string;
    awayTeam: string;
    spread: number;
  };
}

interface PicksContextType {
  selectedPicks: Map<string, 'home' | 'away'>;
  setSelectedPicks: (picks: Map<string, 'home' | 'away'>) => void;
  addPick: (gameId: string, team: 'home' | 'away') => void;
  removePick: (gameId: string) => void;
  clearPicks: () => void;
}

const PicksContext = createContext<PicksContextType | undefined>(undefined);

export const PicksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedPicks, setSelectedPicks] = useState<Map<string, 'home' | 'away'>>(new Map());

  const addPick = (gameId: string, team: 'home' | 'away') => {
    const newPicks = new Map(selectedPicks);
    newPicks.set(gameId, team);
    setSelectedPicks(newPicks);
  };

  const removePick = (gameId: string) => {
    const newPicks = new Map(selectedPicks);
    newPicks.delete(gameId);
    setSelectedPicks(newPicks);
  };

  const clearPicks = () => {
    setSelectedPicks(new Map());
  };

  return (
    <PicksContext.Provider value={{
      selectedPicks,
      setSelectedPicks,
      addPick,
      removePick,
      clearPicks
    }}>
      {children}
    </PicksContext.Provider>
  );
};

export const usePicks = () => {
  const context = useContext(PicksContext);
  if (context === undefined) {
    throw new Error('usePicks must be used within a PicksProvider');
  }
  return context;
};