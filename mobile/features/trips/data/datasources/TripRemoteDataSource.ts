import { PopularTripDto, HomeItineraryDto } from '../dto/TripDto';

export interface TripRemoteDataSource {
  getPopularTrips(limit: number): Promise<PopularTripDto[]>;
  getTripsByUserId(userId: string): Promise<PopularTripDto[]>;
  getHomeItineraries(userId: string): Promise<HomeItineraryDto[]>;
}
