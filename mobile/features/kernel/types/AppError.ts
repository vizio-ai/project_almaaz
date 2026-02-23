export interface AppError {
  code: string;
  message: string;
  cause?: unknown;
}

export function appError(
  code: string,
  message: string,
  cause?: unknown,
): AppError {
  return { code, message, cause };
}

export function unknownError(cause?: unknown): AppError {
  return appError(
    'UNKNOWN',
    'An unexpected error occurred',
    cause,
  );
}

export function networkError(cause?: unknown): AppError {
  return appError(
    'NETWORK',
    'Network request failed',
    cause,
  );
}

export function validationError(message: string): AppError {
  return appError('VALIDATION', message);
}

export function unauthorizedError(message = 'Unauthorized'): AppError {
  return appError('UNAUTHORIZED', message);
}
