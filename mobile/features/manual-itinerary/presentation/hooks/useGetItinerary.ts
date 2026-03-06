import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useManualItineraryDependencies } from '../../di/ManualItineraryProvider';
import { GetItineraryUseCase } from '../../domain/usecases/GetItineraryUseCase';
import type { Itinerary } from '../../domain/entities/Itinerary';
import type { ItineraryDay } from '../../domain/entities/ItineraryDay';
import type { Activity } from '../../domain/entities/Activity';
import type { TravelInfo } from '../../domain/entities/TravelInfo';

export function useGetItinerary(itineraryId: string | null): {
  itinerary: Itinerary | null;
  days: ItineraryDay[];
  activities: Activity[];
  travelInfo: TravelInfo[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
} {
  const { manualItineraryRepository } = useManualItineraryDependencies();
  const getUseCase = useMemo(
    () => new GetItineraryUseCase(manualItineraryRepository),
    [manualItineraryRepository],
  );
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [travelInfo, setTravelInfo] = useState<TravelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(!!itineraryId);
  const [error, setError] = useState<string | null>(null);
  // Only show the full-screen spinner on the very first load.
  // Subsequent refresh() calls (after mutations) update data silently.
  const initialLoadDone = useRef(false);

  const load = useCallback(async () => {
    if (!itineraryId) {
      setItinerary(null);
      setDays([]);
      setActivities([]);
      setTravelInfo([]);
      setIsLoading(false);
      setError(null);
      initialLoadDone.current = false;
      return;
    }
    if (!initialLoadDone.current) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const result = await getUseCase.execute(itineraryId);
      if (result) {
        setItinerary(result.itinerary);
        setDays(result.days);
        setActivities(result.activities);
        setTravelInfo(result.travelInfo);
      } else {
        setItinerary(null);
        setDays([]);
        setActivities([]);
        setTravelInfo([]);
        setError('Itinerary not found');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load itinerary');
      setItinerary(null);
      setDays([]);
      setActivities([]);
      setTravelInfo([]);
    } finally {
      initialLoadDone.current = true;
      setIsLoading(false);
    }
  }, [itineraryId, getUseCase]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    itinerary,
    days,
    activities,
    travelInfo,
    isLoading,
    error,
    refresh: load,
  };
}
