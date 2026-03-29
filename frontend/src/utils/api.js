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

const API_BASE = envApiBase || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

if (!envApiBase && import.meta.env.PROD) {
  console.warn(
    'VITE_API_URL is not defined in production. Falling back to same-origin /api; set VITE_API_URL if the backend is hosted on a different domain.'
  );
}

const getToken = () => localStorage.getItem('token');

let isRedirecting = false;

const api = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  let response;

  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error('Unable to reach the API server. Check the deployed API URL and CORS configuration.');
  }

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (!isRedirecting) {
      isRedirecting = true;
      window.location.replace('/login');
    }
    throw new Error('Unauthorized');
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }

  return data;
};

api.get = (endpoint) => api(endpoint);
api.post = (endpoint, body) => api(endpoint, { method: 'POST', body: JSON.stringify(body) });
api.put = (endpoint, body) => api(endpoint, { method: 'PUT', body: JSON.stringify(body) });
api.del = (endpoint) => api(endpoint, { method: 'DELETE' });

export default api;
