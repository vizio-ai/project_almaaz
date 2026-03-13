import { Result, ok, fail, networkError } from '@shared/kernel';
import { TripRepository } from '../../domain/repositories/TripRepository';
import { PopularTrip } from '../../domain/entities/PopularTrip';
import { HomeItinerary } from '../../domain/entities/HomeItinerary';
import { TripRemoteDataSource } from '../datasources/TripRemoteDataSource';
import { PopularTripMapper } from '../mappers/PopularTripMapper';
import { HomeItineraryMapper } from '../mappers/HomeItineraryMapper';

export class TripRepositoryImpl implements TripRepository {
  private readonly mapper = new PopularTripMapper();
  private readonly homeMapper = new HomeItineraryMapper();

  constructor(private readonly remoteDataSource: TripRemoteDataSource) {}

  async getPopularTrips(limit: number): Promise<Result<PopularTrip[]>> {
    try {
      const dtos = await this.remoteDataSource.getPopularTrips(limit);
      return ok(dtos.map((dto) => this.mapper.map(dto)));
    } catch (error) {
      return fail(networkError(error));
    }
  }

  async getTripsByUserId(userId: string): Promise<Result<PopularTrip[]>> {
    try {
      const dtos = await this.remoteDataSource.getTripsByUserId(userId);
      return ok(dtos.map((dto) => this.mapper.map(dto)));
    } catch (error) {
      return fail(networkError(error));
    }
  }

  async getHomeItineraries(userId: string): Promise<Result<HomeItinerary[]>> {
    try {
      const dtos = await this.remoteDataSource.getHomeItineraries(userId);
      return ok(dtos.map((dto) => this.homeMapper.map(dto)));
    } catch (error) {
      return fail(networkError(error));
    }
  }
}
