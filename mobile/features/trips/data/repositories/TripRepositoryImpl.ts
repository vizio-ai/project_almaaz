import { Result, ok, fail, networkError } from '@shared/kernel';
import { TripRepository } from '../../domain/repositories/TripRepository';
import { PopularTrip } from '../../domain/entities/PopularTrip';
import { TripRemoteDataSource } from '../datasources/TripRemoteDataSource';
import { PopularTripMapper } from '../mappers/PopularTripMapper';

export class TripRepositoryImpl implements TripRepository {
  private readonly mapper = new PopularTripMapper();

  constructor(private readonly remoteDataSource: TripRemoteDataSource) {}

  async getPopularTrips(limit: number): Promise<Result<PopularTrip[]>> {
    try {
      const dtos = await this.remoteDataSource.getPopularTrips(limit);
      return ok(dtos.map((dto) => this.mapper.map(dto)));
    } catch (error) {
      return fail(networkError(error));
    }
  }
}
