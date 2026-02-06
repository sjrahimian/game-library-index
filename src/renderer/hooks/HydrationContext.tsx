import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the shape of our context
interface HydrationContextType {
  isHydrating: boolean;
}

const HydrationContext = createContext<HydrationContextType | undefined>(undefined);

export const HydrationProvider = ({ children }: { children: ReactNode }) => {
  const [isHydrating, setIsHydrating] = useState(false);

  useEffect(() => {
    // These listeners are set up once when the Provider mounts
    const handleStart = () => setIsHydrating(true);
    const handleFinished = () => setIsHydrating(false);

    // Subscribe using your API
    window.api.onHydrationStarted(handleStart);
    window.api.onHydrationFinished(handleFinished);

    // Cleanup: This runs only when the app is closed/reloaded
    return () => {
      window.api.removeHydrationStartedListener(handleStart);
      window.api.removeHydrationFinishedListener(handleFinished);
    };
  }, []);

  return (
    <HydrationContext.Provider value={{ isHydrating }}>
      {children}
    </HydrationContext.Provider>
  );
};

// Custom hook for easy access
export const useHydration = () => {
  const context = useContext(HydrationContext);
  if (context === undefined) {
    throw new Error('useHydration must be used within a HydrationProvider');
  }
  return context;
};