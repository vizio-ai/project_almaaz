import React, { createContext, useMemo } from 'react';
import { ProfileDependencies, ProfileExternalDependencies } from './ProfileDependencies';
import { createProfileDependencies } from './ProfileFactory';

export const ProfileDependenciesContext = createContext<ProfileDependencies | null>(null);

interface ProfileProviderProps {
  dependencies: ProfileExternalDependencies;
  children: React.ReactNode;
}

export function ProfileProvider({ dependencies, children }: ProfileProviderProps) {
  const value = useMemo(
    () => createProfileDependencies(dependencies),
    [dependencies],
  );

  return (
    <ProfileDependenciesContext.Provider value={value}>
      {children}
    </ProfileDependenciesContext.Provider>
  );
}
