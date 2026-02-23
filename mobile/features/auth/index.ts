// Domain — Entities
export type { User } from './domain/entities/User';
export type { AuthToken } from './domain/entities/AuthToken';

// Domain — Repository
export type { AuthRepository, VerifyOtpData } from './domain/repositories/AuthRepository';

// Domain — Use Cases
export { SendOtpUseCase } from './domain/usecases/SendOtpUseCase';
export type { SendOtpParams } from './domain/usecases/SendOtpUseCase';
export { VerifyOtpUseCase } from './domain/usecases/VerifyOtpUseCase';
export type { VerifyOtpParams } from './domain/usecases/VerifyOtpUseCase';
export { LogoutUseCase } from './domain/usecases/LogoutUseCase';
export { GetCurrentSessionUseCase } from './domain/usecases/GetCurrentSessionUseCase';

// Data — DTOs (for infrastructure layer)
export type { SendOtpRequestDto, VerifyOtpRequestDto, OtpSessionDto } from './data/dto/OtpDto';

// Data — DataSource interface
export type { AuthRemoteDataSource } from './data/datasources/AuthRemoteDataSource';

// Data — Repository implementation
export { AuthRepositoryImpl } from './data/repositories/AuthRepositoryImpl';

// DI
export type { AuthExternalDependencies, AuthDependencies } from './di/AuthDependencies';
export { createAuthDependencies } from './di/AuthFactory';
export { AuthProvider } from './di/AuthProvider';
export { AuthSessionProvider, useSession } from './di/AuthSessionProvider';
export { useAuthDependencies } from './di/useAuthDependencies';

// Presentation — Screens
export { WelcomeScreen } from './presentation/screens/WelcomeScreen';
export { PhoneEntryScreen } from './presentation/screens/PhoneEntryScreen';
export { OtpVerificationScreen } from './presentation/screens/OtpVerificationScreen';

// Presentation — Components (for app-layer onboarding screens)
export { OnboardingStep } from './presentation/components/OnboardingStep';
export type { WelcomeTripCardData } from './presentation/components/welcome/TripCard';

// Presentation — Hooks
export { useAuth } from './presentation/hooks/useAuth';
export type { AuthSession } from './presentation/hooks/useAuth';
