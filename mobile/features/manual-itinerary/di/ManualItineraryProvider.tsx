import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { ManualItineraryRepository } from '../domain/repository/ManualItineraryRepository';

const ManualItineraryDependenciesContext = createContext<{
  manualItineraryRepository: ManualItineraryRepository;
} | null>(null);

export interface ManualItineraryProviderProps {
  manualItineraryRepository: ManualItineraryRepository;
  children: ReactNode;
}

export function ManualItineraryProvider({ manualItineraryRepository, children }: ManualItineraryProviderProps) {
  const value = useMemo(
    () => ({ manualItineraryRepository }),
    [manualItineraryRepository],
  );

  return (
    <ManualItineraryDependenciesContext.Provider value={value}>
      {children}
    </ManualItineraryDependenciesContext.Provider>
  );
}

export function useManualItineraryDependencies(): { manualItineraryRepository: ManualItineraryRepository } {
  const ctx = useContext(ManualItineraryDependenciesContext);
  if (!ctx) {
    throw new Error(
      'useManualItineraryDependencies must be used within a <ManualItineraryProvider>. ' +
        'Wrap your component tree with <ManualItineraryProvider manualItineraryRepository={...}>.',
    );
  }
  return ctx;
}
