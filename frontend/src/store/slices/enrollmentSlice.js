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
      providesTags: (result, error, params) => {
        const id = params?.classInstance || 'ALL';
        return result
          ? [
              ...result.map((e) => ({ type: 'Enrollments', id: e._id })),
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
  }),
});

export const {
  useGetEnrollmentsQuery,
  useSaveAttendanceMutation,
  useUpdateEnrollmentMutation,
} = enrollmentApi;
