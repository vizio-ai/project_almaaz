import type { Itinerary } from '../entities/Itinerary';
import type { ItineraryDay } from '../entities/ItineraryDay';
import type { Activity } from '../entities/Activity';
import type { TravelInfo, TravelInfoType } from '../entities/TravelInfo';

// ─── Itinerary ───────────────────────────────────────────────────────────────

export interface CreateItineraryParams {
  userId: string;
  title: string;
  destination: string;
  startDate?: string | null;
  endDate?: string | null;
  isPublic?: boolean;
  isClonable?: boolean;
  tripNotes?: string | null;
  isAiGenerated?: boolean;
  /** Optional travel info items to create together with the itinerary (create mode). */
  travelInfo?: AddTravelInfoParams[];
}

export interface UpdateItineraryParams {
  title?: string;
  destination?: string;
  startDate?: string | null;
  endDate?: string | null;
  tripNotes?: string | null;
  isPublic?: boolean;
  isClonable?: boolean;
  coverImageUrl?: string | null;
}

export interface ItineraryWithDetails {
  itinerary: Itinerary;
  days: ItineraryDay[];
  activities: Activity[];
  travelInfo: TravelInfo[];
}

// ─── Day ─────────────────────────────────────────────────────────────────────

export interface AddDayParams {
  /** ISO date string (YYYY-MM-DD). Optional — day may be dateless. */
  date?: string | null;
  /** Optional free-form notes for this day (Figma: "Add a note"). */
  notes?: string | null;
}

export interface UpdateDayParams {
  date?: string | null;
  notes?: string | null;
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export interface AddActivityParams {
  name: string;
  /** Omit to append at the end. */
  sortOrder?: number;
  locationText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface UpdateActivityParams {
  name?: string;
  sortOrder?: number;
  locationText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

// ─── TravelInfo ───────────────────────────────────────────────────────────────

export interface AddTravelInfoParams {
  type: TravelInfoType;
  title: string;
  provider?: string | null;
  detail?: string | null;
  startDatetime?: string | null;
  /** Optional end datetime (hotel check-out, rental car drop-off, etc.). */
  endDatetime?: string | null;
}

export interface UpdateTravelInfoParams {
  type?: TravelInfoType;
  title?: string;
  provider?: string | null;
  detail?: string | null;
  startDatetime?: string | null;
   /** Optional end datetime (hotel check-out, rental car drop-off, etc.). */
  endDatetime?: string | null;
}

// ─── Repository ───────────────────────────────────────────────────────────────

export interface ManualItineraryRepository {
  // Itinerary
  getById(id: string): Promise<ItineraryWithDetails | null>;
  create(params: CreateItineraryParams): Promise<{ success: boolean; id?: string }>;
  update(id: string, params: UpdateItineraryParams): Promise<{ success: boolean }>;
  remove(id: string): Promise<{ success: boolean }>;
  /**
   * Compress and upload a local image URI to the `covers` Storage bucket.
   * Returns the public URL on success.
   * Path pattern: covers/{userId}/{itineraryId}.jpg
   */
  uploadCoverImage(
    userId: string,
    itineraryId: string,
    localUri: string,
  ): Promise<{ success: boolean; url?: string }>;

  // Days
  addDay(itineraryId: string, params: AddDayParams): Promise<{ success: boolean; id?: string }>;
  updateDay(dayId: string, params: UpdateDayParams): Promise<{ success: boolean }>;
  removeDay(dayId: string): Promise<{ success: boolean }>;
  /** Persist a new day order by passing all dayIds in the desired sequence. */
  reorderDays(itineraryId: string, orderedDayIds: string[]): Promise<{ success: boolean }>;

  // Activities
  addActivity(dayId: string, params: AddActivityParams): Promise<{ success: boolean; id?: string }>;
  updateActivity(activityId: string, params: UpdateActivityParams): Promise<{ success: boolean }>;
  removeActivity(activityId: string): Promise<{ success: boolean }>;
  /** Persist a new activity order within a day. */
  reorderActivities(dayId: string, orderedActivityIds: string[]): Promise<{ success: boolean }>;

  // Travel Info
  addTravelInfo(itineraryId: string, params: AddTravelInfoParams): Promise<{ success: boolean; id?: string }>;
  updateTravelInfo(id: string, params: UpdateTravelInfoParams): Promise<{ success: boolean }>;
  removeTravelInfo(id: string): Promise<{ success: boolean }>;
}
