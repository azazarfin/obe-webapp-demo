import { createSlice } from '@reduxjs/toolkit';
import { baseApi } from '../api/baseApi';

const authApiSlice = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['Auth'],
    }),
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
    }),
  }),
});

export const { useGetMeQuery, useLoginMutation } = authApiSlice;

const initialState = {
  currentUser: null,
  userRole: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.currentUser = user;
      state.userRole = user.role;
      state.token = token;
      state.isAuthenticated = true;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    setUser: (state, action) => {
      state.currentUser = action.payload;
      state.userRole = action.payload?.role || null;
      state.isAuthenticated = !!action.payload;
    },
    clearCredentials: (state) => {
      state.currentUser = null;
      state.userRole = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});

export const { setCredentials, setUser, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
