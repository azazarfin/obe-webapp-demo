const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

if (!import.meta.env.VITE_API_URL && import.meta.env.PROD) {
  console.warn('VITE_API_URL is not defined in production environment!');
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

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (!isRedirecting) {
      isRedirecting = true;
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
};

api.get = (endpoint) => api(endpoint);
api.post = (endpoint, body) => api(endpoint, { method: 'POST', body: JSON.stringify(body) });
api.put = (endpoint, body) => api(endpoint, { method: 'PUT', body: JSON.stringify(body) });
api.del = (endpoint) => api(endpoint, { method: 'DELETE' });

export default api;
