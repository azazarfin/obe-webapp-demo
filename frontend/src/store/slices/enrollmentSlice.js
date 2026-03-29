import { baseApi } from '../api/baseApi';

const enrollmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEnrollments: builder.query({
      query: (params = {}) => {
        const search = new URLSearchParams();
        if (params.classInstance) search.set('classInstance', params.classInstance);
        if (params.student) search.set('student', params.student);
        if (params.status) search.set('status', params.status);
        if (params.type) search.set('type', params.type);
        const qs = search.toString();
        return `/enrollments${qs ? `?${qs}` : ''}`;
      },
      transformResponse: (response) => {
        return {
          data: response.data !== undefined ? response.data : response,
          total: response.total,
          page: response.page,
          limit: response.limit,
          totalPages: response.totalPages
        };
      },
      serializeQueryArgs: ({ endpointName, queryArgs = {} }) => {
        const rest = { ...queryArgs };
        delete rest.page;
        delete rest.limit;
        return `${endpointName}-${JSON.stringify(rest)}`;
      },
      merge: (currentCache, newItems) => {
        if (newItems.page === 1) {
          return newItems;
        }
        currentCache.data.push(...newItems.data);
        currentCache.page = newItems.page;
        currentCache.totalPages = newItems.totalPages;
        return currentCache;
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.page !== previousArg?.page;
      },
      providesTags: (result, error, params) => {
        const id = params?.classInstance || 'ALL';
        const items = Array.isArray(result?.data) ? result.data : [];
        return result
          ? [
              ...items.map((e) => ({ type: 'Enrollments', id: e._id })),
              { type: 'Enrollments', id },
            ]
          : [{ type: 'Enrollments', id }];
      },
      keepUnusedDataFor: 120,
    }),

    saveAttendance: builder.mutation({
      query: ({ classInstanceId, ...body }) => ({
        url: `/enrollments/${classInstanceId}/attendance`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { classInstanceId }) => [
        { type: 'Enrollments', id: classInstanceId },
        { type: 'ClassSummary', id: classInstanceId },
      ],
    }),

    updateEnrollment: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/enrollments/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result) =>
        result
          ? [
              { type: 'Enrollments', id: result._id },
              { type: 'ClassSummary', id: result.classInstance?._id || result.classInstance },
            ]
          : [],
    }),

    createEnrollment: builder.mutation({
      query: (body) => ({
        url: '/enrollments',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result) =>
        result
          ? [
              { type: 'ClassSummary', id: result.classInstance?._id || result.classInstance },
            ]
          : [],
    }),
  }),
});

export const {
  useGetEnrollmentsQuery,
  useSaveAttendanceMutation,
  useUpdateEnrollmentMutation,
  useCreateEnrollmentMutation,
} = enrollmentApi;
