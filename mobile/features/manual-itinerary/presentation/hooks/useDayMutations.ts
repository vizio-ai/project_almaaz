import { useCallback, useMemo } from 'react';
import { useManualItineraryDependencies } from '../../di/ManualItineraryProvider';
import { AddDayUseCase } from '../../domain/usecases/AddDayUseCase';
import { UpdateDayUseCase } from '../../domain/usecases/UpdateDayUseCase';
import { RemoveDayUseCase } from '../../domain/usecases/RemoveDayUseCase';

export function useDayMutations(itineraryId: string | null, refresh: () => void) {
  const { manualItineraryRepository } = useManualItineraryDependencies();

  const addUseCase = useMemo(
    () => new AddDayUseCase(manualItineraryRepository),
    [manualItineraryRepository],
  );
  const updateUseCase = useMemo(
    () => new UpdateDayUseCase(manualItineraryRepository),
    [manualItineraryRepository],
  );
  const removeUseCase = useMemo(
    () => new RemoveDayUseCase(manualItineraryRepository),
    [manualItineraryRepository],
  );

  const addDay = useCallback(async () => {
    if (!itineraryId) return { success: false as const };
    const result = await addUseCase.execute(itineraryId);
    if (result.success) refresh();
    return result;
  }, [itineraryId, addUseCase, refresh]);

  const updateDay = useCallback(
    async (dayId: string, notes: string | null) => {
      // No refresh — caller handles UI state to avoid losing cursor focus
      return updateUseCase.execute(dayId, notes);
    },
    [updateUseCase],
  );

  const removeDay = useCallback(
    async (dayId: string) => {
      const result = await removeUseCase.execute(dayId);
      if (result.success) refresh();
      return result;
    },
    [removeUseCase, refresh],
  );

  return { addDay, updateDay, removeDay };
}
