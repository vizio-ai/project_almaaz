import type { ManualItineraryRepository, AddDayParams } from '../repository/ManualItineraryRepository';

export class AddDayUseCase {
  constructor(private readonly repository: ManualItineraryRepository) {}

  async execute(itineraryId: string, params: AddDayParams = {}): Promise<{ success: boolean; id?: string }> {
    return this.repository.addDay(itineraryId, params);
  }
}
