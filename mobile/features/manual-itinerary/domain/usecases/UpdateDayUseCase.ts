import type { ManualItineraryRepository, UpdateDayParams } from '../repository/ManualItineraryRepository';

export class UpdateDayUseCase {
  constructor(private readonly repository: ManualItineraryRepository) {}

  async execute(dayId: string, params: UpdateDayParams): Promise<{ success: boolean }> {
    return this.repository.updateDay(dayId, params);
  }
}
