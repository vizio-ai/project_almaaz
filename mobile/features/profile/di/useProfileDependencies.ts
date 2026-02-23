import { useContext } from 'react';
import { ProfileDependenciesContext } from './ProfileProvider';
import { ProfileDependencies } from './ProfileDependencies';

export function useProfileDependencies(): ProfileDependencies {
  const dependencies = useContext(ProfileDependenciesContext);

  if (!dependencies) {
    throw new Error(
      'useProfileDependencies must be used within a <ProfileProvider>. ' +
        'Wrap your component tree with <ProfileProvider dependencies={...}>.',
    );
  }

  return dependencies;
}
