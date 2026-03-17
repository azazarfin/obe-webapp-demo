import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { loginDemo } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (email.endsWith('@demo.com')) {
      let assignedRole = 'STUDENT';
      if (email.includes('central')) assignedRole = 'CENTRAL_ADMIN';
      else if (email.includes('dept')) assignedRole = 'DEPT_ADMIN';
      else if (email.includes('teacher')) assignedRole = 'TEACHER';
      
      loginDemo(assignedRole);
      setLoading(false);
      
      if (assignedRole === 'CENTRAL_ADMIN') navigate('/central-admin');
      else if (assignedRole === 'DEPT_ADMIN') navigate('/dept-admin');
      else if (assignedRole === 'TEACHER') navigate('/teacher');
      else navigate('/student');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();

      const response = await fetch('http://localhost:5000/api/auth/me', {
         headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
         const data = await response.json();
         const role = data.role;
         if (role === 'CENTRAL_ADMIN') navigate('/central-admin');
         else if (role === 'DEPT_ADMIN') navigate('/dept-admin');
         else if (role === 'TEACHER') navigate('/teacher');
         else if (role === 'STUDENT') navigate('/student');
         else navigate('/unauthorized');
      } else {
         setError('User role not found in the system. Please contact an administrator.');
         // Optionally sign out from Firebase if no DB user exists
         // await auth.signOut();
      }
    } catch (err) {
      setError('Failed to log in. Please check your credentials.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-[#1e1e1e] p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-ruet-blue dark:text-white">
            RUET OBE System
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Sign in to your account
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 p-3 rounded-md text-sm text-center">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus:ring-ruet-blue focus:border-ruet-blue block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-[#2d2d2d] dark:text-white rounded-md p-2.5 outline-none transition-colors"
                  placeholder="ID@student.ruet.ac.bd"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-ruet-blue focus:border-ruet-blue block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-[#2d2d2d] dark:text-white rounded-md p-2.5 outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-ruet-blue hover:bg-ruet-dark dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ruet-blue transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
