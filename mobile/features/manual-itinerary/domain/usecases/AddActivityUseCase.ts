import type { ManualItineraryRepository } from '../repository/ManualItineraryRepository';

export class AddActivityUseCase {
  constructor(private readonly repository: ManualItineraryRepository) {}

  async execute(
    dayId: string,
    name: string,
  ): Promise<{ success: boolean; id?: string }> {
    const trimmed = name.trim();
    if (!trimmed) return { success: false };
    return this.repository.addActivity(dayId, { name: trimmed });
  }
}
