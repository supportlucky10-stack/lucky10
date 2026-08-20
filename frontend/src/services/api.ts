const isProd = import.meta.env.PROD;
const rawApiUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').trim();

if (isProd && !rawApiUrl) {
  console.error('[CRITICAL CONFIG ERROR] VITE_API_URL or VITE_API_BASE_URL is not set in production build!');
}

const base = rawApiUrl || (isProd ? '' : 'http://localhost:8000');
const API_BASE_URL = base.endsWith('/') ? base.slice(0, -1) : base;

export function getAuthToken(): string | null {
  return localStorage.getItem('lucky10_jwt_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('lucky10_jwt_token', token);
  } else {
    localStorage.removeItem('lucky10_jwt_token');
  }
}

const inFlightGetRequests = new Map<string, Promise<any>>();

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (isProd && !rawApiUrl) {
    throw new Error('API URL is not configured. Please set VITE_API_URL or VITE_API_BASE_URL in Vercel environment variables.');
  }

  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  // Request Deduplication for in-flight GET requests
  if (isGet && inFlightGetRequests.has(endpoint)) {
    return inFlightGetRequests.get(endpoint) as Promise<T>;
  }

  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorDetail = data?.detail || 'An unexpected server error occurred';
        throw new Error(errorDetail);
      }

      return data as T;
    } finally {
      if (isGet) {
        inFlightGetRequests.delete(endpoint);
      }
    }
  })();

  if (isGet) {
    inFlightGetRequests.set(endpoint, fetchPromise);
  }

  return fetchPromise;
}
