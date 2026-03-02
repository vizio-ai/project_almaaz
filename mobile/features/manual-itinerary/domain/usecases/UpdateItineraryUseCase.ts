import type {
  ManualItineraryRepository,
  UpdateItineraryParams,
} from '../repository/ManualItineraryRepository';

export class UpdateItineraryUseCase {
  constructor(private readonly repository: ManualItineraryRepository) {}

  async execute(
    itineraryId: string,
    params: UpdateItineraryParams,
  ): Promise<{ success: boolean }> {
    return this.repository.update(itineraryId, params);
  }
}
