import { DoraRepositoryImpl } from '../data/repositories/DoraRepositoryImpl';
import { SendDoraMessageUseCase } from '../domain/usecases/SendDoraMessageUseCase';
import { ItineraryExternalDependencies, ItineraryDependencies } from './ItineraryDependencies';

export function createItineraryDependencies(
  external: ItineraryExternalDependencies,
): ItineraryDependencies {
  const repository = new DoraRepositoryImpl(external.doraRemoteDataSource);

  return {
    sendDoraMessageUseCase: new SendDoraMessageUseCase(repository),
  };
}
