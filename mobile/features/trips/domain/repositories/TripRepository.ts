import { Result } from '@shared/kernel';
import { PopularTrip } from '../entities/PopularTrip';

export interface TripRepository {
  getPopularTrips(limit: number): Promise<Result<PopularTrip[]>>;
}
