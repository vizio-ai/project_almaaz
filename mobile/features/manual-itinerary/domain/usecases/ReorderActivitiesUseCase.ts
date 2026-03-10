import type { ManualItineraryRepository } from '../repository/ManualItineraryRepository';

export class ReorderActivitiesUseCase {
  constructor(private readonly repository: ManualItineraryRepository) {}

  async execute(
    dayId: string,
    orderedActivityIds: string[],
  ): Promise<{ success: boolean }> {
    if (!dayId || orderedActivityIds.length === 0) return { success: false };
    return this.repository.reorderActivities(dayId, orderedActivityIds);
  }
}
