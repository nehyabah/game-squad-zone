import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Sport = 'nfl' | 'six-nations';

interface SportContextType {
  selectedSport: Sport;
  setSelectedSport: (sport: Sport) => void;
  hasSportSelection: boolean;
}

const SportContext = createContext<SportContextType | undefined>(undefined);

const SPORT_STORAGE_KEY = 'squadpot-selected-sport';

export function SportProvider({ children }: { children: ReactNode }) {
  const [selectedSport, setSelectedSportState] = useState<Sport>(() => {
    // Check localStorage for saved sport preference
    const saved = localStorage.getItem(SPORT_STORAGE_KEY);
    return (saved as Sport) || 'nfl'; // Default to NFL
  });

  const [hasSportSelection, setHasSportSelection] = useState<boolean>(() => {
    return localStorage.getItem(SPORT_STORAGE_KEY) !== null;
  });

  const setSelectedSport = (sport: Sport) => {
    setSelectedSportState(sport);
    localStorage.setItem(SPORT_STORAGE_KEY, sport);
    setHasSportSelection(true);
  };

  return (
    <SportContext.Provider
      value={{
        selectedSport,
        setSelectedSport,
        hasSportSelection,
      }}
    >
      {children}
    </SportContext.Provider>
  );
}

export function useSport() {
  const context = useContext(SportContext);
  if (context === undefined) {
    throw new Error('useSport must be used within a SportProvider');
  }
  return context;
}
