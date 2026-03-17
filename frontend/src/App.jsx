import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';

import CentralAdminDashboard from './pages/dashboards/CentralAdminDashboard';
import DeptAdminDashboard from './pages/dashboards/DeptAdminDashboard';
import TeacherDashboard from './pages/dashboards/TeacherDashboard';
import StudentDashboard from './pages/dashboards/StudentDashboard';


// ... (keep Unauthorized component identical) ...
const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
     <div className="text-center">
        <h2 className="text-3xl font-bold dark:text-white text-ruet-blue">403 Unauthorized</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">You do not have permission to view this page.</p>
     </div>
  </div>
);

// Redirects logged in users to appropriate dashboard on index
const HomeRedirect = () => {
   const { currentUser, userRole, loading } = useAuth();
   
   if (loading) return null;
   if (!currentUser) return <Navigate to="/login" replace />;
   
   if (userRole === 'CENTRAL_ADMIN') return <Navigate to="/central-admin" replace />;
   if (userRole === 'DEPT_ADMIN') return <Navigate to="/dept-admin" replace />;
   if (userRole === 'TEACHER') return <Navigate to="/teacher" replace />;
   if (userRole === 'STUDENT') return <Navigate to="/student" replace />;
   
   return <Navigate to="/unauthorized" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            <Route path="/" element={<Layout />}>
              {/* Central Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['CENTRAL_ADMIN']} />}>
                <Route path="central-admin" element={<CentralAdminDashboard />} />
              </Route>
              
              {/* Department Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['DEPT_ADMIN']} />}>
                <Route path="dept-admin" element={<DeptAdminDashboard />} />
              </Route>

              {/* Teacher Routes */}
              <Route element={<ProtectedRoute allowedRoles={['TEACHER']} />}>
                <Route path="teacher" element={<TeacherDashboard />} />
              </Route>

              {/* Student Routes */}
              <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
                <Route path="student" element={<StudentDashboard />} />
              </Route>

              <Route index element={<HomeRedirect />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
