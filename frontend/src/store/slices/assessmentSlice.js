import { baseApi } from '../api/baseApi';

const assessmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAssessments: builder.query({
      query: (classInstanceId) => `/assessments/${classInstanceId}`,
      providesTags: (result, error, classInstanceId) =>
        result
          ? [
              ...result.map((a) => ({ type: 'Assessments', id: a._id })),
              { type: 'Assessments', id: classInstanceId },
            ]
          : [{ type: 'Assessments', id: classInstanceId }],
      keepUnusedDataFor: 120,
    }),

    createAssessment: builder.mutation({
      query: (body) => ({
        url: '/assessments',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result) =>
        result
          ? [
              { type: 'Assessments', id: result.classInstance },
              { type: 'ClassSummary', id: result.classInstance },
              { type: 'Evaluation', id: result.classInstance },
            ]
          : [],
    }),

    updateAssessment: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/assessments/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result) =>
        result
          ? [
              { type: 'Assessments', id: result._id },
              { type: 'Assessments', id: result.classInstance },
              { type: 'ClassSummary', id: result.classInstance },
              { type: 'Evaluation', id: result.classInstance },
            ]
          : [],
    }),

    saveMarks: builder.mutation({
      query: ({ assessmentId, ...body }) => ({
        url: `/assessments/${assessmentId}/marks`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { classInstanceId }) => [
        { type: 'ClassSummary', id: classInstanceId },
        { type: 'Evaluation', id: classInstanceId },
        { type: 'Enrollments', id: classInstanceId },
      ],
    }),

    deleteAssessment: builder.mutation({
      query: (id) => ({
        url: `/assessments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Assessments', id },
        'ClassSummary',
        'Evaluation',
        'Enrollments',
      ],
    }),
  }),
});

export const {
  useGetAssessmentsQuery,
  useCreateAssessmentMutation,
  useUpdateAssessmentMutation,
  useSaveMarksMutation,
  useDeleteAssessmentMutation,
} = assessmentApi;
