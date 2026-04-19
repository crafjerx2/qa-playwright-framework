/**
 * DEPENDENCY INVERSION PRINCIPLE
 *
 * High-level modules (tests) should NOT depend on low-level modules (HTTP library).
 * Both should depend on abstractions (interfaces).
 *
 * This means:
 * - Tests depend on IApiClient interface
 * - AxiosApiClient implements IApiClient
 * - If we switch from Axios to Fetch → tests do NOT change
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
  success: boolean;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  params?: Record<string, string>;
}

/**
 * HIGH-LEVEL abstraction - tests depend on this interface
 * NOT on Axios, Fetch, or any specific HTTP library
 */
export interface IApiClient {
  get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>>;
  post<T>(endpoint: string, body: unknown, options?: RequestOptions): Promise<ApiResponse<T>>;
  put<T>(endpoint: string, body: unknown, options?: RequestOptions): Promise<ApiResponse<T>>;
  patch<T>(endpoint: string, body: unknown, options?: RequestOptions): Promise<ApiResponse<T>>;
  delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>>;
  setAuthToken(token: string): void;
}

/**
 * IPageFactory abstraction
 * Tests ask for a page → factory creates it
 * Tests don't know HOW pages are created
 */
export interface IPageFactory {
  createLoginPage(): Promise<unknown>;
  createInventoryPage(): Promise<unknown>;
}

/**
 * IDataProvider abstraction
 * Tests ask for data → provider loads it
 * Tests don't know if data comes from JSON, CSV, or database
 */
export interface IDataProvider<T> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | undefined>;
  getRandom(): Promise<T>;
}
