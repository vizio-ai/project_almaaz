import type { ManualItineraryRepository, AddActivityParams } from '../repository/ManualItineraryRepository';

export class AddActivityUseCase {
  constructor(private readonly repository: ManualItineraryRepository) {}

  async execute(
    dayId: string,
    params: AddActivityParams,
  ): Promise<{ success: boolean; id?: string }> {
    const trimmed = params.name.trim();
    if (!trimmed) return { success: false };
    return this.repository.addActivity(dayId, { ...params, name: trimmed });
  }
}
