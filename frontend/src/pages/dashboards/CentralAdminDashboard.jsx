import React from 'react';
import CentralDashboardOverview from '../admin/CentralDashboardOverview';
import DepartmentInfo from '../admin/DepartmentInfo';
import CourseInfo from '../admin/CourseInfo';
import TeacherInfo from '../admin/TeacherInfo';
import StudentInfo from '../admin/StudentInfo';
import SeriesManagement from '../admin/SeriesManagement';
import { useHistoryBackedState } from '../../hooks/useHistoryBackedState';

const INITIAL_DASHBOARD_STATE = { activeTab: 'overview' };

const CentralAdminDashboard = () => {
  const {
    state: dashboardState,
    pushState: pushDashboardState,
    goBack
  } = useHistoryBackedState('central-admin-dashboard', INITIAL_DASHBOARD_STATE);
  const activeTab = dashboardState.activeTab;

  const navigateTab = (newTab) => {
    pushDashboardState((currentState) => ({
      ...currentState,
      activeTab: newTab
    }));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'departments':
        return <DepartmentInfo />;
      case 'courses':
        return <CourseInfo />;
      case 'teachers':
        return <TeacherInfo />;
      case 'students':
        return <StudentInfo />;
      case 'series':
        return <SeriesManagement />;
      case 'overview':
      default:
        return <CentralDashboardOverview setActiveTab={navigateTab} />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 dark:border-gray-800 pb-4 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Central Admin Panel</h1>
        {activeTab !== 'overview' && (
          <button onClick={goBack} className="text-sm text-gray-600 dark:text-gray-400 hover:text-ruet-blue dark:hover:text-white font-medium flex items-center">
            &larr; Back to Overview
          </button>
        )}
      </div>
      
      {renderContent()}
    </div>
  );
};

export default CentralAdminDashboard;
