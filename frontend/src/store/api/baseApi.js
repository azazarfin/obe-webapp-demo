import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '../../config/apiConfig';


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
    'Feedback',
    'Notices',
    'NoticeCount',
    'CourseAdvisors',
    'AdvisedSections',
    'SectionStudents',
    'InstructorReport',
    'FeedbackAnalytics'
  ],
  endpoints: () => ({}),
});
