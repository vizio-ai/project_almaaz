import React, { createContext, useMemo } from 'react';
import { AdminDependencies, AdminExternalDependencies } from './AdminDependencies';
import { createAdminDependencies } from './AdminFactory';

export const AdminDependenciesContext = createContext<AdminDependencies | null>(null);

interface AdminProviderProps {
  dependencies: AdminExternalDependencies;
  children: React.ReactNode;
}

export function AdminProvider({ dependencies, children }: AdminProviderProps) {
  const value = useMemo(
    () => createAdminDependencies(dependencies),
    [dependencies],
  );

  return (
    <AdminDependenciesContext.Provider value={value}>
      {children}
    </AdminDependenciesContext.Provider>
  );
}
