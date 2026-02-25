import { useContext } from 'react';
import { ItineraryDependenciesContext } from './ItineraryProvider';
import { ItineraryDependencies } from './ItineraryDependencies';

export function useItineraryDependencies(): ItineraryDependencies {
  const dependencies = useContext(ItineraryDependenciesContext);

  if (!dependencies) {
    throw new Error(
      'useItineraryDependencies must be used within a <ItineraryProvider>. ' +
        'Wrap your component tree with <ItineraryProvider dependencies={...}>.',
    );
  }

  return dependencies;
}
