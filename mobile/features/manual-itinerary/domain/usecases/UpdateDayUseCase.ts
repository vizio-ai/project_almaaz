import type { ManualItineraryRepository } from '../repository/ManualItineraryRepository';

export class UpdateDayUseCase {
  constructor(private readonly repository: ManualItineraryRepository) {}

  async execute(dayId: string, notes: string | null): Promise<{ success: boolean }> {
    return this.repository.updateDay(dayId, { notes });
  }
}
