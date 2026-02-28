import { PopularTripDto } from '../dto/TripDto';

export interface TripRemoteDataSource {
  getPopularTrips(limit: number): Promise<PopularTripDto[]>;
  getTripsByUserId(userId: string): Promise<PopularTripDto[]>;
}
