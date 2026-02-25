import { useContext } from 'react';
import { AdminDependenciesContext } from './AdminProvider';
import { AdminDependencies } from './AdminDependencies';

export function useAdminDependencies(): AdminDependencies {
  const deps = useContext(AdminDependenciesContext);
  if (!deps) {
    throw new Error(
      'useAdminDependencies must be used within <AdminProvider>.',
    );
  }
  return deps;
}
