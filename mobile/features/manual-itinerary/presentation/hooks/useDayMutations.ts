import { useCallback, useMemo } from 'react';
import { useManualItineraryDependencies } from '../../di/ManualItineraryProvider';
import { AddDayUseCase } from '../../domain/usecases/AddDayUseCase';
import { UpdateDayUseCase } from '../../domain/usecases/UpdateDayUseCase';
import { RemoveDayUseCase } from '../../domain/usecases/RemoveDayUseCase';
import { ReorderDaysUseCase } from '../../domain/usecases/ReorderDaysUseCase';
import type { UpdateDayParams } from '../../domain/repository/ManualItineraryRepository';

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
  const reorderUseCase = useMemo(
    () => new ReorderDaysUseCase(manualItineraryRepository),
    [manualItineraryRepository],
  );

  const addDay = useCallback(async () => {
    if (!itineraryId) return { success: false as const };
    const result = await addUseCase.execute(itineraryId);
    if (result.success) refresh();
    return result;
  }, [itineraryId, addUseCase, refresh]);

  const updateDay = useCallback(
    async (dayId: string, params: UpdateDayParams) => {
      const result = await updateUseCase.execute(dayId, params);
      if (result.success) setTimeout(refresh, 300);
      return result;
    },
    [updateUseCase, refresh],
  );

  const removeDay = useCallback(
    async (dayId: string) => {
      const result = await removeUseCase.execute(dayId);
      if (result.success) refresh();
      return result;
    },
    [removeUseCase, refresh],
  );

  const reorderDays = useCallback(
    async (orderedDayIds: string[]) => {
      if (!itineraryId) return { success: false as const };
      const result = await reorderUseCase.execute(itineraryId, orderedDayIds);
      if (result.success) refresh();
      return result;
    },
    [itineraryId, reorderUseCase, refresh],
  );

  return { addDay, updateDay, removeDay, reorderDays };
}
