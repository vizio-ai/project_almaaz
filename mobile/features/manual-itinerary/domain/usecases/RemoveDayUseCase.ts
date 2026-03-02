import type { ManualItineraryRepository } from '../repository/ManualItineraryRepository';

export class RemoveDayUseCase {
  constructor(private readonly repository: ManualItineraryRepository) {}

  async execute(dayId: string): Promise<{ success: boolean }> {
    return this.repository.removeDay(dayId);
  }
}
