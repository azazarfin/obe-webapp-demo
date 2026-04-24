import { baseApi } from '../api/baseApi';

const instructorReportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInstructorReport: builder.query({
      query: (classInstanceId) => `/instructor-reports?classInstance=${classInstanceId}`,
      transformResponse: (response) => (Array.isArray(response) ? response[0] || null : response),
      providesTags: (result, error, id) => [{ type: 'InstructorReport', id }],
      keepUnusedDataFor: 120,
    }),

    saveInstructorReport: builder.mutation({
      query: (body) => ({
        url: '/instructor-reports',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, body) => [
        { type: 'InstructorReport', id: body.classInstance },
      ],
    }),
  }),
});

export const {
  useGetInstructorReportQuery,
  useSaveInstructorReportMutation,
} = instructorReportApi;
