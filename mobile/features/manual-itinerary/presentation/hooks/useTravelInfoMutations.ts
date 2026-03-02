import { useCallback, useMemo } from 'react';
import { useManualItineraryDependencies } from '../../di/ManualItineraryProvider';
import { AddTravelInfoUseCase } from '../../domain/usecases/AddTravelInfoUseCase';
import { UpdateTravelInfoUseCase } from '../../domain/usecases/UpdateTravelInfoUseCase';
import { RemoveTravelInfoUseCase } from '../../domain/usecases/RemoveTravelInfoUseCase';
import type {
  AddTravelInfoParams,
  UpdateTravelInfoParams,
} from '../../domain/repository/ManualItineraryRepository';

export function useTravelInfoMutations(itineraryId: string | null, refresh: () => void) {
  const { manualItineraryRepository } = useManualItineraryDependencies();

  const addUseCase = useMemo(
    () => new AddTravelInfoUseCase(manualItineraryRepository),
    [manualItineraryRepository],
  );
  const updateUseCase = useMemo(
    () => new UpdateTravelInfoUseCase(manualItineraryRepository),
    [manualItineraryRepository],
  );
  const removeUseCase = useMemo(
    () => new RemoveTravelInfoUseCase(manualItineraryRepository),
    [manualItineraryRepository],
  );

  const addTravelInfo = useCallback(
    async (params: AddTravelInfoParams) => {
      if (!itineraryId) return { success: false as const };
      const result = await addUseCase.execute(itineraryId, params);
      if (result.success) refresh();
      return result;
    },
    [itineraryId, addUseCase, refresh],
  );

  const updateTravelInfo = useCallback(
    async (id: string, params: UpdateTravelInfoParams) => {
      const result = await updateUseCase.execute(id, params);
      if (result.success) refresh();
      return result;
    },
    [updateUseCase, refresh],
  );

  const removeTravelInfo = useCallback(
    async (id: string) => {
      const result = await removeUseCase.execute(id);
      if (result.success) refresh();
      return result;
    },
    [removeUseCase, refresh],
  );

  return { addTravelInfo, updateTravelInfo, removeTravelInfo };
}
