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

    const handleSingleGameHydrated = (data: any) => {
      console.log("Game row hydrated:", data);
      // You can trigger a table refresh here or update a local state
    };

    const removeHydratedListener = window.api.onGameHydrated(handleSingleGameHydrated);

    // Cleanup when the app is closed/reloaded
    return () => {
      window.api.removeHydrationStartedListener(handleStart);
      window.api.removeHydrationFinishedListener(handleFinished);
      if (removeHydratedListener) removeHydratedListener;
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