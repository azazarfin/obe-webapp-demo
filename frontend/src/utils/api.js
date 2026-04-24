import { API_BASE } from '../config/apiConfig';


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
