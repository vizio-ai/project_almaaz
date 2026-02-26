import type { FollowRemoteDataSource } from '@shared/follow';
import type { FollowUserDto } from '@shared/follow';
import { supabase } from '../supabase';

export function createFollowRemoteDataSource(): FollowRemoteDataSource {
  return {
    async followUser(followerId: string, followingId: string): Promise<void> {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: followerId, following_id: followingId });
      if (error) throw new Error(error.message);
    },

    async unfollowUser(followerId: string, followingId: string): Promise<void> {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);
      if (error) throw new Error(error.message);
    },

    async checkIsFollowing(followerId: string, followingId: string): Promise<boolean> {
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', followerId)
        .eq('following_id', followingId);
      if (error) throw new Error(error.message);
      return (count ?? 0) > 0;
    },

    async getFollowers(userId: string): Promise<FollowUserDto[]> {
      const { data, error } = await supabase
        .from('follows')
        .select('follower:profiles!follows_follower_id_fkey(id, name, surname, avatar_url)')
        .eq('following_id', userId);
      if (error) throw new Error(error.message);
      return (data ?? [])
        .map((row: any) => row.follower as FollowUserDto)
        .filter(Boolean);
    },

    async getFollowing(userId: string): Promise<FollowUserDto[]> {
      const { data, error } = await supabase
        .from('follows')
        .select('following:profiles!follows_following_id_fkey(id, name, surname, avatar_url)')
        .eq('follower_id', userId);
      if (error) throw new Error(error.message);
      return (data ?? [])
        .map((row: any) => row.following as FollowUserDto)
        .filter(Boolean);
    },
  };
}
