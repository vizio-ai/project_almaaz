import { useContext } from 'react';
import { TripDependenciesContext } from './TripProvider';
import { TripDependencies } from './TripDependencies';

export function useTripDependencies(): TripDependencies {
  const dependencies = useContext(TripDependenciesContext);

  if (!dependencies) {
    throw new Error(
      'useTripDependencies must be used within a <TripProvider>. ' +
        'Wrap your component tree with <TripProvider dependencies={...}>.',
    );
  }

  return dependencies;
}
