/**
 * Raw row shape from the Supabase `trips` table.
 * Creator info is joined from the profiles table.
 */
export interface PopularTripDto {
  id: string;
  title: string;
  save_count: number;
  cover_image_url: string | null;
  creator_name: string;
}
