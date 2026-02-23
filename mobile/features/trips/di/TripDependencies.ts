import { TripRemoteDataSource } from '../data/datasources/TripRemoteDataSource';
import { GetPopularTripsUseCase } from '../domain/usecases/GetPopularTripsUseCase';

export interface TripExternalDependencies {
  tripRemoteDataSource: TripRemoteDataSource;
}

export interface TripDependencies {
  getPopularTripsUseCase: GetPopularTripsUseCase;
}
