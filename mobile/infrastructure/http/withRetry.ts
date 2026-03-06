const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_BASE_DELAY_MS = 1000;

/**
 * Retries an async operation with exponential backoff for transient errors.
 * Only retries on network-related errors (TypeError, AbortError, fetch failures).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = DEFAULT_MAX_RETRIES,
  baseDelay = DEFAULT_BASE_DELAY_MS,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === maxRetries) break;
      await delay(baseDelay * Math.pow(2, attempt));
    }
  }
  throw lastError;
}

function isRetryable(error: unknown): boolean {
  if (error instanceof TypeError) return true; // network failure
  if (error instanceof Error) {
    const name = error.name;
    const msg = error.message.toLowerCase();
    if (name === 'AbortError') return true; // timeout
    if (msg.includes('network request failed')) return true;
    if (msg.includes('failed to fetch')) return true;
    if (msg.includes('load failed')) return true; // iOS fetch failure
  }
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
