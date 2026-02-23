import { useContext } from 'react';
import { AuthDependenciesContext } from './AuthProvider';
import { AuthDependencies } from './AuthDependencies';

export function useAuthDependencies(): AuthDependencies {
  const dependencies = useContext(AuthDependenciesContext);

  if (!dependencies) {
    throw new Error(
      'useAuthDependencies must be used within an <AuthProvider>. ' +
        'Wrap your component tree with <AuthProvider dependencies={...}>.',
    );
  }

  return dependencies;
}
