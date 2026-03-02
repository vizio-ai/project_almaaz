import type { ManualItineraryRepository } from '../repository/ManualItineraryRepository';

export class RemoveActivityUseCase {
  constructor(private readonly repository: ManualItineraryRepository) {}

  async execute(activityId: string): Promise<{ success: boolean }> {
    return this.repository.removeActivity(activityId);
  }
}
