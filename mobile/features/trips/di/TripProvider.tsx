import React, { createContext, useMemo } from 'react';
import { TripDependencies, TripExternalDependencies } from './TripDependencies';
import { createTripDependencies } from './TripFactory';

export const TripDependenciesContext = createContext<TripDependencies | null>(null);

interface TripProviderProps {
  dependencies: TripExternalDependencies;
  children: React.ReactNode;
}

export function TripProvider({ dependencies, children }: TripProviderProps) {
  const value = useMemo(() => createTripDependencies(dependencies), [dependencies]);

  return (
    <TripDependenciesContext.Provider value={value}>
      {children}
    </TripDependenciesContext.Provider>
  );
}
