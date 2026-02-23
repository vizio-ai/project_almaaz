import React, { createContext, useMemo } from 'react';
import { AuthDependencies, AuthExternalDependencies } from './AuthDependencies';
import { createAuthDependencies } from './AuthFactory';

export const AuthDependenciesContext = createContext<AuthDependencies | null>(
  null,
);

interface AuthProviderProps {
  dependencies: AuthExternalDependencies;
  children: React.ReactNode;
}

export function AuthProvider({ dependencies, children }: AuthProviderProps) {
  const value = useMemo(
    () => createAuthDependencies(dependencies),
    [dependencies],
  );

  return (
    <AuthDependenciesContext.Provider value={value}>
      {children}
    </AuthDependenciesContext.Provider>
  );
}
