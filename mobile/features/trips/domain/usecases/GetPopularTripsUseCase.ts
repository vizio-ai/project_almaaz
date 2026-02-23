import { UseCase, Result } from '@shared/kernel';
import { TripRepository } from '../repositories/TripRepository';
import { PopularTrip } from '../entities/PopularTrip';

export interface GetPopularTripsParams {
  limit: number;
}

export class GetPopularTripsUseCase implements UseCase<GetPopularTripsParams, PopularTrip[]> {
  constructor(private readonly repository: TripRepository) {}

  execute(params: GetPopularTripsParams): Promise<Result<PopularTrip[]>> {
    return this.repository.getPopularTrips(params.limit);
  }
}
