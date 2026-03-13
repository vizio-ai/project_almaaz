// Domain — Entities
export type { PopularTrip } from './domain/entities/PopularTrip';
export type { HomeItinerary, HomeActivity } from './domain/entities/HomeItinerary';

// Domain — Repository
export type { TripRepository } from './domain/repositories/TripRepository';

// Domain — Use Cases
export { GetPopularTripsUseCase } from './domain/usecases/GetPopularTripsUseCase';
export type { GetPopularTripsParams } from './domain/usecases/GetPopularTripsUseCase';
export { GetTripsByUserIdUseCase } from './domain/usecases/GetTripsByUserIdUseCase';
export type { GetTripsByUserIdParams } from './domain/usecases/GetTripsByUserIdUseCase';
export { GetHomeDataUseCase } from './domain/usecases/GetHomeDataUseCase';
export type { GetHomeDataParams } from './domain/usecases/GetHomeDataUseCase';

// Data — DTOs (for infrastructure layer)
export type { PopularTripDto, HomeItineraryDto, HomeActivityDto } from './data/dto/TripDto';

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
export { useHomeTrips } from './presentation/hooks/useHomeTrips';
export type { HomeTripsData } from './presentation/hooks/useHomeTrips';

// Presentation — Components
export { ItinerariesGrid } from './presentation/components/ItinerariesGrid';
