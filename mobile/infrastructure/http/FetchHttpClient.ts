import { HttpClient, HttpResponse, RequestConfig } from './HttpClient';

export class FetchHttpClient implements HttpClient {
  constructor(private readonly baseUrl: string) {}

  async get<T>(url: string, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>('GET', url, undefined, config);
  }

  async post<T>(url: string, body?: unknown, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>('POST', url, body, config);
  }

  async put<T>(url: string, body?: unknown, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>('PUT', url, body, config);
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>('DELETE', url, undefined, config);
  }

  private async request<T>(
    method: string,
    url: string,
    body?: unknown,
    config?: RequestConfig,
  ): Promise<HttpResponse<T>> {
    const fullUrl = this.buildUrl(url, config?.params);

    const response = await fetch(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: config?.timeout
        ? AbortSignal.timeout(config.timeout)
        : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as T;
    return { data, status: response.status };
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const url = new URL(path, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    return url.toString();
  }
}
