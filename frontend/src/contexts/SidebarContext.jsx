import React, { createContext, useContext, useState, useCallback } from 'react';

const SidebarContext = createContext(null);

export const SidebarProvider = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [courseData, setCourseData] = useState({
    runningCourses: [],
    finishedCourses: [],
    loading: false,
  });

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const updateCourseData = useCallback((data) => {
    setCourseData((prev) => ({ ...prev, ...data }));
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        sidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebar,
        courseData,
        updateCourseData,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
