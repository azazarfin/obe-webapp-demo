import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const token = await user.getIdToken();
          // Fetch user role from backend
          const response = await fetch('http://localhost:5000/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setUserRole(data.role); // e.g., 'CENTRAL_ADMIN', 'DEPT_ADMIN', 'TEACHER', 'STUDENT'
          } else {
            console.error('Failed to fetch user role');
            setUserRole(null);
          }
        } catch (error) {
          console.error('Error fetching role:', error);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginDemo = (role) => {
    setCurrentUser({ uid: 'demo-user', email: `demo@${role.toLowerCase()}.com` });
    setUserRole(role);
  };

  const logoutDemo = () => {
    setCurrentUser(null);
    setUserRole(null);
    auth.signOut();
  };

  const value = {
    currentUser,
    userRole,
    loading,
    loginDemo,
    logoutDemo
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
