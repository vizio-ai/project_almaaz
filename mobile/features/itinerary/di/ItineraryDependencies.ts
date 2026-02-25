import { DoraRemoteDataSource } from '../data/datasources/DoraRemoteDataSource';
import { SendDoraMessageUseCase } from '../domain/usecases/SendDoraMessageUseCase';

export interface ItineraryExternalDependencies {
  doraRemoteDataSource: DoraRemoteDataSource;
}

export interface ItineraryDependencies {
  sendDoraMessageUseCase: SendDoraMessageUseCase;
}
