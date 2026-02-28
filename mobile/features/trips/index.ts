// Domain — Entities
export type { PopularTrip } from './domain/entities/PopularTrip';

// Domain — Repository
export type { TripRepository } from './domain/repositories/TripRepository';

// Domain — Use Cases
export { GetPopularTripsUseCase } from './domain/usecases/GetPopularTripsUseCase';
export type { GetPopularTripsParams } from './domain/usecases/GetPopularTripsUseCase';
export { GetTripsByUserIdUseCase } from './domain/usecases/GetTripsByUserIdUseCase';
export type { GetTripsByUserIdParams } from './domain/usecases/GetTripsByUserIdUseCase';

// Data — DTOs (for infrastructure layer)
export type { PopularTripDto } from './data/dto/TripDto';

// Data — DataSource interface
export type { TripRemoteDataSource } from './data/datasources/TripRemoteDataSource';

// Data — Repository implementation
export { TripRepositoryImpl } from './data/repositories/TripRepositoryImpl';

// DI
export type { TripExternalDependencies, TripDependencies } from './di/TripDependencies';
export { createTripDependencies } from './di/TripFactory';
export { TripProvider } from './di/TripProvider';
export { useTripDependencies } from './di/useTripDependencies';

// Presentation — Hooks
export { usePopularTrips } from './presentation/hooks/usePopularTrips';
export { useUserTrips } from './presentation/hooks/useUserTrips';

// Presentation — Components
export { ItinerariesGrid } from './presentation/components/ItinerariesGrid';
