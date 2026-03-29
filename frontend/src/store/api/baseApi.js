import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const envApiBase = import.meta.env.VITE_API_URL
  ? (() => {
      const trimmed = import.meta.env.VITE_API_URL.trim().replace(/\/+$/, '');
      if (!trimmed) return '';
      if (trimmed === '/api' || trimmed.endsWith('/api')) return trimmed;
      if (/^https?:\/\//i.test(trimmed)) {
        const url = new URL(trimmed);
        const p = url.pathname.replace(/\/+$/, '');
        url.pathname = p ? `${p}/api` : '/api';
        return url.toString().replace(/\/$/, '');
      }
      return `${trimmed}/api`;
    })()
  : '';

const API_BASE = envApiBase || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    'Auth',
    'ClassInstances',
    'ClassSummary',
    'Assessments',
    'Enrollments',
    'Evaluation',
    'DeptDashboard',
    'StudentDashboard',
    'Feedback'
  ],
  endpoints: () => ({}),
});
