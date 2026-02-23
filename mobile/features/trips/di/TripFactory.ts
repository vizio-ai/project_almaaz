import { TripRepositoryImpl } from '../data/repositories/TripRepositoryImpl';
import { GetPopularTripsUseCase } from '../domain/usecases/GetPopularTripsUseCase';
import { TripExternalDependencies, TripDependencies } from './TripDependencies';

export function createTripDependencies(external: TripExternalDependencies): TripDependencies {
  const repository = new TripRepositoryImpl(external.tripRemoteDataSource);

  return {
    getPopularTripsUseCase: new GetPopularTripsUseCase(repository),
  };
}
