/**
 * Shared API base URL configuration.
 *
 * Both the lightweight fetch wrapper (`utils/api.js`) and the RTK Query
 * base API (`store/api/baseApi.js`) import `API_BASE` from here so the
 * normalisation logic is defined in exactly one place.
 */

const normalizeApiBase = (value) => {
  const trimmedValue = value.trim().replace(/\/+$/, '');

  if (!trimmedValue) return '';

  if (trimmedValue === '/api' || trimmedValue.endsWith('/api')) {
    return trimmedValue;
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    const url = new URL(trimmedValue);
    const normalizedPath = url.pathname.replace(/\/+$/, '');
    url.pathname = normalizedPath ? `${normalizedPath}/api` : '/api';
    return url.toString().replace(/\/$/, '');
  }

  return `${trimmedValue}/api`;
};

const envApiBase = import.meta.env.VITE_API_URL
  ? normalizeApiBase(import.meta.env.VITE_API_URL)
  : '';

export const API_BASE = envApiBase || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

if (!envApiBase && import.meta.env.PROD) {
  console.warn(
    'VITE_API_URL is not defined in production. Falling back to same-origin /api; set VITE_API_URL if the backend is hosted on a different domain.'
  );
}
