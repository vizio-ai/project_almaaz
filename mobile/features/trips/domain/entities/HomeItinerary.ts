export interface HomeActivity {
  id: string;
  name: string;
  activityType: string | null;
  startTime: string | null;
  locationText: string | null;
}

export interface HomeItinerary {
  id: string;
  title: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  coverImageUrl: string | null;
  todayAccommodation: string | null;
  todayActivities: HomeActivity[];
}
