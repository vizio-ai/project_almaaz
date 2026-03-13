import type { TripRemoteDataSource, PopularTripDto, HomeItineraryDto } from '@shared/trips';
import { supabase } from '../supabase';

export function createTripRemoteDataSource(): TripRemoteDataSource {
  return {
    async getPopularTrips(limit: number): Promise<PopularTripDto[]> {
      const { data, error } = await supabase
        .from('trips')
        .select('id, user_id, title, save_count, cover_image_url, creator_name')
        .order('save_count', { ascending: false })
        .limit(limit);

      if (error) throw new Error(error.message);

      return (data ?? []) as PopularTripDto[];
    },

    async getTripsByUserId(userId: string): Promise<PopularTripDto[]> {
      const { data, error } = await supabase
        .from('trips')
        .select('id, user_id, title, save_count, cover_image_url, creator_name')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);

      return (data ?? []) as PopularTripDto[];
    },

    async getHomeItineraries(userId: string): Promise<HomeItineraryDto[]> {
      const { data, error } = await supabase
        .from('itineraries')
        .select('id, title, destination, start_date, end_date, cover_image_url')
        .eq('user_id', userId)
        .order('start_date', { ascending: true });

      if (error) throw new Error(error.message);

      const today = new Date().toISOString().split('T')[0];
      const result: HomeItineraryDto[] = [];

      for (const row of (data ?? [])) {
        let today_activities: HomeItineraryDto['today_activities'] = [];

        const isActive =
          row.start_date &&
          row.end_date &&
          row.start_date <= today &&
          today <= row.end_date;

        let today_accommodation: string | null = null;

        if (isActive) {
          const { data: dayData } = await supabase
            .from('itinerary_days')
            .select('id, accommodation')
            .eq('itinerary_id', row.id)
            .eq('date', today)
            .maybeSingle();

          if (dayData) {
            today_accommodation = dayData.accommodation ?? null;

            const { data: acts } = await supabase
              .from('itinerary_activities')
              .select('id, name, activity_type, start_time, location_text')
              .eq('day_id', dayData.id)
              .order('sort_order', { ascending: true });

            today_activities = (acts ?? []).map((a) => ({
              id: a.id,
              name: a.name,
              activity_type: a.activity_type ?? null,
              start_time: a.start_time ?? null,
              location_text: a.location_text ?? null,
            }));
          }
        }

        result.push({
          id: row.id,
          title: row.title,
          destination: row.destination,
          start_date: row.start_date ?? null,
          end_date: row.end_date ?? null,
          cover_image_url: row.cover_image_url ?? null,
          today_accommodation,
          today_activities,
        });
      }

      return result;
    },
  };
}
