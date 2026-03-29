import { baseApi } from '../api/baseApi';

const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDeptDashboard: builder.query({
      query: () => '/dashboard/department',
      providesTags: ['DeptDashboard'],
      keepUnusedDataFor: 300,
    }),

    getStudentDashboard: builder.query({
      query: () => '/dashboard/student',
      providesTags: ['StudentDashboard'],
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useGetDeptDashboardQuery,
  useGetStudentDashboardQuery,
} = dashboardApi;
