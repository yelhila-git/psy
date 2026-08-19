/**
 * HTTP client for the Laravel REST API.
 *
 * Nothing in the UI talks to this directly — the service layer in
 * `src/lib/services` does. While `NEXT_PUBLIC_API_URL` is unset the services
 * resolve from the mock repositories instead, which is why the whole frontend
 * runs today without a backend.
 *
 * When Laravel is ready:
 *   1. set NEXT_PUBLIC_API_URL=https://api.allomonpsy.com/api
 *   2. each service's `live()` branch takes over — no component changes
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

/** True while the app is running on mock repositories. */
export const USE_MOCK = !API_URL;

/**
 * Which parts of the API are actually built.
 *
 * The backend lands one milestone at a time, so `NEXT_PUBLIC_API_URL` alone is
 * not enough to decide whether a call can be made — pointing at the API would
 * otherwise send all thirty-odd endpoints live at once and 404 on everything a
 * milestone has not reached yet. `NEXT_PUBLIC_LIVE_SERVICES` is the allowlist
 * of what is backed; everything absent from it keeps resolving from mocks.
 *
 * Entries are either a whole service (`psychologists`) or a single method
 * (`psychologists.list`), so a service can go live one endpoint at a time and
 * collapse to its bare name once the backend covers all of it.
 */
const LIVE_SERVICES = new Set(
  (process.env.NEXT_PUBLIC_LIVE_SERVICES ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

/** True when `capability` ("psychologists" or "psychologists.list") is backed. */
export function isLive(capability: string): boolean {
  if (!API_URL) return false;
  if (LIVE_SERVICES.has(capability)) return true;
  const service = capability.split('.')[0]!;
  return LIVE_SERVICES.has(service);
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  /** Query string parameters; arrays are serialised as Laravel expects (`k[]=a&k[]=b`). */
  params?: Record<string, string | number | boolean | undefined | null | (string | number)[]>;
  token?: string;
};

function buildQuery(params: RequestOptions['params']) {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      value.forEach((v) => search.append(`${key}[]`, String(v)));
    } else {
      search.append(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, params, token, headers, ...rest } = options;

  const response = await fetch(`${API_URL}${path}${buildQuery(params)}`, {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    // Laravel returns { message, errors: { field: [msg] } } on 422.
    const payload: unknown = await response.json().catch(() => ({}));
    throw new ApiError(
      (payload as { message?: string }).message ?? response.statusText,
      response.status,
      (payload as { errors?: Record<string, string[]> }).errors,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};

/**
 * The endpoint map the Laravel backend is expected to expose. Kept in one
 * place so the contract is reviewable without grepping the service files.
 */
export const ENDPOINTS = {
  psychologists: '/psychologists',
  psychologist: (id: string) => `/psychologists/${id}`,
  psychologistSlots: (id: string) => `/psychologists/${id}/slots`,
  psychologistReviews: (id: string) => `/psychologists/${id}/reviews`,
  appointments: '/appointments',
  appointment: (id: string) => `/appointments/${id}`,
  patients: '/patients',
  patient: (id: string) => `/patients/${id}`,
  payments: '/payments',
  payment: (id: string) => `/payments/${id}`,
  invoices: '/invoices',
  invoice: (id: string) => `/invoices/${id}`,
  conversations: '/conversations',
  messages: (conversationId: string) => `/conversations/${conversationId}/messages`,
  adminStats: '/admin/stats',
  adminVerifications: '/admin/verifications',
} as const;
