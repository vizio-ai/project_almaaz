import { useCallback, useMemo } from 'react';
import { useManualItineraryDependencies } from '../../di/ManualItineraryProvider';
import { AddActivityUseCase } from '../../domain/usecases/AddActivityUseCase';
import { UpdateActivityUseCase } from '../../domain/usecases/UpdateActivityUseCase';
import { RemoveActivityUseCase } from '../../domain/usecases/RemoveActivityUseCase';

export function useActivityMutations(refresh: () => void) {
  const { manualItineraryRepository } = useManualItineraryDependencies();

  const addUseCase = useMemo(
    () => new AddActivityUseCase(manualItineraryRepository),
    [manualItineraryRepository],
  );
  const updateUseCase = useMemo(
    () => new UpdateActivityUseCase(manualItineraryRepository),
    [manualItineraryRepository],
  );
  const removeUseCase = useMemo(
    () => new RemoveActivityUseCase(manualItineraryRepository),
    [manualItineraryRepository],
  );

  const addActivity = useCallback(
    async (dayId: string, name: string) => {
      const result = await addUseCase.execute(dayId, name);
      if (result.success) refresh();
      return result;
    },
    [addUseCase, refresh],
  );

  const updateActivity = useCallback(
    async (activityId: string, name: string) => {
      const result = await updateUseCase.execute(activityId, name);
      if (result.success) refresh();
      return result;
    },
    [updateUseCase, refresh],
  );

  const removeActivity = useCallback(
    async (activityId: string) => {
      const result = await removeUseCase.execute(activityId);
      if (result.success) refresh();
      return result;
    },
    [removeUseCase, refresh],
  );

  return { addActivity, updateActivity, removeActivity };
}
