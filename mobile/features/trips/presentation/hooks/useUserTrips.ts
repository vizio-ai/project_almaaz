import { useState, useEffect, useCallback } from 'react';
import { PopularTrip } from '../../domain/entities/PopularTrip';
import { useTripDependencies } from '../../di/useTripDependencies';

interface UseUserTripsResult {
  trips: PopularTrip[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useUserTrips(userId: string | undefined): UseUserTripsResult {
  const { getTripsByUserIdUseCase } = useTripDependencies();
  const [trips, setTrips] = useState<PopularTrip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getTripsByUserIdUseCase.execute({ userId }).then((result) => {
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
  }, [getTripsByUserIdUseCase, userId, fetchKey]);

  const refresh = useCallback(() => setFetchKey((k) => k + 1), []);

  return { trips, isLoading, error, refresh };
}
