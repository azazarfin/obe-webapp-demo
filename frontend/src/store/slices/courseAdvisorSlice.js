import { baseApi } from '../api/baseApi';

const courseAdvisorApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCourseAdvisors: builder.query({
      query: (params = {}) => {
        const search = new URLSearchParams();
        if (params.department) search.set('department', params.department);
        const qs = search.toString();
        return `/course-advisors${qs ? `?${qs}` : ''}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((ca) => ({ type: 'CourseAdvisors', id: ca._id })),
              { type: 'CourseAdvisors', id: 'LIST' },
            ]
          : [{ type: 'CourseAdvisors', id: 'LIST' }],
    }),

    createCourseAdvisor: builder.mutation({
      query: (body) => ({
        url: '/course-advisors',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'CourseAdvisors', id: 'LIST' }],
    }),

    updateCourseAdvisor: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/course-advisors/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'CourseAdvisors', id },
        { type: 'CourseAdvisors', id: 'LIST' },
      ],
    }),

    deleteCourseAdvisor: builder.mutation({
      query: (id) => ({
        url: `/course-advisors/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'CourseAdvisors', id },
        { type: 'CourseAdvisors', id: 'LIST' },
      ],
    }),

    getAdvisedSections: builder.query({
      query: () => '/course-advisors/me/advised-sections',
      providesTags: ['AdvisedSections'],
    }),

    getSectionStudents: builder.query({
      query: (advisorId) => `/course-advisors/me/advised-sections/${advisorId}/students`,
      providesTags: (result, error, id) => [{ type: 'SectionStudents', id }],
    }),

    setSectionCRs: builder.mutation({
      query: ({ id, studentIds }) => ({
        url: `/course-advisors/me/advised-sections/${id}/crs`,
        method: 'PUT',
        body: { studentIds },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'SectionStudents', id },
      ],
    }),
  }),
});

export const {
  useGetCourseAdvisorsQuery,
  useCreateCourseAdvisorMutation,
  useUpdateCourseAdvisorMutation,
  useDeleteCourseAdvisorMutation,
  useGetAdvisedSectionsQuery,
  useGetSectionStudentsQuery,
  useSetSectionCRsMutation,
} = courseAdvisorApi;
