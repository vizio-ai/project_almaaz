import type { TripRemoteDataSource, PopularTripDto } from '@shared/trips';
import { supabase } from '../supabase';

export function createTripRemoteDataSource(): TripRemoteDataSource {
  return {
    async getPopularTrips(limit: number): Promise<PopularTripDto[]> {
      const { data, error } = await supabase
        .from('trips')
        .select('id, title, save_count, cover_image_url, creator_name')
        .order('save_count', { ascending: false })
        .limit(limit);

      if (error) throw new Error(error.message);

      return (data ?? []) as PopularTripDto[];
    },

    async getTripsByUserId(userId: string): Promise<PopularTripDto[]> {
      const { data, error } = await supabase
        .from('trips')
        .select('id, title, save_count, cover_image_url, creator_name')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);

      return (data ?? []) as PopularTripDto[];
    },
  };
}
