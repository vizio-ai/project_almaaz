import { useState, useEffect } from 'react';
import { PopularTrip } from '../../domain/entities/PopularTrip';
import { useTripDependencies } from '../../di/useTripDependencies';

const DEFAULT_LIMIT = 10;

interface UsePopularTripsResult {
  trips: PopularTrip[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function usePopularTrips(limit = DEFAULT_LIMIT): UsePopularTripsResult {
  const { getPopularTripsUseCase } = useTripDependencies();
  const [trips, setTrips] = useState<PopularTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    getPopularTripsUseCase.execute({ limit }).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setTrips(result.data);
      } else {
        setError(result.error.message);
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [getPopularTripsUseCase, limit, refreshKey]);

  return { trips, isLoading, error, refresh: () => setRefreshKey((k) => k + 1) };
}
