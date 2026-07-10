const LOCAL_BACKEND_HOST = 'localhost';
const LOCAL_BACKEND_PORT = '3000';

export const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (
    window.location.hostname === LOCAL_BACKEND_HOST ||
    window.location.hostname === '127.0.0.1'
      ? `http://localhost:${LOCAL_BACKEND_PORT}`
      : ''
  );

export const apiFetch = (
  endpoint: string,
  options: RequestInit = {}
) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  return fetch(url, {
    ...options,
    headers,
  });
};