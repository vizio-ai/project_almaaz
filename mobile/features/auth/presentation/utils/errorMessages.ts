/**
 * Maps AppError codes to user-facing messages.
 * Domain error messages are technical — this layer provides presentation-friendly translations.
 */
export function resolveAuthError(code: string, message: string): string {
  const userMessages: Record<string, string> = {
    NETWORK: 'Connection failed. Please check your internet and try again.',
    UNAUTHORIZED: 'This number is not authorized. Please try again.',
    UNKNOWN: 'Something went wrong. Please try again.',
  };
  // VALIDATION errors are already user-friendly (written in UseCase)
  return userMessages[code] ?? message;
}
