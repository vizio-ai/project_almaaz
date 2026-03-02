import type { ManualItineraryRepository } from '../repository/ManualItineraryRepository';

export class RemoveTravelInfoUseCase {
  constructor(private readonly repository: ManualItineraryRepository) {}

  async execute(id: string): Promise<{ success: boolean }> {
    return this.repository.removeTravelInfo(id);
  }
}
