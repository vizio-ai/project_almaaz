export interface Activity {
  id: string;
  dayId: string;
  sortOrder: number;
  name: string;
  /** Plain text fallback when no map result is found */
  locationText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}
