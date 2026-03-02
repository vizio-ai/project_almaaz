import type {
  ManualItineraryRepository,
  UpdateTravelInfoParams,
} from '../repository/ManualItineraryRepository';

export class UpdateTravelInfoUseCase {
  constructor(private readonly repository: ManualItineraryRepository) {}

  async execute(id: string, params: UpdateTravelInfoParams): Promise<{ success: boolean }> {
    return this.repository.updateTravelInfo(id, params);
  }
}
