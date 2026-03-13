import { TripRemoteDataSource } from '../data/datasources/TripRemoteDataSource';
import { GetPopularTripsUseCase } from '../domain/usecases/GetPopularTripsUseCase';
import { GetTripsByUserIdUseCase } from '../domain/usecases/GetTripsByUserIdUseCase';
import { GetHomeDataUseCase } from '../domain/usecases/GetHomeDataUseCase';

export interface TripExternalDependencies {
  tripRemoteDataSource: TripRemoteDataSource;
}

export interface TripDependencies {
  getPopularTripsUseCase: GetPopularTripsUseCase;
  getTripsByUserIdUseCase: GetTripsByUserIdUseCase;
  getHomeDataUseCase: GetHomeDataUseCase;
}
