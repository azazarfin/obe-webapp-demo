import { baseApi } from '../api/baseApi';

const classInstanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getClassInstances: builder.query({
      query: (params = {}) => {
        const search = new URLSearchParams();
        if (params.teacher) search.set('teacher', params.teacher);
        if (params.status) search.set('status', params.status);
        if (params.course) search.set('course', params.course);
        if (params.series) search.set('series', params.series);
        const qs = search.toString();
        return `/class-instances${qs ? `?${qs}` : ''}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((ci) => ({ type: 'ClassInstances', id: ci._id })),
              { type: 'ClassInstances', id: 'LIST' },
            ]
          : [{ type: 'ClassInstances', id: 'LIST' }],
      keepUnusedDataFor: 300,
    }),

    getClassSummary: builder.query({
      query: (classInstanceId) => `/class-instances/${classInstanceId}/summary`,
      providesTags: (result, error, id) => [{ type: 'ClassSummary', id }],
      keepUnusedDataFor: 120,
    }),

    getClassEvaluation: builder.query({
      query: (classInstanceId) => `/class-instances/${classInstanceId}/evaluation`,
      providesTags: (result, error, id) => [{ type: 'Evaluation', id }],
      keepUnusedDataFor: 120,
    }),

    updateClassInstance: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/class-instances/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ClassInstances', id },
        { type: 'ClassInstances', id: 'LIST' },
        { type: 'ClassSummary', id },
      ],
    }),
  }),
});

export const {
  useGetClassInstancesQuery,
  useGetClassSummaryQuery,
  useGetClassEvaluationQuery,
  useUpdateClassInstanceMutation,
} = classInstanceApi;
