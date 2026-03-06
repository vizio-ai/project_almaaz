import type { ManualItineraryRepository, UpdateActivityParams } from '../repository/ManualItineraryRepository';

export class UpdateActivityUseCase {
  constructor(private readonly repository: ManualItineraryRepository) {}

  async execute(activityId: string, params: UpdateActivityParams): Promise<{ success: boolean }> {
    if (params.name !== undefined && !params.name.trim()) return { success: false };
    const normalized = params.name !== undefined
      ? { ...params, name: params.name.trim() }
      : params;
    return this.repository.updateActivity(activityId, normalized);
  }
}
