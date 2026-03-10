export interface ItineraryDay {
  id: string;
  dayNumber: number;
  date: string | null;
  notes?: string | null;
  /** AI-generated summary of the day's activities. */
  summary?: string | null;
  /** Hotel / accommodation name for this day. */
  accommodation?: string | null;
  accommodationLatitude?: number | null;
  accommodationLongitude?: number | null;
}
