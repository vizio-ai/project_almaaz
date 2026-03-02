import type {
  ManualItineraryRepository,
  AddTravelInfoParams,
} from '../repository/ManualItineraryRepository';

export class AddTravelInfoUseCase {
  constructor(private readonly repository: ManualItineraryRepository) {}

  async execute(
    itineraryId: string,
    params: AddTravelInfoParams,
  ): Promise<{ success: boolean; id?: string }> {
    const title = params.title?.trim();
    if (!title) return { success: false };
    return this.repository.addTravelInfo(itineraryId, { ...params, title });
  }
}
