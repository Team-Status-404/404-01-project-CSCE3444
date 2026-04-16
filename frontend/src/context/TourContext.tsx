import { createContext, useContext, useState, type ReactNode } from 'react';

interface TourContextValue {
  showTour: boolean;
  isRevisit: boolean;
  startTour: (revisit?: boolean) => void;
  endTour: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const [showTour, setShowTour] = useState(false);
  const [isRevisit, setIsRevisit] = useState(false);

  function startTour(revisit = false) {
    setIsRevisit(revisit);
    setShowTour(true);
  }

  function endTour() {
    setShowTour(false);
    setIsRevisit(false);
  }

  return (
    <TourContext.Provider value={{ showTour, isRevisit, startTour, endTour }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used inside TourProvider');
  return ctx;
}
