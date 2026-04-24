import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from './api/baseApi';
import authReducer from './slices/authSlice';

import './slices/classInstanceSlice';
import './slices/assessmentSlice';
import './slices/enrollmentSlice';
import './slices/dashboardSlice';
import './slices/noticeSlice';
import './slices/courseAdvisorSlice';
import './slices/feedbackAnalyticsSlice';
import './slices/instructorReportSlice';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});
