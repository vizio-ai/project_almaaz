// Result
export type { Result } from './types/Result';
export { ok, fail, isOk, isFail } from './types/Result';

// Error
export type { AppError } from './types/AppError';
export { appError, unknownError, networkError, validationError, unauthorizedError } from './types/AppError';

// Base types
export type { UseCase } from './types/UseCase';
export type { Mapper } from './types/Mapper';

// Primitive aliases
export type { ID, DateString } from './types/Id';
export type { Paginated, PaginationParams } from './types/Pagination';
