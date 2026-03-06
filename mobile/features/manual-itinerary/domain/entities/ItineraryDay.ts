export interface ItineraryDay {
  id: string;
  dayNumber: number;
  date: string | null;
  notes?: string | null;
  /** Hotel / accommodation name for this day. */
  accommodation?: string | null;
}
