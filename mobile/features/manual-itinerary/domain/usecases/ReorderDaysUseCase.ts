import type { ManualItineraryRepository } from '../repository/ManualItineraryRepository';

export class ReorderDaysUseCase {
  constructor(private readonly repository: ManualItineraryRepository) {}

  async execute(
    itineraryId: string,
    orderedDayIds: string[],
  ): Promise<{ success: boolean }> {
    if (!itineraryId || orderedDayIds.length === 0) return { success: false };
    return this.repository.reorderDays(itineraryId, orderedDayIds);
  }
}
