export type ActivityType = 'park' | 'museum' | 'food' | 'shopping' | 'historic' | 'beach';

export interface Activity {
  id: string;
  dayId: string;
  sortOrder: number;
  name: string;
  activityType?: ActivityType | null;
  /** User-selected start time as formatted string, e.g. "9:00 AM". */
  startTime?: string | null;
  /** Plain text fallback when no map result is found */
  locationText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}
