import type { ManualItineraryRepository } from '../repository/ManualItineraryRepository';

export class UpdateActivityUseCase {
  constructor(private readonly repository: ManualItineraryRepository) {}

  async execute(activityId: string, name: string): Promise<{ success: boolean }> {
    const trimmed = name.trim();
    if (!trimmed) return { success: false };
    return this.repository.updateActivity(activityId, { name: trimmed });
  }
}
