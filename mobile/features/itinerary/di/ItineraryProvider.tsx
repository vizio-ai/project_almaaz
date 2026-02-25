import React, { createContext, useMemo } from 'react';
import { ItineraryDependencies, ItineraryExternalDependencies } from './ItineraryDependencies';
import { createItineraryDependencies } from './ItineraryFactory';

export const ItineraryDependenciesContext = createContext<ItineraryDependencies | null>(null);

interface ItineraryProviderProps {
  dependencies: ItineraryExternalDependencies;
  children: React.ReactNode;
}

export function ItineraryProvider({ dependencies, children }: ItineraryProviderProps) {
  const value = useMemo(
    () => createItineraryDependencies(dependencies),
    [dependencies],
  );

  return (
    <ItineraryDependenciesContext.Provider value={value}>
      {children}
    </ItineraryDependenciesContext.Provider>
  );
}
