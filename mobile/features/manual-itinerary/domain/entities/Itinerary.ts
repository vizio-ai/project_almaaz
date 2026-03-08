export interface Itinerary {
  id: string;
  /** Owner's user ID */
  userId?: string;
  title: string;
  destination: string;
  startDate: string | null;
  endDate?: string | null;
  creatorName?: string | null;
  creatorAvatarUrl?: string | null;
  coverImageUrl?: string | null;
  tripNotes?: string | null;
  /** Visible on discover/public feed */
  isPublic?: boolean;
  /** Others can clone this itinerary */
  isClonable?: boolean;
  isAiGenerated?: boolean;
}
