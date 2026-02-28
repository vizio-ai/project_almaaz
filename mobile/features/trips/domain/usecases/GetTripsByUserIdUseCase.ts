import { UseCase, Result } from '@shared/kernel';
import { TripRepository } from '../repositories/TripRepository';
import { PopularTrip } from '../entities/PopularTrip';

export interface GetTripsByUserIdParams {
  userId: string;
}

export class GetTripsByUserIdUseCase implements UseCase<GetTripsByUserIdParams, PopularTrip[]> {
  constructor(private readonly repository: TripRepository) {}

  execute(params: GetTripsByUserIdParams): Promise<Result<PopularTrip[]>> {
    return this.repository.getTripsByUserId(params.userId);
  }
}
