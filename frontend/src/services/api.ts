const isProd = import.meta.env.PROD;
const defaultBaseUrl = isProd ? '' : 'http://localhost:8000';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined ? import.meta.env.VITE_API_BASE_URL : defaultBaseUrl;

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

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

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
}
