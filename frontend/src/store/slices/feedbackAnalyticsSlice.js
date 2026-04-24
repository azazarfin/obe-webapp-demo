import { baseApi } from '../api/baseApi';

const feedbackAnalyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDepartmentFeedbackSummary: builder.query({
      query: () => '/feedback/department-summary',
      providesTags: ['FeedbackAnalytics'],
      keepUnusedDataFor: 180,
    }),
  }),
});

export const { useGetDepartmentFeedbackSummaryQuery } = feedbackAnalyticsApi;
