const isProd = import.meta.env.PROD;
const rawApiUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').trim();

if (isProd && !rawApiUrl) {
  console.error('[CRITICAL CONFIG ERROR] VITE_API_URL or VITE_API_BASE_URL is not set in production build!');
}

const base = rawApiUrl || (isProd ? '' : 'http://localhost:8000');
const API_BASE_URL = base.endsWith('/') ? base.slice(0, -1) : base;

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem('lucky10_jwt_token');
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      sessionStorage.setItem('lucky10_jwt_token', token);
    } else {
      sessionStorage.removeItem('lucky10_jwt_token');
    }
    // Clean up any legacy permanent token so no 30-day/permanent login persists
    localStorage.removeItem('lucky10_jwt_token');
  } catch {}
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

  const executeFetch = async (retryCount = 0): Promise<T> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second request timeout

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        signal: options.signal || controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        let errorDetail = 'An unexpected server error occurred';
        if (typeof data?.detail === 'string') {
          errorDetail = data.detail;
        } else if (data?.detail && typeof data.detail === 'object') {
          errorDetail = data.detail.message || JSON.stringify(data.detail);
        }
        throw new Error(errorDetail);
      }

      return data as T;
    } catch (err: any) {
      clearTimeout(timeoutId);
      // Only retry safe GET requests once on network/timeout errors, never retry POST/financial calls
      if (isGet && retryCount < 1 && (err.name === 'AbortError' || err.message?.includes('Failed to fetch'))) {
        return executeFetch(retryCount + 1);
      }
      if (err.name === 'AbortError') {
        throw new Error('Network request timed out. Please check your connection.');
      }
      throw err;
    }
  };

  const fetchPromise = (async () => {
    try {
      return await executeFetch();
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
