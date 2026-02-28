import { TripRemoteDataSource } from '../data/datasources/TripRemoteDataSource';
import { GetPopularTripsUseCase } from '../domain/usecases/GetPopularTripsUseCase';
import { GetTripsByUserIdUseCase } from '../domain/usecases/GetTripsByUserIdUseCase';

export interface TripExternalDependencies {
  tripRemoteDataSource: TripRemoteDataSource;
}

export interface TripDependencies {
  getPopularTripsUseCase: GetPopularTripsUseCase;
  getTripsByUserIdUseCase: GetTripsByUserIdUseCase;
}
