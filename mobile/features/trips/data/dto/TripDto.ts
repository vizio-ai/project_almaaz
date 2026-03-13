/**
 * Raw row shape from the Supabase `trips` table.
 * Creator info is joined from the profiles table.
 */
export interface PopularTripDto {
  id: string;
  user_id: string;
  title: string;
  save_count: number;
  cover_image_url: string | null;
  creator_name: string;
}

export interface HomeActivityDto {
  id: string;
  name: string;
  activity_type: string | null;
  start_time: string | null;
  location_text: string | null;
}

export interface HomeItineraryDto {
  id: string;
  title: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  cover_image_url: string | null;
  today_accommodation: string | null;
  today_activities: HomeActivityDto[];
}
