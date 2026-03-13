import { useState, useEffect, useCallback } from 'react';
import { useTripDependencies } from '../../di/useTripDependencies';
import type { HomeItinerary } from '../../domain/entities/HomeItinerary';

export interface HomeTripsData {
  activeTripToday: HomeItinerary | null;
  upcomingTrip: HomeItinerary | null;
  pastTripsCount: number;
  isLoading: boolean;
}

export function useHomeTrips(userId: string | undefined): HomeTripsData {
  const { getHomeDataUseCase } = useTripDependencies();
  const [data, setData] = useState<HomeTripsData>({
    activeTripToday: null,
    upcomingTrip: null,
    pastTripsCount: 0,
    isLoading: false,
  });

  const load = useCallback(async () => {
    if (!userId) return;

    setData((prev) => ({ ...prev, isLoading: true }));

    const result = await getHomeDataUseCase.execute({ userId });

    if (!result.success) {
      setData((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const itineraries = result.data;

    const activeTripToday =
      itineraries.find(
        (t) =>
          t.startDate &&
          t.endDate &&
          t.startDate <= today &&
          today <= t.endDate,
      ) ?? null;

    const upcomingTrip =
      itineraries.find((t) => t.startDate && t.startDate > today) ?? null;

    const pastTripsCount = itineraries.filter(
      (t) => t.endDate && t.endDate < today,
    ).length;

    setData({ activeTripToday, upcomingTrip, pastTripsCount, isLoading: false });
  }, [userId, getHomeDataUseCase]);

  useEffect(() => {
    load();
  }, [load]);

  return data;
}
