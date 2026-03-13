import { Result } from '@shared/kernel';
import { TripRepository } from '../repositories/TripRepository';
import { HomeItinerary } from '../entities/HomeItinerary';

export interface GetHomeDataParams {
  userId: string;
}

export class GetHomeDataUseCase {
  constructor(private readonly repository: TripRepository) {}

  execute(params: GetHomeDataParams): Promise<Result<HomeItinerary[]>> {
    return this.repository.getHomeItineraries(params.userId);
  }
}
