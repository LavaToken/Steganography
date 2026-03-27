import axios, { AxiosError } from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ error: string }>) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/signin';
    }
    return Promise.reject(err);
  }
);

export function getErrorMessage(err: unknown): string {
  if (err instanceof AxiosError && err.response?.data?.error) {
    return err.response.data.error;
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred';
}

export default api;
