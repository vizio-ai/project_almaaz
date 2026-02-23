import { AppError } from './AppError';
import { Result } from './Result';

export interface UseCase<TParams, TResult, TError = AppError> {
  execute(params: TParams): Promise<Result<TResult, TError>>;
}
