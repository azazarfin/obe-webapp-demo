import { baseApi } from '../api/baseApi';

const noticeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotices: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.set('page', params.page);
        if (params.limit) searchParams.set('limit', params.limit);
        if (params.scope) searchParams.set('scope', params.scope);
        if (params.type) searchParams.set('type', params.type);
        if (params.search) searchParams.set('search', params.search);
        const qs = searchParams.toString();
        return `/notices${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Notices'],
    }),
    getUnreadCount: builder.query({
      query: () => '/notices/unread-count',
      providesTags: ['NoticeCount'],
    }),
    getNoticeById: builder.query({
      query: (id) => `/notices/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Notices', id }],
    }),
    createNotice: builder.mutation({
      query: (body) => ({
        url: '/notices',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Notices', 'NoticeCount'],
    }),
    markNoticeRead: builder.mutation({
      query: (id) => ({
        url: `/notices/${id}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notices', 'NoticeCount'],
    }),
    markAllNoticesRead: builder.mutation({
      query: () => ({
        url: '/notices/read-all',
        method: 'PUT',
      }),
      invalidatesTags: ['Notices', 'NoticeCount'],
    }),
    deleteNotice: builder.mutation({
      query: (id) => ({
        url: `/notices/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notices', 'NoticeCount'],
    }),
  }),
});

export const {
  useGetNoticesQuery,
  useGetUnreadCountQuery,
  useGetNoticeByIdQuery,
  useCreateNoticeMutation,
  useMarkNoticeReadMutation,
  useMarkAllNoticesReadMutation,
  useDeleteNoticeMutation,
} = noticeApi;
