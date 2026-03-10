import { useCallback, useMemo } from 'react';
import { useManualItineraryDependencies } from '../../di/ManualItineraryProvider';
import { AddActivityUseCase } from '../../domain/usecases/AddActivityUseCase';
import { UpdateActivityUseCase } from '../../domain/usecases/UpdateActivityUseCase';
import { RemoveActivityUseCase } from '../../domain/usecases/RemoveActivityUseCase';
import { ReorderActivitiesUseCase } from '../../domain/usecases/ReorderActivitiesUseCase';
import type { AddActivityParams, UpdateActivityParams } from '../../domain/repository/ManualItineraryRepository';

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
  const reorderUseCase = useMemo(
    () => new ReorderActivitiesUseCase(manualItineraryRepository),
    [manualItineraryRepository],
  );

  const addActivity = useCallback(
    async (dayId: string, params: AddActivityParams) => {
      const result = await addUseCase.execute(dayId, params);
      if (result.success) refresh();
      return result;
    },
    [addUseCase, refresh],
  );

  const updateActivity = useCallback(
    async (activityId: string, params: UpdateActivityParams) => {
      const result = await updateUseCase.execute(activityId, params);
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

  const updateActivityLocation = useCallback(
    async (
      activityId: string,
      locationText: string | null,
      latitude: number | null,
      longitude: number | null,
    ) => {
      const result = await updateUseCase.execute(activityId, {
        locationText,
        latitude,
        longitude,
      });
      if (result.success) refresh();
      return result;
    },
    [updateUseCase, refresh],
  );

  const reorderActivities = useCallback(
    async (dayId: string, orderedActivityIds: string[]) => {
      const result = await reorderUseCase.execute(dayId, orderedActivityIds);
      if (result.success) refresh();
      return result;
    },
    [reorderUseCase, refresh],
  );

  return { addActivity, updateActivity, removeActivity, updateActivityLocation, reorderActivities };
}
