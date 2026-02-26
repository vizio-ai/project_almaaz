import { useContext } from 'react';
import { FollowContext } from './FollowProvider';
import { FollowDependencies } from './FollowDependencies';

export function useFollowDependencies(): FollowDependencies {
  const ctx = useContext(FollowContext);
  if (!ctx) throw new Error('useFollowDependencies must be used within a FollowProvider');
  return ctx;
}
