import type { ManualItineraryRepository, ItineraryWithDetails } from '../repository/ManualItineraryRepository';

export class GetItineraryUseCase {
  constructor(private readonly repository: ManualItineraryRepository) {}

  async execute(itineraryId: string): Promise<ItineraryWithDetails | null> {
    return this.repository.getById(itineraryId);
  }
}
