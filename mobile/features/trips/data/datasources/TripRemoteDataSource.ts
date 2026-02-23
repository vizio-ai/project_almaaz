import { PopularTripDto } from '../dto/TripDto';

export interface TripRemoteDataSource {
  getPopularTrips(limit: number): Promise<PopularTripDto[]>;
}
