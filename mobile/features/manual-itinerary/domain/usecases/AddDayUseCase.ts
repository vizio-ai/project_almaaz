import type { ManualItineraryRepository } from '../repository/ManualItineraryRepository';

export class AddDayUseCase {
  constructor(private readonly repository: ManualItineraryRepository) {}

  async execute(itineraryId: string): Promise<{ success: boolean; id?: string }> {
    return this.repository.addDay(itineraryId, {});
  }
}
