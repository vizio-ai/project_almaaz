import { Result } from '@shared/kernel';
import { PopularTrip } from '../entities/PopularTrip';
import { HomeItinerary } from '../entities/HomeItinerary';

export interface TripRepository {
  getPopularTrips(limit: number): Promise<Result<PopularTrip[]>>;
  getTripsByUserId(userId: string): Promise<Result<PopularTrip[]>>;
  getHomeItineraries(userId: string): Promise<Result<HomeItinerary[]>>;
}
