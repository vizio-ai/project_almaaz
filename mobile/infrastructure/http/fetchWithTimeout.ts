const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Wrapper around fetch that adds a timeout via AbortSignal.
 * Throws an error with name 'AbortError' when the request times out.
 */
export async function fetchWithTimeout(
  input: RequestInfo,
  init?: RequestInit & { timeout?: number },
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT_MS, ...rest } = init ?? {};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(input, { ...rest, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
