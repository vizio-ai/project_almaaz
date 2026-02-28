import { TripRepositoryImpl } from '../data/repositories/TripRepositoryImpl';
import { GetPopularTripsUseCase } from '../domain/usecases/GetPopularTripsUseCase';
import { GetTripsByUserIdUseCase } from '../domain/usecases/GetTripsByUserIdUseCase';
import { TripExternalDependencies, TripDependencies } from './TripDependencies';

export function createTripDependencies(external: TripExternalDependencies): TripDependencies {
  const repository = new TripRepositoryImpl(external.tripRemoteDataSource);

  return {
    getPopularTripsUseCase: new GetPopularTripsUseCase(repository),
    getTripsByUserIdUseCase: new GetTripsByUserIdUseCase(repository),
  };
}
