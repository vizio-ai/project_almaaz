import React, { createContext, useMemo, type ReactNode } from 'react';
import { FollowDependencies, FollowExternalDependencies } from './FollowDependencies';
import { createFollowDependencies } from './FollowFactory';

export const FollowContext = createContext<FollowDependencies | null>(null);

interface FollowProviderProps {
  dependencies: FollowExternalDependencies;
  children: ReactNode;
}

export function FollowProvider({ dependencies, children }: FollowProviderProps) {
  const value = useMemo(() => createFollowDependencies(dependencies), [dependencies]);
  return <FollowContext.Provider value={value}>{children}</FollowContext.Provider>;
}
